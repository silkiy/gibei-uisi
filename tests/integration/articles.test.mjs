import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import pg from 'pg';
import { fixtureAccounts, authenticate, httpClient } from '../support/http.mjs';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';

const accounts = fixtureAccounts();
let admin, a, b;
const rich = text => ({ root: { type: 'root', version: 1, format: '', indent: 0, direction: null, children: [{ type: 'paragraph', version: 1, format: '', indent: 0, direction: null, textFormat: 0, textStyle: '', children: [{ type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' }] }] } });
before(async () => { admin = await authenticate(accounts.admin); a = await authenticate(accounts.mediaA); b = await authenticate(accounts.mediaB); });
async function create(client, slug, extra = {}) {
  const result = await client.request('/api/articles', { method: 'POST', data: { slug, title: 'Draft artikel uji', body: rich('Isi privat'), publicAuthor: 'Tim Riset Contoh', ...extra } });
  assert.equal(result.status, 201, 'Draft creation succeeds');
  return (await result.json()).doc;
}
async function patch(client, doc, data, status = 200) {
  const result = await client.request(`/api/articles/${doc.id}`, { method: 'PATCH', data: { expectedLockVersion: doc.lockVersion, ...data } });
  assert.equal(result.status, status, 'Draft update status');
  return status === 200 ? (await result.json()).doc : null;
}

test('draft visibility, assignment, transfer and stale-version protection use current ownership', async () => {
  const doc = await create(a, '  Draft Pribadi A  ');
  assert.equal(doc.slug, 'draft-pribadi-a');
  assert.equal(doc.createdBy, a.user.id);
  assert.equal(doc.owner, a.user.id);
  assert.equal(doc.state, 'draft');
  assert.equal(doc.publicRevision, null);
  assert.equal(doc.body.root.children[0].children[0].text, 'Isi privat');
  assert.match((await a.request(`/api/articles/${doc.id}`)).headers.get('cache-control'), /no-store/);
  assert.equal((await httpClient(process.env.SERVER_URL)(`/api/articles/${doc.id}`)).status, 403);
  assert.equal((await b.request(`/api/articles/${doc.id}`)).status, 404);
  await patch(b, doc, { title: 'Tebak ID' }, 404);
  const list = await b.request('/api/articles');
  assert.equal((await list.json()).totalDocs, 0);
  const categoryResponse = await admin.request('/api/article-categories', { method: 'POST', data: { name: 'Kategori Uji', slug: 'kategori-uji' } });
  assert.equal(categoryResponse.status, 201);
  const category = (await categoryResponse.json()).doc;
  const assigned = await patch(admin, doc, { assignedTo: [b.user.id], category: category.id, sources: [{ title: 'Bursa Efek Indonesia', url: 'https://www.idx.co.id/' }] });
  assert.equal((await b.request(`/api/articles/${doc.id}`)).status, 200);
  const saved = await patch(b, assigned, { title: 'Disunting Media B', excerpt: 'Ringkasan privat.' });
  assert.equal(saved.title, 'Disunting Media B');
  assert.equal(saved.category, category.id);
  assert.equal(saved.publicAuthor, 'Tim Riset Contoh');
  await patch(a, assigned, { title: 'Versi lama' }, 409);
  await patch(b, saved, { category: null }, 403);
  const transferred = await patch(admin, saved, { owner: b.user.id, assignedTo: [] });
  assert.equal(transferred.createdBy, a.user.id);
  assert.equal(transferred.owner, b.user.id);
  assert.equal((await a.request(`/api/articles/${doc.id}`)).status, 404);
  await patch(b, transferred, { excerpt: 'Pemilik baru dapat menyimpan.' });
});

test('direct requests cannot spoof ownership, publish or modify internal revisions', async () => {
  for (const data of [{ owner: b.user.id }, { createdBy: b.user.id }, { assignedTo: [b.user.id] }, { state: 'published' }, { _status: 'published' }, { publicRevision: 99 }]) {
    const response = await a.request('/api/articles', { method: 'POST', data: { slug: 'spoofed', ...data } });
    assert.equal(response.status, 403);
  }
  assert.equal((await a.request('/api/article-categories', { method: 'POST', data: { name: 'Denied', slug: 'denied' } })).status, 403);
  const doc = await create(a, 'slug-unik');
  const duplicate = await b.request('/api/articles', { method: 'POST', data: { slug: 'slug-unik', title: 'Bentrok slug' } });
  assert.ok([400, 409].includes(duplicate.status), 'Duplicate slug rejected without database error');
  await patch(admin, doc, { state: 'published' }, 403);
  await patch(a, doc, { sources: [{ url: 'javascript:alert(1)' }] }, 400);
  await patch(a, doc, { body: { root: { type: 'root', children: [{ type: 'upload', value: 99 }] } } }, 400);
  for (const collection of ['article-revisions', 'editorial-audit']) {
    assert.equal((await a.request(`/api/${collection}`)).status, 403);
    assert.equal((await admin.request(`/api/${collection}`, { method: 'POST', data: { article: doc.id, state: 'published', context: { editorialWrite: true } } })).status, 403);
  }
  assert.equal((await admin.request(`/api/articles/${doc.id}`, { method: 'DELETE' })).status, 403);
});

test('draft/revision/audit rollback together and revision count stays one', async () => {
  const doc = await create(a, 'atomic-draft');
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  try {
    const state = (await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0];
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID, state);
    const count = (await pool.query('SELECT count(*)::int AS n FROM payload.editorial_audit WHERE article_id=$1', [doc.id])).rows[0].n;
    await pool.query('REVOKE INSERT ON payload.editorial_audit FROM gibei_runtime');
    try {
      await patch(a, doc, { title: 'Must roll back' }, 500);
      const failedCreate = await a.request('/api/articles', { method: 'POST', data: { slug: 'rollback-create', title: 'Not committed' } });
      assert.equal(failedCreate.status, 500);
    }
    finally { await pool.query('GRANT INSERT ON payload.editorial_audit TO gibei_runtime'); }
    const read = await a.request(`/api/articles/${doc.id}`);
    const unchanged = await read.json();
    assert.equal(unchanged.title, doc.title);
    assert.equal(unchanged.lockVersion, doc.lockVersion);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM payload.editorial_audit WHERE article_id=$1', [doc.id])).rows[0].n, count);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM payload.article_revisions WHERE article_id=$1', [doc.id])).rows[0].n, 1);
    assert.equal((await pool.query('SELECT public_revision_id FROM payload.articles WHERE id=$1', [doc.id])).rows[0].public_revision_id, null);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM payload.articles WHERE slug='rollback-create'")).rows[0].n, 0);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM payload.article_revisions r LEFT JOIN payload.articles a ON r.article_id=a.id WHERE a.id IS NULL')).rows[0].n, 0);
    assert.equal((await pool.query("SELECT has_table_privilege('gibei_runtime','payload.editorial_audit','UPDATE') OR has_table_privilege('gibei_runtime','payload.editorial_audit','DELETE') OR has_table_privilege('gibei_runtime','payload.editorial_audit','TRUNCATE') AS writable")).rows[0].writable, false);
  } finally { await pool.end(); }
});

test('concurrent saves from the same version yield one commit and one conflict', async () => {
  const doc = await create(a, 'concurrent-draft');
  const results = await Promise.all(['Save one', 'Save two'].map(title => a.request(`/api/articles/${doc.id}`, {
    method: 'PATCH', data: { title, expectedLockVersion: doc.lockVersion },
  })));
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  const current = await (await a.request(`/api/articles/${doc.id}`)).json();
  assert.equal(current.lockVersion, doc.lockVersion + 1);
  assert.ok(['Save one', 'Save two'].includes(current.title));
});
