import { test, expect } from './fixtures';

test('published members remain accessible by period and Admin selects one active period through CMS', async ({ adminPage, mediaAPage, page, accounts, baseURL }) => {
  test.setTimeout(120000); adminPage.setDefaultTimeout(10000);
  const headers = { Origin: baseURL! };
  const users = await adminPage.request.get(`/api/users?where[email][equals]=${encodeURIComponent(accounts.mediaA.email)}`, { headers });
  const owner = (await users.json()).docs[0].id;
  const command = async (kind: string, doc: { id: number; lockVersion: number; workingRevision: number }, action: string, extra = {}, actor = adminPage) => {
    const response = await actor.request.post(`/api/editorial/organization/${kind}/${doc.id}/${action}`, { headers, data: { expectedLockVersion: doc.lockVersion, expectedRevisionId: doc.workingRevision, ...extra } });
    expect(response.status()).toBe(200); return response.json();
  };
  const periods: { id: number }[] = [];
  for (const year of [2020, 2021]) {
    const created = await adminPage.request.post('/api/organizational-periods', { headers, data: { label: `Contoh UI ${year}`, owner, startDate: `${year}-01-01`, endDate: `${year}-12-31` } });
    expect(created.status()).toBe(201); const doc = (await created.json()).doc;
    const pending = await command('periods', doc, 'submit', {}, mediaAPage);
    const published = await command('periods', pending.doc, 'publish', { submissionId: pending.submission.id }); periods.push(published.doc);
    const member = await adminPage.request.post('/api/members', { headers, data: { slug: `contoh-ketua-ui-${year}`, owner, name: `Contoh Ketua ${year}`, position: 'Ketua organisasi', period: doc.id, division: null, example: true } });
    expect(member.status()).toBe(201); const draft = (await member.json()).doc;
    if (year === 2021) {
      await mediaAPage.goto(`/admin/collections/members/${draft.id}`);
      await expect(mediaAPage.getByLabel(/^Name/)).toHaveValue(`Contoh Ketua ${year}`);
      await mediaAPage.getByRole('button', { name: 'Ajukan review', exact: true }).click();
      await expect(mediaAPage.getByText('Status editorial: in_review', { exact: true })).toBeVisible();
      await adminPage.goto(`/admin/collections/members/${draft.id}`); await adminPage.getByRole('button', { name: 'Terbitkan', exact: true }).click();
      await expect(adminPage.getByText('Status editorial: published', { exact: true })).toBeVisible();
    } else { const pendingMember = await command('members', draft, 'submit', {}, mediaAPage); await command('members', pendingMember.doc, 'publish', { submissionId: pendingMember.submission.id }); }
  }
  await adminPage.goto('/admin/globals/organization-state');
  await adminPage.locator('#field-activePeriod').getByRole('combobox').fill('Contoh UI 2021');
  await adminPage.getByRole('option', { name: 'Contoh UI 2021', exact: true }).click();
  const saving = adminPage.waitForResponse(response => new URL(response.url()).pathname === '/api/globals/organization-state' && response.request().method() === 'POST');
  await adminPage.getByRole('button', { name: 'Save', exact: true }).click(); expect((await saving).status()).toBe(200);
  await page.goto('/tentang/struktur'); await expect(page.getByRole('heading', { name: 'Contoh Ketua 2021', exact: true })).toBeVisible();
  await page.getByLabel('Periode kepengurusan').selectOption(String(periods[0].id)); await page.getByRole('button', { name: 'Tampilkan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Contoh Ketua 2020', exact: true })).toBeVisible();
  await expect(page.getByText('Ketua organisasi', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/T031-mobile.png', fullPage: true });
});
