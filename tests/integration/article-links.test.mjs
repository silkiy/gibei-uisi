import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { editorialFixture } from '../support/editorial.mjs';
let s;
before(async () => { s = await editorialFixture('article-links'); });
const body = fields => ({ root: { type: 'root', version: 1, children: [{ type: 'paragraph', version: 1, children: [{ type: 'link', version: 1, fields, children: [{ type: 'text', version: 1, text: 'Safe label' }] }] }] } });
test('HTTPS and media links survive publication only through the matching asset manifest', async () => {
  const image = await s.upload(s.a);
  const rich = body({ linkType: 'internal', doc: { relationTo: 'media', value: image.id }, newTab: false });
  const published = await s.publish(await s.submit(s.a, await s.draft(s.a, 'article-links-published', { body: rich, assets: [{ asset: image.id, alt: 'Snapshot image' }] })));
  const response = await s.anonymous.request(`/api/public/articles/${published.slug}`); assert.equal(response.status, 200);
  const doc = await response.json(); assert.equal(doc.assets[0].width, 24); assert.equal(doc.assets[0].height, 18);
  assert.equal(doc.body.root.children[0].children[0].fields.assetId, image.id);
  assert.ok(!JSON.stringify(doc.body).includes('relationTo')); assert.ok(!JSON.stringify(doc.body).includes('owner'));
  assert.equal((await s.a.request('/api/articles', { method: 'POST', data: { slug: 'article-links-unbound', title: 'Invalid', body: rich, assets: [] } })).status, 400);
});
test('unsafe rich text, HTTP sources and private media links cannot enter a saved draft', async () => {
  for (const [index, url] of ['javascript:alert(1)', 'data:text/html,x', 'http://example.com/', 'https://u:p@example.com/'].entries()) {
    const response = await s.a.request('/api/articles', { method: 'POST', data: { slug: `article-links-unsafe-${index}`, title: 'Unsafe', body: body({ linkType: 'custom', url, newTab: true }) } }); assert.equal(response.status, 400);
  }
  assert.equal((await s.a.request('/api/articles', { method: 'POST', data: { slug: 'article-links-http-source', sources: [{ url: 'http://example.com/' }] } })).status, 400);
  const privateImage = await s.upload(s.b);
  assert.equal((await s.a.request('/api/articles', { method: 'POST', data: { slug: 'article-links-private', body: body({ linkType: 'internal', doc: { relationTo: 'media', value: privateImage.id } }), assets: [{ asset: privateImage.id, alt: 'Guess' }] } })).status, 404);
});
