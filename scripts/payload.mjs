import { loadEnvFile } from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

loadEnvFile('.env.local');
const args = process.argv.slice(2);
const allowed = ['generate:types', 'generate:importmap', 'migrate:create', 'migrate', 'migrate:status', 'run'];
if (!allowed.includes(args[0])) throw new Error('Use an explicitly supported non-destructive Payload command');
if (args[0] === 'run' && (args[1] !== 'scripts/bootstrap-admin.ts' || args.length !== 2)) throw new Error('Only the local Admin bootstrap script is supported');
if (args[0].startsWith('migrate')) {
  if (!process.env.MIGRATION_DATABASE_URL) throw new Error('MIGRATION_DATABASE_URL required');
  process.env.DATABASE_URL = process.env.MIGRATION_DATABASE_URL;
}
process.env.PAYLOAD_CONFIG_PATH = 'src/payload.config.ts';
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/payload/bin.js', import.meta.url)), ...args], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
