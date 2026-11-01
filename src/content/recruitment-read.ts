import type { PayloadRequest } from 'payload';
import { sql } from '@payloadcms/db-postgres';
import { transaction } from '../editorial/internal';
import { recruitmentStatus } from '../recruitment/policy.mjs';
import { divisionNames } from '../validation/organization.mjs';

type Campaign={id:number;slug:string;title:string;description:string;periodLabel:string;opensAt:string;closesAt:string;registrationURL:string|null;registrationConfirmed:boolean;enabled:boolean;positions:{title:string;requirements:string;divisionSlug:string|null}[];selectionStages:{title:string;description:string}[]};
function base(req:PayloadRequest) {
  const schema=sql.identifier(req.payload.db.schemaName || 'payload');
  return {schema,from:sql`FROM ${schema}.recruitment_periods e JOIN ${schema}.recruitment_revisions r ON r.id=e.public_revision_id AND r.entity_id=e.id AND r.state='published'
    JOIN ${schema}.organizational_periods p ON p.id=r.period_id AND p.deleted_at IS NULL
    JOIN ${schema}.period_revisions pr ON pr.id=p.public_revision_id AND pr.entity_id=p.id AND pr.state='published'
    WHERE e.deleted_at IS NULL AND EXISTS(SELECT 1 FROM ${schema}.organization_reviews v WHERE v.kind='recruitment' AND v.entity_id=e.id AND v.revision_id=r.id AND v.edit_version=r.edit_version AND v.status='approved' AND v.resolved_at IS NOT NULL)
    AND EXISTS(SELECT 1 FROM ${schema}.organization_reviews v WHERE v.kind='periods' AND v.entity_id=p.id AND v.revision_id=pr.id AND v.edit_version=pr.edit_version AND v.status='approved' AND v.resolved_at IS NOT NULL)`};
}
export async function recruitmentChoices(req:PayloadRequest) {
  const {schema,from}=base(req);
  return (await (await transaction(req)).execute<{slug:string;title:string;enabled:boolean}>(sql`SELECT e.slug,r.title,EXISTS(SELECT 1 FROM ${schema}.recruitment_state s WHERE s.enabled_campaign_id=e.id) AS enabled ${from} ORDER BY r.opens_at DESC,e.id DESC LIMIT 200`)).rows;
}
export async function recruitmentDetail(req:PayloadRequest,slug:string) {
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>120) return null;
  const {schema,from}=base(req);
  const [row]=(await (await transaction(req)).execute<Campaign>(sql`SELECT e.id,e.slug,r.title,r.description,p.label AS "periodLabel",r.opens_at AS "opensAt",r.closes_at AS "closesAt",r.registration_u_r_l AS "registrationURL",r.registration_confirmed AS "registrationConfirmed",
    EXISTS(SELECT 1 FROM ${schema}.recruitment_state s WHERE s.enabled_campaign_id=e.id) AS enabled,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('title',pos.title,'requirements',pos.requirements,'divisionSlug',d.slug) ORDER BY pos._order) FROM ${schema}.recruitment_revisions_positions pos LEFT JOIN ${schema}.divisions d ON d.id=pos.division_id AND d.public_revision_id IS NOT NULL AND d.deleted_at IS NULL WHERE pos._parent_id=r.id),'[]'::jsonb) AS positions,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('title',stage.title,'description',stage.description) ORDER BY stage._order) FROM ${schema}.recruitment_revisions_selection_stages stage WHERE stage._parent_id=r.id),'[]'::jsonb) AS "selectionStages"
    ${from} AND e.slug=${slug} LIMIT 1`)).rows;
  if(!row) return null;
  return {id:row.id,slug:row.slug,title:row.title,description:row.description,periodLabel:row.periodLabel,opensAt:row.opensAt,closesAt:row.closesAt,
    positions:row.positions.map(position=>({title:position.title,requirements:position.requirements,division:position.divisionSlug && Object.hasOwn(divisionNames,position.divisionSlug)?{slug:position.divisionSlug,name:divisionNames[position.divisionSlug as keyof typeof divisionNames]}:null})),selectionStages:row.selectionStages,...recruitmentStatus(row,row.enabled)};
}
export async function recruitmentPage(req:PayloadRequest,slug?:string) {
  const choices=await recruitmentChoices(req),selected=slug || choices.find(row=>row.enabled)?.slug || choices[0]?.slug;
  return {choices,campaign:selected?await recruitmentDetail(req,selected):null};
}
