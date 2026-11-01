import { verifyRecruitmentRelations } from '../recruitment/relations';
import { randomUUID } from 'node:crypto';
import { APIError, Forbidden, NotFound, type Access, type CollectionConfig, type CollectionSlug, type PayloadRequest, type Where } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { canEditDraft, relationId } from './policy';
import { currentActor, editorialWrite } from './internal';
import { editorialLock } from '../media/access';
import { editorialModel, validateIdentity, validateDraft, type EditorialKind, type EditorialDoc, type EditorialRevision } from './reviewed-model';
import { normalizeAssets, referencedAsset, verifyReferencedFiles } from '../media/references';
import { RESEARCH_DISCLAIMER } from '../content/research-policy.mjs';
import { utcTimestamp, wibTimestamp } from '../events/status.mjs';

export const orgScope: Access = ({ req }) => {
  if (!isActiveUser(req.user)) return false;
  const alive = { deletedAt: { exists: false } };
  return isActiveAdmin(req.user) ? alive : { and: [alive, { or: [{ owner: { equals: req.user!.id } }, { assignedTo: { in: [req.user!.id] } }] }] } as Where;
};
export const orgOptions = (req: PayloadRequest) => ({ req, overrideAccess: true, context: { [editorialWrite]: true } });
export const orgRevision = (req: PayloadRequest, kind: EditorialKind, id: number) => req.payload.findByID({ collection: editorialModel(kind).revisions as CollectionSlug, id, req, overrideAccess: true, depth: 0 }) as unknown as Promise<EditorialRevision>;
export async function orgAudit(req: PayloadRequest, kind: EditorialKind, root: EditorialDoc, revision: EditorialRevision, action: string, before: Record<string, unknown>, after: Record<string, unknown>) {
  await req.payload.create({ collection: 'organization-audit', ...orgOptions(req), data: { kind, entityId: root.id, revisionId: revision.id, actorId: req.user!.id, action, before, after, correlationId: randomUUID() } });
}
export async function verifyPeriod(req: PayloadRequest, kind: EditorialKind, draft: Record<string, unknown>) {
  if (kind === 'recruitment') { await verifyRecruitmentRelations(req,draft); return; }
  if (!['divisions', 'members'].includes(kind) || !draft.period) return;
  const id = Number(relationId(draft.period as number));
  const period = await req.payload.db.findOne({ collection: 'organizational-periods', where: { id: { equals: id } }, req }) as unknown as EditorialDoc | null;
  if (!period || period.deletedAt || !period.publicRevision) throw new APIError('Referenced period must be published', 409);
  const revision = await orgRevision(req, 'periods', period.publicRevision);
  const approved = await req.payload.db.findOne({ collection: 'organization-reviews', where: { and: [{ kind: { equals: 'periods' } }, { entityId: { equals: id } }, { revisionId: { equals: revision.id } }, { editVersion: { equals: revision.editVersion } }, { status: { equals: 'approved' } }, { resolvedAt: { exists: true } }] }, req });
  if (revision.entity !== id || revision.state !== 'published' || !approved) throw new APIError('Referenced period unavailable', 409);
}
export async function verifyDraftFiles(req: PayloadRequest, revision: EditorialRevision) {
  await verifyReferencedFiles(req, revision);
}

