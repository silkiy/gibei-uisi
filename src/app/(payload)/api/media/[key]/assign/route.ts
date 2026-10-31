import { randomUUID } from 'node:crypto';
import { APIError, Forbidden } from 'payload';
import { authenticatedRequest, atomic, failure } from '../../../../../../server/request';
import { isActiveAdmin, isActiveUser } from '../../../../../../auth/policy';
import { currentActor, editorialWrite } from '../../../../../../editorial/internal';
import { editorialLock, loadAsset } from '../../../../../../media/access';

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const req = await authenticatedRequest(request, true);
    if (!isActiveAdmin(req.user)) throw new Forbidden();
    if (Number(request.headers.get('content-length')) > 4096) throw new APIError('Request too large', 413);
    const body = await request.text(); if (body.length > 4096) throw new APIError('Request too large', 413);
    const data = JSON.parse(body);
    if (Object.keys(data).some(key => key !== 'assignedTo') || !Array.isArray(data.assignedTo) || data.assignedTo.length > 20 || data.assignedTo.some((id: unknown) => !Number.isSafeInteger(id))) throw new APIError('Invalid assignees', 400);
    const key = (await params).key;
    const doc = await atomic(req, async () => {
      await editorialLock(req); if (!isActiveAdmin(await currentActor(req))) throw new Forbidden();
      const asset = await loadAsset(req, key);
      if (asset.state !== 'ready') throw new APIError('Asset is unavailable', 409);
      for (const id of data.assignedTo) if (!isActiveUser(await req.payload.findByID({ collection: 'users', id, req, overrideAccess: true }))) throw new APIError('Assignee must be active', 400);
      const options = { req, overrideAccess: true, context: { [editorialWrite]: true } };
      const updated = await req.payload.update({ collection: 'media', id: asset.id, ...options, data: { assignedTo: [...new Set<number>(data.assignedTo)] } });
      await req.payload.create({ collection: 'media-audit', ...options, data: { assetId: asset.id, actorId: req.user!.id, action: 'assigned', details: { before: asset.assignedTo, after: updated.assignedTo }, correlationId: randomUUID() } });
      return updated;
    });
    return Response.json({ doc }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}
