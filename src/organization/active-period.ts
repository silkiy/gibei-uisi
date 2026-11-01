import { randomUUID } from 'node:crypto';
import { APIError, Forbidden, type GlobalConfig, type PayloadRequest } from 'payload';
import { isActiveAdmin } from '../auth/policy';
import { editorialLock } from '../media/access';
import { currentActor, editorialWrite } from '../editorial/internal';
import { relationId } from '../editorial/policy';
import { orgRevision } from '../editorial/reviewed-hooks';
import type { EditorialDoc } from '../editorial/reviewed-model';

const cause = Symbol('organization-state-cause');
const inputs = new WeakMap<PayloadRequest, Record<string, unknown>>();
export async function approvedPeriod(req: PayloadRequest, id: number) {
  const root = await req.payload.db.findOne({ collection: 'organizational-periods', req, where: { id: { equals: id } } }) as unknown as EditorialDoc | null;
  if (!root?.publicRevision || root.deletedAt) throw new APIError('Only a published period can be selected', 409);
  const revision = await orgRevision(req, 'periods', root.publicRevision);
  const review = await req.payload.db.findOne({ collection: 'organization-reviews', req, where: { and: [{ kind: { equals: 'periods' } }, { entityId: { equals: id } }, { revisionId: { equals: revision.id } }, { editVersion: { equals: revision.editVersion } }, { status: { equals: 'approved' } }, { resolvedAt: { exists: true } }] } });
  if (!review || revision.entity !== id || revision.state !== 'published') throw new APIError('Period publication unavailable', 409);
}
export const OrganizationState: GlobalConfig = {
  slug: 'organization-state', label: 'Periode aktif', lockDocuments: false,
  access: { read: ({ req }) => isActiveAdmin(req.user), update: ({ req }) => isActiveAdmin(req.user) },
  fields: [
    { name: 'activePeriod', label: 'Periode aktif (hanya versi terbit)', type: 'relationship', relationTo: 'organizational-periods', maxDepth: 0,
      filterOptions: { and: [{ publicRevision: { exists: true } }, { deletedAt: { exists: false } }] } },
    { name: 'version', type: 'number', admin: { hidden: true } },
    { name: 'expectedVersion', type: 'number', virtual: true, admin: { readOnly: true } },
  ],
  hooks: {
    beforeOperation: [async ({ req, args, operation }) => {
      if (operation !== 'update') return args;
      await editorialLock(req); if (!isActiveAdmin(await currentActor(req))) throw new Forbidden();
      const raw = { ...args.data };
      if (Object.keys(raw).some(key => !['activePeriod', 'version', 'expectedVersion', 'id', 'createdAt', 'updatedAt', 'globalType'].includes(key))) throw new Forbidden();
      inputs.set(req, raw); return args;
    }],
    beforeChange: [async ({ req, data, originalDoc }) => {
      const raw = inputs.get(req); if (!raw) throw new Forbidden();
      const version = Number(originalDoc.version || 0);
      if (raw.expectedVersion !== version) throw new APIError('Active period changed; reload before saving', 409);
      if (raw.version != null && raw.version !== version) throw new Forbidden();
      const id = Object.hasOwn(raw, 'activePeriod') ? relationId(data.activePeriod) : relationId(originalDoc.activePeriod);
      if (id != null) { if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) throw new APIError('Invalid period', 400); await approvedPeriod(req, Number(id)); }
      return { ...data, activePeriod: id == null ? null : Number(id), version: version + 1 };
    }],
    afterChange: [async ({ doc, previousDoc, req }) => {
      try {
        await req.payload.create({ collection: 'organization-state-audit', req, overrideAccess: true, context: { [editorialWrite]: true }, data: {
          actorId: req.user!.id, version: doc.version, before: { activePeriod: relationId(previousDoc?.activePeriod) ?? null },
          after: { activePeriod: relationId(doc.activePeriod) ?? null, cause: Reflect.get(req.context, cause) || 'admin_selection' }, correlationId: randomUUID(),
        } });
        return doc;
      } finally { inputs.delete(req); Reflect.deleteProperty(req.context, editorialWrite); }
    }],
    afterRead: [({ doc }) => ({ ...doc, expectedVersion: Number(doc.version || 0) })],
  },
};
export async function clearWithdrawnActivePeriod(req: PayloadRequest, id: number) {
  const state = await req.payload.findGlobal({ slug: 'organization-state', req, overrideAccess: true, depth: 0 });
  if (Number(relationId(state.activePeriod)) !== id) return;
  Reflect.set(req.context, cause, 'period_withdrawn');
  try { await req.payload.updateGlobal({ slug: 'organization-state', req, overrideAccess: true, data: { expectedVersion: state.expectedVersion, activePeriod: null } }); }
  finally { Reflect.deleteProperty(req.context, cause); }
}
