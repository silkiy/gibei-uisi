import assert from 'node:assert/strict';
import test from 'node:test';
import { publicBody } from '../../src/content/serialization.ts';
test('public rich text strips unapproved nodes, styles and private-shaped metadata', () => {
  const body = publicBody({ root: { type: 'root', version: 1, owner: 99, children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Approved text', email: 'private@example.invalid', style: 'background:url(x)' }, { type: 'upload', value: 99 }, { type: 'heading', tag: 'script', children: [] }] }] } });
  const json = JSON.stringify(body);
  assert.ok(json.includes('Approved text'));
  for (const key of ['owner', 'email', 'style', 'upload', 'script']) assert.ok(!json.includes(key));
  assert.equal(publicBody({ root: { type: 'text', text: 'not a root' } }), null);
});
