import assert from 'node:assert/strict';
import { before,test } from 'node:test';
import pg from 'pg';
import { reviewedFixture } from '../support/reviewed.mjs';
import { localTestConnection,assertOwnedTestTarget } from '../../scripts/database/test-config.mjs';
let f,basePeriod,category;
before(async()=>{
  f=await reviewedFixture('archival');
  basePeriod=await f.publishReviewed('periods',await f.create('periods','QA archival base',{startDate:'2080-01-01',endDate:'2081-01-01'}));
  category=(await (await f.admin.request('/api/research-categories?limit=10')).json()).docs[0];
});
const fields=kind=>({
  periods:{startDate:'2080-01-01',endDate:'2081-01-01'},
  members:{name:'QA member',position:'QA position',period:basePeriod.id},
  research:{title:'QA research',excerpt:'QA excerpt',publicAuthor:'QA team',body:f.rich('QA body'),analysisDate:'2026-11-01',category:category.id,sources:[{title:'QA source',url:'https://example.com/source'}]},
  events:{title:'QA event',description:'QA event description.',organizer:'QA team',locationType:'offline',location:'QA campus',startAt:'2080-01-01T09:00',endAt:'2080-01-01T11:00'},
  recruitment:{title:'QA campaign',description:'QA campaign description.',period:basePeriod.id,positions:[{title:'QA role',requirements:'QA requirements'}],selectionStages:[{title:'QA selection',description:'QA stage'}],opensAt:'2080-01-01T09:00',closesAt:'2080-01-02T09:00'},
}[kind]);
for(const kind of ['periods','divisions','members','research','events','recruitment']) test(`${kind}: archive preserves public snapshot; only Admin restarts withdrawn content`,async()=>{
  let published;
  if(kind==='divisions') {
    published=(await (await f.admin.request('/api/divisions?depth=0&limit=48')).json()).docs.find(doc=>doc.publicRevision&&!doc.workingRevision&&doc.owner===f.a.user.id);
    assert.ok(published,'A reviewed division fixture is available');
  } else published=await f.publishReviewed(kind,await f.create(kind,`qa-archival-${kind}`,fields(kind)));
  let draft=await f.revision(kind,published);
  assert.equal((await f.command(kind,draft,'archive-revision',{note:'Denied'},f.a)).status,403);
  assert.equal((await f.command(kind,draft,'archive-revision')).status,400);
  const pending=await f.submitReviewed(kind,draft);
  assert.equal((await f.command(kind,pending.doc,'archive-revision',{note:'Pending review.'})).status,409);
  let response=await f.command(kind,pending.doc,'withdraw-submission',{submissionId:pending.submission.id},f.a);assert.equal(response.status,200);draft=(await response.json()).doc;
  if(kind==='events') {
    const pool=new pg.Pool(localTestConnection(process.env,process.env.TEST_MIGRATION_DATABASE_URL));
    try {
      assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID,(await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
      await pool.query('REVOKE INSERT ON payload.organization_audit FROM gibei_runtime');
      try {assert.equal((await f.command(kind,draft,'archive-revision',{note:'Fault injection.'})).status,500);}finally{await pool.query('GRANT INSERT ON payload.organization_audit TO gibei_runtime');}
      const unchanged=await f.read(kind,draft);assert.equal(unchanged.workingRevision,draft.workingRevision);assert.equal(unchanged.lockVersion,draft.lockVersion);
    }finally{await pool.end();}
  }
  const archivedId=draft.workingRevision;
  response=await f.command(kind,draft,'archive-revision',{note:'Preserve public revision.'});assert.equal(response.status,200);let current=(await response.json()).doc;
  assert.equal(current.workingRevision,null);assert.equal(current.publicRevision,published.publicRevision);assert.equal(current.state,'published');
  const audits=(await (await f.admin.request(`/api/organization-audit?where[kind][equals]=${kind}&where[entityId][equals]=${current.id}&limit=100`)).json()).docs;
  assert.ok(audits.some(row=>row.action==='revision_archived'&&row.revisionId===archivedId&&row.after.note==='Preserve public revision.'));
  response=await f.command(kind,current,'withdraw-publication',{note:'QA withdrawn publication.'});assert.equal(response.status,200);current=(await response.json()).doc;
  const version=current.lockVersion;
  assert.equal((await f.command(kind,current,'create-revision',{},f.a)).status,403);
  assert.equal((await f.read(kind,current)).lockVersion,version);
  response=await f.command(kind,current,'create-revision');assert.equal(response.status,200);current=(await response.json()).doc;
  assert.equal(current.state,'draft');assert.equal(current.publicRevision,null);assert.ok(current.workingRevision);
  assert.equal((await f.command(kind,current,'publish')).status,409);
});
