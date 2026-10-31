import { randomUUID } from 'node:crypto';
import { APIError } from 'payload';
import { authenticatedRequest, atomic, failure } from '../../../../../server/request';
import { currentActor, editorialWrite } from '../../../../../editorial/internal';
import { validateFile, fileLimit } from '../../../../../media/validate';
import { writeAsset, removeAsset, digest } from '../../../../../media/storage';

export async function POST(request: Request) {
  let storedKey: string | undefined;
  try {
    const req = await authenticatedRequest(request, true);
    const mime = request.headers.get('content-type') || '';
    const limit = fileLimit(mime);
    if (Number(request.headers.get('content-length')) > limit) throw new APIError('File exceeds size limit', 413);
    const reader = request.body?.getReader();
    if (!reader) throw new APIError('File is required', 400);
    const chunks: Buffer[] = []; let length = 0;
    try { for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.length; if (length > limit) throw new APIError('File exceeds size limit', 413);
      chunks.push(Buffer.from(value));
    } } finally { await reader.cancel(); }
    const name = decodeURIComponent(request.headers.get('x-filename') || '');
    const alt = decodeURIComponent(request.headers.get('x-alt') || '');
    let file;
    try { file = await validateFile(Buffer.concat(chunks), name, mime, alt); }
    catch { throw new APIError('File type, size, content or alt is invalid', 400); }
    const key = randomUUID();
    await writeAsset(key, file.original, file.thumbnail); storedKey = key;
    const result = await atomic(req, async () => {
      await currentActor(req);
      const options = { req, overrideAccess: true, context: { [editorialWrite]: true } };
      const doc = await req.payload.create({ collection: 'media', ...options, data: {
        key, name, alt: alt.trim(), owner: req.user!.id, assignedTo: [], state: 'ready', fileVersion: randomUUID(),
        checksum: digest(file.original), mime: file.mime, extension: file.extension, size: file.original.length,
        width: file.width, height: file.height, hasThumbnail: !!file.thumbnail, thumbnailChecksum: file.thumbnail ? digest(file.thumbnail) : null,
      } });
      await req.payload.create({ collection: 'media-audit', ...options, data: { assetId: doc.id, actorId: req.user!.id, action: 'uploaded', details: { fileVersion: doc.fileVersion, checksum: doc.checksum }, correlationId: randomUUID() } });
      return doc;
    });
    storedKey = undefined;
    return Response.json({ doc: result }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { if (storedKey) await removeAsset(storedKey); return failure(error); }
}
