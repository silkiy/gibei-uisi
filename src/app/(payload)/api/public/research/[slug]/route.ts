import { atomic, requestContext, failure } from '../../../../../../server/request';
import { editorialLock } from '../../../../../../media/access';
import { researchDetail } from '../../../../../../content/research-read';
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try { const req = await requestContext(request); req.user = null; const { slug } = await params;
    const data = await atomic(req, async () => { await editorialLock(req, true); return researchDetail(req, slug); });
    return Response.json(data || { errors: [{ message: 'Not Found' }] }, { status: data ? 200 : 404, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
