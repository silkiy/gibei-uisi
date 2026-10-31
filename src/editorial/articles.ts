import { randomUUID } from 'node:crypto';
import { APIError, Forbidden, NotFound, type Access, type CollectionConfig, type PayloadRequest } from 'payload';
import type { ArticleRevision } from '../payload-types';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { articleLock, currentActor, editorialWrite, transaction } from './internal';
import { canEditDraft, normalizeSlug, relationId, validateDraft } from './policy';
import { editorialLock } from '../media/access';
import { normalizeAssets } from '../media/references';
import { normalizeRelated } from '../content/relations';

export const articleAccess: Access = ({ req }) => {
  if (isActiveAdmin(req.user)) return true;
  if (!isActiveUser(req.user)) return false;
  return { or: [{ owner: { equals: req.user!.id } }, { assignedTo: { in: [req.user!.id] } }] } as import('payload').Where;
};
export const draftKeys = ['title', 'excerpt', 'body', 'category', 'publicAuthor', 'sources', 'assets', 'related'] as const;
const keys = draftKeys;
type Draft = Pick<ArticleRevision, typeof keys[number]>;
type Change = { raw: Record<string, unknown>; draft?: Draft; previous?: ArticleRevision; ownerChanged?: boolean; before?: Record<string, unknown> };
const changes = new WeakMap<PayloadRequest, Change>();
const ids = (value: unknown) => (Array.isArray(value) ? value : []).map(item => String(relationId(item))).sort();

async function readRevision(req: PayloadRequest, pointer: unknown) {
  const id = relationId(pointer as number);
  if (!id) throw new APIError('Draft revision is unavailable', 409);
  return req.payload.findByID({ collection: 'article-revisions', id, overrideAccess: true, depth: 0, req });
}

