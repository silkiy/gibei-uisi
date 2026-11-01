import { APIError, type PayloadRequest } from 'payload';
import { sql } from '@payloadcms/db-postgres';
import type { ArticleRevision } from '../payload-types';
import { transaction } from '../editorial/internal';
import { articleSearch } from './article-search';
import { publicBody } from './serialization';
import { previewAssets } from '../media/references';
import { RESEARCH_DISCLAIMER } from './research-policy.mjs';
import { safeExternalURL } from './links.mjs';

type Row = { id: number; slug: string; title: string; excerpt: string; publicAuthor: string; analysisDate: string; publishedAt: string | Date; body: unknown; additionalNote: string | null; categoryName: string | null; categorySlug: string | null; assets: ArticleRevision['assets']; sources: { title?: string; url?: string }[] };
function base(req: PayloadRequest) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  return { schema, from: sql`FROM ${schema}.research_publications e JOIN ${schema}.research_revisions r ON r.id=e.public_revision_id AND r.entity_id=e.id AND r.state='published'
    JOIN LATERAL(SELECT v.resolved_at FROM ${schema}.organization_reviews v WHERE v.kind='research' AND v.entity_id=e.id AND v.revision_id=r.id AND v.edit_version=r.edit_version AND v.status='approved' AND v.resolved_at IS NOT NULL ORDER BY v.id DESC LIMIT 1) decision ON true
    LEFT JOIN ${schema}.research_categories c ON c.id=r.category_id` };
}
async function rows(req: PayloadRequest, condition: ReturnType<typeof sql>, limit: number, offset = 0, detail = false) {
  const { schema, from } = base(req);
  return (await (await transaction(req)).execute<Row>(sql`SELECT e.id,e.slug,r.title,r.excerpt,r.public_author AS "publicAuthor",r.analysis_date AS "analysisDate",${detail ? sql`r.body` : sql`NULL::jsonb`} AS body,r.additional_note AS "additionalNote",decision.resolved_at AS "publishedAt",c.name AS "categoryName",c.slug AS "categorySlug",
    ${detail ? sql`COALESCE((SELECT jsonb_agg(jsonb_build_object('asset',a.asset_id,'fileVersion',a.file_version,'checksum',a.checksum,'alt',a.alt,'caption',a.caption) ORDER BY a._order) FROM ${schema}.research_revisions_assets a WHERE a._parent_id=r.id),'[]'::jsonb)` : sql`'[]'::jsonb`} AS assets,
    ${detail ? sql`COALESCE((SELECT jsonb_agg(jsonb_build_object('title',s.title,'url',s.url) ORDER BY s._order) FROM ${schema}.research_revisions_sources s WHERE s._parent_id=r.id),'[]'::jsonb)` : sql`'[]'::jsonb`} AS sources
    ${from} WHERE e.deleted_at IS NULL AND ${condition} ORDER BY decision.resolved_at DESC,e.id DESC LIMIT ${limit} OFFSET ${offset}`)).rows;
}
const summary = (row: Row) => ({ id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt, publicAuthor: row.publicAuthor, analysisDate: row.analysisDate, publishedAt: new Date(row.publishedAt).toISOString(), category: row.categorySlug ? { name: row.categoryName, slug: row.categorySlug } : null });
export async function publicResearch(req: PayloadRequest, query: URLSearchParams) {
  if ([...query.keys()].some(key => !['q', 'category', 'page', 'limit'].includes(key) || query.getAll(key).length !== 1)) throw new APIError('Unsupported query parameter', 400);
  const { q, category, page, limit } = articleSearch(query), { from } = base(req);
  const condition = sql`(${q}='' OR strpos(lower(COALESCE(r.title,'')),lower(${q}))>0 OR strpos(lower(COALESCE(r.excerpt,'')),lower(${q}))>0) AND (${category}='' OR c.slug=${category})`;
  const totalDocs = (await (await transaction(req)).execute<{ total: number }>(sql`SELECT count(*)::int AS total ${from} WHERE e.deleted_at IS NULL AND ${condition}`)).rows[0].total;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit)), outOfRange = page > totalPages;
  return { docs: outOfRange ? [] : (await rows(req, condition, limit, (page - 1) * limit)).map(summary), totalDocs, totalPages, page, limit, outOfRange };
}
export async function researchCategories(req: PayloadRequest) {
  const { from } = base(req);
  return (await (await transaction(req)).execute<{ name: string; slug: string }>(sql`SELECT DISTINCT c.name,c.slug ${from} WHERE e.deleted_at IS NULL AND c.slug IS NOT NULL ORDER BY c.name`)).rows;
}
export async function researchDetail(req: PayloadRequest, slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null;
  const [row] = await rows(req, sql`e.slug=${slug}`, 1, 0, true); if (!row) return null;
  return { ...summary(row), body: publicBody(row.body, (row.assets || []).map(item => Number(item.asset))), assets: await previewAssets(req, row.assets),
    sources: row.sources.filter(source => safeExternalURL(source.url)).map(source => ({ title: source.title || 'Sumber', url: safeExternalURL(source.url)! })), disclaimer: RESEARCH_DISCLAIMER, additionalNote: row.additionalNote };
}
