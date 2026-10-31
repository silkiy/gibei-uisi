import type { CollectionConfig } from 'payload';
import { internalHooks } from '../editorial/internal';
import { isActiveAdmin } from '../auth/policy';

export const SettingsAudit: CollectionConfig = {
  slug: 'settings-audit', lockDocuments: false, admin: { hidden: true }, hooks: internalHooks,
  access: { create: () => false, update: () => false, delete: () => false, read: ({ req }) => isActiveAdmin(req.user) },
  fields: [
    { name: 'actorId', type: 'number', required: true }, { name: 'version', type: 'number', required: true, unique: true },
    { name: 'before', type: 'json', required: true }, { name: 'after', type: 'json', required: true },
    { name: 'correlationId', type: 'text', required: true },
  ],
};
