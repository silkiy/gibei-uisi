import { safeExternalURL } from '../content/links.mjs';

const routes = new Set(['/', '/tentang', '/tentang/divisi', '/publikasi/artikel', '/#tentang', '/#publikasi', '/#agenda', '/#kontak']);
export const safeNavigationURL = value => typeof value === 'string' && (routes.has(value) || /^\/tentang\/divisi\/[a-z0-9-]+$/.test(value) || /^\/publikasi\/artikel\/[a-z0-9-]+$/.test(value)) ? value : safeExternalURL(value);
export const validEmail = value => typeof value === 'string' && value.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(value);
export function settingsText(value, max, multiline = false) {
  return value == null || typeof value === 'string' && value.length <= max && !(multiline ? /[<>\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/ : /[<>\u0000-\u001f\u007f]/).test(value);
}
