import { authenticatedRequest, failure, readJSON } from '../../../../../../../../server/request';
import { organizationKind } from '../../../../../../../../editorial/organization-model';
import { organizationCommand } from '../../../../../../../../editorial/organization-commands';

export async function POST(request: Request, { params }: { params: Promise<{ kind: string; id: string; action: string }> }) {
  try {
    const req = await authenticatedRequest(request, true);
    const { kind, id, action } = await params;
    return Response.json(await organizationCommand(req, organizationKind(kind), Number(id), action, await readJSON(request)), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}
