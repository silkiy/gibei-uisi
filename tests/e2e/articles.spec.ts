import { test, expect } from './fixtures';

test('Media saves and reloads a private rich-text draft in CMS', async ({ mediaAPage, mediaBPage }) => {
  const page = mediaAPage;
  const errors: string[] = [];
  page.on('pageerror', () => errors.push('pageerror'));
  await page.goto('/admin/collections/articles/create');
  await page.getByLabel(/^Slug/).fill('browser-private-draft');
  await page.getByLabel(/^Title/).fill('Artikel privat dari browser');
  await page.getByLabel(/^Excerpt/).fill('Ringkasan untuk diuji.');
  await page.locator('[contenteditable="true"]').fill('Isi rich text tersimpan secara privat.');
  await page.getByLabel(/^Public Author/).fill('Tim Edukasi');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/collections\/articles\/\d+$/);
  const id = page.url().split('/').at(-1);
  const requestOptions = { headers: { Origin: new URL(page.url()).origin } };
  await page.reload();
  await expect(page.getByLabel(/^Title/)).toHaveValue('Artikel privat dari browser');
  await expect(page.locator('[contenteditable="true"]')).toContainText('Isi rich text tersimpan secara privat.');
  await expect(page.getByLabel(/^Public Author/)).toHaveValue('Tim Edukasi');
  await page.getByLabel(/^Title/).fill('Artikel diperbarui melalui CMS');
  const [save] = await Promise.all([
    page.waitForResponse(response => response.url().includes(`/api/articles/${id}`) && response.request().method() === 'PATCH'),
    page.getByRole('button', { name: 'Save', exact: true }).click(),
  ]);
  expect(save.status()).toBe(200);
  // Non-browser APIRequestContext needs Origin for Payload's cookie/CSRF authentication.
  await expect.poll(async () => (await (await page.request.get(`/api/articles/${id}`, requestOptions)).json()).title).toBe('Artikel diperbarui melalui CMS');
  await page.reload();
  await expect(page.getByLabel(/^Title/)).toHaveValue('Artikel diperbarui melalui CMS');
  const denied = await mediaBPage.request.get(`/api/articles/${id}`, requestOptions);
  expect(denied.status()).toBe(404);
  const own = await page.request.get(`/api/articles/${id}`, requestOptions);
  const doc = await own.json();
  expect(doc.publicRevision).toBeNull();
  expect(doc.state).toBe('draft');
  expect(errors).toEqual([]);
});

test('Admin can create a draft through the CMS form', async ({ adminPage }) => {
  await adminPage.goto('/admin/collections/articles/create');
  await adminPage.getByLabel(/^Slug/).fill('browser-admin-draft');
  await adminPage.getByLabel(/^Title/).fill('Draft Admin');
  await adminPage.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(adminPage).toHaveURL(/\/admin\/collections\/articles\/\d+$/);
  await adminPage.reload();
  await expect(adminPage.getByLabel(/^Title/)).toHaveValue('Draft Admin');
});
