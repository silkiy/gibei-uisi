import { authenticatedRequest, failure, readJSON } from '../../../../../../../server/request';
import { articleCommand } from '../../../../../../../editorial/commands';

export async function POST(request: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  try {
    const req = await authenticatedRequest(request, true);
    const { id, action } = await params;
    return Response.json(await articleCommand(req, Number(id), action, await readJSON(request)), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}
