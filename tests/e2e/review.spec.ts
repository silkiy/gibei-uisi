import { test, expect } from './fixtures';

test('owner reads the private revision note in CMS; another Media cannot read it', async ({ adminPage, mediaAPage, mediaBPage, baseURL }) => {
  const headers = { Origin: baseURL! };
  const category = await adminPage.request.post('/api/article-categories', { headers, data: { name: 'Browser Review', slug: 'browser-review' } });
  expect(category.status()).toBe(201);
  const body = { root: { type: 'root', version: 1, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Isi untuk ditinjau.' }] }] } };
  const response = await mediaAPage.request.post('/api/articles', { headers, data: { slug: 'browser-review-note', title: 'Catatan privat', excerpt: 'Ringkasan', publicAuthor: 'Tim', body } });
  expect(response.status()).toBe(201); let doc = (await response.json()).doc;
  const categorized = await adminPage.request.patch(`/api/articles/${doc.id}`, { headers, data: { expectedLockVersion: doc.lockVersion, category: (await category.json()).doc.id } });
  expect(categorized.status()).toBe(200); doc = (await categorized.json()).doc;
  const submitted = await mediaAPage.request.post(`/api/editorial/articles/${doc.id}/submit`, { headers, data: { expectedLockVersion: doc.lockVersion, expectedRevisionId: doc.workingRevision } });
  expect(submitted.status()).toBe(200); const pending = await submitted.json();
  const note = 'Perjelas pembahasan sumber artikel.';
  const requested = await adminPage.request.post(`/api/editorial/articles/${doc.id}/request-revision`, { headers, data: { expectedLockVersion: pending.doc.lockVersion, expectedRevisionId: pending.doc.workingRevision, submissionId: pending.submission.id, note } });
  expect(requested.status()).toBe(200); const result = await requested.json();
  await mediaAPage.goto(`/admin/collections/content-reviews/${result.submission.id}`);
  await expect(mediaAPage.getByLabel(/^Note/)).toHaveValue(note);
  expect((await mediaBPage.request.get(`/api/content-reviews/${result.submission.id}`, { headers })).status()).toBe(404);
});
