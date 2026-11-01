import { atomic, requestContext, failure } from '../../../../../../server/request';
import { editorialLock } from '../../../../../../media/access';
import { editorialKind } from '../../../../../../editorial/reviewed-model';
import { publishedOrganization, publicDivisions } from '../../../../../../content/organization-read';

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  try {
    const kind = editorialKind((await params).kind);
    if (kind !== 'periods' && kind !== 'divisions') return Response.json({ errors: [{ message: 'Not Found' }] }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const req = await requestContext(request); req.user = null;
    const docs = await atomic(req, async () => { await editorialLock(req, true); return kind === 'divisions' ? publicDivisions(req) : publishedOrganization(req, kind); });
    return Response.json({ docs }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
