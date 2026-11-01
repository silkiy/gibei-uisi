import { validateDraft as validateArticle } from '../editorial/policy';
import { validateComplete } from '../editorial/review-policy';
import { settingsText } from '../validation/navigation.mjs';
import { calendarDate } from '../validation/organization.mjs';
import { safeExternalURL } from './links.mjs';
import { RESEARCH_DISCLAIMER } from './research-policy.mjs';
import { utcTimestamp } from '../events/status.mjs';

const required = (value: unknown, max: number) => typeof value === 'string' && !!value.trim() && settingsText(value, max, true);
export function validatePublication(kind: 'research' | 'events', data: Record<string, unknown>, complete: boolean) {
  if (kind === 'research') {
    validateArticle(data as Parameters<typeof validateArticle>[0]);
    if (data.analysisDate && !calendarDate(data.analysisDate) || complete && !calendarDate(data.analysisDate)) throw Error('Tanggal analisis kalender wajib sebelum publikasi');
    if (data.baseDisclaimer !== RESEARCH_DISCLAIMER) throw Error('Disclaimer dasar tidak boleh dihapus atau diganti');
    if (!settingsText(data.additionalNote, 2000, true)) throw Error('Catatan tambahan tidak valid');
    if (complete) {
      validateComplete(data as Parameters<typeof validateComplete>[0]);
      if (!Number.isSafeInteger(data.category) || !Array.isArray(data.sources) || !data.sources.length) throw Error('Kategori dan sumber analisis wajib');
    }
  } else {
    for (const [key, max] of [['title', 240], ['description', 6000], ['location', 500], ['organizer', 160], ['cancellationNote', 1000]] as const) if (!settingsText(data[key], max, key === 'description' || key === 'cancellationNote') || complete && ['title', 'description', 'organizer'].includes(key) && !required(data[key], max)) throw Error('Informasi kegiatan tidak lengkap atau tidak valid');
    if (complete && (!data.startAt || !data.endAt)) throw Error('Mulai dan selesai wajib');
    for (const key of ['startAt', 'endAt', 'registrationOpensAt', 'registrationClosesAt']) if (data[key]) utcTimestamp(data[key]);
    if (data.startAt && data.endAt && Date.parse(String(data.endAt)) <= Date.parse(String(data.startAt))) throw Error('Selesai harus setelah mulai');
    if (data.registrationOpensAt && data.registrationClosesAt && Date.parse(String(data.registrationClosesAt)) <= Date.parse(String(data.registrationOpensAt))) throw Error('Jendela pendaftaran tidak valid');
    if (!['offline', 'online'].includes(String(data.locationType)) || !['closed', 'open'].includes(String(data.registrationStatus)) || typeof data.cancelled !== 'boolean' || typeof data.registrationConfirmed !== 'boolean') throw Error('Status atau lokasi tidak valid');
    for (const key of ['onlineURL', 'registrationURL']) if (data[key] && !safeExternalURL(data[key])) throw Error('Tautan wajib HTTPS yang valid');
    if (data.registrationConfirmed && !data.registrationURL) throw Error('Konfirmasi membutuhkan tujuan pendaftaran');
    if (complete && (data.locationType === 'offline' ? !required(data.location, 500) : !safeExternalURL(data.onlineURL))) throw Error('Lokasi atau kanal online wajib');
    if (complete && data.cancelled && !required(data.cancellationNote, 1000)) throw Error('Keterangan pembatalan wajib');
  }
}
