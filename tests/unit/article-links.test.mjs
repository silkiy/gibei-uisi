import assert from 'node:assert/strict';
import test from 'node:test';
import { publicBody } from '../../src/content/serialization.ts';
import { validateDraft } from '../../src/editorial/policy.ts';
const text = { type: 'text', text: 'Tautan edukasi', version: 1 };
const body = fields => ({ root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'link', fields, children: [text] }] }] } });
test('rich text preserves only HTTPS links and media bound to the revision asset manifest', () => {
  const external = body({ linkType: 'custom', url: 'https://www.idx.co.id/', newTab: true, owner: 999 });
  assert.doesNotThrow(() => validateDraft({ body: external }));
  const published = publicBody(external);
  assert.ok(JSON.stringify(published).includes('https://www.idx.co.id/')); assert.ok(!JSON.stringify(published).includes('owner'));
  const media = body({ linkType: 'internal', doc: { relationTo: 'media', value: 7 }, newTab: true });
  assert.doesNotThrow(() => validateDraft({ body: media, assets: [{ asset: 7 }] }));
  assert.throws(() => validateDraft({ body: media, assets: [] }));
  assert.ok(JSON.stringify(publicBody(media, [7])).includes('assetId'));
  assert.deepEqual(publicBody(publicBody(media, [7]), [7]), publicBody(media, [7]));
  assert.ok(!JSON.stringify(publicBody(media, [])).includes('assetId'));
});
test('active, credentialed, insecure and unexpected internal links are rejected or stripped', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'http://example.com/', 'https://user:pass@example.com/', '//example.com/', 'https://example.com/\nattack']) {
    const malicious = body({ linkType: 'custom', url, newTab: true });
    assert.throws(() => validateDraft({ body: malicious }));
    assert.ok(!JSON.stringify(publicBody(malicious)).includes(url));
    assert.throws(() => validateDraft({ sources: [{ url }] }));
  }
  assert.throws(() => validateDraft({ body: body({ linkType: 'internal', doc: { relationTo: 'users', value: 1 } }) }));
});
