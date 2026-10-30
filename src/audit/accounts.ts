import { Forbidden, type CollectionConfig } from 'payload';
import { isActiveAdmin } from '../auth/policy';

export const accountAuditCapability = Symbol('account-audit');

export const AccountAudit: CollectionConfig = {
  slug: 'account-audit',
  admin: { useAsTitle: 'action' },
  disableBulkEdit: true,
  disableDuplicate: true,
  lockDocuments: false,
  access: {
    read: ({ req }) => isActiveAdmin(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [({ operation, req, data }) => {
      if (operation !== 'create' || Reflect.get(req.context, accountAuditCapability) !== true) throw new Forbidden();
      return data;
    }],
    beforeDelete: [() => { throw new Forbidden(); }],
  },
  fields: [
    { name: 'actorId', type: 'number', required: true },
    { name: 'targetId', type: 'number', required: true, index: true },
    { name: 'action', type: 'select', required: true, options: ['account_created', 'account_updated', 'password_reset'] },
    { name: 'before', type: 'json' },
    { name: 'after', type: 'json', required: true },
  ],
};
