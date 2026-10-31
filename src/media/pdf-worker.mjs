import { parentPort, workerData } from 'node:worker_threads';
import { PDFDocument, PDFDict, PDFArray } from 'pdf-lib';

try {
  const pdf = await PDFDocument.load(workerData.bytes, { updateMetadata: false, throwOnInvalidObject: true });
  if (pdf.isEncrypted || pdf.getPageCount() < 1 || pdf.getPageCount() > 1000) throw Error('Invalid PDF');
  const blocked = new Set(['JavaScript', 'JS', 'OpenAction', 'AA', 'Launch', 'EmbeddedFiles', 'EmbeddedFile', 'RichMedia', 'XFA', 'AcroForm', 'URI', 'A']);
  const seen = new WeakSet(); let count = 0;
  function inspect(value, depth = 0) {
    if (++count > 100000 || depth > 40) throw Error('Complex PDF');
    if (!(value instanceof PDFDict || value instanceof PDFArray) || seen.has(value)) return;
    seen.add(value);
    if (value instanceof PDFDict) for (const [key, item] of value.entries()) {
      if (blocked.has(key.decodeText())) throw Error('Active PDF is not supported');
      inspect(item, depth + 1);
    }
    else for (let i = 0; i < value.size(); i++) inspect(value.get(i), depth + 1);
  }
  const objects = pdf.context.enumerateIndirectObjects();
  if (objects.length > 50000) throw Error('Complex PDF');
  for (const [, object] of objects) { inspect(object); if (object.dict) inspect(object.dict); }
  parentPort.postMessage({ bytes: await pdf.save({ useObjectStreams: false }) });
} catch { parentPort.postMessage({ error: true }); }
