import { test, expect } from './fixtures';
import { PDFDocument } from 'pdf-lib';
import { RESEARCH_DISCLAIMER } from '../../src/content/research-policy.mjs';

test('reviewed research list/detail preserve PDF approval, disclaimer, calendar date and pagination on mobile', async ({ adminPage, mediaAPage, page, accounts, baseURL }) => {
  test.setTimeout(120000); adminPage.setDefaultTimeout(10000); mediaAPage.setDefaultTimeout(10000);
  const headers = { Origin: baseURL! };
  const owner = (await (await adminPage.request.get(`/api/users?where[email][equals]=${encodeURIComponent(accounts.mediaA.email)}`, { headers })).json()).docs[0].id;
  const category = (await (await adminPage.request.get('/api/research-categories?where[slug][equals]=equity-snapshot', { headers })).json()).docs[0];
  const pdfDocument = await PDFDocument.create(); pdfDocument.addPage();
  const uploaded = await mediaAPage.request.post('/api/media/upload', { headers: { Origin: baseURL!, 'Content-Type': 'application/pdf', 'X-Filename': 'contoh-riset.pdf', 'X-Alt': 'PDF contoh riset' }, data: Buffer.from(await pdfDocument.save()) });
  expect(uploaded.status()).toBe(201); const pdf = (await uploaded.json()).doc;
  const rich = { root: { type: 'root', version: 1, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Analisis contoh untuk pembelajaran.' }] }] } };
  let first: { id: number; lockVersion: number; workingRevision: number; publicRevision: number } | undefined;
  for (let i = 0; i < 13; i++) {
    const created = await adminPage.request.post('/api/research-publications', { headers, data: { slug: `browser-riset-${i}`, owner, title: `Browser Riset ${i}`, excerpt: 'Ringkasan riset contoh.', publicAuthor: 'Tim Riset Contoh', category: category.id, analysisDate: '2026-10-30', body: rich, sources: [{ title: 'Sumber edukasi', url: 'https://www.idx.co.id/' }], ...(i === 0 ? { pdf: pdf.id } : {}) } });
    expect(created.status()).toBe(201); const doc = (await created.json()).doc;
    if (i === 0) { first = doc; continue; }
    const pending = await mediaAPage.request.post(`/api/editorial/organization/research/${doc.id}/submit`, { headers, data: { expectedLockVersion: doc.lockVersion, expectedRevisionId: doc.workingRevision } }); expect(pending.status()).toBe(200); const review = await pending.json();
    expect((await adminPage.request.post(`/api/editorial/organization/research/${doc.id}/publish`, { headers, data: { expectedLockVersion: review.doc.lockVersion, expectedRevisionId: review.doc.workingRevision, submissionId: review.submission.id } })).status()).toBe(200);
  }
  expect((await page.request.get(`/api/media/${pdf.key}/original`)).status()).toBe(404);
  const editor = `/admin/collections/research-publications/${first!.id}`;
  await mediaAPage.goto(editor, { waitUntil: 'domcontentloaded' }); await mediaAPage.locator('#field-title').fill('Browser Riset 0 disetujui');
  const saving = mediaAPage.waitForResponse(response => new URL(response.url()).pathname === `/api/research-publications/${first!.id}` && response.request().method() === 'PATCH');
  await mediaAPage.getByRole('button', { name: 'Save', exact: true }).click(); const updated = await saving; expect(updated.status()).toBe(200); expect((await updated.json()).doc.category).toBe(category.id);
  await mediaAPage.getByRole('button', { name: 'Ajukan review', exact: true }).click(); await expect(mediaAPage.getByText('Status editorial: in_review', { exact: true })).toBeVisible();
  await adminPage.goto(editor, { waitUntil: 'domcontentloaded' }); await adminPage.getByRole('button', { name: 'Terbitkan', exact: true }).click(); await expect(adminPage.getByText('Status editorial: published', { exact: true })).toBeVisible();
  await page.goto('/publikasi/riset?q=BROWSER+RISET&category=equity-snapshot');
  await expect(page.getByRole('status').filter({ hasText: /^13 riset/ })).toBeVisible(); await expect(page.getByRole('link', { name: 'Halaman berikutnya', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Halaman berikutnya', exact: true }).click(); await expect(page.locator('.article-list > li')).toHaveCount(1);
  await page.goto('/publikasi/riset/browser-riset-0'); await expect(page.getByRole('heading', { name: 'Browser Riset 0 disetujui', exact: true })).toBeVisible();
  await expect(page.getByText(RESEARCH_DISCLAIMER, { exact: true })).toBeVisible(); await expect(page.getByText('Tanggal analisis: 2026-10-30', { exact: true })).toBeVisible();
  const download = page.getByRole('link', { name: 'Unduh PDF: PDF contoh riset', exact: true }); await expect(download).toBeVisible(); expect((await page.request.get((await download.getAttribute('href'))!)).status()).toBe(200);
  await mediaAPage.reload(); await mediaAPage.getByRole('button', { name: 'Buat revisi baru', exact: true }).click(); await expect(mediaAPage.getByText('Status editorial: draft', { exact: true })).toBeVisible();
  await mediaAPage.locator('#field-title').fill('PRIVATE BROWSER RESEARCH');
  const privateSave = mediaAPage.waitForResponse(response => new URL(response.url()).pathname === `/api/research-publications/${first!.id}` && response.request().method() === 'PATCH');
  await mediaAPage.getByRole('button', { name: 'Save', exact: true }).click(); expect((await privateSave).status()).toBe(200);
  await page.reload(); await expect(page.getByText('PRIVATE BROWSER RESEARCH', { exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/T034-mobile.png', fullPage: true });
  await page.goto('/publikasi/riset/browser-riset-1'); await expect(page.getByRole('link', { name: /^Unduh PDF:/ })).toHaveCount(0);
});
