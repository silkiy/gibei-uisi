import type { Field } from 'payload';
import { APIError } from 'payload';
import { divisionNames, validateOrganization } from '../validation/organization.mjs';

export type OrganizationKind = 'periods' | 'divisions';
export const organizationModel = (kind: OrganizationKind) => kind === 'periods'
  ? { root: 'organizational-periods' as const, revisions: 'period-revisions' as const, identity: 'label' as const, reference: 'period' as const, keys: ['startDate', 'endDate'] }
  : { root: 'divisions' as const, revisions: 'division-revisions' as const, identity: 'slug' as const, reference: 'division' as const, keys: ['description', 'workPrograms', 'displayOrder', 'example', 'period'] };
export function organizationKind(value: string): OrganizationKind {
  if (value !== 'periods' && value !== 'divisions') throw new APIError('Unknown organization kind', 404);
  return value;
}
export function validateIdentity(kind: OrganizationKind, value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.length > 120 || /[<>\u0000-\u001f\u007f]/.test(value) || kind === 'divisions' && !Object.hasOwn(divisionNames, value)) throw new APIError('Invalid organization identity', 400);
  return value.trim();
}
export function validateDraft(kind: OrganizationKind, data: Record<string, unknown>, complete = false) {
  try { validateOrganization(kind, data, complete); } catch (error) { throw new APIError((error as Error).message, 400); }
}
export function organizationFields(kind: OrganizationKind, virtual = false): Field[] {
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
export type OrganizationDoc = { id: number; owner: number; assignedTo?: number[] | null; createdBy: number; lockVersion: number; workingRevision?: number | null; publicRevision?: number | null; label?: string; slug?: string; deletedAt?: string | null; createdAt: string };
export type OrganizationRevision = Record<string, unknown> & { id: number; entity: number; number: number; editVersion: number; state: string };
