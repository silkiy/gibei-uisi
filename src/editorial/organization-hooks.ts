import { randomUUID } from 'node:crypto';
import { APIError, Forbidden, NotFound, type Access, type CollectionConfig, type CollectionSlug, type PayloadRequest, type Where } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { canEditDraft, relationId } from './policy';
import { currentActor, editorialWrite } from './internal';
import { editorialLock } from '../media/access';
import { organizationModel, validateIdentity, validateDraft, type OrganizationKind, type OrganizationDoc, type OrganizationRevision } from './organization-model';

export const orgScope: Access = ({ req }) => {
  if (!isActiveUser(req.user)) return false;
  const alive = { deletedAt: { exists: false } };
  return isActiveAdmin(req.user) ? alive : { and: [alive, { or: [{ owner: { equals: req.user!.id } }, { assignedTo: { in: [req.user!.id] } }] }] } as Where;
};
export const orgOptions = (req: PayloadRequest) => ({ req, overrideAccess: true, context: { [editorialWrite]: true } });
export const orgRevision = (req: PayloadRequest, kind: OrganizationKind, id: number) => req.payload.findByID({ collection: organizationModel(kind).revisions as CollectionSlug, id, req, overrideAccess: true, depth: 0 }) as unknown as Promise<OrganizationRevision>;
export async function orgAudit(req: PayloadRequest, kind: OrganizationKind, root: OrganizationDoc, revision: OrganizationRevision, action: string, before: Record<string, unknown>, after: Record<string, unknown>) {
  await req.payload.create({ collection: 'organization-audit', ...orgOptions(req), data: { kind, entityId: root.id, revisionId: revision.id, actorId: req.user!.id, action, before, after, correlationId: randomUUID() } });
}
export async function verifyPeriod(req: PayloadRequest, kind: OrganizationKind, draft: Record<string, unknown>) {
  if (kind !== 'divisions' || !draft.period) return;
  const id = Number(relationId(draft.period as number));
  const period = await req.payload.db.findOne({ collection: 'organizational-periods', where: { id: { equals: id } }, req }) as unknown as OrganizationDoc | null;
  if (!period || period.deletedAt || !period.publicRevision) throw new APIError('Referenced period must be published', 409);
  const revision = await orgRevision(req, 'periods', period.publicRevision);
  const approved = await req.payload.db.findOne({ collection: 'organization-reviews', where: { and: [{ kind: { equals: 'periods' } }, { entityId: { equals: id } }, { revisionId: { equals: revision.id } }, { editVersion: { equals: revision.editVersion } }, { status: { equals: 'approved' } }] }, req });
  if (revision.entity !== id || revision.state !== 'published' || !approved) throw new APIError('Referenced period unavailable', 409);
}

