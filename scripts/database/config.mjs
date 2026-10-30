import { readFileSync } from 'node:fs';
import pg from 'pg';
import { localTestConnection } from './test-config.mjs';

export const projectRef = 'lgqnxvldjqzgbfyxqonx';

export function connectionConfig(raw, ca) {
  if (!raw) throw new Error('DATABASE_URL belum diisi dalam .env.local');
  let url;
  try { url = new URL(raw); } catch { throw new Error('DATABASE_URL tidak valid'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL harus connection string PostgreSQL, bukan URL API');
  const direct = url.hostname === `db.${projectRef}.supabase.co`;
  const session = url.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(url.username).endsWith(`.${projectRef}`);
  if (!direct && !session) throw new Error('DATABASE_URL bukan project Supabase yang dipilih');
  if (url.port && url.port !== '5432') throw new Error('Gunakan direct/session connection port 5432');
  if (!url.username || !url.password || url.pathname !== '/postgres') throw new Error('Kredensial/database PostgreSQL belum lengkap');
  for (const parameter of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(parameter);
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    max: 3,
    connectionTimeoutMillis: 12000,
    idleTimeoutMillis: 10000,
    statement_timeout: 15000,
    application_name: 'gibei-uisi',
  };
}

export function createPool(key = 'DATABASE_URL') {
  if (process.env.GIBEI_TEST_RUN_ID) return new pg.Pool(localTestConnection(process.env, process.env[key]));
  const ca = process.env.DATABASE_CA_FILE ? readFileSync(process.env.DATABASE_CA_FILE, 'utf8') : undefined;
  return new pg.Pool(connectionConfig(process.env[key], ca));
}

export function reportFailure(error) {
  const code = error?.code || 'CONFIG_ERROR';
  const known = {
    ENOTFOUND: 'Host database tidak ditemukan',
    ENETUNREACH: 'Jaringan database tidak terjangkau; gunakan Session pooler',
    '28P01': 'Username/password database ditolak',
    '42501': 'Role database tidak memiliki izin yang diperlukan',
    SELF_SIGNED_CERT_IN_CHAIN: 'Simpan CA Supabase lalu isi DATABASE_CA_FILE; jangan menonaktifkan verifikasi TLS',
    UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'CA database belum dipercaya; isi DATABASE_CA_FILE',
  };
  console.error(JSON.stringify({ status: 'failed', code, message: known[code] || (code === 'CONFIG_ERROR' ? 'Konfigurasi database belum valid; periksa docs/setup.md' : 'Operasi database gagal; detail sensitif tidak dicetak') }));
  process.exitCode = 1;
}
