import type { PayloadRequest } from 'payload';
import type { Media } from '../payload-types';
import { isAssetPublic } from '../media/access';
import { assetFilesExist } from '../media/storage';
import { safeNavigationURL, validEmail } from '../validation/navigation.mjs';
import { relationId } from '../editorial/policy';

export async function publicSettings(req: PayloadRequest) {
  const doc = await req.payload.findGlobal({ slug: 'site-settings', req, depth: 0, overrideAccess: true });
  async function image(value: unknown) {
    const id = Number(relationId(value as number));
    if (!Number.isSafeInteger(id) || id < 1) return null;
    const asset = await req.payload.db.findOne({ collection: 'media', where: { id: { equals: id } }, req }) as Media | null;
    return asset?.state === 'ready' && await isAssetPublic(req, asset) && await assetFilesExist(asset.key, asset.size, asset.hasThumbnail)
      ? { url: `/api/media/${asset.key}/original`, alt: asset.alt, width: asset.width || 96, height: asset.height || 96 } : null;
  }
  return {
    siteName: doc.siteName || 'GIBEI UISI', footerText: doc.footerText || null,
    email: doc.emailConfirmed === true && validEmail(doc.email) ? doc.email : null,
    location: doc.locationConfirmed === true && doc.location ? doc.location : null,
    socials: (doc.socials || []).filter(row => row.confirmed === true && safeNavigationURL(row.url)).map(row => ({ label: row.label, url: row.url })),
    navigation: (doc.navigation || []).filter(row => safeNavigationURL(row.url)).map(row => ({ label: row.label, href: row.url })),
    logo: await image(doc.logo), favicon: await image(doc.favicon),
  };
}
export type PublicSettings = Awaited<ReturnType<typeof publicSettings>>;
