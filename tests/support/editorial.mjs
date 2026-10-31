import assert from 'node:assert/strict';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { fixtureAccounts, authenticate, httpClient } from './http.mjs';

export async function editorialFixture(prefix) {
  const accounts = fixtureAccounts();
  const admin = await authenticate(accounts.admin), a = await authenticate(accounts.mediaA), b = await authenticate(accounts.mediaB);
  const anonymous = { request: httpClient(process.env.SERVER_URL) };
  const response = await admin.request('/api/article-categories', { method: 'POST', data: { name: `Category ${prefix}`, slug: `category-${prefix}` } });
  assert.equal(response.status, 201); const category = (await response.json()).doc;
  const rich = text => ({ root: { type: 'root', version: 1, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text }] }] } });
  async function draft(actor, slug, extra = {}) {
    const result = await actor.request('/api/articles', { method: 'POST', data: { slug, title: `Title ${slug}`, excerpt: 'Test excerpt', publicAuthor: 'Public Team', body: rich('Approved article body.'), ...extra } });
    assert.equal(result.status, 201); let doc = (await result.json()).doc;
    const categorized = await admin.request(`/api/articles/${doc.id}`, { method: 'PATCH', data: { expectedLockVersion: doc.lockVersion, category: category.id } });
    assert.equal(categorized.status, 200); doc = (await categorized.json()).doc; return doc;
  }
  const command = (actor, doc, action, extra = {}) => actor.request(`/api/editorial/articles/${doc.id}/${action}`, { method: 'POST', data: {
    expectedLockVersion: doc.lockVersion, expectedRevisionId: doc.workingRevision || doc.publicRevision || doc.expectedRevisionId, ...extra,
  } });
  async function submit(actor, doc) { const result = await command(actor, doc, 'submit'); assert.equal(result.status, 200); return result.json(); }
  async function publish(pending) { const result = await command(admin, pending.doc, 'publish', { submissionId: pending.submission.id }); assert.equal(result.status, 200); return (await result.json()).doc; }
  async function upload(actor, format = 'png') {
    let bytes, mime;
    if (format === 'pdf') { const pdf = await PDFDocument.create(); pdf.addPage(); bytes = Buffer.from(await pdf.save()); mime = 'application/pdf'; }
    else { bytes = await sharp({ create: { width: 24, height: 18, channels: 3, background: '#123456' } }).toFormat(format).toBuffer(); mime = `image/${format}`; }
    const result = await actor.request('/api/media/upload', { method: 'POST', bytes, headers: { 'Content-Type': mime, 'X-Filename': `${prefix}.${format}`, 'X-Alt': 'Library alt' } });
    assert.equal(result.status, 201); return (await result.json()).doc;
  }
  return { admin, a, b, anonymous, category, rich, draft, command, submit, publish, upload };
}
