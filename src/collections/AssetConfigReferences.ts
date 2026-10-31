import type { CollectionConfig } from 'payload';
import { isActiveAdmin } from '../auth/policy';
import { internalHooks } from '../editorial/internal';

// Retention only. T027 must maintain this ledger atomically with versioned Site Settings.
// A row never grants public byte access by itself.
export const AssetConfigReferences: CollectionConfig = {
  slug: 'asset-config-references', lockDocuments: false, admin: { hidden: true }, hooks: internalHooks,
  access: { create: () => false, update: () => false, delete: () => false, read: ({ req }) => isActiveAdmin(req.user) },
  fields: [
    { name: 'asset', type: 'relationship', relationTo: 'media', required: true, maxDepth: 0 },
    { name: 'configKey', type: 'text', required: true, maxLength: 160 },
    { name: 'version', type: 'text', required: true, maxLength: 160 },
  ],
};
