import type { CollectionConfig, CollectionSlug } from 'payload';
import { internalHooks } from '../editorial/internal';
import { pageDraftFields } from '../editorial/page-fields';

export const PageRevisions: CollectionConfig = {
  slug: 'page-revisions', admin: { hidden: true }, lockDocuments: false,
  access: { create: () => false, read: () => false, update: () => false, delete: () => false },
  hooks: internalHooks,
  indexes: [{ fields: ['page', 'number'], unique: true }],
  fields: [
    { name: 'page', type: 'relationship', relationTo: 'pages' as CollectionSlug, required: true, maxDepth: 0 },
    { name: 'number', type: 'number', required: true, min: 1 },
    { name: 'state', type: 'select', required: true, options: ['draft', 'in_review', 'revision_required', 'published', 'archived'] },
    { name: 'editVersion', type: 'number', required: true, min: 1 },
    ...pageDraftFields(),
  ],
};
