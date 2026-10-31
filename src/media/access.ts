import { NotFound, type PayloadRequest } from 'payload';
import { sql } from '@payloadcms/db-postgres';
import type { Media } from '../payload-types';
import { transaction } from '../editorial/internal';
import { canEditDraft } from '../editorial/policy';

// Shared by workflow publish/withdraw/revoke; serializes the small MVP editorial graph.
export async function editorialLock(req: PayloadRequest, shared = false) {
  const db = await transaction(req);
  await db.execute(shared ? sql`SELECT pg_advisory_xact_lock_shared(697816, 0)` : sql`SELECT pg_advisory_xact_lock(697816, 0)`);
}
export async function loadAsset(req: PayloadRequest, key: string): Promise<Media> {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(key)) throw new NotFound();
  const asset = await req.payload.db.findOne({ collection: 'media', where: { key: { equals: key } }, req });
  if (!asset) throw new NotFound();
  return asset as Media;
}
export const privatelyAllowed = (req: PayloadRequest, asset: Media) => canEditDraft(req.user, asset);
export async function isAssetPublic(req: PayloadRequest, asset: Media) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  const result = await (await transaction(req)).execute<{ allowed: boolean }>(sql`SELECT EXISTS (
    SELECT 1 FROM ${schema}.articles a
    JOIN ${schema}.article_revisions r ON a.public_revision_id = r.id AND r.article_id = a.id
    JOIN ${schema}.article_revisions_assets usage ON usage._parent_id = r.id
    WHERE r.state = 'published' AND usage.asset_id = ${asset.id}
      AND usage.file_version = ${asset.fileVersion} AND usage.checksum = ${asset.checksum}
      AND EXISTS (SELECT 1 FROM ${schema}.content_reviews approved WHERE approved.revision_id = r.id
        AND approved.status = 'approved' AND approved.edit_version = r.edit_version AND approved.resolved_at IS NOT NULL)
  ) OR EXISTS (
    SELECT 1 FROM ${schema}.site_settings s JOIN ${schema}.settings_audit audit ON audit.version = s.config_version
    WHERE (s.logo_id = ${asset.id} AND s.logo_version = ${asset.fileVersion} AND s.logo_checksum = ${asset.checksum}
      AND audit.after->>'logo' = ${String(asset.id)} AND audit.after->>'logoVersion' = ${asset.fileVersion} AND audit.after->>'logoChecksum' = ${asset.checksum})
    OR (s.favicon_id = ${asset.id} AND s.favicon_version = ${asset.fileVersion} AND s.favicon_checksum = ${asset.checksum}
      AND audit.after->>'favicon' = ${String(asset.id)} AND audit.after->>'faviconVersion' = ${asset.fileVersion} AND audit.after->>'faviconChecksum' = ${asset.checksum})
  ) AS allowed`);
  return result.rows[0]?.allowed === true;
}
