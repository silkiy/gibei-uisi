import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { rename, realpath, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { editorialFixture } from '../support/editorial.mjs';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';
let s;
before(async () => { s = await editorialFixture('publish'); });
test('only Admin publishes the matching reviewed snapshot and approved assets become public', async () => {
  const image = await s.upload(s.a), pdf = await s.upload(s.a, 'pdf');
  const doc = await s.draft(s.a, 'publish-approved', { assets: [{ asset: image.id, alt: 'Reviewed image alt', caption: 'Reviewed caption' }, { asset: pdf.id, alt: 'Reviewed PDF' }] });
  const pending = await s.submit(s.a, doc);
  assert.equal((await s.anonymous.request(`/api/media/${image.key}/original`)).status, 404);
  assert.equal((await s.command(s.a, pending.doc, 'publish', { submissionId: pending.submission.id })).status, 403);
  assert.equal((await s.command(s.admin, pending.doc, 'publish', { submissionId: pending.submission.id + 999 })).status, 409);
  const published = await s.publish(pending);
  assert.equal(published.state, 'published'); assert.equal(published.publicRevision, doc.workingRevision); assert.equal(published.workingRevision, null);
  assert.equal(published.assets[0].alt, 'Reviewed image alt');
  const review = await s.admin.request(`/api/content-reviews/${pending.submission.id}`);
  const decision = await review.json(); assert.equal(decision.status, 'approved'); assert.equal(decision.reviewerId, s.admin.user.id); assert.ok(decision.resolvedAt);
  for (const variant of ['original', 'thumbnail']) assert.equal((await s.anonymous.request(`/api/media/${image.key}/${variant}`)).status, 200);
  const attachment = await s.anonymous.request(`/api/media/${pdf.key}/original`, { headers: { Range: 'bytes=0-7' } });
  assert.equal(attachment.status, 206); assert.match(attachment.headers.get('content-disposition'), /^attachment;/);
  assert.equal((await s.command(s.admin, pending.doc, 'publish', { submissionId: pending.submission.id })).status, 409);
  assert.equal((await s.admin.request(`/api/media/${image.id}`, { method: 'PATCH', data: { fileVersion: 'overwritten', checksum: 'forged' } })).status, 403);
  assert.equal((await s.admin.request(`/api/media/${image.key}/original`, { method: 'PUT', bytes: Buffer.from('replacement') })).status, 405);
});
test('missing storage and audit failure cannot partially publish or expose any asset', async () => {
  const image = await s.upload(s.a);
  const doc = await s.draft(s.a, 'publish-rollback', { assets: [{ asset: image.id, alt: 'Snapshot alt' }] });
  const pending = await s.submit(s.a, doc);
  const run = process.env.GIBEI_TEST_RUN_ID; assert.match(run, /^[a-f0-9]{12}$/); assert.match(image.key, /^[a-f0-9-]{36}$/);
  const root = await realpath(path.resolve('.tools/test-databases', run));
  assert.equal(root, path.resolve('.tools/test-databases', run));
  assert.equal(JSON.parse(await readFile(path.join(root, 'run-owner.json'), 'utf8')).runId, run);
  const directory = await realpath(path.join(root, 'assets', image.key)); assert.equal(directory, path.join(root, 'assets', image.key));
  const original = path.join(directory, 'original'), offline = path.join(directory, 'original.offline');
  await rename(original, offline);
  try { assert.equal((await s.command(s.admin, pending.doc, 'publish', { submissionId: pending.submission.id })).status, 409); }
  finally { await rename(offline, original); }
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  try {
    assertOwnedTestTarget(run, (await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    await pool.query('REVOKE INSERT ON payload.editorial_audit FROM gibei_runtime');
    try { assert.equal((await s.command(s.admin, pending.doc, 'publish', { submissionId: pending.submission.id })).status, 500); }
    finally { await pool.query('GRANT INSERT ON payload.editorial_audit TO gibei_runtime'); }
    const read = await s.a.request(`/api/articles/${doc.id}`); const unchanged = await read.json();
    assert.equal(unchanged.publicRevision, null); assert.equal(unchanged.state, 'in_review'); assert.equal(unchanged.lockVersion, pending.doc.lockVersion);
    assert.equal((await s.anonymous.request(`/api/media/${image.key}/original`)).status, 404);
    assert.equal((await (await s.admin.request(`/api/content-reviews/${pending.submission.id}`)).json()).status, 'pending');
    await s.publish(pending);
    assert.equal((await s.anonymous.request(`/api/media/${image.key}/original`)).status, 200);
  } finally { await pool.end(); }
});
