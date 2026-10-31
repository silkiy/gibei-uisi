import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { editorialFixture } from '../support/editorial.mjs';
let s;
before(async () => { s = await editorialFixture('published-revision'); });
const publicRead = async slug => { const response = await s.anonymous.request(`/api/public/articles/${slug}`); assert.equal(response.status, 200); return response.json(); };
test('one working revision preserves the public snapshot and replaces it only after review', async () => {
  const oldAsset = await s.upload(s.a), nextAsset = await s.upload(s.a);
  const published = await s.publish(await s.submit(s.a, await s.draft(s.a, 'revision-stable-slug', { title: 'Original public title', assets: [{ asset: oldAsset.id, alt: 'Original public alt' }] })));
  const before = await publicRead(published.slug);
  const attempts = await Promise.all([s.command(s.a, published, 'create-revision'), s.command(s.a, published, 'create-revision')]);
  assert.deepEqual(attempts.map(result => result.status).sort(), [200, 409]);
  let working = (await attempts.find(result => result.status === 200).json()).doc;
  assert.notEqual(working.workingRevision, published.publicRevision); assert.equal(working.publicRevision, published.publicRevision);
  assert.deepEqual(await publicRead(published.slug), before);
  assert.equal((await s.a.request(`/api/articles/${working.id}`, { method: 'PATCH', data: { expectedLockVersion: working.lockVersion, slug: 'changed-after-publication' } })).status, 409);
  const changed = await s.a.request(`/api/articles/${working.id}`, { method: 'PATCH', data: { expectedLockVersion: working.lockVersion, title: 'New reviewed title', excerpt: 'New excerpt', body: s.rich('New reviewed body'),
    assets: [{ id: published.assets[0].id, asset: nextAsset.id, alt: 'New reviewed alt', caption: 'New caption' }] } });
  assert.equal(changed.status, 200); working = (await changed.json()).doc;
  assert.deepEqual(await publicRead(published.slug), before, 'Caller-supplied child IDs cannot mutate published rows');
  assert.equal((await s.anonymous.request(`/api/media/${oldAsset.key}/original`)).status, 200);
  assert.equal((await s.anonymous.request(`/api/media/${nextAsset.key}/original`)).status, 404);
  const next = await s.publish(await s.submit(s.a, working));
  const after = await publicRead(published.slug);
  assert.equal(after.title, 'New reviewed title'); assert.equal(after.assets[0].alt, 'New reviewed alt'); assert.match(after.assets[0].url, new RegExp(nextAsset.key));
  assert.equal(next.workingRevision, null); assert.notEqual(next.publicRevision, published.publicRevision); assert.equal(next.slug, published.slug);
  assert.equal((await s.anonymous.request(`/api/media/${oldAsset.key}/original`)).status, 404);
});
test('archiving a working revision does not withdraw the public revision', async () => {
  const published = await s.publish(await s.submit(s.a, await s.draft(s.a, 'archive-working-only')));
  const before = await publicRead(published.slug);
  const created = await s.command(s.a, published, 'create-revision'); assert.equal(created.status, 200); const working = (await created.json()).doc;
  assert.equal((await s.command(s.a, working, 'archive-revision')).status, 403);
  const archived = await s.command(s.admin, working, 'archive-revision'); assert.equal(archived.status, 200); const current = (await archived.json()).doc;
  assert.equal(current.publicRevision, published.publicRevision); assert.equal(current.workingRevision, null);
  assert.deepEqual(await publicRead(published.slug), before);
  assert.equal((await s.command(s.a, current, 'create-revision')).status, 200);
});
