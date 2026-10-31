/** @param {unknown} value */
export function safeExternalURL(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** @param {unknown} fields */
export function mediaLinkID(fields) {
  if (!fields || typeof fields !== 'object' || !('linkType' in fields) || fields.linkType !== 'internal' || !('doc' in fields)) return null;
  const doc = fields.doc;
  if (!doc || typeof doc !== 'object' || !('relationTo' in doc) || doc.relationTo !== 'media' || !('value' in doc)) return null;
  const value = doc.value && typeof doc.value === 'object' && 'id' in doc.value ? doc.value.id : doc.value;
  const id = Number(value);
  return (typeof value === 'number' || (typeof value === 'string' && /^[1-9]\d*$/.test(value))) && Number.isSafeInteger(id) && id > 0 ? id : null;
}
