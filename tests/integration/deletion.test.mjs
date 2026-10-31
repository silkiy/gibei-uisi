import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { access, readFile, realpath, rename, symlink, unlink } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { editorialFixture } from '../support/editorial.mjs';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';
let s;
before(async () => { s = await editorialFixture('deletion'); });
const manage = (actor, asset, action, note = 'Administrative test reason') => actor.request(`/api/media/${asset.key}/manage`, { method: 'POST', data: { action, note } });
test('audit failure leaves files intact; failed physical cleanup remains denied and can be retried', async () => {
  const image = await s.upload(s.a);
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  try {
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID, (await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    await pool.query('REVOKE INSERT ON payload.media_audit FROM gibei_runtime');
    try { assert.equal((await manage(s.admin, image, 'delete')).status, 500); }
    finally { await pool.query('GRANT INSERT ON payload.media_audit TO gibei_runtime'); }
    assert.equal((await s.admin.request(`/api/media/${image.key}/original`)).status, 200);
    const run = process.env.GIBEI_TEST_RUN_ID; assert.match(run, /^[a-f0-9]{12}$/);
    const root = await realpath(path.resolve('.tools/test-databases', run));
    assert.equal(root, path.resolve('.tools/test-databases', run));
    assert.equal(JSON.parse(await readFile(path.join(root, 'run-owner.json'), 'utf8')).runId, run);
    const directory = await realpath(path.join(root, 'assets', image.key));
    assert.equal(directory, path.join(root, 'assets', image.key));
    const offline = `${directory}.offline`; await rename(directory, offline);
    try {
      await symlink(offline, directory, 'junction');
      try {
        const response = await manage(s.admin, image, 'delete'); assert.equal(response.status, 200);
        assert.equal((await response.json()).cleanupPending, true);
        assert.equal((await s.admin.request(`/api/media/${image.key}/original`)).status, 404);
        await access(path.join(offline, 'original'));
      } finally { await unlink(directory); }
    } finally { await rename(offline, directory); }
    const retry = await manage(s.admin, image, 'delete'); assert.equal(retry.status, 200); assert.equal((await retry.json()).cleanupPending, false);
  } finally { await pool.end(); }
});
test('only Admin deletes unused files, leaving an audit and an inaccessible tombstone', async () => {
  const image = await s.upload(s.a);
  assert.equal((await manage(s.a, image, 'delete')).status, 403);
  assert.equal((await manage(s.admin, image, 'delete', '')).status, 400);
  assert.equal((await s.admin.request(`/api/media/${image.id}`, { method: 'DELETE' })).status, 403);
  const run = process.env.GIBEI_TEST_RUN_ID; assert.match(run, /^[a-f0-9]{12}$/);
  const root = await realpath(path.resolve('.tools/test-databases', run));
  assert.equal(root, path.resolve('.tools/test-databases', run));
  assert.equal(JSON.parse(await readFile(path.join(root, 'run-owner.json'), 'utf8')).runId, run);
  const file = path.join(root, 'assets', image.key, 'original'); await access(file);
  const response = await manage(s.admin, image, 'delete'); assert.equal(response.status, 200);
  assert.equal((await response.json()).cleanupPending, false); await assert.rejects(access(file));
  assert.equal((await s.admin.request(`/api/media/${image.key}/original`)).status, 404);
  assert.equal((await manage(s.admin, image, 'delete')).status, 200);
  const audit = await s.admin.request(`/api/media-audit?where[assetId][equals]=${image.id}`);
  assert.ok((await audit.json()).docs.some(row => row.action === 'deleted'));
});
test('draft, historical review, publication and configuration references each prevent file deletion', async () => {
  const image = await s.upload(s.a);
  const draft = await s.draft(s.a, 'deletion-draft-ref', { assets: [{ asset: image.id, alt: 'Reference' }] });
  const denied = await manage(s.admin, image, 'delete'); assert.equal(denied.status, 409);
  assert.ok((await denied.json()).references.some(row => row.kind === 'revision' && row.articleId === draft.id));
  const pending = await s.submit(s.a, draft);
  const withdrawn = (await (await s.command(s.a, pending.doc, 'withdraw-submission', { submissionId: pending.submission.id })).json()).doc;
  const saved = await s.a.request(`/api/articles/${draft.id}`, { method: 'PATCH', data: { expectedLockVersion: withdrawn.lockVersion, assets: [] } }); assert.equal(saved.status, 200);
  const historical = await manage(s.admin, image, 'delete'); assert.equal(historical.status, 409);
  assert.ok((await historical.json()).references.some(row => row.kind === 'review'));
  const publishedImage = await s.upload(s.a);
  const published = await s.publish(await s.submit(s.a, await s.draft(s.a, 'deletion-public-ref', { assets: [{ asset: publishedImage.id, alt: 'Published' }] })));
  assert.equal((await manage(s.admin, publishedImage, 'delete')).status, 409);
  assert.equal((await s.command(s.admin, published, 'withdraw-publication', { note: 'Historical version still retained' })).status, 200);
  assert.equal((await manage(s.admin, publishedImage, 'delete')).status, 409);
  const configured = await s.upload(s.a);
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  try {
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID, (await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    await pool.query('INSERT INTO payload.asset_config_references(asset_id,config_key,version) VALUES($1,$2,$3)', [configured.id, 'test-header-logo', 'fixture-v1']);
    const blocked = await manage(s.admin, configured, 'delete'); assert.equal(blocked.status, 409);
    assert.ok((await blocked.json()).references.some(row => row.kind === 'configuration'));
    assert.equal((await s.anonymous.request(`/api/media/${configured.key}/original`)).status, 404);
    assert.equal((await s.admin.request('/api/asset-config-references', { method: 'POST', data: { asset: configured.id, configKey: 'forged', version: 'v1' } })).status, 403);
  } finally { await pool.end(); }
});
test('emergency revocation closes all warm byte variants, exposes impact and gives a safe public fallback', async () => {
  const image = await s.upload(s.a), pdf = await s.upload(s.a, 'pdf');
  const published = await s.publish(await s.submit(s.a, await s.draft(s.a, 'deletion-revoke', { assets: [image, pdf].map(asset => ({ asset: asset.id, alt: 'Published snapshot' })) })));
  const created = (await (await s.command(s.a, published, 'create-revision')).json()).doc;
  const pending = await s.submit(s.a, created);
  for (const asset of [image, pdf]) {
    assert.equal((await s.anonymous.request(`/api/media/${asset.key}/original`)).status, 200);
    assert.equal((await manage(s.a, asset, 'revoke')).status, 403);
    const revoked = await manage(s.admin, asset, 'revoke'); assert.equal(revoked.status, 200);
    assert.ok((await revoked.json()).references.some(row => row.articleId === published.id));
    for (const variant of asset.hasThumbnail ? ['original', 'thumbnail'] : ['original']) for (const actor of [s.admin, s.anonymous]) {
      for (const options of [{}, { method: 'HEAD' }, { headers: { Range: 'bytes=0-7', 'If-None-Match': '*' } }]) assert.equal((await actor.request(`/api/media/${asset.key}/${variant}`, options)).status, 404);
    }
  }
  const publicDoc = await (await s.anonymous.request(`/api/public/articles/${published.slug}`)).json();
  assert.ok(publicDoc.assets.every(asset => !asset.available && asset.url === null && asset.fallback));
  assert.equal((await s.command(s.admin, pending.doc, 'publish', { submissionId: pending.submission.id })).status, 409);
});
test('Admin can remove an unreferenced unpublished draft while preserving audit, but cannot delete reviewed publications or referenced drafts', async () => {
  const draft = await s.draft(s.a, 'deletion-clean-draft');
  assert.equal((await s.command(s.a, draft, 'delete-draft', { note: 'Forbidden' })).status, 403);
  assert.equal((await s.command(s.admin, draft, 'delete-draft', { note: '' })).status, 400);
  const removed = await s.command(s.admin, draft, 'delete-draft', { note: 'Unused draft' }); assert.equal(removed.status, 200);
  for (const actor of [s.a, s.admin]) assert.equal((await actor.request(`/api/articles/${draft.id}`)).status, 404);
  const list = await (await s.admin.request(`/api/articles?where[id][equals]=${draft.id}`)).json(); assert.equal(list.totalDocs, 0);
  assert.equal((await s.admin.request(`/api/articles/${draft.id}`, { method: 'PATCH', data: { expectedLockVersion: draft.lockVersion, title: 'Restore' } })).status, 404);
  const audit = await (await s.admin.request(`/api/editorial-audit?where[article][equals]=${draft.id}`)).json();
  assert.ok(audit.docs.some(row => row.action === 'draft_deleted'));
  const target = await s.draft(s.a, 'deletion-related-target'); await s.draft(s.a, 'deletion-related-source', { related: [{ target: target.id }] });
  const blocked = await s.command(s.admin, target, 'delete-draft', { note: 'Referenced' }); assert.equal(blocked.status, 409); assert.ok((await blocked.json()).references.length);
  const reviewed = await s.submit(s.a, await s.draft(s.a, 'deletion-pending'));
  assert.equal((await s.command(s.admin, reviewed.doc, 'delete-draft', { note: 'Pending review' })).status, 409);
  const published = await s.publish(reviewed);
  const workingResult = await s.command(s.a, published, 'create-revision'); assert.equal(workingResult.status, 200);
  const working = (await workingResult.json()).doc;
  const withdrawn = (await (await s.command(s.admin, working, 'withdraw-publication', { note: 'Retain history' })).json()).doc;
  assert.ok(withdrawn.workingRevision); assert.equal(withdrawn.publicRevision, null);
  assert.equal((await s.command(s.admin, withdrawn, 'delete-draft', { note: 'Ever published' })).status, 409);
});
