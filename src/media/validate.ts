import path from 'node:path';
import { Worker } from 'node:worker_threads';
import sharp from 'sharp';

const formats = { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'application/pdf': ['pdf'] };
export const fileLimit = (mime: string) => mime === 'application/pdf' ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
let pdfWorkers = 0;
async function safePDF(bytes: Buffer): Promise<Buffer> {
  if (pdfWorkers >= 2) throw new Error('PDF validation is busy; try again');
  pdfWorkers++;
  try {
    return await new Promise((resolve, reject) => {
      const worker = new Worker(path.resolve('src/media/pdf-worker.mjs'), { workerData: { bytes }, resourceLimits: { maxOldGenerationSizeMb: 128, stackSizeMb: 4 } });
      const timer = setTimeout(() => { void worker.terminate(); reject(Error('PDF validation timed out')); }, 5000);
      worker.once('message', result => { clearTimeout(timer); void worker.terminate(); if (result.error) reject(Error('Invalid or active PDF')); else resolve(Buffer.from(result.bytes)); });
      worker.once('error', () => { clearTimeout(timer); reject(Error('PDF validation failed')); });
      worker.once('exit', code => { clearTimeout(timer); if (code !== 0) reject(Error('PDF validation stopped')); });
    });
  } finally { pdfWorkers--; }
}
export async function validateFile(bytes: Buffer, name: string, mime: string, alt: string) {
  if (!Object.hasOwn(formats, mime) || !name || name.length > 160 || /[/\\\x00-\x1f]/.test(name) || name.startsWith('.')) throw Error('Unsupported filename or format');
  const extension = name.split('.').at(-1)!.toLowerCase();
  if (!(formats[mime as keyof typeof formats] as string[]).includes(extension)) throw Error('Extension does not match MIME');
  if (!alt.trim() || alt.length > 300 || !bytes.length || bytes.length > fileLimit(mime)) throw Error('Invalid size or alt text');
  if (mime === 'application/pdf') {
    if (!bytes.subarray(0, 8).toString('ascii').startsWith('%PDF-') || !/%%EOF\s*$/.test(bytes.subarray(-1024).toString('latin1'))) throw Error('Invalid PDF signature');
    const original = await safePDF(bytes);
    if (original.length > fileLimit(mime)) throw Error('PDF output exceeds limit');
    return { mime, extension: 'pdf', original, thumbnail: null, width: null, height: null };
  }
  const signature = mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (!signature) throw Error('Signature does not match MIME');
  const input = sharp(bytes, { limitInputPixels: 25000000, failOn: 'warning' });
  const metadata = await input.metadata();
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > 25000000 || (metadata.pages || 1) !== 1) throw Error('Invalid image dimensions or animation');
  const format = mime.split('/')[1] as 'jpeg' | 'png' | 'webp';
  const original = await input.clone().rotate().toFormat(format).toBuffer();
  const thumbnail = await input.clone().rotate().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp().toBuffer();
  if (original.length > fileLimit(mime)) throw Error('Image output exceeds limit');
  const result = await sharp(original).metadata();
  return { mime, extension: format === 'jpeg' ? 'jpg' : format, original, thumbnail, width: result.width!, height: result.height! };
}
