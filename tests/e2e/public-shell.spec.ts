import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`public shell fits ${width}px and every navigation target exists`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', () => errors.push('pageerror'));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('link', { name: /GIBEI.*UISI.*Galeri Investasi.*Beranda/ })).toBeVisible();
    await expect(page.getByText('Pratinjau lokal', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width < 1024) await page.getByRole('button', { name: 'Buka menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
    for (const label of ['Tentang', 'Publikasi', 'Agenda', 'Kontak']) {
      const link = nav.getByRole('link', { name: label, exact: true });
      await expect(link).toBeVisible();
      const target = new URL((await link.getAttribute('href')) || '', page.url()).hash;
      expect(target).not.toBe('');
      await expect(page.locator(target)).toHaveCount(1);
    }
    if (width === 375) await page.screenshot({ path: 'test-results/public-menu-375.png', fullPage: true });
    if (width < 1024) await page.getByRole('button', { name: 'Tutup menu' }).click();
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/public-${width}.png`, fullPage: true });
  });
}

test('mobile disclosure supports keyboard, Escape and focus after navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Langsung ke konten' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const menu = page.locator('button[aria-controls="site-navigation"]');
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Tentang', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  expect(await menu.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Publikasi', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#publikasi')).toBeFocused();
  await expect(page).toHaveURL(/#publikasi$/);
});

test('reduced motion removes animation and 200% equivalent reflow remains readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 512, height: 900 });
  await page.goto('/');
  const motion = await page.locator('html').evaluate(element => getComputedStyle(element).scrollBehavior);
  expect(motion).toBe('auto');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('text remains readable at 200% size on a 1024px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: /GIBEI.*UISI.*Galeri Investasi.*Beranda/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/public-text-200.png', fullPage: true });
});

for (const width of [375, 1440]) {
  test(`public shell has no automated WCAG A/AA violations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    if (width === 375) await page.getByRole('button', { name: 'Buka menu' }).click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
  });
}
