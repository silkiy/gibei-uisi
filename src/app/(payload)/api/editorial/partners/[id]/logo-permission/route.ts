import { authenticatedRequest, readJSON, failure } from '../../../../../../../server/request';
import { logoPermission } from '../../../../../../../partners/logo-permission';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const req=await authenticatedRequest(request,true); return Response.json(await logoPermission(req,Number((await params).id),await readJSON(request)),{headers:{'Cache-Control':'private, no-store'}}); }
  catch(error) { return failure(error); }
}
