import { getPayload } from 'payload';
import config from '../src/payload.config';
import { bootstrapCapability } from '../src/auth/policy';
import { createPool } from './database/config.mjs';

const lockPool = createPool();
const lock = await lockPool.connect();
let payload;
try {
  await lock.query('select pg_advisory_lock(697815, 6)');
  payload = await getPayload({ config });
  const count = await payload.count({ collection: 'users', overrideAccess: true });
  if (count.totalDocs > 0) {
    console.log('Admin bootstrap skipped: an account already exists; nothing changed');
  } else {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (!email || !password || password.length < 16) throw new Error('Configure local bootstrap credentials first');
    await payload.create({
      collection: 'users', overrideAccess: true,
      context: { [bootstrapCapability]: true },
      data: { email, password, name: 'Admin Demo Lokal', role: 'admin', status: 'active' },
    });
    console.log('Local demo Admin created; credentials remain in .env.local');
  }
} catch {
  throw new Error('Admin bootstrap failed; credentials and database details omitted');
} finally {
  await lock.query('select pg_advisory_unlock(697815, 6)').catch(() => {});
  lock.release();
  await lockPool.end();
  if (payload) {
    await payload.destroy();
  }
}
