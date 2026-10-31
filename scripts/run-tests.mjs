import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';
import { localTestConnection, assertOwnedTestTarget } from './database/test-config.mjs';
import { authenticate } from '../tests/support/http.mjs';
import { startNativePostgres } from '../tests/support/native-postgres.mjs';

const mode = process.argv[2];
assert.ok(['integration', 'e2e', 'all'].includes(mode), 'Choose integration, e2e or all');
if (existsSync('.env.test.local')) loadEnvFile('.env.test.local');
const runId = randomBytes(6).toString('hex');
const name = `gibei-test-${runId}`;
const database = `gibei_test_${runId}`;
const image = 'postgres:17.11-bookworm@sha256:839fbb5a4942a7758dd93e18b42ea5649807491a0545b5eeeb8f0b8bb11857a5';
const secret = () => randomBytes(24).toString('base64url');
const adminPassword = secret(), migrationPassword = secret(), runtimePassword = secret();
const accounts = Object.fromEntries(['admin', 'mediaA', 'mediaB'].map(key => [key, {
  email: `${key.toLowerCase()}@test.gibei.invalid`, password: secret(), name: `Fixture ${key}`,
}]));
const docker = (args, options = {}) => execFileSync('docker', args, { encoding: 'utf8', windowsHide: true, timeout: 30000, ...options });
let containerId, migration, server, log;
let native;
let env;
const stopped = new WeakSet();
const beforeNextEnv = readFileSync('next-env.d.ts', 'utf8');

async function freePort() {
  const listener = createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
  const port = listener.address().port;
  await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
  return port;
}

async function child(args, label) {
  const command = spawn(process.execPath, args, { env, stdio: ['ignore', log, log], windowsHide: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; stop(command); }, 240000);
  try {
    const code = await new Promise((resolve, reject) => { command.once('error', reject); command.once('exit', resolve); });
    assert.ok(!timedOut, `${label} exceeded the test timeout; inspect artifacts/test-run.log locally`);
    assert.equal(code, 0, `${label} failed; inspect artifacts/test-run.log locally`);
  } finally { clearTimeout(timer); }
}

