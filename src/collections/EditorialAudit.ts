import type { CollectionConfig } from 'payload';
import { internalHooks } from '../editorial/internal';
import { isActiveAdmin } from '../auth/policy';

export const EditorialAudit: CollectionConfig = {
  slug: 'editorial-audit', lockDocuments: false, admin: { useAsTitle: 'action' },
  access: { create: () => false, read: ({ req }) => isActiveAdmin(req.user), update: () => false, delete: () => false },
  hooks: internalHooks,
  fields: [
    { name: 'actorId', type: 'number', required: true },
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true, maxDepth: 0 },
    { name: 'revisionId', type: 'number', required: true },
    { name: 'editVersion', type: 'number', required: true },
    { name: 'action', type: 'select', required: true, options: ['draft_created', 'draft_saved', 'ownership_changed'] },
    { name: 'before', type: 'json' },
    { name: 'after', type: 'json', required: true },
    { name: 'correlationId', type: 'text', required: true },
  ],
};
