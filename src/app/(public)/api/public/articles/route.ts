import { atomic, requestContext, failure } from '../../../../../server/request';
import { editorialLock } from '../../../../../media/access';
import { publicArticles } from '../../../../../content/public-read';

export async function GET(request: Request) {
  try {
    const req = await requestContext(request);
    const data = await atomic(req, async () => { await editorialLock(req, true); return publicArticles(req, new URL(request.url).searchParams); });
    return Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}
