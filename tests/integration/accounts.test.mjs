import assert from 'node:assert/strict';
import { test, before } from 'node:test';
import { fixtureAccounts, authenticate, httpClient } from '../support/http.mjs';

const accounts = fixtureAccounts();
let admin, mediaA, mediaB;
before(async () => {
  admin = await authenticate(accounts.admin);
  mediaA = await authenticate(accounts.mediaA);
  mediaB = await authenticate(accounts.mediaB);
});

test('anonymous and authenticated request fixtures enforce account visibility', async () => {
  assert.equal((await httpClient(process.env.SERVER_URL)('/api/users')).status, 403);
  const list = await admin.request('/api/users');
  assert.equal(list.status, 200);
  const users = await list.json();
  assert.equal(users.totalDocs, 3);
  assert.deepEqual(users.docs.map(user => user.role).sort(), ['admin', 'media', 'media']);
  for (const media of [mediaA, mediaB]) {
    const own = await media.request('/api/users');
    assert.equal(own.status, 200);
    const result = await own.json();
    assert.equal(result.totalDocs, 1);
    assert.equal(result.docs[0].id, media.user.id);
  }
  assert.equal((await mediaA.request(`/api/users/${mediaB.user.id}`)).status, 404);
  assert.equal((await mediaB.request(`/api/users/${mediaA.user.id}`)).status, 404);
});

test('both Media fixtures cannot escalate or read private audit', async () => {
  for (const media of [mediaA, mediaB]) {
    assert.equal((await media.request(`/api/users/${media.user.id}`, { method: 'PATCH', data: { role: 'admin' } })).status, 403);
    assert.equal((await media.request('/api/account-audit')).status, 403);
  }
  const audit = await admin.request('/api/account-audit');
  assert.equal(audit.status, 200);
  assert.equal((await audit.json()).totalDocs, 3, 'Bootstrap and two account creations must each be audited');
});

test('logout invalidates an authenticated fixture on its next request', async () => {
  const session = await authenticate(accounts.mediaA);
  assert.equal((await session.request('/api/users/logout', { method: 'POST' })).status, 200);
  assert.equal((await session.request('/api/users')).status, 403);
});
