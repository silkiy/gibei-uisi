import { sql } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';
import { transaction } from '../editorial/internal';
import { assetFilesExist } from '../media/storage';
import { relationId } from '../editorial/policy';

type Photo = { id: number; key: string; mime: string; state: string; version: string; checksum: string; expectedVersion: string; expectedChecksum: string; alt: string; size: number; thumbnail: boolean; width: number | null; height: number | null };

export async function structureData(req: PayloadRequest, requested?: string) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  const db = await transaction(req);
  const periods = (await db.execute<{ id: number; label: string }>(sql`SELECT e.id,e.label FROM ${schema}.organizational_periods e
    JOIN ${schema}.period_revisions r ON r.id=e.public_revision_id AND r.entity_id=e.id AND r.state='published' WHERE e.deleted_at IS NULL
    AND EXISTS(SELECT 1 FROM ${schema}.organization_reviews v WHERE v.kind='periods' AND v.entity_id=e.id AND v.revision_id=r.id AND v.edit_version=r.edit_version AND v.status='approved' AND v.resolved_at IS NOT NULL)
    ORDER BY r.start_date DESC,e.id DESC LIMIT 200`)).rows;
  const state = await req.payload.findGlobal({ slug: 'organization-state', req, overrideAccess: true, depth: 0 });
  const active = Number(relationId(state.activePeriod));
  const selected = requested === undefined ? active : /^[1-9]\d*$/.test(requested) ? Number(requested) : 0;
  const period = periods.find(item => item.id === selected) || null;
  const rows = period ? (await db.execute<{ name: string; position: string; displayOrder: number; example: boolean; division: string | null; photo: Photo | null }>(sql`
    SELECT r.name,r.position,r.display_order AS "displayOrder",r.example,d.slug AS division,
      CASE WHEN r.photo_id IS NULL THEN NULL ELSE jsonb_build_object('id',file.id,'key',file.key,'mime',file.mime,'state',file.state,'version',file.file_version,'checksum',file.checksum,'expectedVersion',usage.file_version,'expectedChecksum',usage.checksum,'alt',usage.alt,'size',file.size,'thumbnail',file.has_thumbnail,'width',file.width,'height',file.height) END AS photo
    FROM ${schema}.members m JOIN ${schema}.member_revisions r ON r.id=m.public_revision_id AND r.entity_id=m.id AND r.state='published'
    LEFT JOIN ${schema}.divisions d ON d.id=r.division_id AND d.deleted_at IS NULL
      AND EXISTS(SELECT 1 FROM ${schema}.division_revisions dr JOIN ${schema}.organization_reviews dv ON dv.kind='divisions' AND dv.entity_id=d.id AND dv.revision_id=dr.id AND dv.edit_version=dr.edit_version AND dv.status='approved' AND dv.resolved_at IS NOT NULL WHERE dr.id=d.public_revision_id AND dr.entity_id=d.id AND dr.state='published')
    LEFT JOIN ${schema}.member_revisions_assets usage ON usage._parent_id=r.id AND usage.asset_id=r.photo_id
    LEFT JOIN ${schema}.media file ON file.id=usage.asset_id
    WHERE m.deleted_at IS NULL AND r.period_id=${period.id}
    AND EXISTS(SELECT 1 FROM ${schema}.organization_reviews v WHERE v.kind='members' AND v.entity_id=m.id AND v.revision_id=r.id AND v.edit_version=r.edit_version AND v.status='approved' AND v.resolved_at IS NOT NULL)
    ORDER BY r.display_order,m.id LIMIT 200`)).rows : [];
  return { periods, activePeriod: periods.some(item => item.id === active) ? active : null, period,
    members: await Promise.all(rows.map(async row => {
      const asset = row.photo;
      const available = !!asset && asset.state === 'ready' && asset.version === asset.expectedVersion && asset.checksum === asset.expectedChecksum && await assetFilesExist(asset.key, Number(asset.size), asset.thumbnail);
      return { name: row.name, position: row.position, division: row.division, example: row.example,
        photo: asset ? { alt: asset.alt || 'Foto pengurus', width: asset.width, height: asset.height, available, url: available ? `/api/media/${asset.key}/original` : null } : null };
    })) };
}
