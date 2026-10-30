import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

export async function startNativePostgres({ runId, database, password, port, log }) {
  assert.match(runId, /^[a-f0-9]{12}$/);
  assert.equal(database, `gibei_test_${runId}`);
  const bin = path.resolve(process.env.GIBEI_TEST_PG_BIN);
  const executable = name => path.join(bin, process.platform === 'win32' ? `${name}.exe` : name);
  const root = path.resolve('.tools/test-databases');
  mkdirSync(root, { recursive: true });
  const directory = path.join(root, runId);
  assert.ok(!existsSync(directory), 'Native test directory must be newly created');
  mkdirSync(directory);
  const marker = path.join(directory, 'run-owner.json');
  writeFileSync(marker, JSON.stringify({ runId, database }));
  const passwordFile = path.join(directory, 'password');
  const data = path.join(directory, 'data');
  writeFileSync(passwordFile, password, { mode: 0o600 });
  let started = false;
  const command = (name, args) => execFileSync(executable(name), args, { stdio: ['ignore', log, log], timeout: 60000, windowsHide: true });
  const dispose = () => {
    // Check both actual location and marker before stopping/removing this run's cluster.
    const resolved = realpathSync(directory);
    assert.ok(realpathSync(root).startsWith(realpathSync(process.cwd()) + path.sep), 'Test data must remain inside the workspace');
    assert.equal(resolved, path.join(realpathSync(root), runId));
    assert.deepEqual(JSON.parse(readFileSync(marker, 'utf8')), { runId, database });
    if (started) {
      let running = true;
      try { command('pg_ctl', ['-D', data, 'status']); }
      catch (error) { if (error.status === 3) running = false; else throw error; }
      if (running) command('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
    }
    rmSync(resolved, { recursive: true, force: false });
  };
  try {
    command('initdb', ['-D', data, '-U', 'postgres', '--pwfile', passwordFile, '--auth', 'scram-sha-256', '--encoding', 'UTF8', '--locale', 'C']);
    rmSync(passwordFile);
    started = true;
    command('pg_ctl', ['-D', data, '-l', path.join(directory, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start']);
    const operator = new pg.Pool({ host: '127.0.0.1', port, user: 'postgres', password, database: 'postgres', max: 1, ssl: false });
    try { await operator.query(`CREATE DATABASE "${database}"`); } finally { await operator.end(); }
    return { port, dispose };
  } catch (error) { dispose(); throw error; }
}
