import { authenticatedRequest, failure, readJSON } from '../../../../../../server/request';
import { manageAsset, cleanupDeletedAsset } from '../../../../../../media/manage';

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const req = await authenticatedRequest(request, true);
    const result = await manageAsset(req, (await params).key, await readJSON(request, 4096));
    const cleanupPending = result.state === 'deleted' ? await cleanupDeletedAsset(result.key) : false;
    if (cleanupPending) req.payload.logger.warn({ assetId: result.id }, 'Deleted asset requires a cleanup retry');
    return Response.json({ ...result, cleanupPending }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}
