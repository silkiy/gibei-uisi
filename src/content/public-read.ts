import { APIError, NotFound, type PayloadRequest } from 'payload';
import { sql } from '@payloadcms/db-postgres';
import type { ArticleRevision } from '../payload-types';
import { transaction } from '../editorial/internal';
import { assetFilesExist } from '../media/storage';
import { publicBody } from './serialization';
import { articleSearch } from './article-search';

type PublicAssetRow = { id: number; key: string; mime: string; state: string; version: string; checksum: string; expectedVersion: string; expectedChecksum: string; size: number; thumbnail: boolean; alt: string; caption: string | null };
type Row = { id: number; slug: string; title: string; excerpt: string; body: ArticleRevision['body']; public_author: string; published_at: Date | string; category_name: string | null; category_slug: string | null; sources: { title: string | null; url: string | null }[]; assets: PublicAssetRow[]; related: { id: number; slug: string; title: string; excerpt: string }[] };
function base(req: PayloadRequest) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  return { schema, from: sql`FROM ${schema}.articles a
    JOIN ${schema}.article_revisions r ON a.public_revision_id = r.id AND r.article_id = a.id AND r.state = 'published'
    JOIN LATERAL (SELECT cr.resolved_at FROM ${schema}.content_reviews cr WHERE cr.revision_id = r.id AND cr.article_id = a.id AND cr.edit_version = r.edit_version AND cr.status = 'approved' AND cr.resolved_at IS NOT NULL ORDER BY cr.id DESC LIMIT 1) decision ON true
    LEFT JOIN ${schema}.article_categories c ON c.id = r.category_id` };
}
async function rows(req: PayloadRequest, where: ReturnType<typeof sql>, limit: number, offset = 0) {
  const { schema, from } = base(req);
  const result = await (await transaction(req)).execute<Row>(sql`SELECT a.id,a.slug,r.title,r.excerpt,r.body,r.public_author,decision.resolved_at AS published_at,c.name AS category_name,c.slug AS category_slug,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('title',s.title,'url',s.url) ORDER BY s._order) FROM ${schema}.article_revisions_sources s WHERE s._parent_id = r.id),'[]'::jsonb) AS sources,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',ref.asset_id,'key',m.key,'mime',m.mime,'state',m.state,'version',m.file_version,'checksum',m.checksum,'expectedVersion',ref.file_version,'expectedChecksum',ref.checksum,'size',m.size,'thumbnail',m.has_thumbnail,'alt',ref.alt,'caption',ref.caption) ORDER BY ref._order)
      FROM ${schema}.article_revisions_assets ref LEFT JOIN ${schema}.media m ON m.id = ref.asset_id WHERE ref._parent_id = r.id),'[]'::jsonb) AS assets,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',target.id,'slug',target.slug,'title',tr.title,'excerpt',tr.excerpt) ORDER BY link._order)
      FROM ${schema}.article_revisions_related link JOIN ${schema}.articles target ON target.id = link.target_id
      JOIN ${schema}.article_revisions tr ON target.public_revision_id = tr.id AND tr.article_id = target.id AND tr.state = 'published'
      WHERE link._parent_id = r.id AND EXISTS(SELECT 1 FROM ${schema}.content_reviews approved WHERE approved.revision_id = tr.id AND approved.edit_version = tr.edit_version AND approved.status = 'approved')),'[]'::jsonb) AS related
    ${from} WHERE ${where} ORDER BY decision.resolved_at DESC,a.id DESC LIMIT ${limit} OFFSET ${offset}`);
  return result.rows;
}
async function serialize(row: Row, detail: boolean) {
  const assets = await Promise.all(row.assets.map(async asset => {
    const available = asset.state === 'ready' && asset.version === asset.expectedVersion && asset.checksum === asset.expectedChecksum && await assetFilesExist(asset.key, Number(asset.size), asset.thumbnail);
    return { id: asset.id, mime: asset.mime, alt: asset.alt, caption: asset.caption, available,
      url: available ? `/api/media/${asset.key}/original` : null,
      thumbnailUrl: available && asset.thumbnail ? `/api/media/${asset.key}/thumbnail` : null,
      fallback: available ? null : 'Media tidak tersedia' };
  }));
  return { id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt, publicAuthor: row.public_author,
    publishedAt: new Date(row.published_at).toISOString(), category: row.category_slug ? { name: row.category_name, slug: row.category_slug } : null,
    assets, related: row.related, ...(detail ? { body: publicBody(row.body), sources: row.sources } : {}) };
}
export async function publicArticle(req: PayloadRequest, slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) throw new NotFound();
  const [row] = await rows(req, sql`a.slug = ${slug}`, 1);
  if (!row) throw new NotFound();
  return serialize(row, true);
}
export async function publicArticles(req: PayloadRequest, query: URLSearchParams) {
  const keys = ['q', 'category', 'page', 'limit'];
  if ([...query.keys()].some(key => !keys.includes(key) || query.getAll(key).length !== 1)) throw new APIError('Unsupported query parameter', 400);
  const { page, limit, q, category } = articleSearch(query);
  const { from } = base(req);
  const where = sql`(${q} = '' OR strpos(lower(COALESCE(r.title,'')),lower(${q})) > 0 OR strpos(lower(COALESCE(r.excerpt,'')),lower(${q})) > 0) AND (${category} = '' OR c.slug = ${category})`;
  const count = await (await transaction(req)).execute<{ total: number }>(sql`SELECT count(*)::int AS total ${from} WHERE ${where}`);
  const totalDocs = count.rows[0].total, totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const outOfRange = page > totalPages;
  return { docs: outOfRange ? [] : await Promise.all((await rows(req, where, limit, (page - 1) * limit)).map(row => serialize(row, false))), totalDocs, totalPages, page, limit, outOfRange };
}

export async function publicArticleCategories(req: PayloadRequest) {
  const { from } = base(req);
  return (await (await transaction(req)).execute<{ name: string; slug: string }>(sql`SELECT DISTINCT c.name,c.slug ${from} WHERE c.slug IS NOT NULL ORDER BY c.name,c.slug`)).rows;
}
