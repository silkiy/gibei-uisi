import assert from 'node:assert/strict';
import test from 'node:test';
import { connectionConfig } from './config.mjs';

const valid = 'postgresql://gibei_runtime.lgqnxvldjqzgbfyxqonx:test@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';
test('rejects API URLs before opening a socket', () => {
  assert.throws(() => connectionConfig('https://lgqnxvldjqzgbfyxqonx.supabase.co'), /PostgreSQL/);
});
test('rejects another project or transaction pooler', () => {
  assert.throws(() => connectionConfig(valid.replace('lgqnxvldjqzgbfyxqonx', 'otherproject')), /project/);
  assert.throws(() => connectionConfig(valid.replace(':5432', ':6543')), /5432/);
});
test('pins verified TLS and bounded pool instead of URL SSL overrides', () => {
  const config = connectionConfig(`${valid}?sslmode=disable&sslrootcert=untrusted`);
  assert.equal(config.ssl.rejectUnauthorized, true);
  assert.equal(new URL(config.connectionString).searchParams.has('sslmode'), false);
  assert.equal(new URL(config.connectionString).searchParams.has('sslrootcert'), false);
  assert.equal(config.max, 3);
});
