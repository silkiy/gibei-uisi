import { recruitmentFields } from '../recruitment/fields';
import { validateRecruitment } from '../recruitment/policy.mjs';
import type { Field } from 'payload';
import { APIError } from 'payload';
import { divisionNames, validateOrganization } from '../validation/organization.mjs';
import { settingsText } from '../validation/navigation.mjs';
import { draftFields } from './fields';
import { publicationFields } from './publication-fields';
import { validatePublication } from '../content/publication-policy';
import type { ArticleRevision } from '../payload-types';

export function revisionAssetsField(virtual: boolean): Extract<Field, { type: 'array' }> {
  const field = draftFields(virtual).find((field): field is Extract<Field, { type: 'array' }> => field.type === 'array' && field.name === 'assets');
  if (!field) throw Error('Missing canonical asset field');
  return { ...field, admin: { hidden: true, readOnly: true } };
}

export const editorialKinds = ['periods', 'divisions', 'members', 'research', 'events', 'recruitment'] as const;
export type EditorialKind = typeof editorialKinds[number];
export const editorialModel = (kind: EditorialKind) => ({
  periods: { root: 'organizational-periods' as const, revisions: 'period-revisions' as const, identity: 'label' as const, reference: 'period' as const, keys: ['startDate', 'endDate'] },
  divisions: { root: 'divisions' as const, revisions: 'division-revisions' as const, identity: 'slug' as const, reference: 'division' as const, keys: ['description', 'workPrograms', 'displayOrder', 'example', 'period'] },
  members: { root: 'members' as const, revisions: 'member-revisions' as const, identity: 'slug' as const, reference: 'member' as const, keys: ['name', 'position', 'period', 'division', 'photo', 'displayOrder', 'example', 'assets'] },
  research: { root: 'research-publications' as const, revisions: 'research-revisions' as const, identity: 'slug' as const, reference: 'research' as const, keys: ['title', 'excerpt', 'body', 'publicAuthor', 'sources', 'category', 'analysisDate', 'cover', 'pdf', 'baseDisclaimer', 'additionalNote', 'assets'] },
  recruitment: { root: 'recruitment-periods' as const, revisions: 'recruitment-revisions' as const, identity: 'slug' as const, reference: 'recruitment' as const, keys: ['title','description','period','positions','selectionStages','opensAt','closesAt','registrationURL','registrationConfirmed'] },
  events: { root: 'events' as const, revisions: 'event-revisions' as const, identity: 'slug' as const, reference: 'event' as const, keys: ['title', 'description', 'poster', 'startAt', 'endAt', 'locationType', 'location', 'onlineURL', 'organizer', 'cancelled', 'cancellationNote', 'registrationStatus', 'registrationURL', 'registrationConfirmed', 'registrationOpensAt', 'registrationClosesAt', 'assets'] },
}[kind]);
export function editorialKind(value: string): EditorialKind {
  if (!editorialKinds.some(kind => kind === value)) throw new APIError('Unknown editorial kind', 404);
  return value as EditorialKind;
}
export function validateIdentity(kind: EditorialKind, value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.length > 120 || /[<>\u0000-\u001f\u007f]/.test(value) || kind === 'divisions' && !Object.hasOwn(divisionNames, value)) throw new APIError('Invalid organization identity', 400);
  if (['members', 'research', 'events', 'recruitment'].includes(kind) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new APIError('Use a stable lowercase slug', 400);
  return value.trim();
}
export function validateDraft(kind: EditorialKind, data: Record<string, unknown>, complete = false) {
  try {
    if (kind === 'recruitment') validateRecruitment(data, complete);
    else if (kind === 'members') {
      for (const key of ['name', 'position']) if (!settingsText(data[key], 160) || complete && (typeof data[key] !== 'string' || !data[key].trim())) throw Error('Public name and position required');
      if (!Number.isSafeInteger(data.period) || Number(data.period) < 1) throw Error('Published period is required');
      if (!Number.isInteger(data.displayOrder) || Number(data.displayOrder) < 0 || Number(data.displayOrder) > 1000 || typeof data.example !== 'boolean') throw Error('Invalid display order or example label');
    } else if (kind === 'research' || kind === 'events') validatePublication(kind, data, complete);
    else validateOrganization(kind, data, complete);
  } catch (error) { throw new APIError((error as Error).message, 400); }
}
export function reviewedFields(kind: EditorialKind, virtual = false): Field[] {
  if (kind === 'recruitment') return recruitmentFields(virtual);
  if (kind === 'research' || kind === 'events') return publicationFields(kind, virtual);
  if (kind === 'members') return [
    { name: 'name', type: 'text', maxLength: 160, virtual, admin: { readOnly: false, description: 'Nama publik, bukan akun CMS.' } },
    { name: 'position', type: 'text', maxLength: 160, virtual, admin: { readOnly: false } },
    { name: 'period', type: 'relationship', relationTo: 'organizational-periods', maxDepth: 0, virtual, admin: { readOnly: false, description: 'Wajib terbit sebelum pengurus diajukan.' } },
    { name: 'division', type: 'relationship', relationTo: 'divisions', maxDepth: 0, virtual, admin: { readOnly: false, description: 'Opsional untuk jabatan tingkat organisasi.' } },
    { name: 'photo', type: 'relationship', relationTo: 'media', maxDepth: 0, virtual, admin: { readOnly: false } },
    { name: 'displayOrder', type: 'number', min: 0, max: 1000, defaultValue: 0, virtual, admin: { readOnly: false } },
    { name: 'example', type: 'checkbox', defaultValue: true, virtual, admin: { readOnly: false } },
    revisionAssetsField(virtual),
  ];
  const fields: Extract<Field, { type: 'text' | 'textarea' | 'number' | 'checkbox' | 'relationship' }>[] = kind === 'periods'
    ? ['startDate', 'endDate'].map(name => ({ name, type: 'text', maxLength: 10, admin: { description: 'Tanggal kalender YYYY-MM-DD, tanpa konversi zona waktu.' } }))
    : [
      { name: 'description', type: 'textarea', maxLength: 6000 }, { name: 'workPrograms', type: 'textarea', maxLength: 6000 },
      { name: 'displayOrder', type: 'number', min: 0, max: 1000, defaultValue: 0 },
      { name: 'example', label: 'Data contoh (belum dikonfirmasi resmi)', type: 'checkbox', defaultValue: true },
      { name: 'period', label: 'Periode terkait (opsional)', type: 'relationship', relationTo: 'organizational-periods', maxDepth: 0 },
    ];
  return fields.map(field => { field.virtual = virtual; field.admin ??= {}; field.admin.readOnly = false; return field; });
}
export type EditorialDoc = { id: number; owner: number; assignedTo?: number[] | null; createdBy: number; lockVersion: number; workingRevision?: number | null; publicRevision?: number | null; label?: string; slug?: string; deletedAt?: string | null; createdAt: string };
export type EditorialRevision = Record<string, unknown> & { id: number; entity: number; number: number; editVersion: number; state: string; assets?: ArticleRevision['assets'] };
