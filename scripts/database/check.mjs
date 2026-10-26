import { createPool, reportFailure } from './config.mjs';

const pool = createPool();
try {
  const client = await pool.connect();
  try {
    const { rows: [row] } = await client.query(`select version() as postgres_version, current_user as role,
      current_database() as database, (select ssl from pg_stat_ssl where pid=pg_backend_pid()) as database_leg_ssl`);
    const tls = { encrypted: client.connection.stream.encrypted === true, authorized: client.connection.stream.authorized === true };
    console.log(JSON.stringify({ status: 'connected', ...row, client_tls: tls }));
    if (!tls.encrypted || !tls.authorized) throw new Error('Verified client TLS required');
  } finally { client.release(); }
} catch (error) {
  reportFailure(error);
} finally {
  await pool.end();
}
