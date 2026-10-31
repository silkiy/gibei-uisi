import { Forbidden, type CollectionConfig, type Where } from 'payload';
import { isActiveAdmin, isActiveUser } from '../auth/policy';
import { internalHooks } from '../editorial/internal';

export const Media: CollectionConfig = {
  slug: 'media', lockDocuments: false, disableBulkEdit: true, disableDuplicate: true,
  admin: { useAsTitle: 'name', components: { beforeList: ['/components/MediaUpload#MediaUpload'] } },
  access: { create: () => false, update: () => false, delete: () => false, read: ({ req }) => {
    if (isActiveAdmin(req.user)) return true;
    return isActiveUser(req.user) ? { or: [{ owner: { equals: req.user!.id } }, { assignedTo: { in: [req.user!.id] } }] } as Where : false;
  } },
  hooks: { ...internalHooks, afterRead: [({ doc, req }) => {
    if (!isActiveUser(req.user) || (!isActiveAdmin(req.user) && doc.owner !== req.user!.id && !doc.assignedTo?.includes(req.user!.id))) throw new Forbidden();
    return doc;
  }] },
  fields: [
    { name: 'preview', type: 'ui', admin: { components: { Field: '/components/MediaPreview#MediaPreview' } } },
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'name', type: 'text', required: true },
    { name: 'alt', type: 'text', required: true, maxLength: 300 },
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, maxDepth: 0 },
    { name: 'assignedTo', type: 'relationship', relationTo: 'users', hasMany: true, maxDepth: 0 },
    { name: 'state', type: 'select', required: true, options: ['ready', 'revoked', 'deleted'] },
    { name: 'fileVersion', type: 'text', required: true },
    { name: 'checksum', type: 'text', required: true },
    { name: 'mime', type: 'text', required: true },
    { name: 'extension', type: 'text', required: true },
    { name: 'size', type: 'number', required: true },
    { name: 'width', type: 'number' }, { name: 'height', type: 'number' },
    { name: 'hasThumbnail', type: 'checkbox', required: true },
    { name: 'thumbnailChecksum', type: 'text' },
    { name: 'revokedAt', type: 'date' },
  ],
};
export const MediaAudit: CollectionConfig = {
  slug: 'media-audit', lockDocuments: false, admin: { hidden: true }, hooks: internalHooks,
  access: { create: () => false, update: () => false, delete: () => false, read: ({ req }) => isActiveAdmin(req.user) },
  fields: [
    { name: 'assetId', type: 'number', required: true }, { name: 'actorId', type: 'number', required: true },
    { name: 'action', type: 'text', required: true }, { name: 'details', type: 'json', required: true },
    { name: 'correlationId', type: 'text', required: true },
  ],
};
