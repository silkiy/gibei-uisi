import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Users } from './collections/Users';
import { connectionConfig } from '../scripts/database/config.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverURL = process.env.SERVER_URL || 'http://127.0.0.1:3000';
const origin = new URL(serverURL);
if (origin.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(origin.hostname)) throw new Error('Non-local CMS requires HTTPS');
if (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.length < 32) throw new Error('Configure a strong PAYLOAD_SECRET');
const ca = readFileSync(path.join(process.cwd(), 'certs', 'supabase-prod-ca-2021.crt'), 'utf8');

export default buildConfig({
  telemetry: false,
  secret: process.env.PAYLOAD_SECRET,
  serverURL,
  cors: [serverURL],
  csrf: [serverURL],
  admin: { user: 'users', importMap: { baseDir: dirname } },
  collections: [Users],
  email: () => ({
    name: 'local-email-disabled',
    defaultFromAddress: 'noreply@gibei-uisi.local',
    defaultFromName: 'GIBEI UISI localhost',
    sendEmail: async () => { throw new Error('Email delivery is disabled for this local demo'); },
  }),
  graphQL: { disable: true },
  db: postgresAdapter({
    pool: connectionConfig(process.env.DATABASE_URL, ca),
    schemaName: 'payload',
    push: false,
    disableCreateDatabase: true,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  sharp,
});
