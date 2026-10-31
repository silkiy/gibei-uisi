import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { authenticate, fixtureAccounts } from '../support/http.mjs';

let admin, a, b;
before(async () => { const accounts = fixtureAccounts(); admin = await authenticate(accounts.admin); a = await authenticate(accounts.mediaA); b = await authenticate(accounts.mediaB); });
const upload = (actor, bytes, name, mime, alt = 'Deskripsi file uji') => actor.request('/api/media/upload', { method: 'POST', bytes, headers: { 'Content-Type': mime, 'X-Filename': encodeURIComponent(name), 'X-Alt': encodeURIComponent(alt) } });
test('private upload accepts validated images/PDF and metadata stays owned', async () => {
  for (const format of ['jpeg', 'png', 'webp']) {
    const bytes = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#123456' } }).toFormat(format).toBuffer();
    const response = await upload(a, bytes, `valid.${format}`, `image/${format}`);
    assert.equal(response.status, 201);
    const { doc } = await response.json();
    assert.equal(doc.owner, a.user.id); assert.equal(doc.state, 'ready'); assert.equal(doc.width, 16);
    assert.match(doc.key, /^[a-f0-9-]{36}$/); assert.equal(doc.checksum.length, 64);
    assert.equal((await a.request(`/api/media/${doc.id}`)).status, 200);
    assert.notEqual((await b.request(`/api/media/${doc.id}`)).status, 200);
    assert.equal((await admin.request(`/api/media/${doc.id}`)).status, 200);
    assert.equal((await a.request(`/api/media/${doc.id}`, { method: 'PATCH', data: { owner: b.user.id, state: 'ready' } })).status, 403);
    assert.equal((await admin.request(`/api/media/${doc.id}`, { method: 'DELETE' })).status, 403);
  }
  const pdf = await PDFDocument.create(); pdf.addPage();
  assert.equal((await upload(a, Buffer.from(await pdf.save()), 'valid.pdf', 'application/pdf')).status, 201);
  assert.equal((await (await b.request('/api/media')).json()).totalDocs, 0);
  assert.equal((await admin.request('/api/media', { method: 'POST', data: { owner: a.user.id, key: 'forged' } })).status, 403);
});
test('invalid, disguised, oversized, high-dimension and unsafe filename uploads fail', async () => {
  const before = (await (await a.request('/api/media')).json()).totalDocs;
  const bytes = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#fff' } }).png().toBuffer();
  for (const [body, name, mime, alt, expected] of [
    [bytes, '../bad.png', 'image/png', 'alt', 400], [bytes, 'fake.jpg', 'image/jpeg', 'alt', 400],
    [Buffer.from('<html>bad</html>'), 'fake.png', 'image/png', 'alt', 400],
    [Buffer.from('<svg/>'), 'image.svg', 'image/svg+xml', 'alt', 400],
    [Buffer.from('MZ-executable'), 'run.exe', 'application/octet-stream', 'alt', 400],
    [bytes, 'valid.png', 'image/png', '', 400],
    [Buffer.alloc(5 * 1024 * 1024 + 1), 'large.png', 'image/png', 'alt', 413],
    [Buffer.from('%PDF-1.7\ninvalid\n%%EOF'), 'invalid.pdf', 'application/pdf', 'alt', 400],
  ]) assert.equal((await upload(a, body, name, mime, alt)).status, expected, name);
  const huge = await sharp({ create: { width: 5001, height: 5000, channels: 3, background: '#fff' } }).png().toBuffer();
  assert.equal((await upload(a, huge, 'dimensions.png', 'image/png')).status, 400);
  assert.equal((await (await a.request('/api/media')).json()).totalDocs, before, 'Failed validation never creates a ready asset');
});
