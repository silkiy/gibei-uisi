import { APIError, type CollectionConfig } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { categoryHooks } from '../editorial/internal';
import { normalizeSlug } from '../editorial/policy';

export const Categories: CollectionConfig = {
  slug: 'article-categories', admin: { useAsTitle: 'name' }, lockDocuments: false,
  disableBulkEdit: true, disableDuplicate: true,
  access: { create: ({ req }) => isActiveAdmin(req.user), read: ({ req }) => isActiveUser(req.user), update: ({ req }) => isActiveAdmin(req.user), delete: () => false },
  hooks: { ...categoryHooks, beforeValidate: [({ data }) => {
    if (data?.slug) {
      try { data.slug = normalizeSlug(data.slug); }
      catch { throw new APIError('Slug kategori tidak valid', 400); }
    }
    return data;
  }] },
  fields: [{ name: 'name', type: 'text', required: true, maxLength: 120 }, { name: 'slug', type: 'text', required: true, unique: true }],
};
