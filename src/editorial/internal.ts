import { Forbidden, type CollectionConfig, type PayloadRequest } from 'payload';
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres';
import { isActiveAdmin, isActiveUser } from '../auth/policy';

export const editorialWrite = Symbol('editorial-write');
export const internalHooks: CollectionConfig['hooks'] = {
  beforeChange: [({ req, data }) => { if (Reflect.get(req.context, editorialWrite) !== true) throw new Forbidden(); return data; }],
  beforeDelete: [() => { throw new Forbidden(); }],
};
export async function transaction(req: PayloadRequest) {
  const id = await req.transactionID;
  const adapter = req.payload.db as unknown as PostgresAdapter;
  if (id == null || !adapter.sessions[String(id)]?.db) throw new Error('Editorial mutation requires a transaction');
  return adapter.sessions[String(id)].db;
}
export async function currentActor(req: PayloadRequest) {
  if (!req.user) throw new Forbidden();
  const actor = await req.payload.findByID({ collection: 'users', id: req.user.id, req, overrideAccess: true, depth: 0 });
  if (!isActiveUser(actor)) throw new Forbidden();
  req.user = { ...req.user, ...actor, collection: 'users' };
  return actor;
}
export const categoryHooks: CollectionConfig['hooks'] = {
  beforeOperation: [async ({ operation, req, args }) => {
    if (operation === 'delete') throw new Forbidden();
    if (['create', 'update'].includes(operation)) {
      await transaction(req);
      if (!isActiveAdmin(await currentActor(req))) throw new Forbidden();
      if (operation === 'update' && !('id' in args)) throw new Forbidden();
    }
    return args;
  }],
};
export async function articleLock(req: PayloadRequest, id: number) {
  await (await transaction(req)).execute(sql`SELECT pg_advisory_xact_lock(697816, ${id})`);
}
