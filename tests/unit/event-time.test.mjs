import assert from 'node:assert/strict';
import test from 'node:test';
import { utcTimestamp, wibTimestamp, eventStatus } from '../../src/events/status.mjs';
const event = { startAt: '2026-11-01T02:00:00.000Z', endAt: '2026-11-01T04:00:00.000Z', cancelled: false, registrationStatus: 'open', registrationConfirmed: true, registrationURL: 'https://example.com/register' };
test('WIB datetime input becomes UTC without accepting invalid calendar rollover or losing milliseconds', () => {
  assert.equal(utcTimestamp('2026-11-01T09:00'), event.startAt);
  assert.equal(utcTimestamp('2026-11-01T09:00:00.123+07:00'), '2026-11-01T02:00:00.123Z');
  assert.equal(utcTimestamp(wibTimestamp('2026-11-01T02:00:00.123Z')), '2026-11-01T02:00:00.123Z');
  for (const value of ['2026-02-30T09:00', '2026-11-01T24:00', '2026-11-01T09:60', '2026-11-01T09:00+25:00', 'yesterday']) assert.throws(() => utcTimestamp(value));
});
test('event boundaries, registration windows, confirmation and cancellation are evaluated from server time', () => {
  const start = Date.parse(event.startAt), end = Date.parse(event.endAt);
  for (const [now, status] of [[start - 1, 'upcoming'], [start, 'ongoing'], [start + 1, 'ongoing'], [end - 1, 'ongoing'], [end, 'completed'], [end + 1, 'completed']]) {
    const result = eventStatus(event, now); assert.equal(result.timeStatus, status); assert.equal(result.canRegister, now < end);
  }
  const window = { ...event, registrationOpensAt: event.startAt, registrationClosesAt: '2026-11-01T03:00:00Z' };
  assert.equal(eventStatus(window, start - 1).canRegister, false); assert.equal(eventStatus(window, start).canRegister, true);
  assert.equal(eventStatus(window, Date.parse(window.registrationClosesAt)).canRegister, false);
  for (const fields of [{ cancelled: true }, { registrationStatus: 'closed' }, { registrationConfirmed: false }, { registrationURL: 'javascript:alert(1)' }]) {
    const result = eventStatus({ ...event, ...fields }, start); assert.equal(result.canRegister, false); assert.equal(result.registrationURL, null);
  }
  assert.equal(eventStatus({ ...event, cancelled: true }, start).status, 'cancelled');
});
