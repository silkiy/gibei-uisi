import { sql, type PostgresAdapter } from '@payloadcms/db-postgres';
import { APIError, Forbidden, type CollectionConfig, type PayloadRequest } from 'payload';
import { accountAuditCapability } from '../audit/accounts';
import { accountSnapshot, removesActiveAdmin, validateAccountInput } from './account-policy';
import { canCreateAccount, isActiveAdmin } from './policy';

type State = { actorId?: number; before?: ReturnType<typeof accountSnapshot>; reset: boolean; revoke: boolean };
const changeStates = new WeakMap<PayloadRequest, State>();

async function transaction(req: PayloadRequest) {
  const id = await req.transactionID;
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const db = id != null ? adapter.sessions[String(id)]?.db : undefined;
  if (!db) throw new APIError('Account changes require a transaction', 503);
  return db;
}

export const accountHooks: CollectionConfig['hooks'] = {
  beforeOperation: [async ({ operation, args, req }) => {
    if (['delete', 'unlock', 'forgotPassword', 'resetPassword'].includes(operation)) throw new Forbidden();
    if (!['create', 'update'].includes(operation)) return args;
    if (operation === 'update' && !('id' in args)) throw new APIError('Update one account at a time', 400);
    // Validate raw input here: field defaults add auth internals before beforeValidate.
    if ('data' in args) {
      try { validateAccountInput(args.data ?? {}); } catch (error) { throw new APIError((error as Error).message, 400); }
    }
    const db = await transaction(req);
    // Acquire before Payload reads originalDoc. All account mutations share this lock.
    await db.execute(sql`SELECT pg_advisory_xact_lock(697815, 7)`);
    if (req.user) {
      const actor = await req.payload.findByID({ collection: 'users', id: req.user.id, req, overrideAccess: true, depth: 0 });
      if (!isActiveAdmin(actor)) throw new Forbidden();
      req.user = { ...req.user, ...actor, collection: 'users' };
    } else if (operation !== 'create' || !canCreateAccount(null, req.context)) throw new Forbidden();
    return args;
  }],
  beforeChange: [async ({ operation, req, data, originalDoc }) => {
    if (!canCreateAccount(req.user, req.context)) throw new Forbidden();
    if (operation === 'create' && !req.user) {
      const { totalDocs } = await req.payload.count({ collection: 'users', req, overrideAccess: true });
      if (totalDocs !== 0 || data.role !== 'admin' || data.status !== 'active') throw new Forbidden();
    }
    if (operation === 'update' && removesActiveAdmin(originalDoc, data)) {
      const { totalDocs } = await req.payload.count({ collection: 'users', req, overrideAccess: true, where: { and: [{ role: { equals: 'admin' } }, { status: { equals: 'active' } }] } });
      if (totalDocs <= 1) throw new APIError('At least one active Admin must remain', 409);
    }
    changeStates.set(req, {
      actorId: req.user?.id,
      before: operation === 'update' ? accountSnapshot(originalDoc) : undefined,
      reset: operation === 'update' && typeof data.password === 'string',
      revoke: operation === 'update' && (typeof data.password === 'string' || ['role', 'status', 'email'].some(key => data[key] !== undefined && data[key] !== originalDoc[key])),
    });
    return data;
  }],
  afterChange: [async ({ doc, req, operation }) => {
    const state = changeStates.get(req);
    if (!state) throw new APIError('Missing account audit context', 500);
    if (state.revoke) {
      const db = await transaction(req);
      const schema = req.payload.db.schemaName || 'payload';
      await db.execute(sql`DELETE FROM ${sql.identifier(schema)}.users_sessions WHERE _parent_id = ${doc.id}`);
      doc.sessions = [];
    }
    try {
      await req.payload.create({
        collection: 'account-audit', req, overrideAccess: true,
        context: { [accountAuditCapability]: true },
        data: { actorId: state.actorId ?? doc.id, targetId: doc.id,
          action: operation === 'create' ? 'account_created' : state.reset ? 'password_reset' : 'account_updated',
          before: state.before, after: accountSnapshot(doc) },
      });
    } finally { Reflect.deleteProperty(req.context, accountAuditCapability); changeStates.delete(req); }
    return doc;
  }],
  beforeDelete: [() => { throw new Forbidden(); }],
  beforeLogin: [({ user }) => { if (user.status !== 'active') throw new Forbidden(); }],
};
