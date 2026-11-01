import { atomic, requestContext, failure } from '../../../../../server/request';
import { editorialLock } from '../../../../../media/access';
import { structureData } from '../../../../../content/members-read';

export async function GET(request: Request) {
  try {
    const req = await requestContext(request); req.user = null;
    const selected = new URL(request.url).searchParams.get('periode') ?? undefined;
    const data = await atomic(req, async () => { await editorialLock(req, true); return structureData(req, selected); });
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
