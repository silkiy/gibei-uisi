import { sql } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';
import { transaction } from '../editorial/internal';

export async function requiredDependents(req: PayloadRequest, targetId: number) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  const result = await (await transaction(req)).execute<{ id: number; slug: string; revisionId: number }>(sql`
    SELECT DISTINCT a.id,a.slug,r.id AS "revisionId" FROM ${schema}.articles a
    JOIN ${schema}.article_revisions r ON a.public_revision_id = r.id AND r.article_id = a.id AND r.state = 'published'
    JOIN ${schema}.article_revisions_related link ON link._parent_id = r.id
    WHERE link.target_id = ${targetId} AND link.required = true AND a.id <> ${targetId}
      AND EXISTS (SELECT 1 FROM ${schema}.content_reviews approved WHERE approved.revision_id = r.id AND approved.status = 'approved')
    ORDER BY a.id`);
  return result.rows;
}
