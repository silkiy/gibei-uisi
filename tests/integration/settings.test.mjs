import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editorialFixture } from '../support/editorial.mjs';
import pg from 'pg';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';

test('only Admin can save audited settings; live configuration controls public files and retains history', async () => {
  const f = await editorialFixture('settings');
  const get = () => f.admin.request('/api/globals/site-settings');
  let doc = await (await get()).json();
  const save = (actor, data) => actor.request('/api/globals/site-settings', { method: 'POST', data: { expectedVersion: doc.expectedVersion, ...data } });
  for (const actor of [f.a, f.anonymous]) {
    assert.equal((await actor.request('/api/globals/site-settings')).status, 403);
    assert.equal((await save(actor, { siteName: 'Spoof', email: 'bad@example.com', emailConfirmed: true })).status, 403);
  }
  for (const data of [{ navigation: [{ label: 'Bad', url: 'javascript:alert(1)' }] }, { email: 'a\n@b.com' }, { email: '', emailConfirmed: true }, { configVersion: 900 }, { title: 'Duplicated page content' }]) {
    assert.ok([400, 403].includes((await save(f.admin, data)).status));
  }
  const logo = await f.upload(f.a), replacement = await f.upload(f.admin), favicon = await f.upload(f.admin);
  const file = asset => f.anonymous.request(`/api/media/${asset.key}/original`);
  assert.equal((await file(logo)).status, 404);
  let response = await save(f.admin, { siteName: 'GIBEI Demo Settings', logo: logo.id, favicon: favicon.id, email: 'demo@example.com', emailConfirmed: false, navigation: [{ label: 'Tentang', url: '/tentang' }], socials: [] });
  assert.equal(response.status, 200); doc = (await response.json()).result;
  assert.ok(doc, 'Payload global update returns result');
  assert.equal((await file(logo)).status, 200);
  assert.equal((await file(favicon)).status, 200);
  assert.equal((await save(f.admin, { expectedVersion: doc.expectedVersion - 1, siteName: 'Stale' })).status, 409);
  response = await save(f.admin, { logo: replacement.id }); assert.equal(response.status, 200); doc = (await response.json()).result;
  assert.equal((await file(logo)).status, 404);
  assert.equal((await file(replacement)).status, 200);
  assert.equal((await file(favicon)).status, 200, 'Favicon permission is independent of the logo slot');
  const deletion = await f.admin.request(`/api/media/${logo.key}/manage`, { method: 'POST', data: { action: 'delete', note: 'Referenced config' } });
  assert.equal(deletion.status, 409);
  assert.ok((await deletion.json()).references.some(row => row.kind === 'configuration'));
  assert.equal((await f.admin.request(`/api/media/${replacement.key}/manage`, { method: 'POST', data: { action: 'revoke', note: 'Revoked configuration' } })).status, 200);
  assert.equal((await file(replacement)).status, 404);
  const history = await f.admin.request('/api/settings-audit?pagination=false');
  assert.equal(history.status, 200); assert.equal((await history.json()).totalDocs, 2);
  assert.equal((await f.a.request('/api/settings-audit')).status, 403);
  response = await save(f.admin, { logo: null, favicon: null, siteName: 'GIBEI UISI', navigation: [], email: null, emailConfirmed: false });
  assert.equal(response.status, 200);
  assert.equal((await file(favicon)).status, 404);
});

test('configuration audit failure rolls back settings, public permission and retention ledger together', async () => {
  const f = await editorialFixture('settings-rollback');
  const original = await (await f.admin.request('/api/globals/site-settings')).json();
  const logo = await f.upload(f.admin);
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  try {
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID, (await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    await pool.query('REVOKE INSERT ON payload.settings_audit FROM gibei_runtime');
    try { assert.equal((await f.admin.request('/api/globals/site-settings', { method: 'POST', data: { expectedVersion: original.expectedVersion, logo: logo.id } })).status, 500); }
    finally { await pool.query('GRANT INSERT ON payload.settings_audit TO gibei_runtime'); }
    const current = await (await f.admin.request('/api/globals/site-settings')).json();
    assert.equal(current.configVersion, original.configVersion);
    assert.equal(current.logo, original.logo);
    assert.equal((await f.anonymous.request(`/api/media/${logo.key}/original`)).status, 404);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM payload.asset_config_references WHERE asset_id=$1', [logo.id])).rows[0].n, 0);
    assert.equal((await pool.query("SELECT has_table_privilege('gibei_runtime','payload.settings_audit','UPDATE') AS allowed")).rows[0].allowed, false);
  } finally { await pool.end(); }
});
