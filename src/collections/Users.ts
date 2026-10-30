import { Forbidden, type CollectionConfig } from 'payload';
import { canCreateAccount, isActiveAdmin, isActiveUser } from '../auth/policy';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'name' },
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
    update: () => false,
    delete: () => false,
    unlock: ({ req }) => isActiveAdmin(req.user),
  },
  hooks: {
    beforeChange: [({ operation, req, data }) => {
      if (operation === 'create' && !canCreateAccount(req.user, req.context)) throw new Forbidden();
      return data;
    }],
    beforeLogin: [({ user }) => {
      if (!isActiveUser(user)) throw new Forbidden();
    }],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'select', required: true, defaultValue: 'media', options: ['admin', 'media'], saveToJWT: true },
    { name: 'status', type: 'select', required: true, defaultValue: 'active', options: ['active', 'inactive'], saveToJWT: true },
  ],
};
