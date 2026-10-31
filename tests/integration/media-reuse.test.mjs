import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import pg from 'pg';
import { editorialFixture } from '../support/editorial.mjs';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';
let s;
before(async () => { s = await editorialFixture('reuse'); });
test('shared image and PDF remain public until their last approved article is withdrawn', async () => {
  const image = await s.upload(s.a), pdf = await s.upload(s.a, 'pdf');
  const assets = [image, pdf].map(asset => ({ asset: asset.id, alt: 'Reviewed reuse' }));
  const first = await s.publish(await s.submit(s.a, await s.draft(s.a, 'reuse-first', { assets })));
  assert.equal((await s.b.request(`/api/media/${image.id}`)).status, 404);
  const second = await s.publish(await s.submit(s.b, await s.draft(s.b, 'reuse-second', { assets })));
  assert.equal((await s.command(s.admin, first, 'withdraw-publication', { note: 'First reference removed' })).status, 200);
  for (const asset of [image, pdf]) assert.equal((await s.anonymous.request(`/api/media/${asset.key}/original`)).status, 200);
  assert.equal((await s.command(s.admin, second, 'withdraw-publication', { note: 'Last reference removed' })).status, 200);
  for (const asset of [image, pdf]) for (const variant of asset.hasThumbnail ? ['original', 'thumbnail'] : ['original']) {
    for (const options of [{}, { method: 'HEAD' }, { headers: { Range: 'bytes=0-7', 'If-None-Match': '*' } }]) {
      const response = await s.anonymous.request(`/api/media/${asset.key}/${variant}`, options);
      assert.equal(response.status, 404); assert.match(response.headers.get('cache-control'), /no-store/);
    }
  }
  const rejected = await s.b.request('/api/articles', { method: 'POST', data: { slug: 'reuse-private-denied', title: 'Private', assets } });
  assert.equal(rejected.status, 404);
});
test('revocation after submission rejects approval until the asset reference is repaired', async () => {
  const image = await s.upload(s.a);
  const pending = await s.submit(s.a, await s.draft(s.a, 'reuse-revoked', { assets: [{ asset: image.id, alt: 'Snapshot' }] }));
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  try {
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID, (await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    await pool.query("UPDATE payload.media SET state='revoked', revoked_at=now() WHERE id=$1", [image.id]);
    assert.equal((await s.command(s.admin, pending.doc, 'publish', { submissionId: pending.submission.id })).status, 409);
    const withdrawn = await s.command(s.a, pending.doc, 'withdraw-submission', { submissionId: pending.submission.id });
    assert.equal(withdrawn.status, 200); const doc = (await withdrawn.json()).doc;
    const repaired = await s.a.request(`/api/articles/${doc.id}`, { method: 'PATCH', data: { expectedLockVersion: doc.lockVersion, assets: [] } });
    assert.equal(repaired.status, 200); await s.publish(await s.submit(s.a, (await repaired.json()).doc));
  } finally { await pool.end(); }
});
