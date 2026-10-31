import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { authenticate, fixtureAccounts, httpClient } from '../support/http.mjs';

let admin, a, b, anonymous;
before(async () => {
  const accounts = fixtureAccounts(); admin = await authenticate(accounts.admin); a = await authenticate(accounts.mediaA); b = await authenticate(accounts.mediaB);
  anonymous = { request: httpClient(process.env.SERVER_URL) };
});
async function asset(bytes, name, mime) {
  const response = await a.request('/api/media/upload', { method: 'POST', bytes, headers: { 'Content-Type': mime, 'X-Filename': name, 'X-Alt': 'Private test file' } });
  assert.equal(response.status, 201); return (await response.json()).doc;
}
test('original/thumbnail/HEAD/conditional/optimizer paths never leak private bytes', async () => {
  const bytes = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#123456' } }).png().toBuffer();
  const doc = await asset(bytes, 'gateway.png', 'image/png');
  for (const variant of ['original', 'thumbnail']) {
    const path = `/api/media/${doc.key}/${variant}`;
    for (const actor of [anonymous, b]) for (const options of [{}, { method: 'HEAD' }, { headers: { Range: 'bytes=0-7' } }, { headers: { 'If-None-Match': '*' } }]) {
      const denied = await actor.request(path, options);
      assert.equal(denied.status, 404);
      assert.match(denied.headers.get('cache-control'), /no-store/);
      assert.equal(denied.headers.get('content-range'), null);
    }
    for (const actor of [a, admin]) {
      const read = await actor.request(path);
      assert.equal(read.status, 200); assert.match(read.headers.get('cache-control'), /no-store/);
      assert.equal(read.headers.get('x-content-type-options'), 'nosniff');
      const length = (await read.arrayBuffer()).byteLength; assert.ok(length > 0);
      const head = await actor.request(path, { method: 'HEAD' }); assert.equal(head.status, 200);
      assert.equal(Number(head.headers.get('content-length')), length); assert.equal((await head.arrayBuffer()).byteLength, 0);
    }
  }
  assert.equal((await a.request(`/api/media/${doc.key}/arbitrary`)).status, 404);
  assert.equal((await anonymous.request(`/api/media/file/${doc.name}`)).status, 404);
  assert.equal((await anonymous.request(`/_next/image?url=${encodeURIComponent(`/api/media/${doc.key}/original`)}&w=640&q=75`)).status, 404);
  assert.equal((await b.request(`/api/media/${doc.key}/assign`, { method: 'POST', data: { assignedTo: [b.user.id] } })).status, 403);
  assert.equal((await admin.request(`/api/media/${doc.key}/assign`, { method: 'POST', data: { assignedTo: [b.user.id] } })).status, 200);
  assert.equal((await b.request(`/api/media/${doc.key}/original`)).status, 200);
  assert.equal((await admin.request(`/api/media/${doc.key}/assign`, { method: 'POST', data: { assignedTo: [] } })).status, 200);
  assert.equal((await b.request(`/api/media/${doc.key}/original`)).status, 404);
});
test('PDF range and attachment headers follow live authorization', async () => {
  const pdf = await PDFDocument.create(); pdf.addPage();
  const doc = await asset(Buffer.from(await pdf.save()), 'gateway.pdf', 'application/pdf');
  const path = `/api/media/${doc.key}/original`;
  const partial = await a.request(path, { headers: { Range: 'bytes=0-7' } });
  assert.equal(partial.status, 206); assert.match(partial.headers.get('content-range'), /^bytes 0-7\//);
  assert.match(partial.headers.get('content-disposition'), /^attachment;/);
  assert.equal((await partial.arrayBuffer()).byteLength, 8);
  assert.equal((await a.request(path, { headers: { Range: 'bytes=999999999-' } })).status, 416);
  assert.equal((await anonymous.request(path, { headers: { Range: 'bytes=0-7' } })).status, 404);
  assert.equal((await a.request(`/api/media/${doc.key}/thumbnail`)).status, 404);
});
