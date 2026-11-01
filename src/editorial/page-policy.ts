import { APIError } from 'payload';
import { safeExternalURL } from '../content/links.mjs';
import { canEditDraft, relationId } from './policy';

export { canEditDraft, relationId };
export type PageKey = 'homepage' | 'about';
export type PageDraft = { title?: string | null; seoTitle?: string | null; seoDescription?: string | null; sections?: unknown[] | null };
export type PageDoc = { id: number; pageKey: PageKey; owner: number; assignedTo?: number[] | null; createdBy: number; workingRevision?: number | null; publicRevision?: number | null; lockVersion: number; createdAt: string };
export type PageRevisionDoc = PageDraft & { id: number; page: number; number: number; state: 'draft' | 'in_review' | 'revision_required' | 'published' | 'archived'; editVersion: number };
export type PageReviewDoc = { id: number; page: number; revision: number; editVersion: number; manifestDigest: string; status: 'pending' | 'approved' | 'changes_requested' | 'cancelled' };

export const pageDraftKeys = ['title', 'seoTitle', 'seoDescription', 'sections'] as const;
export const pageKeyIsValid = (value: unknown): value is PageKey => value === 'homepage' || value === 'about';

const shapes = {
  hero: { heading: 160, summary: 600 },
  profile: { heading: 160, description: 3000, history: 3000, vision: 1200, mission: 2000 },
  program: { heading: 160, description: 1200 },
  cta: { heading: 160, description: 600, label: 100, url: 2048 },
} as const;
const required = { hero: ['heading', 'summary'], profile: ['heading', 'description'], program: ['heading', 'description'], cta: ['heading', 'label', 'url'] } as const;
const internalRoutes = new Set(['/', '/tentang', '/tentang/struktur', '/tentang/divisi', '/publikasi/artikel', '/publikasi/riset']);
const multilineFields = new Set(['seoDescription', 'summary', 'description', 'history', 'vision', 'mission']);
const invalidText = (value: string, field: string) => (multilineFields.has(field)
  ? /[<>\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/
  : /[<>\u0000-\u001f\u007f]/).test(value);

export function validatePageDraft(draft: PageDraft, complete = false) {
  for (const [key, max] of [['title', 160], ['seoTitle', 160], ['seoDescription', 300]] as const) {
    const value = draft[key];
    if (value != null && (typeof value !== 'string' || value.length > max || invalidText(value, key))) throw new APIError('Invalid page text', 400);
    if (complete && !value?.trim()) throw new APIError('Title and SEO are required', 400);
  }
  if (!Array.isArray(draft.sections) || draft.sections.length > 20) throw new APIError('Invalid page sections', 400);
  if (JSON.stringify(draft.sections).length > 50000) throw new APIError('Page sections are too large', 400);
  for (const section of draft.sections) {
    if (!section || typeof section !== 'object' || Array.isArray(section)) throw new APIError('Invalid page section', 400);
    const row = section as Record<string, unknown>;
    const type = row.blockType;
    if (typeof type !== 'string' || !Object.hasOwn(shapes, type)) throw new APIError('Unsupported page section', 400);
    const shape = shapes[type as keyof typeof shapes] as Record<string, number>;
    for (const [field, value] of Object.entries(row)) {
      if (field === 'blockType' || field === 'id' && (value == null || typeof value === 'string' && value.length <= 64) || field === 'blockName' && (value == null || typeof value === 'string' && value.length <= 160)) continue;
      if (!Object.hasOwn(shape, field) || value != null && (typeof value !== 'string' || value.length > shape[field] || invalidText(value, field))) throw new APIError('Invalid page section text', 400);
    }
    if (complete && required[type as keyof typeof required].some(field => typeof row[field] !== 'string' || !(row[field] as string).trim())) throw new APIError('Page section is incomplete', 400);
    if (type === 'cta' && row.url != null && row.url !== '' && (typeof row.url !== 'string' || !internalRoutes.has(row.url) && !safeExternalURL(row.url))) throw new APIError('CTA must use a supported internal route or HTTPS URL', 400);
  }
  if (complete && !draft.sections.some(section => (section as { blockType?: string }).blockType === 'hero' || (section as { blockType?: string }).blockType === 'profile')) throw new APIError('Hero or profile section is required', 400);
}

export function pageNote(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) throw new APIError('Note required (maximum 2000 characters)', 400);
  return value.trim();
}
