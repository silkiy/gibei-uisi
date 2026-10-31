import type { CollectionConfig, FieldAccess } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { articleAccess, articleHooks } from '../editorial/articles';
import { draftFields } from '../editorial/fields';

const adminWrite: FieldAccess = ({ req }) => isActiveAdmin(req.user);
export const Articles: CollectionConfig = {
  slug: 'articles', admin: { useAsTitle: 'slug', defaultColumns: ['slug', 'owner', 'updatedAt'], components: { beforeList: ['/components/ReviewQueue#ReviewQueue'] } },
  lockDocuments: false, disableBulkEdit: true, disableDuplicate: true,
  access: { create: ({ req }) => isActiveUser(req.user), read: articleAccess, update: articleAccess, delete: () => false },
  hooks: articleHooks,
  fields: [
    { name: 'editorialActions', type: 'ui', admin: { components: { Field: '/components/ArticleActions#ArticleActions' } } },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'deletedAt', type: 'date', admin: { hidden: true } },
    ...draftFields(true),
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, maxDepth: 0, defaultValue: ({ user }) => user?.id, admin: { readOnly: true } },
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, maxDepth: 0, defaultValue: ({ user }) => user?.id, access: { create: adminWrite, update: adminWrite } },
    { name: 'assignedTo', type: 'relationship', relationTo: 'users', hasMany: true, maxDepth: 0, access: { create: adminWrite, update: adminWrite } },
    { name: 'workingRevision', type: 'relationship', relationTo: 'article-revisions', maxDepth: 0, admin: { hidden: true } },
    { name: 'publicRevision', type: 'relationship', relationTo: 'article-revisions', maxDepth: 0, admin: { hidden: true } },
    { name: 'lockVersion', type: 'number', required: true, defaultValue: 0, admin: { hidden: true } },
    { name: 'expectedLockVersion', type: 'number', virtual: true, admin: { readOnly: true, description: 'Versi yang dibaca; muat ulang jika terjadi konflik.' } },
    { name: 'expectedRevisionId', type: 'number', virtual: true, admin: { hidden: true, readOnly: true } },
    { name: 'state', type: 'text', virtual: true, admin: { readOnly: true } },
  ],
};
