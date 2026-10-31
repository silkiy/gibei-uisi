import { randomUUID } from 'node:crypto';
import { APIError, Forbidden, NotFound, type CollectionConfig, type CollectionSlug, type PayloadRequest } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { articleLock, currentActor, editorialWrite, transaction } from './internal';
import { editorialLock } from '../media/access';
import { canEditDraft, pageDraftKeys, pageKeyIsValid, relationId, validatePageDraft, type PageDoc, type PageDraft, type PageRevisionDoc } from './page-policy';

// The four collection slugs become generated CollectionSlug members after registration/typegen.
export const pageCollection = (slug: 'pages' | 'page-revisions' | 'page-reviews' | 'page-audit') => slug as CollectionSlug;
const changes = new WeakMap<PayloadRequest, { raw: Record<string, unknown>; draft?: PageDraft; previous?: PageRevisionDoc; before?: Record<string, unknown>; ownerChanged?: boolean }>();
const ids = (value: unknown) => (Array.isArray(value) ? value : []).map(item => String(relationId(item as number | { id: number }))).sort();
const revisionByID = (req: PayloadRequest, id: number) => req.payload.findByID({ collection: pageCollection('page-revisions'), id, req, overrideAccess: true, depth: 0 }) as unknown as Promise<PageRevisionDoc>;

