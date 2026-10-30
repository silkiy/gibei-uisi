export function localTestConnection(env, raw = env.DATABASE_URL) {
  const runId = env.GIBEI_TEST_RUN_ID;
  if (!/^[a-f0-9]{12}$/.test(runId || '')) throw new Error('A valid isolated test run ID is required');
  if (!raw || ![env.TEST_DATABASE_URL, env.TEST_MIGRATION_DATABASE_URL].filter(Boolean).includes(raw)) throw new Error('Test connection must match an explicit test URL');
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid test connection'); }
  if (url.protocol !== 'postgresql:' || url.hostname !== '127.0.0.1' || !url.port ||
      url.pathname !== `/gibei_test_${runId}` || !['gibei_runtime', 'gibei_migrator'].includes(url.username) ||
      !url.password || url.search || url.hash) throw new Error('Only the run-owned loopback test database is allowed');
  return { connectionString: raw, ssl: false, max: 3, connectionTimeoutMillis: 12000,
    idleTimeoutMillis: 10000, statement_timeout: 15000, application_name: `gibei-test-${runId}` };
}

export function assertOwnedTestTarget(runId, state) {
  if (!/^[a-f0-9]{12}$/.test(runId || '') || state.database !== `gibei_test_${runId}` ||
      state.role !== 'gibei_migrator' || state.marker !== runId) throw new Error('Refusing to reset a database not owned by this test run');
}