function stop(command) {
  if (!command?.pid || command.exitCode !== null || stopped.has(command)) return;
  if (process.platform === 'win32') {
    try { execFileSync('taskkill', ['/PID', String(command.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); }
    catch (error) { if (error.status !== 128) throw error; } // Already exited before Node delivered its exit event.
  }
  else command.kill('SIGTERM');
  stopped.add(command);
}

async function assertTarget() {
  const result = await migration.query(`SELECT current_database() AS database, current_user AS role, (SELECT run_id FROM test_meta.run LIMIT 1) AS marker`);
  assertOwnedTestTarget(runId, result.rows[0]);
}

async function resetApplicationData() {
  await assertTarget();
  const client = await migration.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='payload' AND table_type='BASE TABLE' AND table_name<>'payload_migrations'");
    const tables = rows.map(({ table_name }) => `payload.${pg.escapeIdentifier(table_name)}`);
    if (tables.length) await client.query(`TRUNCATE ${tables.join(',')} RESTART IDENTITY CASCADE`);
    await client.query('GRANT USAGE ON SCHEMA payload TO gibei_runtime');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA payload GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO gibei_runtime');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA payload GRANT USAGE,SELECT ON SEQUENCES TO gibei_runtime');
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

try {
  // No .env.local is loaded by this launcher. All database URLs and credentials are fresh.
  mkdirSync('artifacts', { recursive: true });
  log = openSync('artifacts/test-run.log', 'w');
  let port;
  if (process.env.GIBEI_TEST_PG_BIN) {
    console.log('Starting run-owned native PostgreSQL cluster on loopback');
    native = await startNativePostgres({ runId, database, password: adminPassword, port: await freePort(), log });
    port = String(native.port);
  } else {
  assert.equal(docker(['info', '--format', '{{.OSType}}']).trim(), 'linux', 'Docker Linux engine must be Running');
  console.log('Starting run-owned PostgreSQL 17.11 container on loopback');
  const output = docker(['run', '--detach', '--rm', '--name', name,
    '--label', `gibei.test.run=${runId}`, '--label', 'gibei.test.project=gibei-uisi',
    '--publish', '127.0.0.1::5432', '--env', 'POSTGRES_PASSWORD', '--env', 'POSTGRES_DB',
    '--tmpfs', '/var/lib/postgresql/data', image], {
    env: { ...process.env, POSTGRES_PASSWORD: adminPassword, POSTGRES_DB: database }, timeout: 240000,
    stdio: ['ignore', 'pipe', log],
  }).trim();
  assert.match(output, /^[a-f0-9]{64}$/);
  containerId = output;
  const inspect = JSON.parse(docker(['inspect', containerId]))[0];
  assert.equal(inspect.Config.Labels['gibei.test.run'], runId);
  const binding = inspect.NetworkSettings.Ports['5432/tcp'][0];
  assert.equal(binding.HostIp, '127.0.0.1');
  port = binding.HostPort;
  }
  const operator = new pg.Pool({ host: '127.0.0.1', port: Number(port), database, user: 'postgres', password: adminPassword, ssl: false, max: 1, connectionTimeoutMillis: 2000 });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 45; attempt++) {
      try { await operator.query('SELECT 1'); ready = true; break; } catch { await delay(1000); }
    }
    assert.ok(ready, 'Test PostgreSQL must become ready');
    // Passwords are generated base64url; identifiers are fixed. Never accept CLI SQL fragments.
    await operator.query(`CREATE ROLE gibei_migrator LOGIN PASSWORD '${migrationPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`);
    await operator.query(`CREATE ROLE gibei_runtime LOGIN PASSWORD '${runtimePassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`);
    await operator.query('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN');
    await operator.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    await operator.query('CREATE SCHEMA test_meta AUTHORIZATION gibei_migrator');
    await operator.query('CREATE SCHEMA payload AUTHORIZATION gibei_migrator');
  } finally { await operator.end(); }
  const url = (role, password) => `postgresql://${role}:${password}@127.0.0.1:${port}/${database}`;
  const runtimeURL = url('gibei_runtime', runtimePassword), migrationURL = url('gibei_migrator', migrationPassword);
  env = { ...process.env, GIBEI_TEST_RUN_ID: runId, CMS_TEST_SCHEMA: '', NODE_ENV: 'development',
    DATABASE_URL: runtimeURL, TEST_DATABASE_URL: runtimeURL, MIGRATION_DATABASE_URL: migrationURL, TEST_MIGRATION_DATABASE_URL: migrationURL,
    PAYLOAD_SECRET: randomBytes(48).toString('base64url'), SERVER_URL: `http://127.0.0.1:${await freePort()}`,
    BOOTSTRAP_ADMIN_EMAIL: accounts.admin.email, BOOTSTRAP_ADMIN_PASSWORD: accounts.admin.password,
    GIBEI_TEST_ACCOUNTS: JSON.stringify(accounts), NEXT_TELEMETRY_DISABLED: '1' };
  migration = new pg.Pool(localTestConnection(env, migrationURL));
  await migration.query('CREATE TABLE test_meta.run (run_id text PRIMARY KEY)');
  await migration.query('INSERT INTO test_meta.run VALUES ($1)', [runId]);
  await resetApplicationData();
  console.log('Applying real Payload migrations and creating Admin fixture');
  await child(['scripts/payload.mjs', 'migrate'], 'Test migrations');
  await child(['scripts/payload.mjs', 'run', 'scripts/bootstrap-admin.ts'], 'Test Admin bootstrap');
  console.log('Building isolated production server');
  env.NODE_ENV = 'production';
  await child(['node_modules/next/dist/bin/next', 'build'], 'Isolated production build');
  const serverPort = new URL(env.SERVER_URL).port;
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', serverPort], { env, stdio: ['ignore', log, log], windowsHide: true });
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('Run-owned server stopped');
    try { ready = (await fetch(`${env.SERVER_URL}/api/users`, { signal: AbortSignal.timeout(2000) })).status === 403; } catch { /* Starting */ }
    if (ready) break;
    await delay(1000);
  }
  assert.ok(ready, 'Test application must become ready');
  // Verify the actual server identity via the unique generated credential, then seed Media through its API.
  const admin = await authenticate(accounts.admin, env.SERVER_URL);
  for (const key of ['mediaA', 'mediaB']) {
    const account = accounts[key];
    const result = await admin.request('/api/users', { method: 'POST', data: { ...account, role: 'media', status: 'active' } });
    assert.equal(result.status, 201, 'Create isolated Media fixture');
  }
  const roles = (await migration.query('SELECT role FROM payload.users ORDER BY role')).rows.map(row => row.role);
  assert.deepEqual(roles, ['admin', 'media', 'media']);
  await assertTarget();
  if (mode !== 'e2e') {
    console.log('Running integration smoke tests with Admin and two Media');
    await child(['--test', '--test-concurrency=1', 'tests/integration/accounts.test.mjs', 'tests/integration/articles.test.mjs', 'tests/integration/uploads.test.mjs', 'tests/integration/media-read.test.mjs', 'tests/integration/review-submit.test.mjs'], 'Integration tests');
    await child(['scripts/payload.mjs', 'run', 'scripts/verify-editorial-local.ts'], 'Local editorial boundary tests');
  }
  if (mode !== 'integration') {
    console.log('Running isolated Chromium browser tests');
    await child(['node_modules/@playwright/test/cli.js', 'test'], 'E2E tests');
  }
  stop(server);
  await resetApplicationData();
  assert.equal((await migration.query('SELECT count(*)::int AS n FROM payload.users')).rows[0].n, 0);
  assert.equal((await migration.query('SELECT count(*)::int AS n FROM payload.account_audit')).rows[0].n, 0);
  console.log(JSON.stringify({ status: 'passed', mode, fixture: { admin: 1, media: 2 }, dedicatedDatabase: true, guardedResetPassed: true }));
} catch (error) {
  // Keep raw subprocess/database errors out of shared logs; passwords only exist for this run.
  console.error(error instanceof assert.AssertionError ? error.message.split('\n')[0] : `Isolated test run failed (${error.code || error.name}); inspect artifacts/test-run.log locally`);
  process.exitCode = 1;
} finally {
  try { stop(server); } catch { process.exitCode = 1; }
  if (migration) await migration.end();
  if (native) { native.dispose(); console.log('Run-owned native cluster and ephemeral database removed'); }
  if (containerId) {
    const owned = JSON.parse(docker(['inspect', containerId]))[0];
    if (owned.Config.Labels['gibei.test.run'] !== runId || owned.Config.Labels['gibei.test.project'] !== 'gibei-uisi') throw new Error('Refusing cleanup of a container not owned by this run');
    docker(['rm', '--force', containerId], { stdio: 'ignore' });
    console.log('Run-owned test container and ephemeral database removed');
  }
  // Restore only Next's known route import changes, preserving unrelated edits.
  const generated = readFileSync('next-env.d.ts', 'utf8');
  if (generated.replaceAll('.next-test/types', '.next/types') === beforeNextEnv) writeFileSync('next-env.d.ts', beforeNextEnv);
  if (log !== undefined) closeSync(log);
}
