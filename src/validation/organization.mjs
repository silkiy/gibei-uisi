import { settingsText } from './navigation.mjs';

export const divisionNames = Object.freeze({
  secretary: 'Secretary', treasurer: 'Treasurer', strategy: 'Strategy', research: 'Research',
  'human-resource': 'Human Resource', partnership: 'Partnership', 'event-organizer': 'Event Organizer', 'media-communication': 'Media Communication',
});
export function calendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '2199-12-31') return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateOrganization(kind, draft, complete = false) {
  if (kind === 'periods') {
    for (const key of ['startDate', 'endDate']) if ((complete || draft[key]) && !calendarDate(draft[key])) throw Error('Use valid calendar dates YYYY-MM-DD');
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) throw Error('Period end precedes start');
  } else if (kind === 'divisions') {
    for (const key of ['description', 'workPrograms']) if (!settingsText(draft[key], 6000, true) || complete && (typeof draft[key] !== 'string' || !draft[key].trim())) throw Error('Description and work programs are required bounded text');
    if (!Number.isInteger(draft.displayOrder) || draft.displayOrder < 0 || draft.displayOrder > 1000 || typeof draft.example !== 'boolean') throw Error('Invalid display order or example label');
  } else throw Error('Unsupported organization kind');
}
