import assert from 'node:assert/strict';
import test from 'node:test';
import { bootstrapCapability, canCreateAccount, isActiveAdmin } from './policy.ts';

test('anonymous, Media and inactive Admin cannot provision accounts', () => {
  for (const user of [null, { role: 'media', status: 'active' }, { role: 'admin', status: 'inactive' }]) {
    assert.equal(canCreateAccount(user, {}), false);
  }
  assert.equal(isActiveAdmin({ role: 'admin', status: 'active' }), true);
});
test('JSON context cannot forge bootstrap capability', () => {
  assert.equal(canCreateAccount(null, { bootstrap: true, bootstrapCapability: true }), false);
  assert.equal(canCreateAccount(null, { [bootstrapCapability]: true }), true);
});
