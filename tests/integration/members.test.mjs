import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import pg from 'pg';
import { reviewedFixture } from '../support/reviewed.mjs';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';
let f, oldPeriod, newPeriod, emptyPeriod, privatePeriod, member, second, photo;
before(async () => {
  f = await reviewedFixture('members');
  oldPeriod = await f.publishReviewed('periods', await f.create('periods', 'Contoh periode 2022', { startDate: '2022-01-01', endDate: '2022-12-31' }));
  newPeriod = await f.publishReviewed('periods', await f.create('periods', 'Contoh periode 2023', { startDate: '2023-01-01', endDate: '2023-12-31' }));
  emptyPeriod = await f.publishReviewed('periods', await f.create('periods', 'Contoh periode kosong 2021', { startDate: '2021-01-01', endDate: '2021-12-31' }));
  privatePeriod = await f.create('periods', 'Contoh periode privat 2024', { startDate: '2024-01-01', endDate: '2024-12-31' });
  photo = await f.upload(f.a);
});
const listing = async period => (await (await f.anonymous.request(`/api/public/members?periode=${period.id}`)).json());

test('public members require a published period; organization-level positions and private photos are supported', async () => {
  for (const period of [null, privatePeriod.id]) {
    const response = await f.admin.request('/api/members', { method: 'POST', data: { slug: `invalid-member-${period}`, name: 'Contoh nama', position: 'Ketua', period } });
    assert.ok([400, 409].includes(response.status));
  }
  member = await f.create('members', 'contoh-ketua-2022', { name: 'Contoh Ketua', position: 'Ketua organisasi', period: oldPeriod.id, division: null, photo: photo.id });
  assert.equal((await f.b.request(`/api/members/${member.id}`)).status, 404);
  assert.equal((await f.anonymous.request(`/api/media/${photo.key}/original`)).status, 404);
  assert.equal((await listing(oldPeriod)).members.length, 0);
  member = await f.publishReviewed('members', member);
  second = await f.publishReviewed('members', await f.create('members', 'contoh-ketua-2023', { name: 'Contoh Ketua Baru', position: 'Ketua organisasi', period: newPeriod.id }));
  const old = await listing(oldPeriod), current = await listing(newPeriod);
  assert.equal(old.members[0].name, 'Contoh Ketua'); assert.equal(old.members[0].division, null);
  assert.equal(current.members[0].name, 'Contoh Ketua Baru');
  assert.ok(!JSON.stringify(old.members).includes('owner') && !JSON.stringify(old.members).includes('createdBy'));
  assert.equal((await f.anonymous.request(`/api/media/${photo.key}/original`)).status, 200);
  assert.ok((await (await f.anonymous.request(`/tentang/struktur?periode=${oldPeriod.id}`)).text()).includes('Contoh Ketua'));
  const unused = await f.create('members', 'contoh-pengurus-sementara', { name: 'Contoh sementara', position: 'Jabatan contoh', period: oldPeriod.id }, f.a);
  assert.equal(unused.createdBy, f.a.user.id);
  assert.equal((await f.command('members', unused, 'delete-draft', { note: 'Tidak dipakai.' }, f.a)).status, 403);
  assert.equal((await f.command('members', unused, 'delete-draft', { note: 'Hapus draft tanpa publikasi.' })).status, 200);
  assert.equal((await f.admin.request(`/api/members/${unused.id}`)).status, 404);
});

test('member relation/photo changes stay private until approval and prevent period withdrawal while published', async () => {
  assert.equal((await f.command('periods', oldPeriod, 'withdraw-publication', { note: 'Ada pengurus.' })).status, 409);
  let draft = await f.revision('members', member);
  assert.equal((await f.a.request(`/api/members/${member.id}`, { method: 'PATCH', data: { expectedLockVersion: draft.lockVersion, period: privatePeriod.id } })).status, 409);
  const replacement = await f.upload(f.a);
  draft = await f.save('members', draft, { period: newPeriod.id, photo: replacement.id, name: 'Contoh Revisi Ketua' });
  assert.equal((await listing(oldPeriod)).members[0].name, 'Contoh Ketua');
  assert.equal((await f.anonymous.request(`/api/media/${replacement.key}/original`)).status, 404);
  member = await f.publishReviewed('members', draft);
  assert.equal((await listing(oldPeriod)).members.length, 0);
  assert.ok((await listing(newPeriod)).members.some(row => row.name === 'Contoh Revisi Ketua'));
  assert.equal((await f.anonymous.request(`/api/media/${photo.key}/original`)).status, 404);
  assert.equal((await f.anonymous.request(`/api/media/${replacement.key}/original`)).status, 200);
  assert.equal((await f.admin.request(`/api/media/${photo.key}/manage`, { method: 'POST', data: { action: 'delete', note: 'Historical photo' } })).status, 409);
  assert.equal((await f.command('members', member, 'withdraw-publication', { note: 'Tarik profil contoh.' })).status, 200);
  assert.equal((await f.anonymous.request(`/api/media/${replacement.key}/original`)).status, 404);
});

test('active-period selection is Admin-only, compare-and-swap safe and clears atomically on lawful withdrawal', async () => {
  const state = async () => (await (await f.admin.request('/api/globals/organization-state')).json());
  const select = (doc, activePeriod, actor = f.admin) => actor.request('/api/globals/organization-state', { method: 'POST', data: { expectedVersion: doc.expectedVersion, activePeriod } });
  const initial = await state();
  assert.equal((await select(initial, newPeriod.id, f.a)).status, 403);
  assert.equal((await f.anonymous.request('/api/globals/organization-state')).status, 403);
  assert.equal((await select(initial, privatePeriod.id)).status, 409);
  const concurrent = await Promise.all([select(initial, oldPeriod.id), select(initial, newPeriod.id)]);
  assert.deepEqual(concurrent.map(result => result.status).sort(), [200, 409]);
  assert.equal((await state()).expectedVersion, initial.expectedVersion + 1);
  let response = await select(await state(), newPeriod.id); assert.equal(response.status, 200);
  assert.equal((await f.command('periods', newPeriod, 'withdraw-publication', { note: 'Masih dipakai anggota.' })).status, 409);
  assert.equal((await state()).activePeriod, newPeriod.id);
  response = await select(await state(), emptyPeriod.id); assert.equal(response.status, 200);
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  try {
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID, (await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    await pool.query('REVOKE INSERT ON payload.organization_state_audit FROM gibei_runtime');
    try { assert.equal((await f.command('periods', emptyPeriod, 'withdraw-publication', { note: 'Fault audit.' })).status, 500); }
    finally { await pool.query('GRANT INSERT ON payload.organization_state_audit TO gibei_runtime'); }
    assert.equal((await state()).activePeriod, emptyPeriod.id);
    assert.equal((await f.read('periods', emptyPeriod)).publicRevision, emptyPeriod.publicRevision);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM payload.organization_state')).rows[0].n, 1);
  } finally { await pool.end(); }
  assert.equal((await f.command('periods', emptyPeriod, 'withdraw-publication', { note: 'Periode tidak dipakai.' })).status, 200);
  assert.equal((await state()).activePeriod, null);
  assert.equal((await (await f.anonymous.request('/api/public/members')).json()).activePeriod, null);
  assert.ok((await (await f.anonymous.request('/tentang/struktur')).text()).includes('Periode aktif belum ditetapkan'));
  assert.ok((await listing(newPeriod)).members.some(row => row.name === second.name));
});
