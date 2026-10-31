import { APIError, NotFound, type PayloadRequest } from 'payload';
import type { ArticleRevision, Media } from '../payload-types';
import { relationId } from '../editorial/policy';
import { privatelyAllowed, isAssetPublic } from './access';
import { digest, readAsset, assetFilesExist } from './storage';

export async function previewAssets(req: PayloadRequest, references: ArticleRevision['assets']) {
  return Promise.all((references || []).map(async reference => {
    const id = Number(relationId(reference.asset));
    const asset = await req.payload.db.findOne({ collection: 'media', where: { id: { equals: id } }, req }) as Media | null;
    const available = !!asset && asset.state === 'ready' && asset.fileVersion === reference.fileVersion && asset.checksum === reference.checksum
      && (privatelyAllowed(req, asset) || await isAssetPublic(req, asset)) && await assetFilesExist(asset.key, asset.size, asset.hasThumbnail);
    return { id, mime: asset?.mime || 'application/pdf', alt: reference.alt || 'Media', caption: reference.caption,
      width: asset?.width, height: asset?.height, available, url: available ? `/api/media/${asset!.key}/original` : null };
  }));
}

export async function referencedAsset(req: PayloadRequest, id: number) {
  if (!Number.isSafeInteger(id) || id < 1) throw new NotFound();
  const asset = await req.payload.db.findOne({ collection: 'media', where: { id: { equals: id } }, req }) as Media | null;
  if (!asset || asset.state !== 'ready' || (!privatelyAllowed(req, asset) && !await isAssetPublic(req, asset))) throw new NotFound();
  return asset;
}
export async function normalizeAssets(req: PayloadRequest, rows: ArticleRevision['assets']) {
  if (!Array.isArray(rows) || rows.length > 30) throw new APIError('Invalid asset references', 400);
  const result = [];
  for (const row of rows) {
    const asset = await referencedAsset(req, Number(relationId(row.asset)));
    if ((row.fileVersion && row.fileVersion !== asset.fileVersion) || (row.checksum && row.checksum !== asset.checksum)) throw new APIError('Asset version changed', 409);
    result.push({ asset: asset.id, fileVersion: asset.fileVersion, checksum: asset.checksum, alt: row.alt ?? asset.alt, caption: row.caption ?? null });
  }
  return result;
}
export async function verifyReferencedFiles(req: PayloadRequest, revision: ArticleRevision) {
  for (const reference of revision.assets || []) {
    let asset: Media;
    try { asset = await referencedAsset(req, Number(relationId(reference.asset))); }
    catch (error) { if (error instanceof NotFound) throw new APIError('Referenced asset is unavailable', 409); throw error; }
    if (asset.fileVersion !== reference.fileVersion || asset.checksum !== reference.checksum) throw new APIError('Asset version changed', 409);
    try {
      if (digest(await readAsset(asset.key, 'original')) !== asset.checksum) throw Error('Original checksum');
      if (asset.hasThumbnail && digest(await readAsset(asset.key, 'thumbnail')) !== asset.thumbnailChecksum) throw Error('Thumbnail checksum');
    } catch {
      req.payload.logger.warn({ assetKey: asset.key }, 'Referenced asset file is unavailable');
      throw new APIError('Referenced asset file is unavailable', 409);
    }
  }
}
