import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarDate, validateOrganization, divisionNames } from '../../src/validation/organization.mjs';

test('organization calendar dates reject rollover and preserve literal days across WIB and UTC boundaries', () => {
  for (const value of ['2024-02-29', '2026-01-01', '2026-12-31']) assert.equal(calendarDate(value), true);
  for (const value of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-1-1', '2026-01-01T00:00:00Z']) assert.equal(calendarDate(value), false);
  assert.doesNotThrow(() => validateOrganization('periods', { startDate: '2026-01-01', endDate: '2026-12-31' }, true));
  assert.throws(() => validateOrganization('periods', { startDate: '2026-12-31', endDate: '2026-01-01' }, true));
});
test('exactly eight PRD divisions use reviewed descriptions/programs without recruitment requirements', () => {
  assert.equal(Object.keys(divisionNames).length, 8);
  assert.doesNotThrow(() => validateOrganization('divisions', { description: 'Contoh profil.\nBaris kedua.', workPrograms: 'Contoh program.', displayOrder: 1, example: true }, true));
  for (const fields of [{ description: '<script>' }, { displayOrder: -1 }, { example: 'false' }]) assert.throws(() => validateOrganization('divisions', { description: 'Profil', workPrograms: 'Program', displayOrder: 1, example: true, ...fields }, true));
});
