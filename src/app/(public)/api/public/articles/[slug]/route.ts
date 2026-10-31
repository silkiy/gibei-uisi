import { atomic, requestContext, failure } from '../../../../../../server/request';
import { editorialLock } from '../../../../../../media/access';
import { publicArticle } from '../../../../../../content/public-read';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    if (new URL(request.url).search) return Response.json({ errors: [{ message: 'Unsupported detail query' }] }, { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
    const req = await requestContext(request);
    const data = await atomic(req, async () => { await editorialLock(req, true); return publicArticle(req, (await params).slug); });
    return Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}
