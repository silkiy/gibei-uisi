import { test, expect } from './fixtures';
import { editorialFixture } from '../support/editorial.mjs';

test('browser requests refetch a previously viewed public article after withdrawal', async ({ page }) => {
  const s = await editorialFixture('browser-withdraw');
  const doc = await s.publish(await s.submit(s.a, await s.draft(s.a, 'browser-warm-withdraw')));
  await page.goto('/');
  const url = `/api/public/articles/${doc.slug}`;
  const read = () => page.evaluate(async path => { const response = await fetch(path); return { status: response.status, cache: response.headers.get('cache-control') }; }, url);
  expect((await read()).status).toBe(200); expect((await read()).status).toBe(200);
  const withdrawn = await s.command(s.admin, doc, 'withdraw-publication', { note: 'Browser withdrawal test' }); expect(withdrawn.status).toBe(200);
  const after = await read(); expect(after.status).toBe(404); expect(after.cache).toContain('no-store');
});
