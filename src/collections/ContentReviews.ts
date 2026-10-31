import type { CollectionConfig, Where } from 'payload';
import { internalHooks } from '../editorial/internal';
import { isActiveAdmin, isActiveUser } from '../auth/policy';

export const reviewAccess = ({ req }: Parameters<import('payload').Access>[0]) => {
  if (isActiveAdmin(req.user)) return true;
  return isActiveUser(req.user) ? { and: [{ 'article.deletedAt': { exists: false } }, { or: [{ 'article.owner': { equals: req.user!.id } }, { 'article.assignedTo': { in: [req.user!.id] } }] }] } as Where : false;
};
export const ContentReviews: CollectionConfig = {
  slug: 'content-reviews', lockDocuments: false, admin: { useAsTitle: 'status' }, hooks: internalHooks,
  access: { create: () => false, update: () => false, delete: () => false, read: reviewAccess },
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true, maxDepth: 0 },
    { name: 'revision', type: 'relationship', relationTo: 'article-revisions', required: true, maxDepth: 0 },
    { name: 'editVersion', type: 'number', required: true },
    { name: 'manifestDigest', type: 'text', required: true }, { name: 'manifest', type: 'json', required: true },
    { name: 'status', type: 'select', required: true, options: ['pending', 'approved', 'changes_requested', 'cancelled'] },
    { name: 'submittedBy', type: 'number', required: true },
    { name: 'reviewerId', type: 'number' }, { name: 'note', type: 'textarea', maxLength: 2000 }, { name: 'resolvedAt', type: 'date' },
  ],
};
