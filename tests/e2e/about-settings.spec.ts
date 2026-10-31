import { test, expect } from './fixtures';

test('About exposes only approved Pages and shared confirmed settings work with a mobile keyboard menu', async ({ adminPage, mediaAPage, page, accounts, baseURL }) => {
  test.setTimeout(120000);
  adminPage.setDefaultTimeout(10000);
  const headers = { Origin: baseURL! };
  const users = await adminPage.request.get(`/api/users?where[email][equals]=${encodeURIComponent(accounts.mediaA.email)}`, { headers });
  const mediaId = (await users.json()).docs[0].id;
  await page.goto('/tentang');
  await expect(page.getByText('Profil, sejarah, visi, dan misi sedang disiapkan untuk publikasi.')).toBeVisible();
  const response = await adminPage.request.post('/api/pages', { headers, data: {
    pageKey: 'about', owner: mediaId, title: 'Tentang contoh disetujui', seoTitle: 'Tentang contoh', seoDescription: 'Data contoh uji.',
    sections: [{ blockType: 'profile', heading: 'Profil contoh', description: 'Paragraf satu.\nParagraf dua.', history: 'Sejarah contoh', vision: 'Visi contoh', mission: 'Misi contoh' }],
  } });
  expect(response.status()).toBe(201);
  let doc = (await response.json()).doc;
  const command = async (actor: typeof adminPage, action: string, extra = {}) => {
    const result = await actor.request.post(`/api/editorial/pages/${doc.id}/${action}`, { headers, data: {
      expectedLockVersion: doc.lockVersion, expectedRevisionId: doc.workingRevision || doc.publicRevision, ...extra,
    } });
    expect(result.status()).toBe(200); const body = await result.json(); doc = body.doc; return body;
  };
  await page.reload(); await expect(page.getByText('Profil contoh', { exact: true })).toHaveCount(0);
  const submission = await command(mediaAPage, 'submit');
  await command(adminPage, 'publish', { submissionId: submission.submission.id });
  await page.reload(); await expect(page.getByRole('heading', { name: 'Tentang contoh disetujui' })).toBeVisible();
  for (const name of ['Sejarah', 'Visi', 'Misi']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await command(mediaAPage, 'create-revision');
  const saved = await mediaAPage.request.patch(`/api/pages/${doc.id}`, { headers, data: { expectedLockVersion: doc.lockVersion, title: 'REVISI RAHASIA ABOUT' } });
  expect(saved.status()).toBe(200);
  await page.reload(); await expect(page.getByText('REVISI RAHASIA ABOUT', { exact: true })).toHaveCount(0);
  expect((await mediaAPage.request.post('/api/globals/site-settings', { headers, data: { expectedVersion: 0, email: 'spoof@example.com', emailConfirmed: true } })).status()).toBe(403);
  await mediaAPage.goto('/admin');
  await expect(mediaAPage.getByRole('link', { name: 'Site Settings', exact: true })).toHaveCount(0);
  await adminPage.goto('/admin/globals/site-settings');
  await adminPage.getByLabel(/^Site Name/).fill('GIBEI UISI');
  await adminPage.getByLabel(/^Email$/).fill('example@gibei.invalid');
  let saving = adminPage.waitForResponse(result => new URL(result.url()).pathname === '/api/globals/site-settings' && result.request().method() === 'POST');
  await adminPage.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await saving).status()).toBe(200);
  await page.reload(); await expect(page.getByRole('link', { name: 'example@gibei.invalid', exact: true })).toHaveCount(0);
  await adminPage.getByLabel('Email Confirmed', { exact: true }).check();
  saving = adminPage.waitForResponse(result => new URL(result.url()).pathname === '/api/globals/site-settings' && result.request().method() === 'POST');
  await adminPage.getByRole('button', { name: 'Save', exact: true }).click(); expect((await saving).status()).toBe(200);
  await page.reload(); await expect(page.getByRole('link', { name: 'example@gibei.invalid', exact: true })).toHaveAttribute('href', 'mailto:example@gibei.invalid');
  let settings = await (await adminPage.request.get('/api/globals/site-settings', { headers })).json();
  const configured = await adminPage.request.post('/api/globals/site-settings', { headers, data: { expectedVersion: settings.expectedVersion, navigation: [{ label: 'Profil kampus', url: '/tentang' }], footerText: 'Footer contoh CMS' } });
  expect(configured.status()).toBe(200);
  await page.setViewportSize({ width: 375, height: 812 }); await page.reload();
  const toggle = page.getByRole('button', { name: 'Buka menu' }); await toggle.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Profil kampus' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navigasi footer' }).getByRole('link', { name: 'Profil kampus' })).toHaveAttribute('href', '/tentang');
  await page.keyboard.press('Escape'); await expect(toggle).toBeFocused(); await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByText('Footer contoh CMS', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/T028-mobile.png', fullPage: true });
  settings = await (await adminPage.request.get('/api/globals/site-settings', { headers })).json();
  const reset = await adminPage.request.post('/api/globals/site-settings', { headers, data: { expectedVersion: settings.expectedVersion, navigation: [], footerText: null, email: null, emailConfirmed: false } });
  expect(reset.status()).toBe(200);
});
