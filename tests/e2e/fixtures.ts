import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

type Account = { email: string; password: string; name: string };
type Accounts = { admin: Account; mediaA: Account; mediaB: Account };
type Fixtures = { accounts: Accounts; adminPage: Page; mediaAPage: Page; mediaBPage: Page };

async function signIn(page: Page, account: Account) {
  try {
    await page.goto('/admin');
    await page.getByLabel(/Email/i).fill(account.email);
    await page.getByLabel(/^Password/i).fill(account.password);
    await page.getByRole('button', { name: /Log.?in/i }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByRole('heading', { name: 'Collections', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users', exact: true }).first()).toBeVisible();
  } catch { throw new Error('Fixture browser login failed; credential details withheld'); }
}

export const test = base.extend<Fixtures>({
  accounts: async ({}, provide) => {
    const accounts = JSON.parse(process.env.GIBEI_TEST_ACCOUNTS || 'null') as Accounts | null;
    if (!accounts?.admin || !accounts.mediaA || !accounts.mediaB) throw new Error('Use the isolated test launcher');
    await provide(accounts);
  },
  adminPage: async ({ browser, accounts, baseURL }, provide) => {
    const context = await browser.newContext({ baseURL });
    try { const page = await context.newPage(); await signIn(page, accounts.admin); await provide(page); }
    finally { await context.close(); }
  },
  mediaAPage: async ({ browser, accounts, baseURL }, provide) => {
    const context = await browser.newContext({ baseURL });
    try { const page = await context.newPage(); await signIn(page, accounts.mediaA); await provide(page); }
    finally { await context.close(); }
  },
  mediaBPage: async ({ browser, accounts, baseURL }, provide) => {
    const context = await browser.newContext({ baseURL });
    try { const page = await context.newPage(); await signIn(page, accounts.mediaB); await provide(page); }
    finally { await context.close(); }
  },
});
export { expect };
