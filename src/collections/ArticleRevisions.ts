import type { CollectionConfig } from 'payload';
import { internalHooks } from '../editorial/internal';
import { draftFields } from '../editorial/fields';

export const ArticleRevisions: CollectionConfig = {
  slug: 'article-revisions', admin: { hidden: true }, lockDocuments: false,
  access: { create: () => false, read: () => false, update: () => false, delete: () => false },
  hooks: internalHooks,
  indexes: [{ fields: ['article', 'number'], unique: true }],
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true, maxDepth: 0 },
    { name: 'number', type: 'number', required: true, min: 1 },
    { name: 'state', type: 'select', required: true, options: ['draft', 'in_review', 'revision_required', 'published', 'archived'] },
    { name: 'editVersion', type: 'number', required: true, min: 1 },
    ...draftFields(),
  ],
};