export async function normalizeDraft(req: PayloadRequest, kind: EditorialKind, draft: Record<string, unknown>) {
  for (const key of ['period', 'division', 'photo', 'cover', 'pdf', 'poster', 'category']) if (draft[key]) draft[key] = Number(relationId(draft[key] as number));
  if (['members', 'research', 'events'].includes(kind)) {
    const rows = [];
    for (const key of kind === 'members' ? ['photo'] : kind === 'research' ? ['cover', 'pdf'] : ['poster']) if (draft[key]) {
      const asset = await referencedAsset(req, Number(draft[key]));
      if (key === 'pdf' ? asset.mime !== 'application/pdf' : !asset.mime.startsWith('image/')) throw new APIError('Media type does not match its field', 400);
      rows.push({ asset: asset.id });
    }
    draft.assets = await normalizeAssets(req, rows);
  }
  if (kind === 'research') {
    draft.baseDisclaimer = RESEARCH_DISCLAIMER;
    draft.sources = Array.isArray(draft.sources) ? draft.sources.map(row => { const copy = { ...row }; delete copy.id; return copy; }) : [];
    if (draft.category && !await req.payload.db.findOne({ collection: 'research-categories', req, where: { id: { equals: draft.category } } })) throw new APIError('Research category unavailable', 400);
  }
  if (kind === 'recruitment') {
    for (const key of ['positions','selectionStages']) {
      const rows = draft[key];
      if (rows != null && (!Array.isArray(rows) || rows.length > 30 || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row)))) throw new APIError('Posisi/tahapan tidak valid',400);
    }
    draft.positions = Array.isArray(draft.positions) ? draft.positions.map((row: Record<string,unknown>) => ({ title: row.title, requirements: row.requirements, division: row.division ? Number(relationId(row.division as number)) : null })) : [];
    draft.selectionStages = Array.isArray(draft.selectionStages) ? draft.selectionStages.map((row: Record<string,unknown>) => ({ title: row.title, description: row.description })) : [];
    draft.registrationConfirmed ??= false;
    for (const key of ['opensAt','closesAt']) if(draft[key]) { try { draft[key]=utcTimestamp(draft[key]); } catch(error) { throw new APIError((error as Error).message,400); } }
    await verifyRecruitmentRelations(req,draft);
  }
  if (kind === 'events') {
    for (const [key, value] of Object.entries({ cancelled: false, registrationConfirmed: false, registrationStatus: 'closed', locationType: 'offline' })) draft[key] ??= value;
    for (const key of ['startAt', 'endAt', 'registrationOpensAt', 'registrationClosesAt']) if (draft[key]) {
      try { draft[key] = utcTimestamp(draft[key]); } catch (error) { throw new APIError((error as Error).message, 400); }
    }
  }
  if (kind === 'members') {
    await verifyPeriod(req, kind, draft);
    if (draft.division) {
      const division = await req.payload.db.findOne({ collection: 'divisions', req, where: { id: { equals: draft.division } } }) as unknown as EditorialDoc | null;
      if (!division?.publicRevision || division.deletedAt) throw new APIError('Referenced division must be published', 409);
    }
  }
}