export function organizationHooks(kind: OrganizationKind): CollectionConfig['hooks'] {
  const model = organizationModel(kind);
  const changes = new WeakMap<PayloadRequest, { raw: Record<string, unknown>; draft?: Record<string, unknown>; revision?: OrganizationRevision; before?: Record<string, unknown> }>();
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
      if (raw.deletedAt != null || Object.keys(raw).some(key => ![model.identity, ...model.keys, 'owner', 'assignedTo', 'createdBy', 'workingRevision', 'publicRevision', 'lockVersion', 'expectedLockVersion', 'expectedRevisionId', 'state', 'createdAt', 'updatedAt', 'deletedAt'].includes(key))) throw new Forbidden();
      changes.set(req, { raw }); return args;
    }],
    beforeChange: [async ({ req, operation, originalDoc, data }) => {
      const change = changes.get(req); if (!change || !isActiveUser(req.user)) throw new Forbidden();
      const creating = operation === 'create';
      // CMS may send/populate relationships as objects; compare their stable IDs.
      const root = creating ? originalDoc as unknown as OrganizationDoc : {
        ...originalDoc, owner: Number(relationId(originalDoc.owner)), createdBy: Number(relationId(originalDoc.createdBy)),
        assignedTo: (originalDoc.assignedTo || []).map((value: number | { id: number }) => Number(relationId(value))),
        workingRevision: relationId(originalDoc.workingRevision), publicRevision: relationId(originalDoc.publicRevision),
      } as OrganizationDoc;
      if (creating ? !isActiveAdmin(req.user) : root.deletedAt || !canEditDraft(req.user, root)) throw new NotFound();
      const revision = !creating && root.workingRevision ? await orgRevision(req, kind, root.workingRevision) : undefined;
      if (!creating && (!revision || revision.entity !== root.id || !['draft', 'revision_required'].includes(revision.state))) throw new APIError('Working revision unavailable', 409);
      if (!creating && change.raw.expectedLockVersion !== root.lockVersion) throw new APIError('Entity changed; reload before saving', 409);
      const previousIdentity = creating ? undefined : originalDoc[model.identity];
      if (!creating && change.raw[model.identity] != null && change.raw[model.identity] !== previousIdentity) throw new Forbidden();
      data[model.identity] = validateIdentity(kind, creating ? change.raw[model.identity] : previousIdentity);
      const immutable = creating ? { createdBy: req.user!.id, lockVersion: 0, workingRevision: null, publicRevision: null, state: 'draft' } : { createdBy: root.createdBy, lockVersion: root.lockVersion, workingRevision: root.workingRevision, publicRevision: root.publicRevision, state: revision!.state, expectedRevisionId: revision!.id };
      for (const [key, expected] of Object.entries(immutable)) if (change.raw[key] != null && String(relationId(change.raw[key] as number)) !== String(expected)) throw new Forbidden();
      const owner = Number(relationId(data.owner ?? (creating ? req.user!.id : root.owner)));
      const assignedTo = (data.assignedTo ?? (creating ? [] : root.assignedTo ?? [])) as unknown[];
      if (!Number.isSafeInteger(owner) || !Array.isArray(assignedTo) || assignedTo.length > 20) throw new APIError('Invalid ownership', 400);
      const assignments = assignedTo.map(value => Number(relationId(value as number)));
      if (assignments.some(id => !Number.isSafeInteger(id) || id < 1)) throw new APIError('Invalid assignees', 400);
      if (!isActiveAdmin(req.user) && (change.raw.owner != null && Number(relationId(change.raw.owner as number)) !== root.owner || Object.hasOwn(change.raw, 'assignedTo') && (!Array.isArray(change.raw.assignedTo) || JSON.stringify(change.raw.assignedTo.map(value => Number(relationId(value as number))).sort()) !== JSON.stringify([...(root.assignedTo || [])].sort())))) throw new Forbidden();
      if (!isActiveAdmin(req.user) && (owner !== root.owner || JSON.stringify([...assignments].sort()) !== JSON.stringify([...(root.assignedTo || [])].sort()))) throw new Forbidden();
      for (const id of new Set([owner, ...assignments])) if (!isActiveUser(await req.payload.findByID({ collection: 'users', id, req, overrideAccess: true, depth: 0 }))) throw new APIError('Owner and assignees must be active', 400);
      const draft = Object.fromEntries(model.keys.map(key => [key, creating || Object.hasOwn(change.raw, key) ? data[key] ?? (key === 'displayOrder' ? 0 : key === 'example' ? true : null) : revision![key] ?? null]));
      if (kind === 'divisions' && draft.period) draft.period = Number(relationId(draft.period as number));
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
        await orgAudit(req, kind, doc as OrganizationDoc, revision as unknown as OrganizationRevision, operation === 'create' ? 'draft_created' : 'draft_saved', change.before || {}, { owner: doc.owner, assignedTo: doc.assignedTo, lockVersion: doc.lockVersion, state: change.revision?.state ?? 'draft' });
        return { ...doc, ...change.draft, state: change.revision?.state ?? 'draft', expectedLockVersion: doc.lockVersion, expectedRevisionId: revision.id };
      } finally { changes.delete(req); Reflect.deleteProperty(req.context, editorialWrite); }
    }],
    afterRead: [async ({ doc, req }) => {
      if (doc.deletedAt || !canEditDraft(req.user, doc)) throw new NotFound();
      const pointer = relationId(doc.workingRevision) || relationId(doc.publicRevision);
      const revision = pointer ? await orgRevision(req, kind, Number(pointer)) : (await req.payload.find({ collection: model.revisions, req, overrideAccess: true, depth: 0, limit: 1, sort: '-number', where: { entity: { equals: doc.id } } })).docs[0] as unknown as OrganizationRevision | undefined;
      if (!revision) return doc;
      if (revision.entity !== doc.id) throw new APIError('Revision mismatch', 409);
      return { ...doc, ...Object.fromEntries(model.keys.map(key => [key, revision[key]])), state: revision.state, expectedLockVersion: doc.lockVersion, expectedRevisionId: revision.id };
    }],
    beforeDelete: [() => { throw new Forbidden(); }],
  };
}
