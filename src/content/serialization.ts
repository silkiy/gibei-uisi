import { safeExternalURL, mediaLinkID } from './links.mjs';
const types = new Set(['root', 'paragraph', 'text', 'linebreak', 'heading', 'list', 'listitem', 'link']);
const fields = ['text', 'format', 'detail', 'mode', 'direction', 'indent', 'start', 'value', 'listType', 'textFormat'] as const;
export function publicBody(body: unknown, allowedAssetIds: number[] = []) {
  const root = (body as { root?: { type?: string } } | null)?.root;
  if (root?.type !== 'root') return null;
  let count = 0;
  function visit(input: unknown, depth: number): Record<string, unknown> | null {
    if (!input || typeof input !== 'object' || depth > 32 || ++count > 5000) return null;
    const node = input as Record<string, unknown>;
    if (typeof node.type !== 'string' || !types.has(node.type)) return null;
    if (node.type === 'heading' && !['h2', 'h3'].includes(String(node.tag))) return null;
    if (node.type === 'list' && !['ol', 'ul'].includes(String(node.tag))) return null;
    const result: Record<string, unknown> = { type: node.type, version: 1 };
    for (const key of fields) if (node[key] === null || ['string', 'number', 'boolean'].includes(typeof node[key])) result[key] = node[key];
    if (node.type === 'heading' || node.type === 'list') result.tag = node.tag;
    if (node.type === 'link') {
      const input = node.fields as { url?: unknown; newTab?: unknown; assetId?: number } | undefined;
      const assetId = mediaLinkID(input) ?? (Number.isSafeInteger(input?.assetId) ? input!.assetId! : null);
      const url = safeExternalURL(input?.url);
      result.fields = assetId && allowedAssetIds.includes(assetId) ? { assetId } : url && !assetId ? { url, newTab: input?.newTab === true } : {};
    }
    if (Array.isArray(node.children)) result.children = node.children.map(child => visit(child, depth + 1)).filter(Boolean);
    return result;
  }
  return { root: visit(root, 0) };
}
