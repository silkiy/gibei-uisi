import test from 'node:test';
import assert from 'node:assert/strict';
import { validateP1 } from '../../src/content/p1-policy.mjs';

test('gallery validates ordered informative photos, dates and link-only video', () => {
  const album = { title: 'Contoh album', description: 'Dokumentasi contoh', date: '2026-12-31', example: true, photos: [{ asset: 1, alt: 'Diskusi contoh', caption: 'Keterangan' }] };
  assert.doesNotThrow(() => validateP1('galleries', album, true));
  for (const change of [{ date: '2026-02-30' }, { videoURL: 'javascript:alert(1)' }, { photos: [{ asset: 1, alt: '' }] }]) assert.throws(() => validateP1('galleries', { ...album, ...change }, true));
});
test('partner and achievement require safe text and calendar dates', () => {
  const partner = { title: 'Contoh mitra', description: 'Bukan kerja sama resmi', collaboration: 'Edukasi', example: true, showOnHomepage: true };
  assert.doesNotThrow(() => validateP1('partners', partner, true));
  assert.throws(() => validateP1('partners', { ...partner, website: 'https://u:p@example.com' }, true));
  assert.doesNotThrow(() => validateP1('achievements', { title: 'Contoh', description: 'Demo', category: 'Edukasi', date: '2025-12-31', example: true }, true));
});
