import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

test('Admin and Media complete the homepage editorial workflow without exposing drafts to visitors', async ({ adminPage, mediaAPage, mediaBPage, page, accounts, baseURL }) => {
  test.setTimeout(120000);
  adminPage.setDefaultTimeout(10000);
  mediaAPage.setDefaultTimeout(10000);
  const headers = { Origin: baseURL! };
  const users = await adminPage.request.get(`/api/users?where[email][equals]=${encodeURIComponent(accounts.mediaA.email)}&depth=0`, { headers });
  expect(users.status()).toBe(200);
  const assignees = (await users.json()).docs;
  expect(assignees).toHaveLength(1);
  const mediaAId = assignees[0].id;
  const created = await adminPage.request.post('/api/pages', { headers, data: {
    pageKey: 'homepage', owner: mediaAId, assignedTo: [mediaAId],
    title: 'Beranda awal', seoTitle: 'Beranda GIBEI', seoDescription: 'Galeri investasi kampus.',
    sections: [{ blockType: 'hero', heading: 'Selamat datang', summary: 'Belajar pasar modal bersama.' }],
  } });
  expect(created.status()).toBe(201);
  const { doc } = await created.json();
  const id = doc.id;
  const editor = `/admin/collections/pages/${id}`;
  const preview = `/editorial/pages/${id}`;
  expect(doc.pageKey).toBe('homepage');
  expect(doc.workingRevision).toBeTruthy();
  expect(doc.publicRevision).toBeNull();

  async function save(actor: Page) {
    const response = actor.waitForResponse(result => result.url().includes(`/api/pages/${id}`) && result.request().method() === 'PATCH');
    await actor.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await response).status()).toBe(200);
  }
  const read = async () => {
    const response = await adminPage.request.get(`/api/pages/${id}?depth=0`, { headers });
    expect(response.status()).toBe(200);
    return response.json();
  };

  expect((await mediaBPage.request.get(`/api/pages/${id}`, { headers })).status()).toBe(404);
  expect((await page.request.get('/api/pages', { headers })).status()).toBe(403);
  expect((await page.request.get(`/api/pages/${id}`, { headers })).status()).toBe(403);
  await page.goto(preview);
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole('heading', { name: 'Beranda awal', exact: true })).toHaveCount(0);

  await mediaAPage.goto(editor);
  await expect(mediaAPage.getByRole('heading', { name: 'Alur editorial halaman', exact: true })).toBeVisible();
  await mediaAPage.getByLabel(/^Title/).fill('Beranda untuk ditinjau');
  await mediaAPage.getByLabel(/^Summary/).fill('Belajar pasar modal bersama.\nDiskusi dan edukasi untuk mahasiswa.');
  await save(mediaAPage);
  await mediaAPage.getByRole('button', { name: 'Ajukan review', exact: true }).click();
  await expect(mediaAPage.getByText('Status editorial: in_review', { exact: true })).toBeVisible();

  await adminPage.goto(editor);
  await expect(adminPage.getByText('Status editorial: in_review', { exact: true })).toBeVisible();
  const reviews = await adminPage.request.get(`/api/page-reviews?where[page][equals]=${id}&sort=-createdAt&limit=1&depth=0`, { headers });
  expect(reviews.status()).toBe(200);
  const firstReview = (await reviews.json()).docs[0];
  expect(firstReview.status).toBe('pending');
  expect(firstReview.manifest.title).toBe('Beranda untuk ditinjau');
  await adminPage.getByRole('link', { name: 'Preview privat', exact: true }).click();
  await expect(adminPage).toHaveURL(new RegExp(`/editorial/pages/${id}$`));
  await expect(adminPage.getByRole('heading', { name: 'Beranda untuk ditinjau', exact: true })).toBeVisible();
  await expect(adminPage.getByText('Belajar pasar modal bersama. Diskusi dan edukasi untuk mahasiswa.', { exact: true })).toBeVisible();

  await adminPage.goto(editor);
  await adminPage.getByLabel('Alasan editorial').fill('Perjelas pesan sambutan untuk pembaca.');
  await adminPage.getByRole('button', { name: 'Minta revisi', exact: true }).click();
  await expect(adminPage.getByText('Status editorial: revision_required', { exact: true })).toBeVisible();
  await mediaAPage.reload();
  await expect(mediaAPage.getByText('Perjelas pesan sambutan untuk pembaca.', { exact: true })).toBeVisible();
  await mediaAPage.getByLabel(/^Title/).fill('Beranda yang diperbaiki');
  await save(mediaAPage);
  await mediaAPage.getByRole('button', { name: 'Ajukan review', exact: true }).click();
  await expect(mediaAPage.getByText('Status editorial: in_review', { exact: true })).toBeVisible();

  await adminPage.reload();
  await expect(adminPage.getByText('Status editorial: in_review', { exact: true })).toBeVisible();
  const resubmissions = await adminPage.request.get(`/api/page-reviews?where[page][equals]=${id}&sort=-createdAt&limit=1&depth=0`, { headers });
  expect(resubmissions.status()).toBe(200);
  const secondReview = (await resubmissions.json()).docs[0];
  expect(secondReview.id).not.toBe(firstReview.id);
  expect(secondReview.status).toBe('pending');
  expect(secondReview.manifest.title).toBe('Beranda yang diperbaiki');
  await adminPage.getByRole('button', { name: 'Terbitkan', exact: true }).click();
  await expect(adminPage.getByText('Status editorial: published', { exact: true })).toBeVisible();
  const published = await read();
  expect(published.publicRevision).toBeTruthy();
  expect(published.workingRevision).toBeNull();

  await mediaAPage.reload();
  await mediaAPage.getByRole('button', { name: 'Buat revisi baru', exact: true }).click();
  await expect(mediaAPage.getByText('Status editorial: draft', { exact: true })).toBeVisible();
  await mediaAPage.getByLabel(/^Title/).fill('Beranda revisi privat');
  await save(mediaAPage);
  const privateDraft = await read();
  expect(privateDraft.title).toBe('Beranda revisi privat');
  expect(privateDraft.workingRevision).toBeTruthy();
  expect(privateDraft.workingRevision).not.toBe(published.publicRevision);
  expect(privateDraft.publicRevision).toBe(published.publicRevision);
});
