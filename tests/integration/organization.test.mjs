import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import pg from 'pg';
import { editorialFixture } from '../support/editorial.mjs';
import { divisionNames } from '../../src/validation/organization.mjs';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';
let f, period, submitted, divisions = [];
before(async () => { f = await editorialFixture('organization'); });
const root = kind => kind === 'periods' ? 'organizational-periods' : 'divisions';
const command = (actor, kind, doc, action, extra = {}) => actor.request(`/api/editorial/organization/${kind}/${doc.id}/${action}`, { method: 'POST', data: {
  expectedLockVersion: doc.lockVersion, expectedRevisionId: ['withdraw-publication', 'create-revision'].includes(action) ? doc.publicRevision || doc.expectedRevisionId : doc.workingRevision, ...extra,
} });
async function create(kind, data) {
  const response = await f.admin.request(`/api/${root(kind)}`, { method: 'POST', data: { owner: f.a.user.id, ...data } });
  assert.equal(response.status, 201); return (await response.json()).doc;
}
async function read(kind, id) { const response = await f.admin.request(`/api/${root(kind)}/${id}`); assert.equal(response.status, 200); return response.json(); }
async function publish(kind, doc) {
  const response = await command(f.a, kind, doc, 'submit'); assert.equal(response.status, 200); const pending = await response.json();
  const result = await command(f.admin, kind, pending.doc, 'publish', { submissionId: pending.submission.id }); assert.equal(result.status, 200); return (await result.json()).doc;
}

test('period identity and calendar dates are validated; private ownership cannot be bypassed', async () => {
  period = await create('periods', { label: 'Contoh 2026/2027', startDate: '2026-01-01', endDate: '2027-12-31' });
  assert.equal(period.startDate, '2026-01-01'); assert.equal(period.endDate, '2027-12-31');
  assert.equal((await f.admin.request('/api/organizational-periods', { method: 'POST', data: { label: period.label } })).status, 400);
  for (const [startDate, endDate] of [['2026-02-30', '2026-12-31'], ['2026-12-31', '2026-01-01']]) {
    assert.equal((await f.admin.request('/api/organizational-periods', { method: 'POST', data: { label: `Bad ${startDate}`, startDate, endDate } })).status, 400);
  }
  assert.equal((await f.a.request('/api/organizational-periods', { method: 'POST', data: { label: 'Unauthorized' } })).status, 403);
  assert.equal((await f.b.request(`/api/organizational-periods/${period.id}`)).status, 404);
  assert.equal((await f.anonymous.request('/api/organizational-periods')).status, 403);
  const docs = (await (await f.anonymous.request('/api/public/organization/periods')).json()).docs;
  assert.equal(docs.length, 0);
  for (const data of [{ publicRevision: 999 }, { owner: f.b.user.id }, { state: 'published' }, { deletedAt: new Date().toISOString() }]) assert.equal((await f.a.request(`/api/organizational-periods/${period.id}`, { method: 'PATCH', data: { expectedLockVersion: period.lockVersion, ...data } })).status, 403);
  const saved = await f.a.request(`/api/organizational-periods/${period.id}`, { method: 'PATCH', data: { expectedLockVersion: period.lockVersion, deletedAt: null, startDate: period.startDate } });
  assert.equal(saved.status, 200, 'A normal full CMS form includes a null tombstone'); period = (await saved.json()).doc;
});

test('period revisions preserve approved calendar days and require a fresh Admin decision', async () => {
  let response = await command(f.a, 'periods', period, 'submit'); assert.equal(response.status, 200); submitted = await response.json();
  assert.equal((await command(f.a, 'periods', submitted.doc, 'publish', { submissionId: submitted.submission.id })).status, 403);
  response = await command(f.admin, 'periods', submitted.doc, 'request-revision', { submissionId: submitted.submission.id, note: 'Periksa tanggal contoh.' });
  assert.equal(response.status, 200); const requested = (await response.json()).doc;
  assert.equal((await f.b.request(`/api/organization-reviews/${submitted.submission.id}`)).status, 404);
  assert.equal((await f.a.request(`/api/organization-reviews/${submitted.submission.id}`)).status, 200);
  response = await f.a.request(`/api/organizational-periods/${period.id}`, { method: 'PATCH', data: { expectedLockVersion: requested.lockVersion, endDate: '2027-06-30' } });
  assert.equal(response.status, 200); period = await publish('periods', (await response.json()).doc);
  const published = (await (await f.anonymous.request('/api/public/organization/periods')).json()).docs[0];
  assert.deepEqual(published, { label: period.label, startDate: '2026-01-01', endDate: '2027-06-30' });
  response = await command(f.a, 'periods', period, 'create-revision'); assert.equal(response.status, 200); period = (await response.json()).doc;
  const concurrent = await Promise.all(['2027-08-01', '2027-09-01'].map(endDate => f.a.request(`/api/organizational-periods/${period.id}`, { method: 'PATCH', data: { expectedLockVersion: period.lockVersion, endDate } })));
  assert.deepEqual(concurrent.map(result => result.status).sort(), [200, 409]); period = await read('periods', period.id);
  assert.equal((await (await f.anonymous.request('/api/public/organization/periods')).json()).docs[0].endDate, '2027-06-30');
  assert.equal((await command(f.admin, 'periods', submitted.doc, 'publish', { submissionId: submitted.submission.id })).status, 409);
});

