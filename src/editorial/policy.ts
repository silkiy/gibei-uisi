import { safeExternalURL, mediaLinkID } from '../content/links.mjs';

type Identity = { id: number | string; role?: string; status?: string } | null | undefined;
type Relation = number | string | { id: number | string };
export const relationId = (value: Relation | null | undefined) => value && typeof value === 'object' ? value.id : value;

export function canEditDraft(user: Identity, article: { owner?: Relation; assignedTo?: Relation[] | null }): boolean {
  if (!user || user.status !== 'active') return false;
  if (user.role === 'admin') return true;
  return user.role === 'media' && [article.owner, ...(article.assignedTo || [])].some(value => String(relationId(value)) === String(user.id));
}

export function normalizeSlug(value: string): string {
  const slug = value.trim().normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, '-');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) throw new Error('Gunakan slug huruf kecil, angka dan tanda hubung (maksimal 120 karakter)');
  return slug;
}

export function validateDraft(data: { title?: string | null; excerpt?: string | null; publicAuthor?: string | null; body?: unknown; sources?: { url?: string | null }[] | null; assets?: { asset: Relation }[] | null }) {
  if ((data.title?.length || 0) > 240 || (data.excerpt?.length || 0) > 600 || (data.publicAuthor?.length || 0) > 160) throw new Error('Teks draft melampaui batas panjang');
  for (const source of data.sources || []) {
    if (!source.url) continue;
    if (!safeExternalURL(source.url)) throw new Error('Sumber harus URL HTTPS tanpa kredensial');
  }
  if (!data.body) return;
  if (JSON.stringify(data.body).length > 200000) throw new Error('Isi draft terlalu besar');
  let count = 0;
  const visit = (node: unknown, depth: number) => {
    if (!node || typeof node !== 'object' || depth > 32 || ++count > 5000) throw new Error('Struktur rich text tidak valid');
    const value = node as { type?: string; children?: unknown[]; tag?: string; text?: unknown; style?: unknown; textStyle?: unknown; fields?: { linkType?: string; url?: unknown } };
    if (!['root', 'paragraph', 'text', 'linebreak', 'heading', 'list', 'listitem', 'link'].includes(value.type || '')) throw new Error('Node rich text belum didukung');
    if (value.type === 'link') {
      const id = mediaLinkID(value.fields);
      if (value.fields?.linkType === 'internal' ? !id || !data.assets?.some(asset => Number(relationId(asset.asset)) === id) : value.fields?.linkType !== 'custom' || !safeExternalURL(value.fields.url)) throw new Error('Link harus HTTPS atau media yang tercantum pada aset revisi');
    }
    if (value.type === 'heading' && !['h2', 'h3'].includes(value.tag || '')) throw new Error('Heading harus h2/h3');
    if (value.type === 'text' && typeof value.text !== 'string') throw new Error('Text harus string');
    if (value.style || value.textStyle) throw new Error('Custom styling belum didukung');
    if (!['text', 'linebreak'].includes(value.type || '') && !Array.isArray(value.children)) throw new Error('Node container harus memiliki children');
    if (value.children) { if (!Array.isArray(value.children)) throw new Error('Children harus array'); for (const child of value.children) visit(child, depth + 1); }
  };
  visit((data.body as { root?: unknown }).root, 0);
}
