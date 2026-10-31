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
