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
  const owns = await initTransaction(req);
  try { const result = await work(); if (owns) await commitTransaction(req); return result; }
  catch (error) { if (owns) await killTransaction(req); throw error; }
}
export async function readJSON(request: Request, limit = 16384): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length')) > limit) throw new APIError('Request too large', 413);
  const reader = request.body?.getReader(); if (!reader) throw new APIError('JSON body required', 400);
  const chunks: Uint8Array[] = []; let length = 0;
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > limit) throw new APIError('Request too large', 413); chunks.push(value); } }
  finally { await reader.cancel(); }
  try { const result = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!result || Array.isArray(result) || typeof result !== 'object') throw Error(); return result; }
  catch { throw new APIError('Invalid JSON body', 400); }
}
export function failure(error: unknown) {
  const status = error instanceof APIError ? error.status : 500;
  const message = status < 500 && error instanceof Error ? error.message : 'Operation failed';
  const data = error instanceof APIError ? error.data : null;
  const references = data && typeof data === 'object' && 'references' in data && Array.isArray(data.references) ? data.references : undefined;
  return Response.json({ errors: [{ message }], ...(references ? { references } : {}) }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
