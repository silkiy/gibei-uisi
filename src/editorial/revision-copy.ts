export function copyDraftPayload(source: Record<string, unknown>) {
  const copy = structuredClone(source);
  for (const field of ['sources', 'assets', 'related']) {
    if (Array.isArray(copy[field])) copy[field] = copy[field].map(row => {
      const item = { ...row }; delete item.id; return item;
    });
  }
  return copy;
}
