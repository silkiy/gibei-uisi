import { calendarDate } from '../validation/organization.mjs';
import { safeExternalURL } from '../content/links.mjs';

export function utcTimestamp(value) {
  if (typeof value !== 'string') throw Error('Waktu harus berupa ISO datetime dalam WIB');
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!match || !calendarDate(match[1]) || +match[2] > 23 || +match[3] > 59 || +(match[4] || 0) > 59) throw Error('Waktu kalender tidak valid');
  const zone = match[6];
  if (zone && zone !== 'Z' && (+zone.slice(1, 3) > 14 || +zone.slice(4) > 59 || +zone.slice(1, 3) === 14 && +zone.slice(4) !== 0)) throw Error('Offset waktu tidak valid');
  const date = new Date(value + (zone ? '' : '+07:00'));
  if (!Number.isFinite(date.getTime())) throw Error('Waktu tidak valid');
  return date.toISOString();
}
export function wibTimestamp(value) {
  if (!value) return null;
  return new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 23) + '+07:00';
}
export function eventStatus(event, now = Date.now()) {
  const start = Date.parse(event.startAt), end = Date.parse(event.endAt);
  const valid = Number.isFinite(start) && Number.isFinite(end) && end > start && Number.isFinite(now);
  const timeStatus = !valid ? 'unavailable' : now < start ? 'upcoming' : now < end ? 'ongoing' : 'completed';
  const cancelled = event.cancelled === true;
  const url = safeExternalURL(event.registrationURL);
  const withinWindow = (!event.registrationOpensAt || now >= Date.parse(event.registrationOpensAt)) && (!event.registrationClosesAt || now < Date.parse(event.registrationClosesAt));
  const canRegister = valid && !cancelled && now < end && event.registrationStatus === 'open' && event.registrationConfirmed === true && !!url && withinWindow;
  return { timeStatus, cancelled, status: cancelled ? 'cancelled' : timeStatus, canRegister, registrationURL: canRegister ? url : null };
}
