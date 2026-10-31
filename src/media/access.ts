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
  ) AS allowed`);
  return result.rows[0]?.allowed === true;
}
