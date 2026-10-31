import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { validateFile } from '../../src/media/validate.ts';

test('media validation decodes supported images, strips metadata and creates a thumbnail', async () => {
  for (const format of ['jpeg', 'png', 'webp']) {
    const bytes = await sharp({ create: { width: 24, height: 18, channels: 3, background: '#123456' } }).toFormat(format).toBuffer();
    const file = await validateFile(bytes, `image.${format}`, `image/${format}`, 'Ilustrasi pengujian');
    assert.equal(file.width, 24);
    assert.ok(file.thumbnail.length);
    assert.equal((await sharp(file.original).metadata()).exif, undefined);
  }
});
test('media validation rejects spoofed signatures, unsafe paths, oversized input and active PDF', async () => {
  const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#fff' } }).png().toBuffer();
  for (const [bytes, name, mime, alt] of [
    [image, '../image.png', 'image/png', 'alt'], [image, 'image.jpg', 'image/jpeg', 'alt'],
    [Buffer.from('<svg/>'), 'image.png', 'image/png', 'alt'], [image, 'image.png', 'image/png', ''],
    [Buffer.alloc(5 * 1024 * 1024 + 1), 'huge.png', 'image/png', 'alt'],
  ]) await assert.rejects(validateFile(bytes, name, mime, alt));
  const pdf = await PDFDocument.create(); pdf.addPage();
  pdf.catalog.set(PDFName.of('OpenAction'), pdf.context.obj({ S: 'JavaScript', JS: PDFString.of('app.alert(1)') }));
  await assert.rejects(validateFile(Buffer.from(await pdf.save()), 'active.pdf', 'application/pdf', 'Dokumen'));
});
test('plain PDFs are parsed and malformed PDFs are rejected', async () => {
  const pdf = await PDFDocument.create(); pdf.addPage();
  assert.equal((await validateFile(Buffer.from(await pdf.save()), 'document.pdf', 'application/pdf', 'Dokumen')).mime, 'application/pdf');
  await assert.rejects(validateFile(Buffer.from('%PDF-1.7\ninvalid\n%%EOF'), 'broken.pdf', 'application/pdf', 'Dokumen'));
});
