import type { CollectionConfig } from 'payload';
import { internalHooks } from '../editorial/internal';
import { reviewAccess } from './ContentReviews';

export const EditorialAudit: CollectionConfig = {
  slug: 'editorial-audit', lockDocuments: false, admin: { useAsTitle: 'action' },
  access: { create: () => false, read: reviewAccess, update: () => false, delete: () => false },
  hooks: internalHooks,
  fields: [
    { name: 'actorId', type: 'number', required: true },
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true, maxDepth: 0 },
    { name: 'revisionId', type: 'number', required: true },
    { name: 'editVersion', type: 'number', required: true },
    { name: 'action', type: 'select', required: true, options: ['draft_created', 'draft_saved', 'ownership_changed', 'submitted', 'submission_withdrawn', 'revision_requested', 'published', 'revision_created', 'revision_archived', 'publication_withdrawn', 'draft_deleted'] },
    { name: 'before', type: 'json' },
    { name: 'after', type: 'json', required: true },
    { name: 'correlationId', type: 'text', required: true },
  ],
};
