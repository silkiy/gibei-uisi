import assert from 'node:assert/strict';
import test from 'node:test';
import { copyDraftPayload } from '../../src/editorial/revision-copy.ts';
test('revision cloning never reuses child row IDs or mutates the source snapshot', () => {
  const source = { body: { root: { children: [] } }, sources: [{ id: 'published-source', url: 'https://example.org' }], assets: [{ id: 'published-asset', asset: 4 }], related: [{ id: 'published-link', target: 3 }] };
  const copy = copyDraftPayload(source);
  for (const field of ['sources', 'assets', 'related']) { assert.equal(copy[field][0].id, undefined); assert.ok(source[field][0].id); }
  copy.body.root.children.push('new'); assert.deepEqual(source.body.root.children, []);
});
