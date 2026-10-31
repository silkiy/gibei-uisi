import assert from 'node:assert/strict';
import test from 'node:test';
import { safeNavigationURL, validEmail } from '../../src/validation/navigation.mjs';

test('settings links accept supported routes and HTTPS; email remains a separate confirmed contact type', () => {
  for (const url of ['/', '/tentang', '/tentang/divisi', '/#kontak', 'https://www.idx.co.id/']) assert.ok(safeNavigationURL(url));
  for (const url of ['/unknown', '//evil.test', 'javascript:alert(1)', 'data:text/html,x', 'mailto:a@example.com', 'http://example.com', 'https://u:p@example.com']) assert.equal(safeNavigationURL(url), null);
  assert.ok(validEmail('team@example.com'));
  for (const value of ['bad', 'a@', 'a@example.com\nBcc:evil@test.com']) assert.equal(validEmail(value), false);
});
