import { APIError, Forbidden, createLocalReq, getPayload, initTransaction, commitTransaction, killTransaction, type PayloadRequest } from 'payload';
import config from '../payload.config';
import { isActiveUser } from '../auth/policy';

export async function requestContext(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  return createLocalReq({ user: user || undefined, req: { headers: request.headers, url: request.url } }, payload);
}
export async function authenticatedRequest(request: Request, mutation = false) {
  const req = await requestContext(request);
  if (mutation && request.headers.get('origin') !== new URL(req.payload.config.serverURL).origin) throw new Forbidden();
  if (!isActiveUser(req.user)) throw new Forbidden();
  return req;
}
export async function atomic<T>(req: PayloadRequest, work: () => Promise<T>) {
  await initTransaction(req);
  try { const result = await work(); await commitTransaction(req); return result; }
  catch (error) { await killTransaction(req); throw error; }
}
export function failure(error: unknown) {
  const status = error instanceof APIError ? error.status : 500;
  const message = status < 500 && error instanceof Error ? error.message : 'Operation failed';
  return Response.json({ errors: [{ message }] }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
