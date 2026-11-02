import assert from 'node:assert/strict';
import {before,test} from 'node:test';
import {randomBytes} from 'node:crypto';
import pg from 'pg';
import {reviewedFixture} from '../support/reviewed.mjs';
import {authenticate,httpClient} from '../support/http.mjs';
import {coordinated} from '../support/barrier.mjs';
import {localTestConnection,assertOwnedTestTarget} from '../../scripts/database/test-config.mjs';
let f,other,period,category;
const common={title:'Contoh kontrak final',description:'Informasi contoh.',example:true};
before(async()=>{
 f=await reviewedFixture('final-contract');
 const account={email:'other-final@test.gibei.invalid',password:randomBytes(24).toString('base64url'),name:'Other final',role:'media',status:'active'};
 assert.equal((await f.admin.request('/api/users',{method:'POST',data:account})).status,201);other=await authenticate(account);
 period=await f.publishReviewed('periods',await f.create('periods','Kontrak final base',{startDate:'2081-01-01',endDate:'2082-01-01'}));
 category=(await (await f.admin.request('/api/research-categories?limit=1')).json()).docs[0];
});
const fields=kind=>({
 periods:{startDate:'2081-01-01',endDate:'2082-01-01'},
 divisions:{description:'Divisi contoh kontrak.',workPrograms:'Program contoh.',displayOrder:0,example:true},
 members:{name:'Pengurus contoh kontrak',position:'Koordinator contoh',period:period.id},
 research:{title:common.title,excerpt:'Contoh kontrak riset.',body:f.rich('Materi contoh.'),publicAuthor:'Tim contoh',category:category.id,analysisDate:'2026-12-31',sources:[{title:'Contoh',url:'https://example.com/source'}]},
 events:{title:common.title,description:common.description,startAt:'2099-01-01T09:00',endAt:'2099-01-01T10:00',location:'Lokasi contoh',organizer:'Tim contoh'},
 recruitment:{title:common.title,description:common.description,period:period.id,positions:[{title:'Contoh',requirements:'Persyaratan contoh.'}],selectionStages:[{title:'Contoh',description:'Tahap contoh.'}],opensAt:'2099-01-01T09:00',closesAt:'2099-01-02T09:00'},
 galleries:{...common,date:'2026-12-31',photos:[]},partners:{...common,collaboration:'Kolaborasi contoh'},achievements:{...common,date:'2025-12-31',category:'Contoh'},
}[kind]);
for(const kind of ['periods','divisions','members','research','events','recruitment','galleries','partners','achievements'])test(`${kind}: public/owner/assignee/other/Admin contract, frozen review and coordinated decisions`,async()=>{
 let doc;
 if(kind==='divisions'){
  doc=(await (await f.admin.request('/api/divisions?where[slug][equals]=treasurer&depth=0')).json()).docs[0];assert.ok(doc);
  if(!doc.workingRevision)doc=(await (await f.command(kind,doc,'create-revision')).json()).doc;
  doc=await f.save(kind,doc,{...fields(kind),owner:f.a.user.id,assignedTo:[f.b.user.id]},f.admin);
 }else doc=await f.create(kind,kind==='periods'?'Kontrak periode final':`final-contract-${kind}`,{...fields(kind),assignedTo:[f.b.user.id]});
 const path=`/api/${f.roots[kind]}/${doc.id}`;
 assert.equal((await f.anonymous.request(path)).status,403);assert.equal((await other.request(path)).status,404);
 assert.equal((await f.a.request(path)).status,200);assert.equal((await f.b.request(path)).status,200);
 assert.equal((await other.request(path,{method:'PATCH',data:{expectedLockVersion:doc.lockVersion,...fields(kind)}})).status,404);
 assert.equal((await f.a.request(path,{method:'PATCH',data:{expectedLockVersion:doc.lockVersion,owner:f.admin.user.id}})).status,403);
 assert.equal((await f.command(kind,doc,'publish',{},f.a)).status,403);
 const pending=await f.submitReviewed(kind,doc);doc=pending.doc;
 assert.equal((await f.b.request(path,{method:'PATCH',data:{expectedLockVersion:doc.lockVersion,...fields(kind)}})).status,409);
 assert.equal((await other.request(`/api/organization-reviews/${pending.submission.id}`)).status,404);
 const responses=await coordinated(()=>[f.command(kind,doc,'publish',{submissionId:pending.submission.id}),f.command(kind,doc,'publish',{submissionId:pending.submission.id})]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);doc=await f.read(kind,doc);
 const publicRevision=doc.publicRevision;assert.ok(publicRevision);
 doc=await f.revision(kind,doc);doc=await f.save(kind,doc,fields(kind),f.b);
 assert.equal(doc.publicRevision,publicRevision);
 assert.equal((await f.command(kind,doc,'archive-revision',{note:'Denied'},f.b)).status,403);
 assert.equal((await f.command(kind,doc,'withdraw-publication',{note:'Final contract withdrawal'})).status,200);doc=await f.read(kind,doc);
 assert.equal(doc.publicRevision,null);
 let result=await f.command(kind,doc,'archive-revision',{note:'Preserve history'});assert.equal(result.status,200);doc=(await result.json()).doc;
 assert.equal((await f.command(kind,doc,'create-revision',{},f.b)).status,403);
 result=await f.command(kind,doc,'create-revision');assert.equal(result.status,200);doc=(await result.json()).doc;
 assert.equal(doc.state,'draft');assert.equal((await f.command(kind,doc,'delete-draft',{note:'Published history retained'})).status,409);
});
test('server rejects cross-site mutations and unsafe input; login cookies and lockout enforce the configured policy',async()=>{
 const draft=await f.create('galleries','final-origin',{...fields('galleries')});
 const foreign={Origin:'https://untrusted.example'};
 assert.equal((await f.a.request(`/api/galleries/${draft.id}`,{method:'PATCH',headers:foreign,data:{expectedLockVersion:draft.lockVersion,title:'Changed cross-site'}})).status,403);
 assert.equal((await f.a.request('/api/globals/site-settings',{method:'POST',data:{siteName:'Spoof'}})).status,403);
 assert.equal((await f.a.request(`/api/galleries/${draft.id}`,{method:'PATCH',data:{expectedLockVersion:draft.lockVersion,videoURL:'javascript:alert(1)'}})).status,400);
 const account={email:'lockout-final@test.gibei.invalid',password:randomBytes(24).toString('base64url'),name:'Lockout example',role:'media',status:'active'};
 assert.equal((await f.admin.request('/api/users',{method:'POST',data:account})).status,201);
 const anonymous=httpClient(process.env.SERVER_URL);
 const login=await anonymous('/api/users/login',{method:'POST',data:{email:account.email,password:account.password}});assert.equal(login.status,200);
 const cookie=login.headers.getSetCookie().find(value=>value.startsWith('payload-token='));assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Lax/i);assert.ok(!/;\s*Secure/i.test(cookie));assert.equal((await login.json()).token,undefined);
 for(let i=0;i<6;i++)assert.notEqual((await anonymous('/api/users/login',{method:'POST',data:{email:account.email,password:'wrong-password-final'}})).status,200);
 assert.notEqual((await anonymous('/api/users/login',{method:'POST',data:{email:account.email,password:account.password}})).status,200);
});
test('read failures return generic errors with correlation IDs; permissions recover without partial state',async()=>{
 const pool=new pg.Pool(localTestConnection(process.env,process.env.TEST_MIGRATION_DATABASE_URL));
 try{
  assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID,(await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
  await pool.query('REVOKE SELECT ON payload.gallery_revisions FROM gibei_runtime');
  try{const r=await f.anonymous.request('/api/public/p1/galleries');assert.equal(r.status,500);const body=await r.text();assert.match(body,/correlationId/);assert.ok(!/SELECT|postgresql|stack|password|gallery_revisions/i.test(body));assert.match(r.headers.get('x-request-id'),/^[a-f0-9-]{36}$/);}
  finally{await pool.query('GRANT SELECT ON payload.gallery_revisions TO gibei_runtime');}
  assert.equal((await f.anonymous.request('/api/public/p1/galleries')).status,200);
 }finally{await pool.end();}
});
test('coordinated active-period and recruitment selections preserve singleton configuration',async()=>{
 const periods=(await (await f.admin.request('/api/organizational-periods?limit=100&depth=0')).json()).docs.filter(d=>d.publicRevision).slice(0,2);assert.equal(periods.length,2);
 const state=await (await f.admin.request('/api/globals/organization-state')).json();
 const choose=id=>f.admin.request('/api/globals/organization-state',{method:'POST',data:{expectedVersion:state.expectedVersion,activePeriod:id}});
 assert.deepEqual((await coordinated(()=>periods.map(doc=>choose(doc.id)))).map(r=>r.status).sort(),[200,409]);
 const campaigns=[];for(let i=0;i<2;i++)campaigns.push(await f.publishReviewed('recruitment',await f.create('recruitment',`final-race-campaign-${i}`,fields('recruitment'))));
 let operational=await (await f.admin.request('/api/globals/recruitment-state')).json();assert.equal((await f.admin.request('/api/globals/recruitment-state',{method:'POST',data:{expectedVersion:operational.expectedVersion,enabledCampaign:null}})).status,200);
 operational=await (await f.admin.request('/api/globals/recruitment-state')).json();
 const activate=id=>f.admin.request('/api/globals/recruitment-state',{method:'POST',data:{expectedVersion:operational.expectedVersion,enabledCampaign:id}});
 assert.deepEqual((await coordinated(()=>campaigns.map(doc=>activate(doc.id)))).map(r=>r.status).sort(),[200,409]);
});
