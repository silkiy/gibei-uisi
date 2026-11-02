import { APIError, Forbidden, type PayloadRequest } from 'payload';
import { isActiveAdmin } from '../auth/policy';
import { atomic } from '../server/request';
import { editorialLock } from '../media/access';
import { currentActor, editorialWrite } from '../editorial/internal';
import { orgOptions, orgRevision, orgAudit } from '../editorial/reviewed-hooks';
import { pageNote } from '../editorial/page-policy';
import { referencedAsset } from '../media/references';
import type { Media } from '../payload-types';
import type { EditorialDoc } from '../editorial/reviewed-model';

export async function logoPermission(req: PayloadRequest, id: number, input: Record<string, unknown>) {
  try { return await atomic(req, async () => {
    await editorialLock(req); await currentActor(req);
    if (!isActiveAdmin(req.user)) throw new Forbidden();
    if (!Number.isSafeInteger(id) || typeof input.allowed !== 'boolean' || Object.keys(input).some(key => !['allowed','note','expectedLockVersion'].includes(key))) throw new APIError('Invalid permission',400);
    const root = await req.payload.db.findOne({ collection: 'partners', req, where: { id: { equals: id } } }) as unknown as EditorialDoc | null;
    if (!root || root.deletedAt || root.lockVersion !== input.expectedLockVersion) throw new APIError('Reload partner',409);
    const revision = await orgRevision(req,'partners',Number(input.allowed ? root.workingRevision || root.publicRevision : root.publicRevision || root.workingRevision));
    if (!revision.logo) throw new APIError('Save a logo first',400);
    const asset = input.allowed ? await referencedAsset(req,Number(revision.logo)) : await req.payload.db.findOne({collection:'media',req,where:{id:{equals:Number(revision.logo)}}}) as Media | null;
    if(!asset) throw new APIError('Logo unavailable',409);
    const note=pageNote(input.note);
    await req.payload.create({ collection: 'partner-logo-permissions', ...orgOptions(req), data: { partner:id, assetId:asset.id, fileVersion:asset.fileVersion, checksum:asset.checksum, actorId:req.user!.id, allowed:input.allowed, note } });
    await orgAudit(req,'partners',root,revision,'logo_permission_recorded',{}, { allowed:input.allowed, assetId:asset.id, note });
    await req.payload.db.updateOne({ collection:'partners',id,req,data:{lockVersion:root.lockVersion+1} });
    return { allowed: input.allowed };
  }); } finally { Reflect.deleteProperty(req.context,editorialWrite); }
}
