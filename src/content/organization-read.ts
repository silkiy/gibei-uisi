import { sql } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';
import { transaction } from '../editorial/internal';
import { editorialModel, type EditorialKind } from '../editorial/reviewed-model';
import { divisionNames } from '../validation/organization.mjs';

export type PublicDivision = { slug: string; name: string; description: string; workPrograms: string; displayOrder: number; example: boolean };
const names = new Map<string, string>(Object.entries(divisionNames));
export async function publishedOrganization(req: PayloadRequest, kind: Extract<EditorialKind, 'periods' | 'divisions'>, slug?: string) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  const model = editorialModel(kind);
  const root = sql.identifier(model.root.replaceAll('-', '_')), revisions = sql.identifier(model.revisions.replaceAll('-', '_'));
  const fields = kind === 'periods' ? sql`e.label,r.start_date AS "startDate",r.end_date AS "endDate"`
    : sql`e.slug,r.description,r.work_programs AS "workPrograms",r.display_order AS "displayOrder",r.example`;
  const result = await (await transaction(req)).execute<Record<string, unknown>>(sql`SELECT ${fields} FROM ${schema}.${root} e
    JOIN ${schema}.${revisions} r ON r.id=e.public_revision_id AND r.entity_id=e.id AND r.state='published'
    WHERE e.deleted_at IS NULL ${kind === 'divisions' && slug ? sql`AND e.slug=${slug}` : sql``}
    AND EXISTS(SELECT 1 FROM ${schema}.organization_reviews review WHERE review.kind=${kind} AND review.entity_id=e.id
      AND review.revision_id=r.id AND review.edit_version=r.edit_version AND review.status='approved' AND review.resolved_at IS NOT NULL)
    ORDER BY ${kind === 'divisions' ? sql`r.display_order,e.id` : sql`r.start_date DESC,e.id DESC`} LIMIT 48`);
  return result.rows;
}
export async function publicDivisions(req: PayloadRequest, slug?: string): Promise<PublicDivision[]> {
  if (slug && !Object.hasOwn(divisionNames, slug)) return [];
  return (await publishedOrganization(req, 'divisions', slug)).map(row => ({ slug: String(row.slug), name: names.get(String(row.slug)) || String(row.slug), description: String(row.description || ''), workPrograms: String(row.workPrograms || ''), displayOrder: Number(row.displayOrder), example: row.example === true }));
}
