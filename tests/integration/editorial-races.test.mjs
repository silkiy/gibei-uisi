import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';
import { editorialFixture } from '../support/editorial.mjs';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';
let s;
before(async () => { s = await editorialFixture('races'); });
async function coordinated(work) {
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  const barrier = await pool.connect(); let requests;
  try {
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID, (await barrier.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    await barrier.query('BEGIN'); await barrier.query('SELECT pg_advisory_xact_lock(697816,0)');
    requests = work().map(promise => promise.then(response => ({ response }), error => ({ error })));
    let queued = false;
    for (let i = 0; i < 80; i++) {
      queued = (await pool.query("SELECT count(*)::int AS n FROM pg_locks WHERE locktype='advisory' AND classid=697816 AND objid=0 AND NOT granted")).rows[0].n >= 2;
      if (queued) break; await delay(25);
    }
    assert.ok(queued, 'Both requests must reach the same database lock before release');
    await barrier.query('COMMIT');
    const results = await Promise.all(requests);
    return results.map(result => { if (result.error) throw result.error; return result.response; });
  } finally { await barrier.query('ROLLBACK'); if (requests) await Promise.all(requests); barrier.release(); await pool.end(); }
}
test('two coordinated decisions on one snapshot yield one success and one explicit conflict', async () => {
  const pending = await s.submit(s.a, await s.draft(s.a, 'races-decisions'));
  const responses = await coordinated(() => [s.command(s.admin, pending.doc, 'publish', { submissionId: pending.submission.id }), s.command(s.admin, pending.doc, 'request-revision', { submissionId: pending.submission.id, note: 'Perjelas sumber.' })]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  const doc = await (await s.a.request(`/api/articles/${pending.doc.id}`)).json();
  assert.equal(doc.lockVersion, pending.doc.lockVersion + 1);
  assert.equal((await s.command(s.admin, pending.doc, 'publish', { submissionId: pending.submission.id })).status, 409);
  const audit = await (await s.admin.request(`/api/editorial-audit?where[article][equals]=${doc.id}&limit=100`)).json();
  const decisions = audit.docs.filter(row => ['published', 'revision_requested'].includes(row.action));
  assert.equal(decisions.length, 1); assert.equal(decisions[0].actorId, s.admin.user.id);
  assert.ok(decisions[0].createdAt); assert.equal(decisions[0].revisionId, pending.doc.workingRevision);
  assert.equal(decisions[0].after.lockVersion, doc.lockVersion);
  if (decisions[0].action === 'revision_requested') assert.equal(decisions[0].after.note, 'Perjelas sumber.');
});
test('publish versus required-target withdrawal and concurrent saves cannot commit incompatible results', async () => {
  const target = await s.publish(await s.submit(s.a, await s.draft(s.a, 'races-target')));
  const pending = await s.submit(s.a, await s.draft(s.a, 'races-dependent', { related: [{ target: target.id, required: true }] }));
  const responses = await coordinated(() => [s.command(s.admin, pending.doc, 'publish', { submissionId: pending.submission.id }), s.command(s.admin, target, 'withdraw-publication', { note: 'Test dependency race' })]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  const draft = await s.draft(s.a, 'races-edits');
  const saves = await coordinated(() => ['First edit', 'Second edit'].map(title => s.a.request(`/api/articles/${draft.id}`, { method: 'PATCH', data: { expectedLockVersion: draft.lockVersion, title } })));
  assert.deepEqual(saves.map(r => r.status).sort(), [200, 409]);
  assert.equal((await (await s.a.request(`/api/articles/${draft.id}`)).json()).lockVersion, draft.lockVersion + 1);
});
test('audit mutations are denied to Admin and Media at HTTP and database boundaries', async () => {
  const pending = await s.submit(s.a, await s.draft(s.a, 'races-audit'));
  await s.command(s.admin, pending.doc, 'request-revision', { submissionId: pending.submission.id, note: 'Audit reason retained' });
  const original = await (await s.admin.request(`/api/editorial-audit?where[article][equals]=${pending.doc.id}&limit=100`)).json();
  const row = original.docs.find(row => row.action === 'revision_requested'); assert.ok(row);
  for (const actor of [s.admin, s.a]) {
    assert.equal((await actor.request('/api/editorial-audit', { method: 'POST', data: row })).status, 403);
    assert.equal((await actor.request(`/api/editorial-audit/${row.id}`, { method: 'PATCH', data: { after: { note: 'forged' } } })).status, 403);
    assert.equal((await actor.request(`/api/editorial-audit/${row.id}`, { method: 'DELETE' })).status, 403);
  }
  const pool = new pg.Pool(localTestConnection(process.env));
  try {
    assert.equal((await pool.query("SELECT has_table_privilege(current_user,'payload.editorial_audit','UPDATE') OR has_table_privilege(current_user,'payload.editorial_audit','DELETE') OR has_table_privilege(current_user,'payload.editorial_audit','TRUNCATE') AS mutable")).rows[0].mutable, false);
    await assert.rejects(pool.query('UPDATE payload.editorial_audit SET actor_id=actor_id WHERE false'), { code: '42501' });
  } finally { await pool.end(); }
  assert.deepEqual(await (await s.admin.request(`/api/editorial-audit/${row.id}`)).json(), row);
});
