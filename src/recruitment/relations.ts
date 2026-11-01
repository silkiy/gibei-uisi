import { APIError, type PayloadRequest } from 'payload';
import { orgRevision } from '../editorial/reviewed-hooks';
import type { EditorialDoc } from '../editorial/reviewed-model';
import { approvedPeriod } from '../organization/active-period';
export async function verifyRecruitmentRelations(req:PayloadRequest,draft:Record<string,unknown>) {
  await approvedPeriod(req,Number(draft.period));
  for(const row of (draft.positions || []) as {division?:number|null}[]) if(row.division) {
    const root=await req.payload.db.findOne({collection:'divisions',req,where:{id:{equals:row.division}}}) as unknown as EditorialDoc|null;
    if(!root?.publicRevision||root.deletedAt) throw new APIError('Divisi posisi harus terbit',409);
    const revision=await orgRevision(req,'divisions',root.publicRevision);
    const approved=await req.payload.db.findOne({collection:'organization-reviews',req,where:{and:[{kind:{equals:'divisions'}},{entityId:{equals:root.id}},{revisionId:{equals:revision.id}},{editVersion:{equals:revision.editVersion}},{status:{equals:'approved'}},{resolvedAt:{exists:true}}]}});
    if(revision.entity!==root.id||revision.state!=='published'||!approved) throw new APIError('Divisi posisi tidak tersedia',409);
  }
}