export const articleHooks: CollectionConfig['hooks'] = {
  beforeOperation: [async ({ operation, args, req }) => {
    if (operation === 'delete') throw new Forbidden();
    if (!['create', 'update'].includes(operation)) return args;
    await transaction(req);
    await editorialLock(req);
    await currentActor(req);
    if (operation === 'update') {
      if (!('id' in args) || !Number.isSafeInteger(Number(args.id))) throw new APIError('Edit one draft at a time', 400);
      await articleLock(req, Number(args.id));
      // Payload's query-based update access returns 403; resolve guessed IDs uniformly as 404 first.
      await req.payload.findByID({ collection: 'articles', id: Number(args.id), req, overrideAccess: true, depth: 0 });
    }
    const raw = 'data' in args ? { ...args.data } : {};
    if (Object.hasOwn(raw, '_status')) throw new Forbidden();
    changes.set(req, { raw });
    return args;
  }],
  beforeChange: [async ({ req, operation, originalDoc, data }) => {
    const change = changes.get(req);
    if (!change || !isActiveUser(req.user)) throw new Forbidden();
    const raw = change.raw;
    const creating = operation === 'create';
    if (!creating && !canEditDraft(req.user, originalDoc)) throw new NotFound();
    const previous = creating ? undefined : await readRevision(req, originalDoc.workingRevision);
    if (previous && !['draft', 'revision_required'].includes(previous.state)) throw new APIError('This revision is locked', 409);
    if (!creating && Number(raw.expectedLockVersion) !== originalDoc.lockVersion) throw new APIError('Draft changed; reload before saving', 409);
    const immutable = { createdBy: creating ? req.user!.id : relationId(originalDoc.createdBy), workingRevision: creating ? null : relationId(originalDoc.workingRevision), publicRevision: creating ? null : relationId(originalDoc.publicRevision), lockVersion: creating ? 0 : originalDoc.lockVersion, state: previous?.state || 'draft' };
    for (const [key, expected] of Object.entries(immutable)) {
      if (raw[key] != null && String(relationId(raw[key] as number)) !== String(expected)) throw new Forbidden();
    }
    if (creating && raw.owner != null && String(relationId(raw.owner as number)) !== String(req.user!.id)) throw new Forbidden();
    if (!isActiveAdmin(req.user)) {
      if (raw.owner != null && String(relationId(raw.owner as number)) !== String(creating ? req.user!.id : relationId(originalDoc.owner))) throw new Forbidden();
      if (raw.assignedTo !== undefined && JSON.stringify(ids(raw.assignedTo)) !== JSON.stringify(ids(creating ? [] : originalDoc.assignedTo))) throw new Forbidden();
      if (raw.category != null && String(relationId(raw.category as number)) !== String(relationId(previous?.category))) throw new Forbidden();
      if (!creating && raw.category === null && previous?.category) throw new Forbidden();
    }
    data.createdBy = immutable.createdBy;
    data.owner = creating ? req.user!.id : (data.owner ?? relationId(originalDoc.owner));
    data.assignedTo = creating ? (isActiveAdmin(req.user) ? data.assignedTo || [] : []) : data.assignedTo ?? originalDoc.assignedTo ?? [];
    if (data.assignedTo.length > 20) throw new APIError('Maximum 20 assignees', 400);
    if (isActiveAdmin(req.user)) {
      for (const id of new Set([relationId(data.owner), ...data.assignedTo.map(relationId)])) {
        const target = await req.payload.findByID({ collection: 'users', id: id as number, req, depth: 0, overrideAccess: true });
        if (!isActiveUser(target)) throw new APIError('Owner/assignee must be active', 400);
      }
    }
    data.lockVersion = creating ? 1 : originalDoc.lockVersion + 1;
    data.publicRevision = immutable.publicRevision;
    data.workingRevision = creating ? null : immutable.workingRevision;
    data.createdAt = creating ? new Date().toISOString() : originalDoc.createdAt;
    data.updatedAt = new Date().toISOString();
    try { data.slug = normalizeSlug(data.slug || (creating ? raw.title || `draft-${randomUUID()}` : originalDoc.slug)); }
    catch (error) { throw new APIError((error as Error).message, 400); }
    if (!creating && data.slug !== originalDoc.slug) {
      const published = await req.payload.count({ collection: 'content-reviews', req, overrideAccess: true, where: { and: [{ article: { equals: originalDoc.id } }, { status: { equals: 'approved' } }] } });
      if (published.totalDocs) throw new APIError('Slug is locked after the first publication', 409);
    }
    // Payload injects empty array defaults even on PATCH. Only explicit input replaces stored draft fields.
    const draft = Object.fromEntries(keys.map(key => [key, creating || Object.hasOwn(raw, key) ? data[key] ?? null : previous?.[key] ?? null])) as Draft;
    draft.sources ??= [];
    draft.sources = draft.sources.map(source => ({ title: source.title, url: source.url }));
    draft.assets = await normalizeAssets(req, draft.assets ?? []);
    draft.related = await normalizeRelated(req, draft.related ?? []);
    if (!isActiveAdmin(req.user)) draft.category = previous?.category ?? null;
    try { validateDraft(draft); } catch { throw new APIError('Draft text, sources or rich text are invalid', 400); }
    change.draft = draft;
    change.previous = previous;
    change.before = creating ? undefined : { state: previous!.state, owner: relationId(originalDoc.owner), assignedTo: ids(originalDoc.assignedTo), lockVersion: originalDoc.lockVersion };
    change.ownerChanged = !creating && (String(relationId(data.owner)) !== String(relationId(originalDoc.owner)) || JSON.stringify(ids(data.assignedTo)) !== JSON.stringify(ids(originalDoc.assignedTo)));
    return data;
  }],
  afterChange: [async ({ req, doc, operation }) => {
    const change = changes.get(req);
    if (!change?.draft) throw new Error('Missing draft transaction context');
    try {
      const options = { req, overrideAccess: true, context: { [editorialWrite]: true } };
      const revision = operation === 'create'
        ? await req.payload.create({ collection: 'article-revisions', ...options, data: { ...change.draft, article: doc.id, number: 1, state: 'draft', editVersion: doc.lockVersion } })
        : await req.payload.update({ collection: 'article-revisions', id: change.previous!.id, ...options, data: { ...change.draft, editVersion: doc.lockVersion } });
      if (operation === 'create') {
        await req.payload.db.updateOne({ collection: 'articles', id: doc.id, req, data: { workingRevision: revision.id } });
        doc.workingRevision = revision.id;
      }
      await req.payload.create({ collection: 'editorial-audit', ...options, data: {
        actorId: req.user!.id, article: doc.id, revisionId: revision.id, editVersion: doc.lockVersion,
        action: operation === 'create' ? 'draft_created' : change.ownerChanged ? 'ownership_changed' : 'draft_saved',
        before: change.before, after: { state: change.previous?.state || 'draft', owner: relationId(doc.owner), assignedTo: ids(doc.assignedTo), lockVersion: doc.lockVersion }, correlationId: randomUUID(),
      } });
      return { ...doc, ...change.draft, state: change.previous?.state || 'draft', expectedLockVersion: doc.lockVersion };
    } finally { Reflect.deleteProperty(req.context, editorialWrite); changes.delete(req); }
  }],
  afterRead: [async ({ doc, req }) => {
    if (!canEditDraft(req.user, doc)) throw new NotFound();
    const pointer = doc.workingRevision || doc.publicRevision;
    const revision = pointer ? await readRevision(req, pointer) : (await req.payload.find({ collection: 'article-revisions', req, overrideAccess: true, depth: 0, limit: 1, pagination: false, sort: '-number', where: { article: { equals: doc.id } } })).docs[0];
    if (!revision) return { ...doc, expectedLockVersion: doc.lockVersion };
    return { ...doc, ...Object.fromEntries(keys.map(key => [key, revision[key]])), state: revision.state, expectedLockVersion: doc.lockVersion, expectedRevisionId: revision.id };
  }],
  beforeDelete: [() => { throw new Forbidden(); }],
};
