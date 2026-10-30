import assert from 'node:assert/strict';
import { getPayload } from 'payload';
import config from '../src/payload.config';

assert.match(process.env.CMS_TEST_SCHEMA || '', /^payload_test_t007_[a-f0-9]{12}$/);
const payload = await getPayload({ config });
const forbidden = (error: unknown) => (error as { status?: number }).status === 403;
try {
  const account = (await payload.find({ collection: 'users', overrideAccess: true })).docs[0];
  assert.ok(account);
  // Default Local API overrideAccess must not bypass the account service boundary.
  await assert.rejects(payload.update({ collection: 'users', id: account.id, data: { role: 'media' } }), forbidden);
  await assert.rejects(payload.delete({ collection: 'users', id: account.id }), forbidden);
  await assert.rejects(payload.create({ collection: 'users', data: { name: 'Denied', email: 'denied@example.invalid', password: 'long-unused-test-password', role: 'media', status: 'active' } }), forbidden);
  await assert.rejects(payload.create({ collection: 'account-audit', context: { accountAuditCapability: true }, data: { action: 'account_updated', actorId: account.id, targetId: account.id, after: {} } }), forbidden);
  await assert.rejects(payload.forgotPassword({ collection: 'users', data: { email: account.email } }), forbidden);
  await assert.rejects(payload.unlock({ collection: 'users', overrideAccess: true, data: { email: account.email, password: 'unused-test-password' } }), forbidden);
  await assert.rejects(payload.update({ collection: 'users', id: account.id, disableTransaction: true, user: { ...account, collection: 'users' }, data: { name: 'No transaction' } }), error => (error as { status?: number }).status === 503);
  console.log('Local API override and forged audit context denied; transaction required');
} finally { await payload.destroy(); }
