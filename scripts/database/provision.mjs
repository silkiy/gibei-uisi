import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import pg from 'pg';
import { createPool, reportFailure, projectRef } from './config.mjs';

const pool = createPool();
let client;
let committed = false;
try {
  client = await pool.connect();
  const { rows: [identity] } = await client.query('select current_user as role');
  if (identity.role !== 'postgres') throw new Error('Bootstrap requires initial postgres connection');
  await client.query('begin');
  const { rows } = await client.query("select rolname, rolcanlogin from pg_roles where rolname in ('gibei_migrator','gibei_runtime')");
  if (rows.length !== 2 || rows.some(row => row.rolcanlogin)) throw new Error('Foundation missing or credentials already provisioned; no rotation performed');
  let env = readFileSync('.env.local', 'utf8');
  for (const [role, key] of [['gibei_migrator', 'MIGRATION_DATABASE_URL'], ['gibei_runtime', 'DATABASE_URL']]) {
    const password = randomBytes(32).toString('hex');
    await client.query(`alter role ${role} login password ${pg.escapeLiteral(password)}`);
    const url = new URL(process.env.DATABASE_URL);
    url.username = url.hostname.endsWith('.pooler.supabase.com') ? `${role}.${projectRef}` : role;
    url.password = password;
    const line = `${key}=${url.toString()}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    env = pattern.test(env) ? env.replace(pattern, () => line) : `${env}\n${line}\n`;
  }
  writeFileSync('.env.local.pending', env, { mode: 0o600 });
  await client.query('commit');
  committed = true;
  renameSync('.env.local.pending', '.env.local');
  console.log('Restricted runtime and migration credentials provisioned in .env.local; values omitted');
} catch (error) {
  if (client && !committed) await client.query('rollback').catch(() => {});
  if (!committed) rmSync('.env.local.pending', { force: true });
  reportFailure(error);
  if (committed) console.error('Credentials committed: preserve .env.local.pending and install it as .env.local before retrying');
} finally {
  client?.release();
  await pool.end();
}
