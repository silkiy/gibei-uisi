import assert from 'node:assert/strict';
import { before,test } from 'node:test';
import pg from 'pg';
import { localTestConnection, assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';
import { reviewedFixture } from '../support/reviewed.mjs';
let f,period,one,two;
const fields=()=>({title:'Kampanye contoh',description:'Belajar dan berkontribusi.',period:period.id,positions:[{title:'Ketua',requirements:'Persyaratan contoh.'}],selectionStages:[{title:'Seleksi',description:'Tahapan contoh.'}],opensAt:'2099-11-01T09:00',closesAt:'2099-11-02T09:00',registrationURL:'https://example.com/apply',registrationConfirmed:true});
const state=async()=> (await (await f.admin.request('/api/globals/recruitment-state')).json());
const select=(version,id,actor=f.admin)=>actor.request('/api/globals/recruitment-state',{method:'POST',data:{expectedVersion:version,enabledCampaign:id}});
const detail=slug=>f.anonymous.request(`/api/public/recruitment/${slug}`);
before(async()=>{f=await reviewedFixture('recruitment');period=await f.publishReviewed('periods',await f.create('periods','Periode rekrutmen contoh',{startDate:'2099-01-01',endDate:'2100-01-01'}));});
test('recruitment validates relations and nested requirements, isolates owners and reviews the complete snapshot',async()=>{
  const privatePeriod=await f.create('periods','Periode privat rekrutmen',{startDate:'2099-01-01',endDate:'2100-01-01'});
  assert.equal((await f.a.request('/api/recruitment-periods',{method:'POST',data:{slug:'invalid-period',...fields(),period:privatePeriod.id,registrationConfirmed:false}})).status,409);
  one=await f.create('recruitment','kampanye-contoh-satu',fields());
  assert.equal((await f.b.request(`/api/recruitment-periods/${one.id}`)).status,404);
  assert.equal((await f.anonymous.request('/api/recruitment-periods')).status,403);
  assert.equal((await detail(one.slug)).status,404);
  assert.equal((await f.a.request(`/api/recruitment-periods/${one.id}`,{method:'PATCH',data:{expectedLockVersion:one.lockVersion,positions:[null]}})).status,400);
  assert.equal((await f.a.request(`/api/recruitment-periods/${one.id}`,{method:'PATCH',data:{expectedLockVersion:one.lockVersion,enabledByAdmin:true}})).status,403);
  one=await f.save('recruitment',one,{positions:[]});assert.equal((await f.command('recruitment',one,'submit',{},f.a)).status,400);
  one=await f.save('recruitment',one,{positions:fields().positions,registrationConfirmed:true});assert.equal(one.registrationConfirmed,true);
  const pending=await f.submitReviewed('recruitment',one);
  assert.equal((await f.a.request(`/api/recruitment-periods/${one.id}`,{method:'PATCH',data:{expectedLockVersion:pending.doc.lockVersion,title:'Changed while in review'}})).status,409);
  const published=await f.command('recruitment',pending.doc,'publish',{submissionId:pending.submission.id});assert.equal(published.status,200);one=(await published.json()).doc;
  const dto=await (await detail(one.slug)).json();assert.equal(dto.enabledByAdmin,false);assert.equal(dto.registrationURL,null);assert.equal(dto.positions[0].requirements,'Persyaratan contoh.');assert.ok(!('owner' in dto));
  two=await f.publishReviewed('recruitment',await f.create('recruitment','kampanye-contoh-dua',{...fields(),title:'Kampanye kedua'}));
  const revision=await f.revision('recruitment',one);const edited=await f.save('recruitment',revision,{registrationURL:'https://example.com/changed'});assert.equal(edited.registrationConfirmed,false);assert.equal((await (await detail(one.slug)).json()).title,one.title);
});
test('activation is Admin-only, requires disable before switching and serializes simultaneous selections',async()=>{
  const draft=await f.create('recruitment','kampanye-draft',fields());let initial=await state();
  assert.equal((await select(initial.expectedVersion,one.id,f.a)).status,403);assert.equal((await f.anonymous.request('/api/globals/recruitment-state')).status,403);
  assert.equal((await select(initial.expectedVersion,draft.id)).status,409);
  const races=await Promise.all([select(initial.expectedVersion,one.id),select(initial.expectedVersion,two.id)]);assert.deepEqual(races.map(r=>r.status).sort(),[200,409]);
  initial=await state();const active=initial.enabledCampaign;assert.equal((await select(initial.expectedVersion,active===one.id?two.id:one.id)).status,409);
  assert.equal((await select(initial.expectedVersion,null)).status,200);
  assert.equal((await select((await state()).expectedVersion,one.id)).status,200);
  assert.equal((await (await detail(one.slug)).json()).status,'not_open');
  assert.equal((await f.command('periods',period,'withdraw-publication',{note:'Still referenced.'})).status,409);
});
test('withdrawal clears activation atomically, immutable audit survives failures and closed flags do not mutate',async()=>{
  const pool=new pg.Pool(localTestConnection(process.env,process.env.TEST_MIGRATION_DATABASE_URL));
  const published=await f.read('recruitment',one);
  try {
    assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID,(await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
    await pool.query('REVOKE INSERT ON payload.recruitment_state_audit FROM gibei_runtime');
    try {assert.equal((await f.command('recruitment',published,'withdraw-publication',{note:'Fault audit.'})).status,500);}finally{await pool.query('GRANT INSERT ON payload.recruitment_state_audit TO gibei_runtime');}
    assert.equal((await state()).enabledCampaign,one.id);assert.equal((await detail(one.slug)).status,200);
    assert.equal((await pool.query("SELECT has_table_privilege('gibei_runtime','payload.recruitment_state_audit','UPDATE') AS allowed")).rows[0].allowed,false);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM payload.recruitment_state')).rows[0].n,1);
  }finally{await pool.end();}
  assert.equal((await f.command('recruitment',published,'withdraw-publication',{note:'Withdraw reviewed campaign.'})).status,200);
  assert.equal((await state()).enabledCampaign,null);assert.equal((await detail(one.slug)).status,404);
  const closed=await f.publishReviewed('recruitment',await f.create('recruitment','kampanye-selesai',{...fields(),opensAt:'2020-01-01T09:00',closesAt:'2020-01-02T09:00'}));
  assert.equal((await select((await state()).expectedVersion,closed.id)).status,200);
  const dto=await (await detail(closed.slug)).json();assert.equal(dto.status,'closed');assert.equal(dto.canRegister,false);assert.equal(dto.enabledByAdmin,true);
  assert.equal((await select((await state()).expectedVersion,null)).status,200);
});
