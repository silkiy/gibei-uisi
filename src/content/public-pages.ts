import { randomUUID } from 'node:crypto';
import { connection } from 'next/server';
import { createLocalReq, getPayload } from 'payload';
import config from '../payload.config';
import { atomic } from '../server/request';
import { editorialLock } from '../media/access';
import type { PayloadRequest } from 'payload';

export async function publicPageData<T>(read: (req: PayloadRequest) => Promise<T>) {
  await connection();
  // Always anonymous: an Admin viewing a public URL receives the same allowlist as a visitor.
  try {
  const req = await createLocalReq({}, await getPayload({ config }));
  return await atomic(req, async () => { await editorialLock(req, true); return read(req); });
  } catch(error) {
    if(error && typeof error==='object' && 'status' in error && Number(error.status)<500) throw error;
    const correlationId=randomUUID();console.error(JSON.stringify({event:'public_read_failed',correlationId}));
    throw new Error(`Public content unavailable (${correlationId})`);
  }
}
