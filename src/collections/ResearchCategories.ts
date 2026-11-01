import type { CollectionConfig } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { categoryHooks } from '../editorial/internal';
import { normalizeSlug } from '../editorial/policy';

export const ResearchCategories: CollectionConfig = {
  slug: 'research-categories', lockDocuments: false, admin: { useAsTitle: 'name' }, hooks: categoryHooks,
  access: { create: ({ req }) => isActiveAdmin(req.user), read: ({ req }) => isActiveUser(req.user), update: ({ req }) => isActiveAdmin(req.user), delete: () => false },
  fields: [{ name: 'name', type: 'text', required: true, maxLength: 120 }, { name: 'slug', type: 'text', unique: true, required: true, hooks: { beforeValidate: [({ value }) => typeof value === 'string' ? normalizeSlug(value) : value] } }],
};
