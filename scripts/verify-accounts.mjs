import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createPool } from './database/config.mjs';

// T007 focused integration test. Never reset the development schema or seed real accounts.
const schema = process.env.T007_TEST_SCHEMA;
assert.ok(schema, 'Provision an empty private schema owned by gibei_migrator and set T007_TEST_SCHEMA; see docs/setup.md');
assert.match(schema, /^payload_test_t007_[a-f0-9]{12}$/);
const pool = createPool('MIGRATION_DATABASE_URL');
const runtime = createPool();
const base = 'http://127.0.0.1:3200';
const password = randomBytes(24).toString('base64url');
const env = { ...process.env, CMS_TEST_SCHEMA: schema, SERVER_URL: base,
  BOOTSTRAP_ADMIN_EMAIL: 't007-admin@example.invalid', BOOTSTRAP_ADMIN_PASSWORD: password };
const request = (path, method = 'GET', data, cookie) => fetch(base + path, {
  method, headers: { 'Content-Type': 'application/json', Origin: base, ...(cookie ? { Cookie: cookie } : {}) },
  ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
});
const check = async (path, method, data, cookie, status) => {
  const response = await request(path, method, data, cookie);
  assert.equal(response.status, status, `${method} ${path} expected ${status}`);
  return response;
};
async function login(email, pass = password) {
  const response = await check('/api/users/login', 'POST', { email, password: pass }, undefined, 200);
  const user = (await response.json()).user;
  const header = response.headers.getSetCookie().find(value => value.startsWith('payload-token='));
  assert.ok(header, 'Login requires session cookie');
  return { user, cookie: header.split(';')[0] };
}
let server;
let log;
let eligibleForCleanup = false;
try {
  // Keep a fingerprint of development account metadata; test operations use only scratch schema.
  const before = (await pool.query('SELECT id, role, status, email, updated_at FROM payload.users ORDER BY id')).rows;
  const ownership = await pool.query('SELECT nspowner = (SELECT oid FROM pg_roles WHERE rolname=current_user) AS owned FROM pg_namespace WHERE nspname=$1', [schema]);
  assert.ok(ownership.rows[0]?.owned, 'Test schema must be pre-provisioned and owned by migration role');
  const tables = await pool.query('SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema=$1', [schema]);
  assert.equal(tables.rows[0].n, 0, 'Test schema must be empty');
  eligibleForCleanup = true;
  await pool.query(`GRANT USAGE ON SCHEMA "${schema}" TO gibei_runtime`);
  const migrationFiles = ['20261030_093751_cms_auth.ts', '20261030_153435_account_controls.ts'];
  for (const file of migrationFiles) {
    const source = readFileSync(new URL(`../src/migrations/${file}`, import.meta.url), 'utf8').split('export async function down')[0];
    const statements = [...source.matchAll(/db\.execute\(sql`([\s\S]*?)`\)/g)];
    assert.ok(statements.length > 0, 'Expected reviewed static migration SQL');
    for (const [, statement] of statements) {
      assert.ok(!statement.includes('${'), 'Only static migrations supported by focused fixture');
      await pool.query(statement.replaceAll('"payload"', `"${schema}"`).replaceAll('payload.', `"${schema}".`));
    }
  }
  await pool.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "${schema}" TO gibei_runtime`);
  await pool.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "${schema}" TO gibei_runtime`);
  await pool.query(`REVOKE UPDATE, DELETE, TRUNCATE ON "${schema}".account_audit FROM gibei_runtime`);
  mkdirSync('artifacts', { recursive: true });
  log = openSync('artifacts/t007-server.log', 'w');
  const bootstrap = spawnSync(process.execPath, ['scripts/payload.mjs', 'run', 'scripts/bootstrap-admin.ts'], { env, stdio: ['ignore', log, log], timeout: 90000, windowsHide: true });
  assert.equal(bootstrap.status, 0, 'Isolated bootstrap must succeed');
  const local = spawnSync(process.execPath, ['scripts/payload.mjs', 'run', 'scripts/verify-account-local.ts'], { env, stdio: ['ignore', log, log], timeout: 90000, windowsHide: true });
  assert.equal(local.status, 0, 'Local API bypass checks must pass');
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3200'], { env, stdio: ['ignore', log, log], windowsHide: true });
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    try { ready = (await fetch(`${base}/api/users`, { signal: AbortSignal.timeout(2000) })).status === 403; } catch { /* Starting */ }
    if (ready) break;
    if (server.exitCode !== null) throw new Error('Isolated test server stopped');
    await delay(1000);
  }
  assert.ok(ready, 'Isolated server must become ready');
  let admin = await login(env.BOOTSTRAP_ADMIN_EMAIL);
  const id = admin.user.id;
  await check(`/api/users/${id}`, 'PATCH', { role: 'media' }, admin.cookie, 409);
  await check(`/api/users/${id}`, 'PATCH', { status: 'inactive' }, admin.cookie, 409);
  await check(`/api/users/${id}`, 'DELETE', undefined, admin.cookie, 403);
  await check('/api/users', 'POST', { email: 'anon@example.invalid', password, name: 'Denied' }, undefined, 403);
  await check('/api/users?where[status][equals]=active', 'PATCH', { status: 'inactive' }, admin.cookie, 403);
  const auditCount = (await pool.query(`SELECT count(*)::int AS n FROM "${schema}".account_audit`)).rows[0].n;
  await pool.query(`REVOKE INSERT ON "${schema}".account_audit FROM gibei_runtime`);
  try {
    await check(`/api/users/${id}`, 'PATCH', { name: 'Must roll back' }, admin.cookie, 500);
    assert.equal((await pool.query(`SELECT name FROM "${schema}".users WHERE id=$1`, [id])).rows[0].name, admin.user.name, 'Account update must roll back when audit fails');
    assert.equal((await pool.query(`SELECT count(*)::int AS n FROM "${schema}".account_audit`)).rows[0].n, auditCount);
  } finally { await pool.query(`GRANT INSERT ON "${schema}".account_audit TO gibei_runtime`); }
  const created = await check('/api/users', 'POST', { email: 't007-media@example.invalid', name: 'Media Test T007', password, role: 'media', status: 'active' }, admin.cookie, 201);
  const mediaId = (await created.json()).doc.id;
  let media = await login('t007-media@example.invalid');
  // Independently prove the fresh-status authentication check, with a still-stored session.
  await pool.query(`UPDATE "${schema}".users SET status='inactive' WHERE id=$1`, [mediaId]);
  await check('/api/users', 'GET', undefined, media.cookie, 403);
  const inactiveMe = await check('/api/users/me', 'GET', undefined, media.cookie, 200);
  assert.equal((await inactiveMe.json()).user, null);
  await pool.query(`UPDATE "${schema}".users SET status='active' WHERE id=$1`, [mediaId]);
  await check('/api/users', 'POST', { email: 'denied@example.invalid', password, name: 'Denied' }, media.cookie, 403);
  for (const data of [{ role: 'admin' }, { status: 'inactive' }, { password: randomBytes(24).toString('base64url') }]) {
    await check(`/api/users/${mediaId}`, 'PATCH', data, media.cookie, 403);
  }
  for (const data of [{ sessions: [{ id: 'forged' }] }, { hash: 'forged', salt: 'forged' }, { resetPasswordToken: 'forged' }, { password: 'short' }]) {
    await check(`/api/users/${mediaId}`, 'PATCH', data, admin.cookie, 400);
  }
  await check(`/api/users/${id}`, 'GET', undefined, media.cookie, 404);
  await check('/api/account-audit', 'GET', undefined, media.cookie, 403);
  await check(`/api/users/${mediaId}`, 'PATCH', { status: 'inactive' }, admin.cookie, 200);
  await check('/api/users', 'GET', undefined, media.cookie, 403);
  const me = await check('/api/users/me', 'GET', undefined, media.cookie, 200);
  assert.equal((await me.json()).user, null, 'Inactive session is not authenticated');
  await check('/api/users/refresh-token', 'POST', {}, media.cookie, 403);
  const deniedLogin = await request('/api/users/login', 'POST', { email: 't007-media@example.invalid', password });
  assert.ok([401, 403].includes(deniedLogin.status), 'Inactive login denied');
  await check(`/api/users/${mediaId}`, 'PATCH', { status: 'active' }, admin.cookie, 200);
  await check('/api/users', 'GET', undefined, media.cookie, 403);
  media = await login('t007-media@example.invalid');
  const newPassword = randomBytes(24).toString('base64url');
  await check(`/api/users/${mediaId}`, 'PATCH', { password: newPassword }, admin.cookie, 200);
  await check('/api/users', 'GET', undefined, media.cookie, 403);
  await check('/api/users/login', 'POST', { email: 't007-media@example.invalid', password }, undefined, 401);
  media = await login('t007-media@example.invalid', newPassword);
  // Promote Media to second Admin, then race two self-demotions.
  await check(`/api/users/${mediaId}`, 'PATCH', { role: 'admin' }, admin.cookie, 200);
  await check('/api/users', 'GET', undefined, media.cookie, 403);
  const second = await login('t007-media@example.invalid', newPassword);
  const race = await Promise.all([
    request(`/api/users/${id}`, 'PATCH', { role: 'media' }, admin.cookie),
    request(`/api/users/${mediaId}`, 'PATCH', { status: 'inactive' }, second.cookie),
  ]);
  assert.deepEqual(race.map(r => r.status).sort(), [200, 409], 'Concurrent changes must preserve active Admin');
  const active = (await pool.query(`SELECT id FROM "${schema}".users WHERE role='admin' AND status='active'`)).rows;
  assert.equal(active.length, 1);
  const survivor = active[0].id === id ? await login(env.BOOTSTRAP_ADMIN_EMAIL) : await login('t007-media@example.invalid', newPassword);
  // Reuse a session authenticated before a role downgrade: the very next request is denied.
  const loser = active[0].id === id ? second : admin;
  await check('/api/account-audit', 'GET', undefined, loser.cookie, 403);
  const audits = await check('/api/account-audit?limit=100', 'GET', undefined, survivor.cookie, 200);
  const events = (await audits.json()).docs;
  assert.ok(events.some(e => e.action === 'password_reset' && e.actorId === id && e.targetId === mediaId));
  assert.ok(events.every(e => !['password', 'hash', 'salt', 'sessions', 'resetPasswordToken'].some(key => Object.hasOwn(e.after, key))));
  assert.ok(!JSON.stringify(events).includes(password) && !JSON.stringify(events).includes(newPassword), 'Audit must not retain passwords');
  const eventId = events[0].id;
  await check('/api/account-audit', 'POST', { action: 'account_updated', actorId: id, targetId: id, after: {} }, survivor.cookie, 403);
  await check(`/api/account-audit/${eventId}`, 'PATCH', { action: 'password_reset' }, survivor.cookie, 403);
  await check(`/api/account-audit/${eventId}`, 'DELETE', undefined, survivor.cookie, 403);
  for (const statement of [`UPDATE "${schema}".account_audit SET action=action`, `DELETE FROM "${schema}".account_audit`, `TRUNCATE "${schema}".account_audit`]) {
    await assert.rejects(runtime.query(statement), error => error.code === '42501');
  }
  const selfPassword = randomBytes(24).toString('base64url');
  await check(`/api/users/${survivor.user.id}`, 'PATCH', { password: selfPassword }, survivor.cookie, 200);
  await check('/api/users', 'GET', undefined, survivor.cookie, 403);
  await login(survivor.user.email, selfPassword);
  const after = (await pool.query('SELECT id, role, status, email, updated_at FROM payload.users ORDER BY id')).rows;
  assert.deepEqual(after, before, 'Development accounts must remain unchanged');
  console.log(JSON.stringify({ status: 'passed', isolated: true, lastAdminRace: race.map(r => r.status), activeAdminsRemaining: active.length,
    mediaEscalationDenied: true, inactiveSessionDenied: true, resetRevokesSessions: true, auditImmutable: true, developmentAccountsUnchanged: true }));
} finally {
  if (server?.pid) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    else server.kill('SIGTERM');
  }
  if (log !== undefined) closeSync(log);
  // Only the freshly generated, validated scratch schema is eligible for cleanup.
  if (eligibleForCleanup && /^payload_test_t007_[a-f0-9]{12}$/.test(schema)) await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await Promise.all([pool.end(), runtime.end()]);
}
