import { test, expect } from './fixtures';

test('anonymous visitor sees public page and is redirected from CMS to login', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('GIBEI UISI');
  await page.goto('/admin');
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('Admin can access account management and logout', async ({ adminPage }) => {
  const errors: string[] = [];
  adminPage.on('pageerror', () => errors.push('pageerror'));
  await adminPage.goto('/admin/collections/users');
  await expect(adminPage.getByRole('link', { name: 'Create new User', exact: true })).toBeVisible();
  await adminPage.screenshot({ path: 'test-results/admin-users.png', fullPage: true });
  await adminPage.goto('/admin/logout');
  // Logout is a client effect: wait for its observable completion before navigating again.
  await expect(adminPage.getByLabel(/Email/i)).toBeVisible();
  await adminPage.goto('/admin');
  await expect(adminPage.getByLabel(/Email/i)).toBeVisible();
  expect(errors).toEqual([]);
});

test('two Media browser contexts stay isolated and cannot provision accounts', async ({ mediaAPage, mediaBPage, accounts }) => {
  for (const [page, account, other] of [[mediaAPage, accounts.mediaA, accounts.mediaB], [mediaBPage, accounts.mediaB, accounts.mediaA]] as const) {
    await page.goto('/admin/collections/users');
    await expect(page.getByRole('link', { name: 'Create new User', exact: true })).toHaveCount(0);
    await expect(page.getByRole('cell', { name: account.name, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: other.name, exact: true })).toHaveCount(0);
  }
});
