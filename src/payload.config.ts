import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Users } from './collections/Users';
import { AccountAudit } from './audit/accounts';
import { isActiveUser } from './auth/policy';
import { connectionConfig } from '../scripts/database/config.mjs';
import { localTestConnection } from '../scripts/database/test-config.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverURL = process.env.SERVER_URL || 'http://127.0.0.1:3000';
const origin = new URL(serverURL);
if (origin.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(origin.hostname)) throw new Error('Non-local CMS requires HTTPS');
if (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.length < 32) throw new Error('Configure a strong PAYLOAD_SECRET');
const ca = readFileSync(path.join(process.cwd(), 'certs', 'supabase-prod-ca-2021.crt'), 'utf8');
const testSchema = process.env.CMS_TEST_SCHEMA;
if (testSchema && (process.env.NODE_ENV === 'production' || !/^payload_test_t007_[a-f0-9]{12}$/.test(testSchema))) throw new Error('Invalid isolated account test schema');

export default buildConfig({
  telemetry: false,
  secret: process.env.PAYLOAD_SECRET,
  serverURL,
  cors: [serverURL],
  csrf: [serverURL],
  admin: { user: 'users', importMap: { baseDir: dirname } },
  collections: [Users, AccountAudit],
  onInit: async payload => {
    // Payload JWT resolves the current user and session from the database on every request.
    // Reject inactive accounts before any CMS/API authorization or /me response.
    for (const strategy of payload.authStrategies) {
      const authenticate = strategy.authenticate;
      strategy.authenticate = async args => {
        const result = await authenticate(args);
        return result.user && !isActiveUser(result.user) ? { ...result, user: null } : result;
      };
    }
  },
  email: () => ({
    name: 'local-email-disabled',
    defaultFromAddress: 'noreply@gibei-uisi.local',
    defaultFromName: 'GIBEI UISI localhost',
    sendEmail: async () => { throw new Error('Email delivery is disabled for this local demo'); },
  }),
  graphQL: { disable: true },
  db: postgresAdapter({
    pool: process.env.GIBEI_TEST_RUN_ID ? localTestConnection(process.env) : connectionConfig(process.env.DATABASE_URL, ca),
    schemaName: testSchema || 'payload',
    push: false,
    disableCreateDatabase: true,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  sharp,
});
