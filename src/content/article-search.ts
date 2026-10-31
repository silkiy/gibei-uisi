export function articleSearch(query: URLSearchParams) {
  const integer = (name: string, fallback: number, maximum: number) => {
    const value = query.get(name) || '';
    return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= maximum ? Number(value) : fallback;
  };
  return { q: (query.get('q') || '').trim().slice(0, 120), category: (query.get('category') || '').slice(0, 120),
    page: integer('page', 1, 1000000), limit: integer('limit', 12, 48) };
}
