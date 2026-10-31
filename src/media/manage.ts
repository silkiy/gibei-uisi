import { randomUUID } from 'node:crypto';
import { APIError, Forbidden, type PayloadRequest } from 'payload';
import { isActiveAdmin } from '../auth/policy';
import { currentActor, editorialWrite } from '../editorial/internal';
import { revisionNote } from '../editorial/review-policy';
import { atomic } from '../server/request';
import { editorialLock, loadAsset } from './access';
import { assetReferences } from './retention';
import { removeAsset } from './storage';

export async function manageAsset(req: PayloadRequest, key: string, input: Record<string, unknown>) {
  if (!isActiveAdmin(req.user)) throw new Forbidden();
  if (Object.keys(input).some(key => !['action', 'note'].includes(key)) || !['revoke', 'delete'].includes(String(input.action))) throw new APIError('Invalid asset action', 400);
  let note: string; try { note = revisionNote(input.note); } catch (error) { throw new APIError((error as Error).message, 400); }
  try {
    return await atomic(req, async () => {
      await editorialLock(req); if (!isActiveAdmin(await currentActor(req))) throw new Forbidden();
      const asset = await loadAsset(req, key), references = await assetReferences(req, asset.id);
      const deleting = input.action === 'delete';
      if (deleting && references.length) throw new APIError('Asset is still referenced', 409, { references });
      if (!deleting && asset.state === 'deleted') throw new APIError('Asset was deleted', 409);
      const options = { req, overrideAccess: true, context: { [editorialWrite]: true } };
      await req.payload.update({ collection: 'media', id: asset.id, ...options, data: { state: deleting ? 'deleted' : 'revoked', revokedAt: asset.revokedAt || new Date().toISOString() } });
      await req.payload.create({ collection: 'media-audit', ...options, data: { assetId: asset.id, actorId: req.user!.id, action: deleting ? 'deleted' : 'revoked', details: { note, before: asset.state, references }, correlationId: randomUUID() } });
      return { id: asset.id, key: asset.key, state: deleting ? 'deleted' : 'revoked', references };
    });
  } finally { Reflect.deleteProperty(req.context, editorialWrite); }
}

// Run only after the DB transaction committed. A failed cleanup remains inaccessible and is retryable.
export async function cleanupDeletedAsset(key: string) {
  try { await removeAsset(key); return false; } catch { return true; }
}