export function reviewedHooks(kind: EditorialKind): CollectionConfig['hooks'] {
  const model = editorialModel(kind);
  const changes = new WeakMap<PayloadRequest, { raw: Record<string, unknown>; draft?: Record<string, unknown>; revision?: EditorialRevision; before?: Record<string, unknown> }>();
  return {
    beforeOperation: [async ({ req, operation, args }) => {
      if (operation === 'delete') throw new Forbidden();
      if (operation !== 'create' && operation !== 'update') return args;
      await editorialLock(req); await currentActor(req);
      if (operation === 'update') {
        if (!('id' in args) || !Number.isSafeInteger(Number(args.id))) throw new APIError('Edit one entity at a time', 400);
        await req.payload.findByID({ collection: model.root, id: Number(args.id), req, overrideAccess: true, depth: 0 });
      }
      const raw: Record<string, unknown> = 'data' in args ? { ...args.data } : {};
      if (kind === 'recruitment') for (const key of ['positions','selectionStages']) {
        const rows = raw[key];
        if (rows != null && (!Array.isArray(rows) || rows.length > 30 || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row)))) throw new APIError('Posisi/tahapan tidak valid',400);
      }
      if (raw.deletedAt != null || Object.keys(raw).some(key => ![model.identity, ...model.keys, 'owner', 'assignedTo', 'createdBy', 'workingRevision', 'publicRevision', 'lockVersion', 'expectedLockVersion', 'expectedRevisionId', 'state', 'createdAt', 'updatedAt', 'deletedAt'].includes(key))) throw new Forbidden();
      changes.set(req, { raw }); return args;
    }],
    beforeChange: [async ({ req, operation, originalDoc, data }) => {
      const change = changes.get(req); if (!change || !isActiveUser(req.user)) throw new Forbidden();
      const creating = operation === 'create';
      // CMS may send/populate relationships as objects; compare their stable IDs.
      const root = creating ? originalDoc as unknown as EditorialDoc : {
        ...originalDoc, owner: Number(relationId(originalDoc.owner)), createdBy: Number(relationId(originalDoc.createdBy)),
        assignedTo: (originalDoc.assignedTo || []).map((value: number | { id: number }) => Number(relationId(value))),
        workingRevision: relationId(originalDoc.workingRevision), publicRevision: relationId(originalDoc.publicRevision),
      } as EditorialDoc;
      if (creating ? !isActiveAdmin(req.user) && !['members', 'research', 'events', 'recruitment'].includes(kind) : root.deletedAt || !canEditDraft(req.user, root)) throw new NotFound();
      const revision = !creating && root.workingRevision ? await orgRevision(req, kind, root.workingRevision) : undefined;
      if (!creating && (!revision || revision.entity !== root.id || !['draft', 'revision_required'].includes(revision.state))) throw new APIError('Working revision unavailable', 409);
      if (!creating && change.raw.expectedLockVersion !== root.lockVersion) throw new APIError('Entity changed; reload before saving', 409);
      const previousIdentity = creating ? undefined : originalDoc[model.identity];
      if (!creating && change.raw[model.identity] != null && change.raw[model.identity] !== previousIdentity) throw new Forbidden();
      data[model.identity] = validateIdentity(kind, creating ? change.raw[model.identity] : previousIdentity);
      const immutable = creating ? { createdBy: req.user!.id, lockVersion: 0, workingRevision: null, publicRevision: null, state: 'draft' } : { createdBy: root.createdBy, lockVersion: root.lockVersion, workingRevision: root.workingRevision, publicRevision: root.publicRevision, state: revision!.state, expectedRevisionId: revision!.id };
      for (const [key, expected] of Object.entries(immutable)) if (change.raw[key] != null && String(relationId(change.raw[key] as number)) !== String(expected)) throw new Forbidden();
      const owner = Number(relationId(data.owner ?? (creating ? req.user!.id : root.owner)));
      const expectedOwner = creating ? req.user!.id : root.owner;
      const expectedAssignments = creating ? [] : root.assignedTo || [];
      const assignedTo = (data.assignedTo ?? (creating ? [] : root.assignedTo ?? [])) as unknown[];
      if (!Number.isSafeInteger(owner) || !Array.isArray(assignedTo) || assignedTo.length > 20) throw new APIError('Invalid ownership', 400);
      const assignments = assignedTo.map(value => Number(relationId(value as number)));
      if (assignments.some(id => !Number.isSafeInteger(id) || id < 1)) throw new APIError('Invalid assignees', 400);
      if (!isActiveAdmin(req.user) && (change.raw.owner != null && Number(relationId(change.raw.owner as number)) !== expectedOwner || Object.hasOwn(change.raw, 'assignedTo') && (!Array.isArray(change.raw.assignedTo) || JSON.stringify(change.raw.assignedTo.map(value => Number(relationId(value as number))).sort()) !== JSON.stringify([...expectedAssignments].sort())))) throw new Forbidden();
      if (!isActiveAdmin(req.user) && (owner !== expectedOwner || JSON.stringify([...assignments].sort()) !== JSON.stringify([...expectedAssignments].sort()))) throw new Forbidden();
      for (const id of new Set([owner, ...assignments])) if (!isActiveUser(await req.payload.findByID({ collection: 'users', id, req, overrideAccess: true, depth: 0 }))) throw new APIError('Owner and assignees must be active', 400);
      const draft = Object.fromEntries(model.keys.map(key => [key, creating || Object.hasOwn(change.raw, key) ? data[key] ?? (key === 'displayOrder' ? 0 : key === 'example' ? true : null) : revision![key] ?? null]));
      if (kind === 'research') {
        if (Object.hasOwn(change.raw, 'baseDisclaimer') && change.raw.baseDisclaimer !== RESEARCH_DISCLAIMER) throw new Forbidden();
        if (!isActiveAdmin(req.user) && change.raw.category != null && Number(relationId(change.raw.category as number)) !== Number(revision?.category || 0)) throw new Forbidden();
        if (!isActiveAdmin(req.user)) {
          if (change.raw.category === null && revision?.category) throw new Forbidden();
          // Payload strips fields with update access=false before this hook.
          // A full Media form echoes the unchanged category; preserve its ID.
          draft.category = revision?.category ?? null;
        }
      }
      if (kind === 'events' || kind === 'recruitment') {
        if (!isActiveAdmin(req.user) && change.raw.registrationConfirmed === true && revision?.registrationConfirmed !== true) throw new Forbidden();
        if (!isActiveAdmin(req.user)) draft.registrationConfirmed = draft.registrationURL === revision?.registrationURL && revision?.registrationConfirmed === true;
      }
      await normalizeDraft(req, kind, draft);
      validateDraft(kind, draft);
      change.draft = draft; change.revision = revision; change.before = creating ? {} : { owner: root.owner, assignedTo: root.assignedTo, lockVersion: root.lockVersion, state: revision!.state };
      return { ...data, deletedAt: null, createdBy: creating ? req.user!.id : root.createdBy, owner, assignedTo: assignments, workingRevision: creating ? null : root.workingRevision, publicRevision: creating ? null : root.publicRevision, lockVersion: creating ? 1 : root.lockVersion + 1, createdAt: creating ? new Date().toISOString() : root.createdAt };
    }],
    afterChange: [async ({ doc, req, operation }) => {
      const change = changes.get(req); if (!change?.draft) throw Error('Missing organization transaction');
      try {
        const revision = operation === 'create'
          ? await req.payload.create({ collection: model.revisions, ...orgOptions(req), data: { ...change.draft, entity: doc.id, number: 1, editVersion: doc.lockVersion, state: 'draft' } as never })
          : await req.payload.update({ collection: model.revisions, id: change.revision!.id, ...orgOptions(req), data: { ...change.draft, editVersion: doc.lockVersion } as never });
        if (operation === 'create') { await req.payload.db.updateOne({ collection: model.root, id: doc.id, req, data: { workingRevision: revision.id } }); doc.workingRevision = revision.id; }
        await orgAudit(req, kind, doc as EditorialDoc, revision as unknown as EditorialRevision, operation === 'create' ? 'draft_created' : 'draft_saved', change.before || {}, { owner: doc.owner, assignedTo: doc.assignedTo, lockVersion: doc.lockVersion, state: change.revision?.state ?? 'draft' });
        return { ...doc, ...change.draft, state: change.revision?.state ?? 'draft', expectedLockVersion: doc.lockVersion, expectedRevisionId: revision.id };
      } finally { changes.delete(req); Reflect.deleteProperty(req.context, editorialWrite); }
    }],
    afterRead: [async ({ doc, req }) => {
      if (doc.deletedAt || !canEditDraft(req.user, doc)) throw new NotFound();
      const pointer = relationId(doc.workingRevision) || relationId(doc.publicRevision);
      const revision = pointer ? await orgRevision(req, kind, Number(pointer)) : (await req.payload.find({ collection: model.revisions, req, overrideAccess: true, depth: 0, limit: 1, sort: '-number', where: { entity: { equals: doc.id } } })).docs[0] as unknown as EditorialRevision | undefined;
      if (!revision) return doc;
      if (revision.entity !== doc.id) throw new APIError('Revision mismatch', 409);
      const draft = Object.fromEntries(model.keys.map(key => [key, revision[key]]));
      if (kind === 'events' || kind === 'recruitment') for (const key of kind === 'events' ? ['startAt', 'endAt', 'registrationOpensAt', 'registrationClosesAt'] : ['opensAt','closesAt']) draft[key] = wibTimestamp(draft[key]);
      return { ...doc, ...draft, state: revision.state, expectedLockVersion: doc.lockVersion, expectedRevisionId: revision.id };
    }],
    beforeDelete: [() => { throw new Forbidden(); }],
  };
}
