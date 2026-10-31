import assert from 'node:assert/strict';
import { getPayload } from 'payload';
import config from '../src/payload.config';

assert.match(process.env.GIBEI_TEST_RUN_ID || '', /^[a-f0-9]{12}$/);
assert.match(new URL(process.env.DATABASE_URL!).pathname, /^\/gibei_test_[a-f0-9]{12}$/);
const payload = await getPayload({ config });
const forbidden = (error: unknown) => (error as { status?: number }).status === 403;
try {
  const actors = (await payload.find({ collection: 'users', overrideAccess: true })).docs;
  const media = actors.find(actor => actor.role === 'media')!;
  assert.ok(media);
  const user = { ...media, collection: 'users' as const };
  // Local API defaults to overrideAccess=true; hooks must still enforce the domain boundary.
  await assert.rejects(payload.create({ collection: 'articles', data: { slug: 'local-no-actor', createdBy: media.id, owner: media.id, lockVersion: 0 } }), forbidden);
  await assert.rejects(payload.create({ collection: 'article-categories', user, data: { name: 'Denied', slug: 'local-denied' } }), forbidden);
  await assert.rejects(payload.create({ collection: 'article-categories', user: { ...user, role: 'admin' }, data: { name: 'Forged role', slug: 'forged-role' } }), forbidden);
  const doc = await payload.create({ collection: 'articles', user, data: { slug: 'local-api-draft', title: 'Local draft', createdBy: media.id, owner: media.id, lockVersion: 0 } });
  await assert.rejects(payload.findByID({ collection: 'articles', id: doc.id }), error => (error as { status?: number }).status === 404);
  await assert.rejects(payload.update({ collection: 'articles', id: doc.id, data: { title: 'No actor', expectedLockVersion: doc.lockVersion } }), forbidden);
  await assert.rejects(payload.update({ collection: 'articles', id: doc.id, user, data: { state: 'published', expectedLockVersion: doc.lockVersion } }), forbidden);
  await assert.rejects(payload.create({ collection: 'article-revisions', user, context: { editorialWrite: true }, data: { article: doc.id, number: 2, editVersion: 1, state: 'published' } }), forbidden);
  await assert.rejects(payload.create({ collection: 'editorial-audit', user, context: { editorialWrite: true }, data: { article: doc.id, actorId: media.id, revisionId: 1, editVersion: 1, action: 'draft_created', after: {}, correlationId: 'forged' } }), forbidden);
  console.log('Local editorial API denies default override, forged role and forged internal context');
} finally { await payload.destroy(); }
