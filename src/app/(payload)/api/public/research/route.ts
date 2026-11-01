import { atomic, requestContext, failure } from '../../../../../server/request';
import { editorialLock } from '../../../../../media/access';
import { publicResearch } from '../../../../../content/research-read';
export async function GET(request: Request) {
  try { const req = await requestContext(request); req.user = null;
    const data = await atomic(req, async () => { await editorialLock(req, true); return publicResearch(req, new URL(request.url).searchParams); });
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
