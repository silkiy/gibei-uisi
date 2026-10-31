import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { editorialFixture } from '../support/editorial.mjs';
let s;
before(async () => {
  s = await editorialFixture('search');
  for (let i = 0; i < 3; i++) await s.publish(await s.submit(s.a, await s.draft(s.a, `search-public-${i}`, { title: `Cerah Search ${i}`, excerpt: 'Ringkasan Kombinasi' })));
  await s.draft(s.a, 'search-secret', { title: 'Cerah Search SECRET', excerpt: 'Ringkasan Kombinasi' });
});
test('search combines case-insensitive title/excerpt, category, pagination and defaults without draft counts', async () => {
  const read = async query => { const result = await s.anonymous.request(`/api/public/articles?${query}`); assert.equal(result.status, 200); return result.json(); };
  const combined = await read('q=cErAh%20sEaRcH&category=category-search&limit=2&page=2');
  assert.equal(combined.totalDocs, 3); assert.equal(combined.docs.length, 1); assert.equal(combined.totalPages, 2);
  assert.ok(!JSON.stringify(combined).includes('SECRET'));
  assert.equal((await read('q=ringkasan%20kombinasi&category=category-search&limit=48')).docs.length, 3);
  for (const query of ['page=0&limit=1000', 'page=1.5&limit=0', 'page=no&limit=49']) {
    const result = await read(query); assert.equal(result.page, 1); assert.equal(result.limit, 12);
  }
  const unknown = await read('category=unknown-category'); assert.equal(unknown.totalDocs, 0); assert.equal(unknown.docs.length, 0);
  const outside = await read('q=Cerah%20Search&page=999&limit=1'); assert.equal(outside.docs.length, 0); assert.equal(outside.totalDocs, 3); assert.equal(outside.outOfRange, true);
});
