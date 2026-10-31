import type { Access, CollectionConfig, FieldAccess, Where } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { internalHooks } from '../editorial/internal';
import { organizationModel, organizationFields, type OrganizationKind } from '../editorial/organization-model';
import { organizationHooks, orgScope } from '../editorial/organization-hooks';
import { divisionNames } from '../validation/organization.mjs';

const adminWrite: FieldAccess = ({ req }) => isActiveAdmin(req.user);
export function organizationCollections(kind: OrganizationKind): CollectionConfig[] {
  const model = organizationModel(kind);
  return [{
    slug: model.root, lockDocuments: false, disableBulkEdit: true, disableDuplicate: true,
    admin: { useAsTitle: model.identity, defaultColumns: [model.identity, 'owner', 'updatedAt'] },
    access: { create: ({ req }) => isActiveAdmin(req.user), read: orgScope, update: orgScope, delete: () => false }, hooks: organizationHooks(kind),
    fields: [
      { name: 'editorialActions', type: 'ui', admin: { components: { Field: { path: '/components/OrganizationActions#OrganizationActions', clientProps: { kind } } } } },
      kind === 'periods' ? { name: 'label', type: 'text', unique: true, required: true, maxLength: 120 }
        : { name: 'slug', type: 'select', unique: true, required: true, options: Object.entries(divisionNames).map(([value, label]) => ({ label, value })) },
      ...organizationFields(kind, true),
      { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, maxDepth: 0, defaultValue: ({ user }) => user?.id, admin: { readOnly: true } },
      { name: 'owner', type: 'relationship', relationTo: 'users', required: true, maxDepth: 0, defaultValue: ({ user }) => user?.id, access: { create: adminWrite, update: adminWrite } },
      { name: 'assignedTo', type: 'relationship', relationTo: 'users', hasMany: true, maxDepth: 0, access: { create: adminWrite, update: adminWrite } },
      { name: 'workingRevision', type: 'relationship', relationTo: model.revisions, maxDepth: 0, admin: { hidden: true } },
      { name: 'publicRevision', type: 'relationship', relationTo: model.revisions, maxDepth: 0, admin: { hidden: true } },
      { name: 'lockVersion', type: 'number', required: true, defaultValue: 0, admin: { hidden: true } },
      { name: 'deletedAt', type: 'date', admin: { hidden: true } },
      { name: 'expectedLockVersion', type: 'number', virtual: true, admin: { readOnly: true } },
      { name: 'expectedRevisionId', type: 'number', virtual: true, admin: { readOnly: true } },
      { name: 'state', type: 'text', virtual: true, admin: { readOnly: true } },
    ],
  }, {
    slug: model.revisions, lockDocuments: false, admin: { hidden: true }, hooks: internalHooks,
    access: { create: () => false, read: () => false, update: () => false, delete: () => false }, indexes: [{ fields: ['entity', 'number'], unique: true }],
    fields: [
      { name: 'entity', type: 'relationship', relationTo: model.root, required: true, maxDepth: 0 },
      { name: 'number', type: 'number', required: true }, { name: 'editVersion', type: 'number', required: true },
      { name: 'state', type: 'select', required: true, options: ['draft', 'in_review', 'revision_required', 'published', 'archived'] },
      ...organizationFields(kind),
    ],
  }];
}
const reviewAccess: Access = ({ req }) => {
  if (isActiveAdmin(req.user)) return true;
  if (!isActiveUser(req.user)) return false;
  return { or: ['period', 'division'].flatMap(key => ['owner', 'assignedTo'].map(field => ({ and: [{ [`${key}.deletedAt`]: { exists: false } }, { [`${key}.${field}`]: field === 'owner' ? { equals: req.user!.id } : { in: [req.user!.id] } }] }))) } as Where;
};
export const OrganizationReviews: CollectionConfig = {
  slug: 'organization-reviews', lockDocuments: false, admin: { hidden: true }, hooks: internalHooks,
  access: { create: () => false, read: reviewAccess, update: () => false, delete: () => false },
  indexes: [{ fields: ['kind', 'entityId', 'revisionId', 'editVersion'] }],
  fields: [
    { name: 'kind', type: 'select', required: true, options: ['periods', 'divisions'] }, { name: 'entityId', type: 'number', required: true }, { name: 'revisionId', type: 'number', required: true },
    { name: 'period', type: 'relationship', relationTo: 'organizational-periods', maxDepth: 0 }, { name: 'division', type: 'relationship', relationTo: 'divisions', maxDepth: 0 },
    { name: 'editVersion', type: 'number', required: true }, { name: 'manifest', type: 'json', required: true }, { name: 'manifestDigest', type: 'text', required: true },
    { name: 'status', type: 'select', required: true, options: ['pending', 'approved', 'changes_requested', 'cancelled'] },
    { name: 'submittedBy', type: 'number', required: true }, { name: 'reviewerId', type: 'number' }, { name: 'note', type: 'textarea', maxLength: 2000 }, { name: 'resolvedAt', type: 'date' },
  ],
};
export const OrganizationAudit: CollectionConfig = {
  slug: 'organization-audit', lockDocuments: false, admin: { hidden: true }, hooks: internalHooks,
  access: { create: () => false, read: ({ req }) => isActiveAdmin(req.user), update: () => false, delete: () => false },
  fields: [
    { name: 'kind', type: 'select', required: true, options: ['periods', 'divisions'] }, { name: 'entityId', type: 'number', required: true },
    { name: 'revisionId', type: 'number', required: true }, { name: 'actorId', type: 'number', required: true }, { name: 'action', type: 'text', required: true },
    { name: 'before', type: 'json', required: true }, { name: 'after', type: 'json', required: true }, { name: 'correlationId', type: 'text', required: true },
  ],
};
