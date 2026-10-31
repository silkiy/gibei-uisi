import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import sharp from 'sharp';
import { authenticate, fixtureAccounts } from '../support/http.mjs';
let admin, a, b, category;
const rich = text => ({ root: { type: 'root', version: 1, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text }] }] } });
before(async () => {
  const accounts = fixtureAccounts(); admin = await authenticate(accounts.admin); a = await authenticate(accounts.mediaA); b = await authenticate(accounts.mediaB);
  const result = await admin.request('/api/article-categories', { method: 'POST', data: { name: 'Review', slug: 'review-submit' } });
  assert.equal(result.status, 201); category = (await result.json()).doc;
});
async function create(actor, slug, extra = {}) {
  const response = await actor.request('/api/articles', { method: 'POST', data: { slug, title: 'Artikel lengkap', excerpt: 'Ringkasan artikel.', publicAuthor: 'Tim Edukasi', body: rich('Isi lengkap untuk ditinjau.'), ...extra } });
  assert.equal(response.status, 201); let doc = (await response.json()).doc;
  const assigned = await admin.request(`/api/articles/${doc.id}`, { method: 'PATCH', data: { expectedLockVersion: doc.lockVersion, category: category.id } });
  assert.equal(assigned.status, 200); doc = (await assigned.json()).doc; return doc;
}
const command = (actor, doc, action, extra = {}) => actor.request(`/api/editorial/articles/${doc.id}/${action}`, { method: 'POST', data: { expectedLockVersion: doc.lockVersion, expectedRevisionId: doc.workingRevision, ...extra } });
test('submit freezes an exact revision; unauthorized users and generic mutations cannot bypass it', async () => {
  const doc = await create(a, 'submit-private');
  assert.equal((await command(b, doc, 'submit')).status, 404);
  const response = await command(a, doc, 'submit'); assert.equal(response.status, 200);
  const submitted = await response.json();
  assert.equal(submitted.doc.state, 'in_review'); assert.equal(submitted.submission.status, 'pending');
  assert.equal(submitted.submission.revision, doc.workingRevision);
  assert.equal(submitted.submission.manifestDigest.length, 64);
  for (const actor of [a, admin]) assert.equal((await actor.request(`/api/articles/${doc.id}`, { method: 'PATCH', data: { expectedLockVersion: submitted.doc.lockVersion, title: 'Edit locked' } })).status, 409);
  assert.equal((await admin.request('/api/content-reviews', { method: 'POST', data: { status: 'approved', article: doc.id } })).status, 403);
  assert.equal((await b.request(`/api/content-reviews/${submitted.submission.id}`)).status, 404);
  const withdrawal = await command(a, submitted.doc, 'withdraw-submission', { submissionId: submitted.submission.id });
  assert.equal(withdrawal.status, 200); const withdrawn = await withdrawal.json(); assert.equal(withdrawn.doc.state, 'draft');
  assert.equal((await command(a, submitted.doc, 'withdraw-submission', { submissionId: submitted.submission.id })).status, 409);
  const again = await command(a, withdrawn.doc, 'submit'); assert.equal(again.status, 200);
  assert.notEqual((await again.json()).submission.id, submitted.submission.id);
});
test('save/submit reject foreign assets and incomplete content', async () => {
  const bytes = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#fff' } }).png().toBuffer();
  const upload = await b.request('/api/media/upload', { method: 'POST', bytes, headers: { 'Content-Type': 'image/png', 'X-Filename': 'foreign.png', 'X-Alt': 'Foreign asset' } });
  assert.equal(upload.status, 201); const asset = (await upload.json()).doc;
  const denied = await a.request('/api/articles', { method: 'POST', data: { slug: 'foreign-reference', assets: [{ asset: asset.id, alt: 'Guessed asset' }] } });
  assert.equal(denied.status, 404);
  const doc = await create(b, 'owned-asset-review', { assets: [{ asset: asset.id, alt: 'Snapshot alt', caption: 'Snapshot caption' }] });
  assert.equal(doc.assets[0].fileVersion, asset.fileVersion);
  assert.equal((await command(b, doc, 'submit', { reviewerId: admin.user.id })).status, 400);
  const submitted = await command(b, doc, 'submit'); assert.equal(submitted.status, 200);
  const snapshot = (await submitted.json()).submission.manifest;
  assert.equal(snapshot.assets[0].alt, 'Snapshot alt');
  const incomplete = await a.request('/api/articles', { method: 'POST', data: { slug: 'incomplete-review' } });
  assert.equal(incomplete.status, 201); assert.equal((await command(a, (await incomplete.json()).doc, 'submit')).status, 400);
});
