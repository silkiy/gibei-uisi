import type { Field } from 'payload';
import { draftFields } from './fields';
import { isActiveAdmin } from '../auth/policy';
import { RESEARCH_DISCLAIMER } from '../content/research-policy.mjs';

export function publicationFields(kind: 'research' | 'events', virtual: boolean): Field[] {
  const common = draftFields(virtual);
  const assets = common.find((field): field is Extract<Field, { type: 'array' }> => field.type === 'array' && field.name === 'assets')!;
  const media = (name: string): Field => ({ name, type: 'relationship', relationTo: 'media', maxDepth: 0, virtual, admin: { readOnly: false } });
  if (kind === 'research') return [
    ...common.filter(field => 'name' in field && ['title', 'excerpt', 'body', 'publicAuthor', 'sources'].includes(field.name)),
    { name: 'category', type: 'relationship', relationTo: 'research-categories', maxDepth: 0, virtual, admin: { readOnly: false },
      ...(virtual ? { access: { create: ({ req }) => isActiveAdmin(req.user), update: ({ req }) => isActiveAdmin(req.user) } } : {}) },
    { name: 'analysisDate', label: 'Tanggal analisis (YYYY-MM-DD)', type: 'text', maxLength: 10, virtual, admin: { readOnly: false } },
    media('cover'), media('pdf'),
    { name: 'additionalNote', label: 'Catatan tambahan', type: 'textarea', maxLength: 2000, virtual, admin: { readOnly: false } },
    { name: 'baseDisclaimer', label: 'Disclaimer dasar (tetap)', type: 'textarea', defaultValue: RESEARCH_DISCLAIMER, virtual, admin: { readOnly: true } },
    { ...assets, admin: { hidden: true, readOnly: true } },
  ];
  const timestamp = (name: string, label: string): Field => ({ name, label, type: 'text', virtual, admin: { readOnly: false, description: 'WIB (Asia/Jakarta), contoh 2026-11-01T09:00. Tanpa offset dibaca sebagai WIB; penyimpanan UTC.' } });
  return [
    { name: 'title', type: 'text', maxLength: 240, virtual, admin: { readOnly: false } },
    { name: 'description', type: 'textarea', maxLength: 6000, virtual, admin: { readOnly: false } }, media('poster'),
    timestamp('startAt', 'Mulai (WIB)'), timestamp('endAt', 'Selesai (WIB)'),
    { name: 'locationType', type: 'select', options: ['offline', 'online'], defaultValue: 'offline', virtual, admin: { readOnly: false } },
    { name: 'location', type: 'text', maxLength: 500, virtual, admin: { readOnly: false } },
    { name: 'onlineURL', type: 'text', maxLength: 2048, virtual, admin: { readOnly: false } },
    { name: 'organizer', type: 'text', maxLength: 160, virtual, admin: { readOnly: false } },
    { name: 'cancelled', type: 'checkbox', defaultValue: false, virtual, admin: { readOnly: false } },
    { name: 'cancellationNote', type: 'textarea', maxLength: 1000, virtual, admin: { readOnly: false } },
    { name: 'registrationStatus', type: 'select', options: ['closed', 'open'], defaultValue: 'closed', virtual, admin: { readOnly: false } },
    { name: 'registrationURL', type: 'text', maxLength: 2048, virtual, admin: { readOnly: false } },
    { name: 'registrationConfirmed', label: 'Tujuan pendaftaran dikonfirmasi Admin', type: 'checkbox', defaultValue: false, virtual, admin: { readOnly: false },
      ...(virtual ? { access: { create: ({ req }) => isActiveAdmin(req.user), update: ({ req }) => isActiveAdmin(req.user) } } : {}) },
    timestamp('registrationOpensAt', 'Pendaftaran dibuka (WIB, opsional)'), timestamp('registrationClosesAt', 'Pendaftaran ditutup (WIB, opsional)'),
    { ...assets, admin: { hidden: true, readOnly: true } },
  ];
}
