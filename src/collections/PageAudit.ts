import type { CollectionConfig, CollectionSlug } from 'payload';
import { internalHooks } from '../editorial/internal';
import { isActiveAdmin } from '../auth/policy';

export const PageAudit: CollectionConfig = {
  slug: 'page-audit', admin: { hidden: true }, lockDocuments: false,
  access: { create: () => false, read: ({ req }) => isActiveAdmin(req.user), update: () => false, delete: () => false }, hooks: internalHooks,
  fields: [
    { name: 'page', type: 'relationship', relationTo: 'pages' as CollectionSlug, required: true, maxDepth: 0 },
    { name: 'revisionId', type: 'number', required: true },
    { name: 'actorId', type: 'number', required: true },
    { name: 'editVersion', type: 'number', required: true },
    { name: 'action', type: 'select', required: true, options: ['draft_created', 'draft_saved', 'ownership_changed', 'submitted', 'submission_withdrawn', 'revision_requested', 'published', 'revision_created', 'publication_withdrawn'] },
    { name: 'before', type: 'json' }, { name: 'after', type: 'json', required: true },
    { name: 'correlationId', type: 'text', required: true },
  ],
};
