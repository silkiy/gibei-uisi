import { settingsText } from '../validation/navigation.mjs';
import { safeExternalURL as externalHTTPS } from './links.mjs';
import { calendarDate } from '../validation/organization.mjs';

export function validateP1(kind, data, complete = false) {
  for (const key of ['title', 'description', ...(kind === 'partners' ? ['collaboration'] : kind === 'achievements' ? ['category'] : [])]) {
    if (!settingsText(data[key], key === 'description' ? 6000 : 240, key === 'description') || complete && !data[key]?.trim()) throw Error('Judul dan isi wajib berupa teks yang valid');
  }
  if (typeof data.example !== 'boolean') throw Error('Label contoh wajib ditentukan');
  if (kind !== 'partners' && (complete || data.date) && !calendarDate(data.date)) throw Error('Tanggal kalender YYYY-MM-DD wajib valid');
  if (kind === 'galleries') {
    if (!Array.isArray(data.photos) || data.photos.length > 30) throw Error('Maksimum 30 foto');
    for (const photo of data.photos) if (!photo || !Number.isSafeInteger(photo.asset) || photo.asset < 1 || !settingsText(photo.alt, 300) || !photo.alt?.trim() || !settingsText(photo.caption, 600, true)) throw Error('Foto wajib memiliki aset dan alt informatif');
    if (data.videoURL && !externalHTTPS(data.videoURL)) throw Error('Video harus berupa tautan HTTPS');
  }
  if (kind === 'partners') {
    if (data.website && !externalHTTPS(data.website)) throw Error('Website harus HTTPS');
    if (typeof data.showOnHomepage !== 'boolean') throw Error('Pilihan homepage wajib ditentukan');
  }
  if (kind === 'achievements' && !settingsText(data.recipient, 240)) throw Error('Penerima tidak valid');
}
