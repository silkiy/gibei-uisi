import { NotFound } from 'payload';
import { atomic, requestContext } from '../../../../../../server/request';
import { loadAsset, privatelyAllowed, editorialLock, isAssetPublic } from '../../../../../../media/access';
import { readAsset, digest } from '../../../../../../media/storage';

type Context = { params: Promise<{ key: string; variant: string }> };
const baseHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" };
async function serve(request: Request, context: Context) {
  try {
    const { key, variant } = await context.params;
    if (!['original', 'thumbnail'].includes(variant)) throw new NotFound();
    const req = await requestContext(request);
    return await atomic(req, async () => {
      await editorialLock(req, true);
      const asset = await loadAsset(req, key);
      if (asset.state !== 'ready' || (!privatelyAllowed(req, asset) && !await isAssetPublic(req, asset)) || (variant === 'thumbnail' && !asset.hasThumbnail)) throw new NotFound();
      const bytes = await readAsset(key, variant as 'original' | 'thumbnail');
      if (digest(bytes) !== (variant === 'original' ? asset.checksum : asset.thumbnailChecksum)) throw new NotFound();
      const headers = new Headers({ ...baseHeaders, 'Content-Type': variant === 'thumbnail' ? 'image/webp' : asset.mime,
        'Content-Disposition': `${asset.mime === 'application/pdf' ? 'attachment' : 'inline'}; filename="${key}.${variant === 'thumbnail' ? 'webp' : asset.extension}"`, 'Accept-Ranges': 'bytes' });
      let start = 0, end = bytes.length - 1, status = 200;
      const range = request.headers.get('range');
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { ...baseHeaders, 'Content-Range': `bytes */${bytes.length}` } });
        if (!match[1]) start = Math.max(0, bytes.length - Number(match[2]));
        else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= bytes.length) return new Response(null, { status: 416, headers: { ...baseHeaders, 'Content-Range': `bytes */${bytes.length}` } });
        status = 206; headers.set('Content-Range', `bytes ${start}-${end}/${bytes.length}`);
      }
      headers.set('Content-Length', String(end - start + 1));
      return new Response(request.method === 'HEAD' ? null : new Uint8Array(bytes.subarray(start, end + 1)), { status, headers });
    });
  } catch { return new Response(null, { status: 404, headers: baseHeaders }); }
}
export const GET = serve;
export const HEAD = serve;
