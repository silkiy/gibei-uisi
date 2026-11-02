import { sql } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';
import { transaction } from '../editorial/internal';
import { editorialKinds,editorialModel } from '../editorial/reviewed-model';
import { publicRoutes } from './metadata';
import { canonicalURL } from './policy.mjs';
export async function sitemapEntries(req:PayloadRequest) {
 const paths=Object.keys(publicRoutes),schema=sql.identifier(req.payload.db.schemaName||'payload');
 const routes:Record<string,string>={divisions:'/tentang/divisi/',research:'/publikasi/riset/',events:'/kegiatan/',galleries:'/galeri/'};
 for(const kind of editorialKinds.filter(kind=>kind in routes)) {
  const model=editorialModel(kind);
  const rows=(await (await transaction(req)).execute<{slug:string}>(sql`SELECT e.slug FROM ${schema}.${sql.identifier(model.root.replaceAll('-','_'))} e JOIN ${schema}.${sql.identifier(model.revisions.replaceAll('-','_'))} r ON r.id=e.public_revision_id AND r.entity_id=e.id AND r.state='published' WHERE e.deleted_at IS NULL AND EXISTS(SELECT 1 FROM ${schema}.organization_reviews v WHERE v.kind=${kind} AND v.entity_id=e.id AND v.revision_id=r.id AND v.edit_version=r.edit_version AND v.status='approved' AND v.resolved_at IS NOT NULL) ORDER BY e.id`)).rows;
  paths.push(...rows.map(row=>routes[kind]+row.slug));
 }
 const articles=(await (await transaction(req)).execute<{slug:string}>(sql`SELECT e.slug FROM ${schema}.articles e JOIN ${schema}.article_revisions r ON r.id=e.public_revision_id AND r.article_id=e.id AND r.state='published' WHERE e.deleted_at IS NULL AND EXISTS(SELECT 1 FROM ${schema}.content_reviews v WHERE v.article_id=e.id AND v.revision_id=r.id AND v.edit_version=r.edit_version AND v.status='approved' AND v.resolved_at IS NOT NULL) ORDER BY e.id`)).rows;
 paths.push(...articles.map(row=>'/publikasi/artikel/'+row.slug));
 return paths.map(path=>({url:canonicalURL(path)}));
}
