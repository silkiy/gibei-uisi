import { sql } from '@payloadcms/db-postgres';
import { APIError, type PayloadRequest } from 'payload';
import { transaction } from '../editorial/internal';
import { editorialModel } from '../editorial/reviewed-model';
import { orgRevision } from '../editorial/reviewed-hooks';
import { previewAssets } from '../media/references';
import { safeExternalURL } from './links.mjs';
import { eventDetail } from './event-read';
import { articleSearch } from './article-search';
export type P1Kind = 'galleries' | 'partners' | 'achievements';

export async function publicP1(req: PayloadRequest, kind: P1Kind, query = new URLSearchParams(), slug?: string, homepageOnly = false) {
  if ([...query.keys()].some(key => !['page','limit',...(kind==='achievements'?['year']:[])].includes(key) || query.getAll(key).length !== 1)) throw new APIError('Invalid query',400);
  const {page,limit}=articleSearch(query),year=query.get('year');
  if (year && !/^(?:19|20|21)\d{2}$/.test(year)) throw new APIError('Invalid year',400);
  const schema=sql.identifier(req.payload.db.schemaName || 'payload'),model=editorialModel(kind);
  const from=sql`FROM ${schema}.${sql.identifier(model.root.replaceAll('-','_'))} e JOIN ${schema}.${sql.identifier(model.revisions.replaceAll('-','_'))} r ON r.id=e.public_revision_id AND r.entity_id=e.id AND r.state='published'
    WHERE e.deleted_at IS NULL AND EXISTS(SELECT 1 FROM ${schema}.organization_reviews v WHERE v.kind=${kind} AND v.entity_id=e.id AND v.revision_id=r.id AND v.edit_version=r.edit_version AND v.status='approved' AND v.resolved_at IS NOT NULL)`;
  const filter=sql`${kind==='partners' && homepageOnly ? sql`AND r.show_on_homepage=true` : sql``} ${slug ? sql`AND e.slug=${slug}` : sql``} ${year ? sql`AND r.date LIKE ${year+'-%'}` : sql``}`;
  const totalDocs=(await (await transaction(req)).execute<{n:number}>(sql`SELECT count(*)::int n ${from} ${filter}`)).rows[0].n;
  const rows=(await (await transaction(req)).execute<{id:number;slug:string;revision:number}>(sql`SELECT e.id,e.slug,r.id revision ${from} ${filter} ORDER BY ${kind==='partners'?sql`r.title,e.id`:sql`r.date DESC,e.id DESC`} LIMIT ${limit} OFFSET ${(page-1)*limit}`)).rows;
  const docs=[];
  for(const row of rows) {
    const r=await orgRevision(req,kind,row.revision);
    let assets=await previewAssets(req,r.assets);
    if(kind==='partners') {
      const reference=r.assets?.[0];
      const permission=reference ? (await req.payload.find({collection:'partner-logo-permissions',req,overrideAccess:true,depth:0,limit:1,sort:'-id',where:{and:[{partner:{equals:row.id}},{assetId:{equals:reference.asset}},{fileVersion:{equals:reference.fileVersion}},{checksum:{equals:reference.checksum}}]}})).docs[0] : null;
      if(!permission?.allowed) assets=[];
    }
    const event=(kind==='galleries' && r.event ? await req.payload.db.findOne({collection:'events',req,where:{id:{equals:r.event}}}) : null) as {slug?:string}|null;
    const eventDTO=event?.slug ? await eventDetail(req,event.slug) : null;
    docs.push({ id:row.id,slug:row.slug,title:String(r.title||''),description:String(r.description||''),example:r.example===true,assets,
      date:kind!=='partners'?String(r.date||''):null,
      videoURL:kind==='galleries'?safeExternalURL(r.videoURL):null,
      event:eventDTO?{slug:eventDTO.slug,title:eventDTO.title}:null,
      collaboration:kind==='partners'?String(r.collaboration||''):null,website:kind==='partners'?safeExternalURL(r.website):null,showOnHomepage:kind==='partners' && r.showOnHomepage===true,
      category:kind==='achievements'?String(r.category||''):null,recipient:kind==='achievements'?String(r.recipient||''):null });
  }
  const years=kind==='achievements'?(await (await transaction(req)).execute<{year:string}>(sql`SELECT DISTINCT left(r.date,4) AS "year" ${from} ORDER BY "year" DESC`)).rows.map(row=>row.year):[];
  return {docs,totalDocs,totalPages:Math.max(1,Math.ceil(totalDocs/limit)),page,limit,years};
}
export async function p1Detail(req:PayloadRequest,kind:P1Kind,slug:string) { return (await publicP1(req,kind,new URLSearchParams(),slug)).docs[0] || null; }
