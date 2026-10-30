import { type CollectionConfig } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { accountHooks } from '../auth/account-hooks';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'name' },
  disableBulkEdit: true,
  disableDuplicate: true,
  // Account writes are serialized by accountHooks; Payload's document lock reads
  // outside the active transaction and can exhaust the deliberately small pool.
  lockDocuments: false,
  auth: {
    useSessions: true,
    tokenExpiration: 7200,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    removeTokenFromResponses: true,
    cookies: { sameSite: 'Lax', secure: (process.env.SERVER_URL || '').startsWith('https:') },
  },
  access: {
    admin: ({ req }) => isActiveUser(req.user),
    create: ({ req }) => isActiveAdmin(req.user),
    read: ({ req }) => isActiveAdmin(req.user) || (isActiveUser(req.user) ? { id: { equals: req.user!.id } } : false),
    update: ({ req }) => isActiveAdmin(req.user),
    delete: () => false,
    unlock: () => false,
  },
  hooks: accountHooks,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'select', required: true, defaultValue: 'media', options: ['admin', 'media'], saveToJWT: true },
    { name: 'status', type: 'select', required: true, defaultValue: 'active', options: ['active', 'inactive'], saveToJWT: true },
  ],
};
