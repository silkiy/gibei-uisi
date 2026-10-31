import assert from 'node:assert/strict';
import test from 'node:test';
import { articleSearch } from '../../src/content/article-search.ts';
test('public pagination follows PRD defaults and accepts up to 48 items without coercing malformed numbers', () => {
  assert.deepEqual(articleSearch(new URLSearchParams()), { q: '', category: '', page: 1, limit: 12 });
  for (const value of ['0', '-1', 'NaN', '1.5', '1e2', '99999999999999999']) {
    const result = articleSearch(new URLSearchParams({ page: value, limit: value }));
    assert.equal(result.page, 1); assert.equal(result.limit, 12);
  }
  assert.equal(articleSearch(new URLSearchParams('limit=48&page=2')).limit, 48);
  assert.equal(articleSearch(new URLSearchParams('limit=49')).limit, 12);
  assert.equal(articleSearch(new URLSearchParams('q=%20Pasar%20Modal%20&category=unknown')).q, 'Pasar Modal');
});
