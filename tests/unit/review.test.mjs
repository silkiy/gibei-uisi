import assert from 'node:assert/strict';
import test from 'node:test';
import { validateComplete, snapshotDigest, revisionNote } from '../../src/editorial/review-policy.ts';

const revision = { title: 'Artikel', excerpt: 'Ringkasan', category: 1, publicAuthor: 'Tim', body: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Isi artikel' }] }] } }, assets: [] };
test('submission requires complete text/category and freezes content and asset metadata', () => {
  assert.doesNotThrow(() => validateComplete(revision));
  for (const data of [{ ...revision, title: '' }, { ...revision, category: null }, { ...revision, body: { root: { type: 'root', children: [] } } }]) assert.throws(() => validateComplete(data));
  assert.notEqual(snapshotDigest(revision), snapshotDigest({ ...revision, title: 'Changed' }));
  assert.notEqual(snapshotDigest(revision), snapshotDigest({ ...revision, assets: [{ asset: 1, fileVersion: 'v2', alt: 'New alt' }] }));
});
test('revision requests require a bounded, nonempty private note', () => {
  assert.equal(revisionNote('  Perbaiki sumber.  '), 'Perbaiki sumber.');
  for (const note of ['', '  ', null, 'a'.repeat(2001)]) assert.throws(() => revisionNote(note));
});
