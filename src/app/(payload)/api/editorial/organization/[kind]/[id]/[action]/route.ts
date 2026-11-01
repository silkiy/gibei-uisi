import { authenticatedRequest, failure, readJSON } from '../../../../../../../../server/request';
import { editorialKind } from '../../../../../../../../editorial/reviewed-model';
import { reviewedCommand } from '../../../../../../../../editorial/reviewed-commands';

export async function POST(request: Request, { params }: { params: Promise<{ kind: string; id: string; action: string }> }) {
  try {
    const req = await authenticatedRequest(request, true);
    const { kind, id, action } = await params;
    return Response.json(await reviewedCommand(req, editorialKind(kind), Number(id), action, await readJSON(request)), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}