test('all eight example divisions publish through review and public readers never expose drafts or ownership', async () => {
  assert.equal((await f.admin.request('/api/divisions', { method: 'POST', data: { slug: 'unknown' } })).status, 400);
  let order = 0;
  for (const [slug, name] of Object.entries(divisionNames)) {
    const draft = await create('divisions', { slug, description: `Contoh profil ${name}.`, workPrograms: `Contoh program ${name}.`, displayOrder: order++, example: true, ...(slug === 'secretary' ? { period: period.id } : {}) });
    assert.equal((await f.anonymous.request(`/tentang/divisi/${slug}`)).status, 404);
    assert.equal((await f.b.request(`/api/divisions/${draft.id}`)).status, 404);
    divisions.push(await publish('divisions', draft));
  }
  const response = await f.anonymous.request('/api/public/organization/divisions'); assert.equal(response.status, 200);
  const docs = (await response.json()).docs; assert.equal(docs.length, 8);
  assert.deepEqual(docs.map(doc => doc.name), Object.values(divisionNames));
  assert.ok(docs.every(doc => doc.example === true && !('owner' in doc) && !('workingRevision' in doc)));
  const html = await (await f.anonymous.request('/tentang/divisi')).text();
  for (const name of Object.values(divisionNames)) assert.ok(html.includes(name));
  assert.ok(html.includes('Data contoh'));
});

test('period withdrawal and deletion refuse division dependencies; unreferenced draft deletion keeps audit history', async () => {
  assert.equal((await command(f.admin, 'periods', period, 'withdraw-publication', { note: 'Masih dipakai.' })).status, 409);
  assert.equal((await f.admin.request(`/api/organizational-periods/${period.id}`, { method: 'DELETE' })).status, 403);
  const temporary = await create('periods', { label: 'Contoh sementara', startDate: '2026-01-01', endDate: '2026-12-31' });
  let response = await command(f.admin, 'divisions', divisions[0], 'create-revision'); assert.equal(response.status, 200);
  let working = (await response.json()).doc;
  response = await f.a.request(`/api/divisions/${working.id}`, { method: 'PATCH', data: { expectedLockVersion: working.lockVersion, period: temporary.id, description: 'PRIVAT DIVISI BARU' } });
  assert.equal(response.status, 200); working = (await response.json()).doc;
  assert.equal((await command(f.a, 'divisions', working, 'submit')).status, 409, 'Referenced period must be approved');
  response = await command(f.admin, 'periods', temporary, 'delete-draft', { note: 'Masih dirujuk draft.' }); assert.equal(response.status, 409); assert.ok((await response.json()).references.length);
  assert.ok(!(await (await f.anonymous.request('/tentang/divisi/secretary')).text()).includes('PRIVAT DIVISI BARU'));
  const independent = await create('periods', { label: 'Contoh boleh dihapus', startDate: '2026-01-01', endDate: '2026-12-31' });
  assert.equal((await command(f.admin, 'periods', independent, 'delete-draft', { note: 'Hapus draft kosong referensi.' })).status, 200);
  assert.equal((await f.admin.request(`/api/organizational-periods/${independent.id}`)).status, 404);
  assert.equal((await f.admin.request(`/api/organization-audit?where[entityId][equals]=${independent.id}`)).status, 200);
});

test('organization audit failure rolls back edits and audit is immutable at HTTP and database boundaries', async () => {
  const before = await read('periods', period.id);
  const pool = new pg.Pool(localTestConnection(process.env, process.env.TEST_MIGRATION_DATABASE_URL));
  try {
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID, (await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    await pool.query('REVOKE INSERT ON payload.organization_audit FROM gibei_runtime');
    try { assert.equal((await f.a.request(`/api/organizational-periods/${period.id}`, { method: 'PATCH', data: { expectedLockVersion: before.lockVersion, endDate: '2027-11-01' } })).status, 500); }
    finally { await pool.query('GRANT INSERT ON payload.organization_audit TO gibei_runtime'); }
    assert.equal((await read('periods', period.id)).lockVersion, before.lockVersion);
    assert.equal((await read('periods', period.id)).endDate, before.endDate);
    assert.equal((await pool.query("SELECT has_table_privilege('gibei_runtime','payload.organization_audit','UPDATE') AS allowed")).rows[0].allowed, false);
    assert.equal((await f.admin.request('/api/organization-audit', { method: 'POST', data: { kind: 'periods' } })).status, 403);
    assert.equal((await f.a.request('/api/organization-audit')).status, 403);
  } finally { await pool.end(); }
});
