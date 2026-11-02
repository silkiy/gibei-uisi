import test from 'node:test';
import assert from 'node:assert/strict';
import { seedDemo } from '../../scripts/seed-demo.mjs';
import { fixtureAccounts,authenticate } from '../support/http.mjs';
test('demo seed is repeatable, preserves edited revisions and media, and rejects hosted targets',async()=>{
 const accounts=fixtureAccounts(),options={adminEmail:accounts.admin.email,adminPassword:accounts.admin.password,mediaEmail:accounts.mediaA.email,mediaPassword:accounts.mediaA.password,benchmark:true};
 const first=await seedDemo(options);assert.ok(first.created>30);assert.equal(first.assets.length,2);
 const admin=await authenticate(accounts.admin);
 let doc=(await (await admin.request('/api/articles?where[slug][equals]=demo-artikel-01&depth=0')).json()).docs[0];
 let response=await admin.request(`/api/editorial/articles/${doc.id}/create-revision`,{method:'POST',data:{expectedLockVersion:doc.lockVersion,expectedRevisionId:doc.publicRevision}});assert.equal(response.status,200);doc=(await response.json()).doc;
 response=await admin.request(`/api/articles/${doc.id}`,{method:'PATCH',data:{expectedLockVersion:doc.lockVersion,title:'Edit pengguna harus dipertahankan'}});assert.equal(response.status,200);
 const second=await seedDemo(options);assert.equal(second.created,0);assert.deepEqual(second.assets,first.assets);
 const current=await (await admin.request(`/api/articles/${doc.id}?depth=0`)).json();assert.equal(current.title,'Edit pengguna harus dipertahankan');
 const third=await seedDemo(options);assert.equal(third.created,0);
 for(const key of third.assets)assert.equal((await fetch(`${process.env.SERVER_URL}/api/media/${key}/original`)).status,200);
 await assert.rejects(()=>seedDemo({...options,env:{...process.env,TEST_MIGRATION_DATABASE_URL:'postgresql://user:password@db.example.com:5432/postgres'}}));
});
