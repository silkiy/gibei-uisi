import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createPool, reportFailure } from './config.mjs';

const pool = createPool();
const committed = randomUUID();
const rolledBack = randomUUID();
let client;
try {
  client = await pool.connect();
  const { rows: [identity] } = await client.query('select current_user as role');
  assert.equal(identity.role, 'gibei_runtime');
  assert.equal(client.connection.stream.authorized, true);
  if (process.argv[2] === '--read') {
    const result = await client.query('select marker from gibei_meta.connection_probe where id=$1', [process.argv[3]]);
    assert.equal(result.rows[0]?.marker, 't005-commit');
    console.log(JSON.stringify({ persistedInNewProcess: true }));
  } else {
    await client.query('begin');
    await client.query('insert into gibei_meta.connection_probe(id,marker) values($1,$2)', [committed, 't005-commit']);
    await client.query('commit');
    await client.query('begin');
    await client.query('insert into gibei_meta.connection_probe(id,marker) values($1,$2)', [rolledBack, 't005-rollback']);
    await client.query('rollback');
    assert.equal((await client.query('select id from gibei_meta.connection_probe where id=$1', [rolledBack])).rowCount, 0);
    const child = spawnSync(process.execPath, ['--env-file=.env.local', fileURLToPath(import.meta.url), '--read', committed], { encoding: 'utf8', timeout: 30000 });
    assert.equal(child.status, 0, 'Persistence check in a new process failed');
    assert.equal(JSON.parse(child.stdout.trim()).persistedInNewProcess, true);
    await assert.rejects(client.query('create table payload.t005_forbidden(id integer)'), { code: '42501' });
    await assert.rejects(client.query('select id from auth.users limit 0'), { code: '42501' });
    const migrationPool = createPool('MIGRATION_DATABASE_URL');
    let migrationClient;
    try {
      migrationClient = await migrationPool.connect();
      assert.equal((await migrationClient.query('select current_user as role')).rows[0].role, 'gibei_migrator');
      await migrationClient.query('begin');
      await migrationClient.query('create table payload.t005_migration_probe(id integer)');
      await migrationClient.query('rollback');
      assert.equal((await migrationClient.query("select to_regclass('payload.t005_migration_probe') as object")).rows[0].object, null);
    } finally {
      if (migrationClient) await migrationClient.query('rollback').catch(() => {});
      migrationClient?.release();
      await migrationPool.end();
    }
    console.log(JSON.stringify({ status: 'passed', role: identity.role, commit: true, rollback: true, persistenceInNewProcess: true, runtimeDdlDenied: true, authSchemaDenied: true, migrationRoleDdlRollback: true }));
  }
} catch (error) {
  if (client) await client.query('rollback').catch(() => {});
  reportFailure(error);
} finally {
  if (client && process.argv[2] !== '--read') await client.query('delete from gibei_meta.connection_probe where id=any($1::uuid[])', [[committed, rolledBack]]).catch(() => {});
  client?.release();
  await pool.end();
}
