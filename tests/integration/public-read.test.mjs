import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import pg from 'pg';
import { editorialFixture } from '../support/editorial.mjs';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';
let s;
before(async () => { s = await editorialFixture('public-reader'); });
const forbidden = new Set(['owner', 'assignedTo', 'createdBy', 'email', 'password', 'hash', 'salt', 'manifest', 'reviewerId', 'submittedBy', 'workingRevision', 'publicRevision', 'checksum', 'fileVersion']);
function publicOnly(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) { assert.ok(!forbidden.has(key), `Private field ${key} excluded`); publicOnly(child); }
}
test('anonymous list/count/detail use approved snapshots and an explicit field allowlist', async () => {
  const asset = await s.upload(s.a);
  const draft = await s.draft(s.a, 'whitelist-private', { title: 'Needle Whitelist PRIVATE', assets: [{ asset: asset.id, alt: 'Private image' }] });
  const published = await s.publish(await s.submit(s.a, await s.draft(s.a, 'whitelist-published', { title: 'Needle Whitelist published', assets: [{ asset: asset.id, alt: 'Approved image' }], sources: [{ title: 'Exchange', url: 'https://www.idx.co.id/' }] })));
  const list = await s.anonymous.request('/api/public/articles?q=Needle%20Whitelist&category=category-public-reader&limit=1');
  assert.equal(list.status, 200); assert.match(list.headers.get('cache-control'), /no-store/);
  const data = await list.json(); assert.equal(data.totalDocs, 1); assert.equal(data.docs.length, 1); assert.equal(data.docs[0].slug, published.slug); publicOnly(data);
  const detail = await s.anonymous.request(`/api/public/articles/${published.slug}`); assert.equal(detail.status, 200);
  const article = await detail.json(); publicOnly(article); assert.equal(article.publicAuthor, 'Public Team'); assert.ok(article.publishedAt);
  assert.equal(article.assets[0].alt, 'Approved image'); assert.match(article.assets[0].url, new RegExp(asset.key));
  assert.equal((await s.anonymous.request(`/api/public/articles/${draft.slug}`)).status, 404);
  assert.equal((await s.anonymous.request(`/api/public/articles/${draft.id}`)).status, 404);
  for (const path of ['/api/articles', '/api/article-revisions', '/api/content-reviews', '/api/editorial-audit', '/api/media']) assert.equal((await s.anonymous.request(path)).status, 403);
  for (const query of ['depth=10', 'where[owner][exists]=true']) assert.equal((await s.anonymous.request(`/api/public/articles?${query}`)).status, 400);
  for (const query of ['page=0', 'limit=1000']) {
    const normalized = await s.anonymous.request(`/api/public/articles?${query}`); assert.equal(normalized.status, 200);
    const defaults = await normalized.json(); assert.equal(defaults.page, 1); assert.equal(defaults.limit, 12);
  }
  const outside = await s.anonymous.request('/api/public/articles?page=999999&limit=1'); assert.equal(outside.status, 200); assert.deepEqual((await outside.json()).docs, []);
});
test('nested related content resolves its public target while a newer private target draft exists', async () => {
  const target = await s.publish(await s.submit(s.a, await s.draft(s.a, 'public-relation-target', { title: 'Approved target title' })));
  const source = await s.publish(await s.submit(s.a, await s.draft(s.a, 'public-relation-source', { related: [{ target: target.id, required: true }] })));
  // Read-layer fixture only: simulate the working revision added by T017 without changing the public pointer.
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  try {
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID, (await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    const revision = (await pool.query("INSERT INTO payload.article_revisions(article_id,number,state,edit_version,title,excerpt,body,category_id,public_author) VALUES($1,2,'draft',1,'SECRET TARGET DRAFT','Private target excerpt',$2,$3,'Private author') RETURNING id", [target.id, JSON.stringify(s.rich('Private target body')), s.category.id])).rows[0];
    await pool.query('UPDATE payload.articles SET working_revision_id=$1,lock_version=lock_version+1 WHERE id=$2', [revision.id, target.id]);
    const response = await s.anonymous.request(`/api/public/articles/${source.slug}`); assert.equal(response.status, 200);
    const data = await response.json(); publicOnly(data); assert.equal(data.related[0].title, 'Approved target title');
    assert.ok(!JSON.stringify(data).includes('SECRET TARGET DRAFT'));
    assert.equal((await (await s.anonymous.request(`/api/public/articles/${target.slug}`)).json()).title, 'Approved target title');
  } finally { await pool.end(); }
});
