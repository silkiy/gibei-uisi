import { test, expect } from './fixtures';
import { divisionNames } from '../../src/validation/organization.mjs';

test('Admin creates a calendar period in CMS; Media reviews one of eight example divisions and public pages preserve approved content', async ({ adminPage, mediaAPage, mediaBPage, page, accounts, baseURL }) => {
  test.setTimeout(120000); adminPage.setDefaultTimeout(10000); mediaAPage.setDefaultTimeout(10000);
  const headers = { Origin: baseURL! };
  const users = await adminPage.request.get(`/api/users?where[email][equals]=${encodeURIComponent(accounts.mediaA.email)}`, { headers });
  const mediaId = (await users.json()).docs[0].id;
  await adminPage.goto('/admin/collections/organizational-periods/create');
  await adminPage.getByLabel(/^Label/).fill('Contoh periode browser 2026');
  await adminPage.getByLabel(/^Start Date/).fill('2026-01-01'); await adminPage.getByLabel(/^End Date/).fill('2026-12-31');
  const saved = adminPage.waitForResponse(response => new URL(response.url()).pathname === '/api/organizational-periods' && response.request().method() === 'POST');
  await adminPage.getByRole('button', { name: 'Save', exact: true }).click(); expect((await saved).status()).toBe(201);
  await expect(adminPage.getByRole('button', { name: 'Ajukan review', exact: true })).toBeVisible();
  await adminPage.getByRole('button', { name: 'Ajukan review', exact: true }).click();
  await expect(adminPage.getByText('Status editorial: in_review', { exact: true })).toBeVisible();
  await adminPage.getByRole('button', { name: 'Terbitkan', exact: true }).click();
  await expect(adminPage.getByText('Status editorial: published', { exact: true })).toBeVisible();
  let secretary: { id: number; lockVersion: number; workingRevision: number; publicRevision: number } | undefined;
  for (const [index, [slug, name]] of Object.entries(divisionNames).entries()) {
    const created = await adminPage.request.post('/api/divisions', { headers, data: { slug, owner: mediaId, description: `Contoh profil ${name}.`, workPrograms: `Contoh program ${name}.`, displayOrder: index, example: true } });
    expect(created.status()).toBe(201); const doc = (await created.json()).doc;
    if (slug === 'secretary') { secretary = doc; continue; }
    const pending = await mediaAPage.request.post(`/api/editorial/organization/divisions/${doc.id}/submit`, { headers, data: { expectedLockVersion: doc.lockVersion, expectedRevisionId: doc.workingRevision } });
    expect(pending.status()).toBe(200); const review = await pending.json();
    const publication = await adminPage.request.post(`/api/editorial/organization/divisions/${doc.id}/publish`, { headers, data: { expectedLockVersion: review.doc.lockVersion, expectedRevisionId: review.doc.workingRevision, submissionId: review.submission.id } });
    expect(publication.status()).toBe(200);
  }
  expect(secretary).toBeTruthy();
  expect((await page.request.get('/tentang/divisi/secretary')).status()).toBe(404);
  expect((await mediaBPage.request.get(`/api/divisions/${secretary!.id}`, { headers })).status()).toBe(404);
  const editor = `/admin/collections/divisions/${secretary!.id}`;
  await mediaAPage.goto(editor);
  await mediaAPage.getByLabel(/^Description/).fill('Contoh profil Secretary yang ditinjau.\nBaris kedua profil.');
  const saving = mediaAPage.waitForResponse(response => new URL(response.url()).pathname === `/api/divisions/${secretary!.id}` && response.request().method() === 'PATCH');
  await mediaAPage.getByRole('button', { name: 'Save', exact: true }).click(); expect((await saving).status()).toBe(200);
  await mediaAPage.getByRole('button', { name: 'Ajukan review', exact: true }).click();
  await expect(mediaAPage.getByText('Status editorial: in_review', { exact: true })).toBeVisible();
  await expect(mediaAPage.getByRole('button', { name: 'Terbitkan', exact: true })).toHaveCount(0);
  await adminPage.goto(editor); await adminPage.getByRole('button', { name: 'Terbitkan', exact: true }).click();
  await expect(adminPage.getByText('Status editorial: published', { exact: true })).toBeVisible();
  await page.goto('/tentang/divisi');
  for (const name of Object.values(divisionNames)) await expect(page.getByRole('link', { name: `${name} →`, exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Secretary →', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Secretary', exact: true })).toBeVisible();
  await expect(page.getByText('Data contoh · belum dikonfirmasi resmi', { exact: true })).toBeVisible();
  await expect(page.getByText('Contoh profil Secretary yang ditinjau. Baris kedua profil.', { exact: true })).toBeVisible();
  await mediaAPage.reload(); await mediaAPage.getByRole('button', { name: 'Buat revisi baru', exact: true }).click();
  await expect(mediaAPage.getByText('Status editorial: draft', { exact: true })).toBeVisible();
  await mediaAPage.getByLabel(/^Description/).fill('RAHASIA DRAFT DIVISI');
  const draftSave = mediaAPage.waitForResponse(response => new URL(response.url()).pathname === `/api/divisions/${secretary!.id}` && response.request().method() === 'PATCH');
  await mediaAPage.getByRole('button', { name: 'Save', exact: true }).click(); expect((await draftSave).status()).toBe(200);
  await page.reload(); await expect(page.getByText('RAHASIA DRAFT DIVISI', { exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/T030-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.screenshot({ path: 'artifacts/T030-desktop.png', fullPage: true });
});
