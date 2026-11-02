import type { CollectionConfig } from 'payload';
import { isActiveAdmin } from '../auth/policy';
import { internalHooks } from '../editorial/internal';
export const PartnerLogoPermissions: CollectionConfig = {
  slug: 'partner-logo-permissions', lockDocuments: false, admin: { hidden: true }, hooks: internalHooks,
  access: { create: () => false, read: ({ req }) => isActiveAdmin(req.user), update: () => false, delete: () => false },
  fields: [
    { name: 'partner', type: 'relationship', relationTo: 'partners', required: true, maxDepth: 0 },
    { name: 'assetId', type: 'number', required: true }, { name: 'fileVersion', type: 'text', required: true }, { name: 'checksum', type: 'text', required: true },
    { name: 'allowed', type: 'checkbox', required: true }, { name: 'actorId', type: 'number', required: true },
    { name: 'note', type: 'textarea', required: true, maxLength: 2000 },
  ],
};
