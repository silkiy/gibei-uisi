import type { CollectionConfig, CollectionSlug, Where } from 'payload';
import { internalHooks } from '../editorial/internal';
import { isActiveAdmin, isActiveUser } from '../auth/policy';

const reviewAccess: import('payload').Access = ({ req }) => {
  if (isActiveAdmin(req.user)) return true;
  return isActiveUser(req.user) ? { or: [{ 'page.owner': { equals: req.user!.id } }, { 'page.assignedTo': { in: [req.user!.id] } }] } as Where : false;
};
export const PageReviews: CollectionConfig = {
  slug: 'page-reviews', admin: { hidden: true }, lockDocuments: false,
  access: { create: () => false, read: reviewAccess, update: () => false, delete: () => false }, hooks: internalHooks,
  fields: [
    { name: 'page', type: 'relationship', relationTo: 'pages' as CollectionSlug, required: true, maxDepth: 0 },
    { name: 'revision', type: 'relationship', relationTo: 'page-revisions' as CollectionSlug, required: true, maxDepth: 0 },
    { name: 'editVersion', type: 'number', required: true },
    { name: 'manifest', type: 'json', required: true },
    { name: 'manifestDigest', type: 'text', required: true },
    { name: 'status', type: 'select', required: true, options: ['pending', 'approved', 'changes_requested', 'cancelled'] },
    { name: 'submittedBy', type: 'number', required: true },
    { name: 'reviewerId', type: 'number' }, { name: 'note', type: 'textarea', maxLength: 2000 }, { name: 'resolvedAt', type: 'date' },
  ],
};
