import { createHash } from 'node:crypto';

type CompleteInput = { title?: string | null; excerpt?: string | null; category?: unknown; publicAuthor?: string | null; body?: unknown; assets?: { alt?: string | null }[] | null; sources?: { url?: string | null }[] | null };
export function validateComplete(revision: CompleteInput) {
  const hasText = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false;
    const value = node as { text?: unknown; children?: unknown[] };
    return (typeof value.text === 'string' && !!value.text.trim()) || (Array.isArray(value.children) && value.children.some(hasText));
  };
  if (!revision.title?.trim() || !revision.excerpt?.trim() || !revision.category || !revision.publicAuthor?.trim() || !hasText((revision.body as { root?: unknown })?.root)) throw Error('Judul, ringkasan, kategori, penulis dan isi wajib untuk pengajuan');
  if (revision.assets?.some(asset => !asset.alt?.trim()) || revision.sources?.some(source => !source.url?.trim())) throw Error('Lengkapi alt aset dan URL sumber');
}
export function snapshotDigest(value: unknown) {
  const canonical = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(canonical);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => [k, canonical(v)]));
    return item;
  };
  return createHash('sha256').update(JSON.stringify(canonical(value)) ?? 'null').digest('hex');
}