export const pageHooks: CollectionConfig['hooks'] = {
  beforeOperation: [async ({ operation, args, req }) => {
    if (operation === 'delete') throw new Forbidden();
    if (operation !== 'create' && operation !== 'update') return args;
    await transaction(req);
    await editorialLock(req);
    await currentActor(req);
    if (operation === 'update') {
      if (!('id' in args) || !Number.isSafeInteger(Number(args.id)) || Number(args.id) < 1) throw new APIError('Edit one page at a time', 400);
      await articleLock(req, Number(args.id));
      await req.payload.findByID({ collection: pageCollection('pages'), id: Number(args.id), req, overrideAccess: true, depth: 0 });
    }
    const raw: Record<string, unknown> = 'data' in args ? { ...args.data } : {};
    const allowed = ['pageKey', 'title', 'seoTitle', 'seoDescription', 'sections', 'owner', 'assignedTo', 'expectedLockVersion', 'expectedRevisionId', 'createdBy', 'workingRevision', 'publicRevision', 'lockVersion', 'state', 'createdAt', 'updatedAt'];
    if (Object.keys(raw).some(key => !allowed.includes(key))) throw new Forbidden();
    changes.set(req, { raw });
    return args;
  }],
  beforeChange: [async ({ req, operation, originalDoc, data }) => {
    const change = changes.get(req);
    if (!change || !isActiveUser(req.user)) throw new Forbidden();
    const creating = operation === 'create';
    const previousPage = originalDoc as unknown as PageDoc;
    if (creating ? !isActiveAdmin(req.user) : !canEditDraft(req.user, previousPage)) throw new NotFound();
    const previousId = creating ? null : relationId(previousPage.workingRevision);
    const previous = previousId ? await revisionByID(req, Number(previousId)) : undefined;
    if (!creating && (!previous || previous.page !== previousPage.id || !['draft', 'revision_required'].includes(previous.state))) throw new APIError('Working revision is locked or unavailable', 409);
    if (!creating && change.raw.expectedLockVersion !== previousPage.lockVersion) throw new APIError('Page changed; reload before saving', 409);
    if (creating ? !pageKeyIsValid(change.raw.pageKey) : change.raw.pageKey != null && change.raw.pageKey !== previousPage.pageKey) throw new Forbidden();
    if (!creating && !pageKeyIsValid(previousPage.pageKey)) throw new APIError('Invalid page identity', 409);
        const immutable: Record<string, unknown> = creating ? { createdBy: req.user!.id, workingRevision: null, publicRevision: null, lockVersion: 0, state: 'draft' } : {
          createdBy: relationId(previousPage.createdBy), workingRevision: relationId(previousPage.workingRevision), publicRevision: relationId(previousPage.publicRevision),
          lockVersion: previousPage.lockVersion, state: previous?.state, expectedRevisionId: previous?.id,
        };
        for (const [key, expected] of Object.entries(immutable)) {
          const value = change.raw[key];
          if (value != null && String(relationId(value as number | { id: number })) !== String(expected)) throw new Forbidden();
        }
    const owner = creating ? Number(relationId(data.owner ?? req.user!.id)) : Number(relationId(data.owner ?? previousPage.owner));
    const assignedTo = (data.assignedTo ?? (creating ? [] : previousPage.assignedTo ?? [])) as unknown[];
    if (!Number.isSafeInteger(owner) || owner < 1 || !Array.isArray(assignedTo) || assignedTo.length > 20 || assignedTo.some(id => !Number.isSafeInteger(Number(relationId(id as number | { id: number }))) || Number(relationId(id as number | { id: number })) < 1)) throw new APIError('Invalid owner or assignees', 400);
    if (!isActiveAdmin(req.user) && (change.raw.owner != null && Number(relationId(change.raw.owner as number)) !== Number(relationId(previousPage.owner)) || change.raw.assignedTo !== undefined && JSON.stringify(ids(change.raw.assignedTo)) !== JSON.stringify(ids(previousPage.assignedTo)) || owner !== Number(relationId(previousPage.owner)) || JSON.stringify(ids(assignedTo)) !== JSON.stringify(ids(previousPage.assignedTo)))) throw new Forbidden();
    for (const id of new Set([owner, ...assignedTo.map(value => Number(relationId(value as number | { id: number })))])) {
      const target = await req.payload.findByID({ collection: 'users', id, req, depth: 0, overrideAccess: true });
      if (!isActiveUser(target)) throw new APIError('Owner and assignees must be active', 400);
    }
    const draft: PageDraft = Object.fromEntries(pageDraftKeys.map(key => [key, creating || Object.hasOwn(change.raw, key) ? data[key] ?? null : previous?.[key] ?? null]));
    draft.sections ??= [];
    validatePageDraft(draft);
    change.draft = draft;
    change.previous = previous;
    change.before = creating ? undefined : { state: previous!.state, owner: relationId(previousPage.owner), assignedTo: ids(previousPage.assignedTo), lockVersion: previousPage.lockVersion };
    change.ownerChanged = !creating && (owner !== Number(relationId(previousPage.owner)) || JSON.stringify(ids(assignedTo)) !== JSON.stringify(ids(previousPage.assignedTo)));
    data.pageKey = creating ? change.raw.pageKey : previousPage.pageKey;
    data.createdBy = creating ? req.user!.id : relationId(previousPage.createdBy);
    data.owner = owner;
    data.assignedTo = assignedTo as number[];
    data.workingRevision = creating ? null : relationId(previousPage.workingRevision);
    data.publicRevision = creating ? null : relationId(previousPage.publicRevision);
    data.lockVersion = creating ? 1 : previousPage.lockVersion + 1;
    data.createdAt = creating ? new Date().toISOString() : previousPage.createdAt;
    data.updatedAt = new Date().toISOString();
    return data;
  }],
  afterChange: [async ({ req, doc, operation }) => {
    const change = changes.get(req);
    if (!change?.draft) throw new Error('Missing page transaction context');
    try {
      const options = { req, overrideAccess: true, context: { [editorialWrite]: true } };
      const revision = operation === 'create'
        ? await req.payload.create({ collection: pageCollection('page-revisions'), ...options, data: { ...change.draft, page: doc.id, number: 1, state: 'draft', editVersion: doc.lockVersion } as never })
        : await req.payload.update({ collection: pageCollection('page-revisions'), id: change.previous!.id, ...options, data: { ...change.draft, editVersion: doc.lockVersion } as never });
      if (operation === 'create') {
        await req.payload.db.updateOne({ collection: pageCollection('pages'), id: doc.id, req, data: { workingRevision: revision.id } });
        doc.workingRevision = revision.id;
      }
      await req.payload.create({ collection: pageCollection('page-audit'), ...options, data: {
        page: doc.id, revisionId: revision.id, actorId: req.user!.id, editVersion: doc.lockVersion,
        action: operation === 'create' ? 'draft_created' : change.ownerChanged ? 'ownership_changed' : 'draft_saved',
        before: change.before, after: { state: change.previous?.state ?? 'draft', owner: relationId(doc.owner), assignedTo: ids(doc.assignedTo), lockVersion: doc.lockVersion }, correlationId: randomUUID(),
      } as never });
      return { ...doc, ...change.draft, state: change.previous?.state ?? 'draft', expectedLockVersion: doc.lockVersion, expectedRevisionId: revision.id };
    } finally { Reflect.deleteProperty(req.context, editorialWrite); changes.delete(req); }
  }],
  afterRead: [async ({ doc, req }) => {
    if (!canEditDraft(req.user, doc)) throw new NotFound();
    const page = doc as unknown as PageDoc;
    const pointer = relationId(page.workingRevision) || relationId(page.publicRevision);
    const revision = pointer ? await revisionByID(req, Number(pointer)) : (await req.payload.find({ collection: pageCollection('page-revisions'), req, overrideAccess: true, depth: 0, limit: 1, pagination: false, sort: '-number', where: { page: { equals: page.id } } })).docs[0] as unknown as PageRevisionDoc | undefined;
    if (revision && relationId(revision.page) !== page.id) throw new APIError('Page revision mismatch', 409);
    return revision ? { ...doc, ...Object.fromEntries(pageDraftKeys.map(key => [key, revision[key]])), state: revision.state, expectedLockVersion: page.lockVersion, expectedRevisionId: revision.id } : { ...doc, expectedLockVersion: page.lockVersion };
  }],
  beforeDelete: [() => { throw new Forbidden(); }],
};
