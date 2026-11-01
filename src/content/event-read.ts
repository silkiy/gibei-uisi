import { sql } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';
import type { ArticleRevision } from '../payload-types';
import { transaction } from '../editorial/internal';
import { eventStatus } from '../events/status.mjs';
import { previewAssets } from '../media/references';
import { safeExternalURL } from './links.mjs';

type Event = { id: number; slug: string; title: string; description: string; startAt: string; endAt: string; locationType: string; location: string | null; onlineURL: string | null; organizer: string; cancelled: boolean; cancellationNote: string | null; registrationStatus: string; registrationURL: string | null; registrationConfirmed: boolean; registrationOpensAt: string | null; registrationClosesAt: string | null; assets: ArticleRevision['assets'] };
export async function eventDetail(req: PayloadRequest, slug: string) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  const [row] = (await (await transaction(req)).execute<Event>(sql`SELECT e.id,e.slug,r.title,r.description,r.start_at AS "startAt",r.end_at AS "endAt",r.location_type AS "locationType",r.location,r.online_u_r_l AS "onlineURL",r.organizer,r.cancelled,r.cancellation_note AS "cancellationNote",r.registration_status AS "registrationStatus",r.registration_u_r_l AS "registrationURL",r.registration_confirmed AS "registrationConfirmed",r.registration_opens_at AS "registrationOpensAt",r.registration_closes_at AS "registrationClosesAt",
    COALESCE((SELECT jsonb_agg(jsonb_build_object('asset',a.asset_id,'fileVersion',a.file_version,'checksum',a.checksum,'alt',a.alt,'caption',a.caption)) FROM ${schema}.event_revisions_assets a WHERE a._parent_id=r.id),'[]'::jsonb) AS assets
    FROM ${schema}.events e JOIN ${schema}.event_revisions r ON r.id=e.public_revision_id AND r.entity_id=e.id AND r.state='published'
    WHERE e.deleted_at IS NULL AND e.slug=${slug} AND EXISTS(SELECT 1 FROM ${schema}.organization_reviews v WHERE v.kind='events' AND v.entity_id=e.id AND v.revision_id=r.id AND v.edit_version=r.edit_version AND v.status='approved' AND v.resolved_at IS NOT NULL) LIMIT 1`)).rows;
  if (!row) return null;
  return { id: row.id, slug: row.slug, title: row.title, description: row.description, startAt: row.startAt, endAt: row.endAt, locationType: row.locationType, location: row.location,
    onlineURL: safeExternalURL(row.onlineURL), organizer: row.organizer, cancellationNote: row.cancelled ? row.cancellationNote : null, registrationStatus: row.registrationStatus,
    ...eventStatus(row), assets: await previewAssets(req, row.assets) };
}
