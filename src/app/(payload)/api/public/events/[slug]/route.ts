import { atomic, requestContext, failure } from '../../../../../../server/request';
import { editorialLock } from '../../../../../../media/access';
import { eventDetail } from '../../../../../../content/event-read';
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try { const req = await requestContext(request); req.user = null; const { slug } = await params;
    const data = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120 ? await atomic(req, async () => { await editorialLock(req, true); return eventDetail(req, slug); }) : null;
    return Response.json(data || { errors: [{ message: 'Not Found' }] }, { status: data ? 200 : 404, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
