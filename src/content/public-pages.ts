import { connection } from 'next/server';
import { createLocalReq, getPayload } from 'payload';
import config from '../payload.config';
import { atomic } from '../server/request';
import { editorialLock } from '../media/access';
import type { PayloadRequest } from 'payload';

export async function publicPageData<T>(read: (req: PayloadRequest) => Promise<T>) {
  await connection();
  // Always anonymous: an Admin viewing a public URL receives the same allowlist as a visitor.
  const req = await createLocalReq({}, await getPayload({ config }));
  return atomic(req, async () => { await editorialLock(req, true); return read(req); });
}
