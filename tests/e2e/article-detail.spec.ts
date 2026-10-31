import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { editorialFixture } from '../support/editorial.mjs';

test('approved article renders safe links and version-bound images; revoke and withdraw close warm HTML and bytes', async ({ page }) => {
  const s = await editorialFixture('detail-browser'), image = await s.upload(s.a);
  const text = (text: string) => ({ type: 'text', version: 1, text });
  const body = { root: { type: 'root', version: 1, children: [
    { type: 'heading', tag: 'h2', version: 1, children: [text('Memahami informasi pasar')] },
    { type: 'paragraph', version: 1, children: [text('Mulai dari sumber yang dapat diperiksa. '), { type: 'link', version: 1, fields: { linkType: 'custom', url: 'https://www.idx.co.id/', newTab: true }, children: [text('Bursa Efek Indonesia')] }] },
    { type: 'paragraph', version: 1, children: [{ type: 'link', version: 1, fields: { linkType: 'internal', doc: { relationTo: 'media', value: image.id }, newTab: false }, children: [text('Ilustrasi edukasi')] }] },
  ] } };
  const published = await s.publish(await s.submit(s.a, await s.draft(s.a, 'detail-browser-safe', { title: 'Membaca pasar dengan kritis', body, publicAuthor: 'Tim Edukasi Demo', assets: [{ asset: image.id, alt: 'Ilustrasi pembelajaran pasar', caption: 'Gambar contoh untuk pengujian.' }], sources: [{ title: 'Sumber BEI', url: 'https://www.idx.co.id/' }] })));
  const route = `/publikasi/artikel/${published.slug}`;
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(route);
  await expect(page.getByRole('heading', { name: published.title, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Memahami informasi pasar', exact: true })).toBeVisible();
  const link = page.getByRole('link', { name: 'Bursa Efek Indonesia', exact: true });
  await expect(link).toHaveAttribute('href', 'https://www.idx.co.id/'); await expect(link).toHaveAttribute('rel', /noopener/); await expect(link).toHaveAttribute('target', '_blank');
  await link.focus(); await expect(link).toBeFocused();
  await expect(page.getByRole('img', { name: 'Ilustrasi pembelajaran pasar', exact: true })).toHaveAttribute('src', new RegExp(image.key));
  await expect(page.getByText('Tim Edukasi Demo', { exact: true })).toBeVisible();
  await expect(page.locator('main time')).toHaveAttribute('datetime', /\d{4}-\d{2}-\d{2}T/);
  await expect(page.getByText(/Konten pratinjau/)).toBeVisible(); await expect(page.getByText(/bukan rekomendasi membeli atau menjual efek/).first()).toBeVisible();
  await expect(page.locator('main')).not.toContainText(s.a.user.email);
  await expect(page.locator('main iframe, main script')).toHaveCount(0);
  await page.screenshot({ path: 'artifacts/T024-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 850 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'artifacts/T024-mobile.png', fullPage: true });
  const privateDoc = await s.draft(s.a, 'detail-browser-private', { title: 'RAHASIA DETAIL DRAFT' });
  const hidden = await s.anonymous.request(`/publikasi/artikel/${privateDoc.slug}`); expect(hidden.status).toBe(404); expect(await hidden.text()).not.toContain('RAHASIA DETAIL DRAFT');
  for (let i = 0; i < 2; i++) { const warm = await s.anonymous.request(route); expect(warm.status).toBe(200); expect(warm.headers.get('cache-control')).toContain('no-store'); }
  const revoke = await s.admin.request(`/api/media/${image.key}/manage`, { method: 'POST', data: { action: 'revoke', note: 'Tinjau ulang ilustrasi' } }); expect(revoke.status).toBe(200);
  await page.reload(); await expect(page.getByText(/Media tidak tersedia/)).toBeVisible();
  await expect(page.getByRole('img', { name: 'Ilustrasi pembelajaran pasar', exact: true })).toHaveCount(0);
  expect((await s.command(s.admin, published, 'withdraw-publication', { note: 'Penarikan halaman hangat' })).status).toBe(200);
  const removed = await page.reload(); expect(removed!.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Artikel tidak tersedia.', exact: true })).toBeVisible();
  for (const variant of ['original', 'thumbnail']) expect((await s.anonymous.request(`/api/media/${image.key}/${variant}`)).status).toBe(404);
});
