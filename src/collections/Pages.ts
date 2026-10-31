import type { CollectionConfig, CollectionSlug, FieldAccess, Where } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { pageHooks } from '../editorial/pages';
import { pageDraftFields } from '../editorial/page-fields';

const adminWrite: FieldAccess = ({ req }) => isActiveAdmin(req.user);
const access = ({ req }: Parameters<import('payload').Access>[0]) => {
  if (isActiveAdmin(req.user)) return true;
  return isActiveUser(req.user) ? { or: [{ owner: { equals: req.user!.id } }, { assignedTo: { in: [req.user!.id] } }] } as Where : false;
};
export const Pages: CollectionConfig = {
  slug: 'pages', admin: { useAsTitle: 'pageKey', defaultColumns: ['pageKey', 'owner', 'updatedAt'] },
  lockDocuments: false, disableBulkEdit: true, disableDuplicate: true,
  access: { create: ({ req }) => isActiveAdmin(req.user), read: access, update: access, delete: () => false },
  hooks: pageHooks,
  fields: [
    { name: 'editorialActions', type: 'ui', admin: { components: { Field: '/components/PageActions#PageActions' } } },
        { name: 'pageKey', type: 'select', required: true, unique: true, options: ['homepage', 'about'], access: { create: adminWrite, update: () => false } },
    ...pageDraftFields(true),
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, maxDepth: 0, admin: { readOnly: true } },
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, maxDepth: 0, access: { create: adminWrite, update: adminWrite } },
    { name: 'assignedTo', type: 'relationship', relationTo: 'users', hasMany: true, maxDepth: 0, access: { create: adminWrite, update: adminWrite } },
    { name: 'workingRevision', type: 'relationship', relationTo: 'page-revisions' as CollectionSlug, maxDepth: 0, admin: { hidden: true } },
    { name: 'publicRevision', type: 'relationship', relationTo: 'page-revisions' as CollectionSlug, maxDepth: 0, admin: { hidden: true } },
    { name: 'lockVersion', type: 'number', required: true, defaultValue: 0, admin: { hidden: true } },
    { name: 'expectedLockVersion', type: 'number', virtual: true, admin: { readOnly: true } },
    { name: 'expectedRevisionId', type: 'number', virtual: true, admin: { readOnly: true } },
    { name: 'state', type: 'text', virtual: true, admin: { readOnly: true } },
  ],
};
