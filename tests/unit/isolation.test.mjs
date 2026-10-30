import assert from 'node:assert/strict';
import test from 'node:test';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';

const runId = 'ab12cd34ef56';
const url = `postgresql://gibei_runtime:test-only-password@127.0.0.1:55432/gibei_test_${runId}`;
const env = { GIBEI_TEST_RUN_ID: runId, TEST_DATABASE_URL: url, DATABASE_URL: url };

test('test connection rejects development, remote and mismatched targets before I/O', () => {
  for (const candidate of [undefined, 'postgresql://gibei_runtime:x@127.0.0.1:55432/postgres', url.replace('127.0.0.1', 'db.lgqnxvldjqzgbfyxqonx.supabase.co'), url.replace(runId, 'ffffffffffff')]) {
    assert.throws(() => localTestConnection({ ...env, DATABASE_URL: candidate }));
  }
  assert.throws(() => localTestConnection({ ...env, GIBEI_TEST_RUN_ID: '' }));
  assert.equal(localTestConnection(env).ssl, false);
});

test('cleanup requires matching test database, login role and stored run marker', () => {
  const state = { database: `gibei_test_${runId}`, role: 'gibei_migrator', marker: runId };
  assert.doesNotThrow(() => assertOwnedTestTarget(runId, state));
  for (const change of [{ database: 'postgres' }, { role: 'postgres' }, { marker: 'ffffffffffff' }]) {
    assert.throws(() => assertOwnedTestTarget(runId, { ...state, ...change }));
  }
});
