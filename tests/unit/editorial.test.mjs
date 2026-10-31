import assert from 'node:assert/strict';
import test from 'node:test';
import { canEditDraft, normalizeSlug, validateDraft } from '../../src/editorial/policy.ts';

test('draft access requires active Admin, owner or assignee', () => {
  const draft = { owner: 2, assignedTo: [3] };
  assert.equal(canEditDraft({ id: 1, role: 'admin', status: 'active' }, draft), true);
  for (const id of [2, 3]) assert.equal(canEditDraft({ id, role: 'media', status: 'active' }, draft), true);
  assert.equal(canEditDraft({ id: 4, role: 'media', status: 'active' }, draft), false);
  assert.equal(canEditDraft({ id: 2, role: 'media', status: 'inactive' }, draft), false);
});
test('slugs normalize consistently and cannot become paths', () => {
  assert.equal(normalizeSlug('  Belajar PASAR Modal  '), 'belajar-pasar-modal');
  assert.throws(() => normalizeSlug('../../draft'));
});
test('draft validation rejects executable sources and unapproved rich-text asset nodes', () => {
  assert.throws(() => validateDraft({ sources: [{ url: 'javascript:alert(1)' }] }));
  assert.throws(() => validateDraft({ body: { root: { type: 'root', children: [{ type: 'upload', value: 99 }] } } }));
  assert.doesNotThrow(() => validateDraft({ title: 'Draft belum lengkap', sources: [{ url: 'https://www.idx.co.id/' }] }));
});
