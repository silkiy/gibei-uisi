import assert from 'node:assert/strict';
import test from 'node:test';
import { tsImport } from 'tsx/esm/api';

const { validatePageDraft } = await tsImport('../../src/editorial/page-policy.ts', import.meta.url);
const draft = (section, overrides = {}) => ({
  title: 'Tentang GIBEI', seoTitle: 'Tentang GIBEI UISI', seoDescription: 'Profil galeri investasi.',
  sections: [section], ...overrides,
});
const profile = { blockType: 'profile', heading: 'Profil', description: 'Paragraf pertama\nParagraf kedua' };

test('Pages accepts LF and CRLF paragraphs in every textarea while retaining publication validation', () => {
  for (const newline of ['\n', '\r\n']) {
    const paragraphs = `Paragraf pertama${newline}Paragraf kedua`;
    const sections = [
      { ...profile, description: paragraphs, history: paragraphs, vision: paragraphs, mission: paragraphs },
      { blockType: 'hero', heading: 'Beranda', summary: paragraphs },
      { blockType: 'program', heading: 'Program', description: paragraphs },
      { blockType: 'cta', heading: 'Baca', label: 'Tentang', description: paragraphs, url: '/tentang' },
    ];
    assert.doesNotThrow(() => validatePageDraft(draft(profile, { sections }), true));
    assert.doesNotThrow(() => validatePageDraft(draft(profile, { seoDescription: paragraphs }), true));
  }
});

test('Pages still rejects control characters, HTML and line breaks in single-line fields or CTA URLs', () => {
  for (const value of ['Teks\u0000lain', 'Teks\u0009lain', 'Teks\u001blain', '<script>alert(1)</script>']) {
    assert.throws(() => validatePageDraft(draft({ ...profile, description: value })));
  }
  for (const overrides of [{ title: 'Judul\nbaru' }, { seoTitle: 'SEO\r\nbaru' }]) {
    assert.throws(() => validatePageDraft(draft(profile, overrides)));
  }
  assert.throws(() => validatePageDraft(draft({ ...profile, heading: 'Profil\nbaru' })));
  for (const url of ['/tentang\n', 'https://example.com/\npath', 'javascript:alert(1)']) {
    assert.throws(() => validatePageDraft(draft({ blockType: 'cta', heading: 'Baca', label: 'Baca', url })));
  }
});
