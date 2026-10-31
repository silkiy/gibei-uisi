import { randomUUID } from 'node:crypto';
import { APIError, Forbidden, type GlobalConfig, type PayloadRequest } from 'payload';
import { isActiveAdmin } from '../auth/policy';
import { currentActor, editorialWrite } from '../editorial/internal';
import { editorialLock } from '../media/access';
import { relationId } from '../editorial/policy';
import { referencedAsset } from '../media/references';
import { digest, readAsset } from '../media/storage';
import { safeNavigationURL, validEmail, settingsText } from '../validation/navigation.mjs';

const fields = ['siteName', 'seoDescription', 'email', 'emailConfirmed', 'location', 'locationConfirmed', 'socials', 'navigation', 'footerText', 'logo', 'favicon'] as const;
const protectedFields = ['configVersion', 'logoVersion', 'logoChecksum', 'faviconVersion', 'faviconChecksum'];
const rawInput = new WeakMap<PayloadRequest, Record<string, unknown>>();
const snapshot = (doc: Record<string, unknown>) => Object.fromEntries([...fields, ...protectedFields].map(key => [key, key === 'logo' || key === 'favicon' ? relationId(doc[key] as number) ?? null : doc[key] ?? null]));

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings', label: 'Site Settings', lockDocuments: false,
  access: { read: ({ req }) => isActiveAdmin(req.user), update: ({ req }) => isActiveAdmin(req.user) },
  hooks: {
    beforeOperation: [async ({ args, req, operation }) => {
      if (operation !== 'update') return args;
      await editorialLock(req);
      if (!isActiveAdmin(await currentActor(req))) throw new Forbidden();
      const raw = { ...args.data };
      if (Object.keys(raw).some(key => ![...fields, ...protectedFields, 'expectedVersion', 'id', 'createdAt', 'updatedAt', 'globalType'].includes(key))) throw new APIError('Unsupported settings field', 400);
      rawInput.set(req, raw);
      return args;
    }],
    beforeChange: [async ({ req, data, originalDoc }) => {
      const raw = rawInput.get(req);
      if (!raw || !isActiveAdmin(req.user)) throw new Forbidden();
      const previous = originalDoc as Record<string, unknown>;
      const version = Number(previous.configVersion || 0);
      if (raw.expectedVersion !== version) throw new APIError('Settings changed; reload before saving', 409);
      for (const key of protectedFields) if (Object.hasOwn(raw, key) && raw[key] !== previous[key] && !(key === 'configVersion' && raw[key] === version)) throw new Forbidden();
      // Payload supplies defaults for omitted array fields; preserve only explicitly submitted changes.
      for (const key of fields) data[key] = Object.hasOwn(raw, key) ? data[key] : previous[key] ?? (key === 'siteName' ? 'GIBEI UISI' : key === 'navigation' || key === 'socials' ? [] : null);
      for (const [key, max, multiline] of [['siteName', 160, false], ['seoDescription', 300, true], ['location', 500, true], ['footerText', 500, true]] as const) {
        if (!settingsText(data[key], max, multiline)) throw new APIError('Invalid settings text', 400);
      }
      if (typeof data.siteName !== 'string' || !data.siteName.trim()) throw new APIError('Site name required', 400);
      if (data.email && !validEmail(data.email)) throw new APIError('Invalid email', 400);
      for (const key of ['emailConfirmed', 'locationConfirmed']) if (data[key] != null && typeof data[key] !== 'boolean') throw new APIError('Invalid confirmation', 400);
      if (data.emailConfirmed && !data.email || data.locationConfirmed && !data.location) throw new APIError('Confirmed contact cannot be empty', 400);
      for (const key of ['navigation', 'socials']) {
        if (!Array.isArray(data[key]) || data[key].length > 12) throw new APIError('Invalid navigation or socials', 400);
        for (const row of data[key]) {
          if (!row || !settingsText(row.label, 80) || !row.label?.trim() || !safeNavigationURL(row.url)) throw new APIError('Invalid navigation link', 400);
          if (key === 'socials' && (typeof row.confirmed !== 'boolean' || !/^https:\/\//.test(row.url))) throw new APIError('Invalid social confirmation or URL', 400);
        }
      }
      for (const key of ['logo', 'favicon']) {
        const id = relationId(data[key]);
        if (!id) { data[key] = null; data[`${key}Version`] = null; data[`${key}Checksum`] = null; continue; }
        const asset = await referencedAsset(req, Number(id));
        if (!asset.mime.startsWith('image/')) throw new APIError('Logo and favicon must be validated images', 400);
        if (digest(await readAsset(asset.key, 'original')) !== asset.checksum) throw new APIError('Configuration image unavailable', 409);
        data[key] = asset.id; data[`${key}Version`] = asset.fileVersion; data[`${key}Checksum`] = asset.checksum;
      }
      data.configVersion = version + 1;
      return data;
    }],
    afterChange: [async ({ doc, previousDoc, req }) => {
      const options = { req, overrideAccess: true, context: { [editorialWrite]: true } };
      try {
        for (const key of ['logo', 'favicon']) if (doc[key]) await req.payload.create({ collection: 'asset-config-references', ...options, data: { asset: Number(relationId(doc[key])), configKey: `site-settings.${key}`, version: String(doc.configVersion) } });
        await req.payload.create({ collection: 'settings-audit', ...options, data: { actorId: req.user!.id, version: doc.configVersion, before: snapshot(previousDoc || {}), after: snapshot(doc), correlationId: randomUUID() } });
        return doc;
      } finally { rawInput.delete(req); Reflect.deleteProperty(req.context, editorialWrite); }
    }],
    afterRead: [({ doc }) => ({ ...doc, expectedVersion: Number(doc.configVersion || 0) })],
  },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'GIBEI UISI', maxLength: 160 },
    { name: 'seoDescription', type: 'textarea', maxLength: 300 },
    ...['logo', 'favicon'].map(name => ({ name, type: 'relationship' as const, relationTo: 'media' as const, maxDepth: 0 })),
    { name: 'email', type: 'text', maxLength: 254 }, { name: 'emailConfirmed', type: 'checkbox', defaultValue: false },
    { name: 'location', type: 'textarea', maxLength: 500 }, { name: 'locationConfirmed', type: 'checkbox', defaultValue: false },
    { name: 'socials', type: 'array', maxRows: 12, fields: [{ name: 'label', type: 'text', required: true }, { name: 'url', type: 'text', required: true }, { name: 'confirmed', type: 'checkbox', defaultValue: false }] },
    { name: 'navigation', type: 'array', maxRows: 12, fields: [{ name: 'label', type: 'text', required: true }, { name: 'url', type: 'text', required: true }] },
    { name: 'footerText', type: 'textarea', maxLength: 500 },
    { name: 'configVersion', type: 'number', admin: { hidden: true } },
    ...protectedFields.filter(name => name !== 'configVersion').map(name => ({ name, type: 'text' as const, admin: { hidden: true } })),
    { name: 'expectedVersion', type: 'number', virtual: true, admin: { readOnly: true } },
  ],
};
