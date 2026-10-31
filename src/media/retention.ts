import { sql } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';
import { transaction } from '../editorial/internal';

// All revisions and review manifests retain their files, including withdrawn history.
export async function assetReferences(req: PayloadRequest, id: number) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  const result = await (await transaction(req)).execute<{ kind: string; id: number; articleId: number | null; label: string }>(sql`
    SELECT 'revision' AS kind,r.id,a.id AS "articleId",a.slug AS label
      FROM ${schema}.article_revisions_assets usage
      JOIN ${schema}.article_revisions r ON r.id=usage._parent_id JOIN ${schema}.articles a ON a.id=r.article_id
      WHERE usage.asset_id=${id}
    UNION
    SELECT 'review',review.id,a.id,a.slug FROM ${schema}.content_reviews review JOIN ${schema}.articles a ON a.id=review.article_id
      WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(review.manifest->'assets','[]'::jsonb)) item
        WHERE item->>'asset'=${String(id)} OR item->'asset'->>'id'=${String(id)})
    UNION
    SELECT 'configuration',config.id,NULL,config.config_key FROM ${schema}.asset_config_references config WHERE config.asset_id=${id}
    ORDER BY kind,id`);
  return result.rows;
}

export async function articleReferences(req: PayloadRequest, id: number) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  const result = await (await transaction(req)).execute<{ kind: string; id: number; articleId: number; label: string }>(sql`
    SELECT DISTINCT 'revision' AS kind,r.id,a.id AS "articleId",a.slug AS label FROM ${schema}.article_revisions_related link
      JOIN ${schema}.article_revisions r ON r.id=link._parent_id JOIN ${schema}.articles a ON a.id=r.article_id
      WHERE link.target_id=${id} AND a.id<>${id}
    UNION
    SELECT 'review',review.id,a.id,a.slug FROM ${schema}.content_reviews review JOIN ${schema}.articles a ON a.id=review.article_id
      WHERE a.id<>${id} AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(review.manifest->'related','[]'::jsonb)) item
        WHERE item->>'target'=${String(id)} OR item->'target'->>'id'=${String(id)})
    ORDER BY kind,id`);
  return result.rows;
}
