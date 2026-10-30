import assert from 'node:assert/strict';
import test from 'node:test';
import { accountSnapshot, removesActiveAdmin, validateAccountInput } from './account-policy.ts';

test('last Admin protection considers resulting role and status', () => {
  const admin = { role: 'admin', status: 'active' };
  assert.equal(removesActiveAdmin(admin, { role: 'media' }), true);
  assert.equal(removesActiveAdmin(admin, { status: 'inactive' }), true);
  assert.equal(removesActiveAdmin(admin, { name: 'New name' }), false);
  assert.equal(removesActiveAdmin({ role: 'media', status: 'active' }, { status: 'inactive' }), false);
});

test('account input rejects credential internals and weak local resets', () => {
  for (const key of ['sessions', 'hash', 'salt', 'resetPasswordToken', 'resetPasswordExpiration', 'enableAPIKey', 'apiKey']) {
    assert.throws(() => validateAccountInput({ [key]: 'forged' }));
  }
  assert.throws(() => validateAccountInput({ password: 'short' }));
  assert.doesNotThrow(() => validateAccountInput({ password: 'long-random-local-password', name: 'Demo' }));
});

test('audit snapshot uses only account metadata and cannot retain credentials', () => {
  assert.deepEqual(accountSnapshot({ id: 1, name: 'Demo', email: 'demo@example.invalid', role: 'media', status: 'active', password: 'secret', hash: 'hash', sessions: ['token'] }), {
    name: 'Demo', email: 'demo@example.invalid', role: 'media', status: 'active',
  });
});
