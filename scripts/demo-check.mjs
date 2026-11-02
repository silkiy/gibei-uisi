import {parseEnv} from 'node:util';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import path from 'node:path';
const envFile=path.resolve(process.argv[2]);
// No cookie, password or environment value is included in screenshots/logs.
const env=parseEnv(readFileSync(envFile,'utf8')),base=env.SERVER_URL;
assert.equal(new URL(base).hostname,'127.0.0.1');assert.ok(env.DEMO_OTHER_PASSWORD,'Provide the run-owned demo account file');
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch();
const contexts=[];
async function actor(email,password){const context=await browser.newContext({baseURL:base});contexts.push(context);const page=await context.newPage();try{await page.goto('/admin');await page.getByLabel(/Email/i).fill(email);await page.getByLabel(/^Password/i).fill(password);await page.getByRole('button',{name:/Log.?in/i}).click();await expect(page).toHaveURL(/\/admin\/?$/);}catch{throw Error('Demo login failed; details withheld');}return page;}
const proof={status:'running',date:new Date().toISOString(),base,actors:['Admin','Media owner','Other Media','Visitor'],routes:[],lifecycle:false};
try{
 const admin=await actor(env.DEMO_ADMIN_EMAIL,env.DEMO_ADMIN_PASSWORD),media=await actor(env.DEMO_MEDIA_EMAIL,env.DEMO_MEDIA_PASSWORD),other=await actor(env.DEMO_OTHER_EMAIL,env.DEMO_OTHER_PASSWORD);
 const visitorContext=await browser.newContext({baseURL:base});contexts.push(visitorContext);const visitor=await visitorContext.newPage();
 for(const route of ['/','/tentang','/tentang/struktur','/tentang/divisi','/publikasi','/publikasi/artikel','/publikasi/riset','/kegiatan','/galeri','/rekrutmen','/partnership','/prestasi','/kontak']){assert.equal((await visitor.goto(route)).status(),200);proof.routes.push(route);}
 const slug=`demo-handover-${Date.now()}`,headers={Origin:base};
 const category=await admin.request.post('/api/article-categories',{headers,data:{name:'Contoh serah terima',slug}});assert.equal(category.status(),201);const categoryId=(await category.json()).doc.id;
 await media.goto('/admin/collections/articles/create');await media.getByLabel(/^Slug/).fill(slug);await media.getByLabel(/^Title/).fill('Contoh alur demo akhir');await media.getByLabel(/^Excerpt/).fill('Data contoh untuk demonstrasi.');await media.getByLabel(/^Public Author/).fill('Tim contoh');await media.locator('[contenteditable="true"]').fill('Isi contoh untuk latihan review.');await media.getByRole('button',{name:'Save',exact:true}).click();await expect(media).toHaveURL(/\/admin\/collections\/articles\/\d+$/);
 const id=Number(media.url().split('/').at(-1)),editor=`/admin/collections/articles/${id}`,publicURL=`/publikasi/artikel/${slug}`;
 assert.equal((await visitor.request.get(publicURL)).status(),404);assert.equal((await other.request.get(`/api/articles/${id}`,{headers})).status(),404);
 let doc=await(await admin.request.get(`/api/articles/${id}`,{headers})).json();const assigned=await admin.request.patch(`/api/articles/${id}`,{headers,data:{expectedLockVersion:doc.lockVersion,category:categoryId}});assert.equal(assigned.status(),200);
 await media.reload();await media.getByRole('button',{name:'Ajukan review',exact:true}).click();await expect(media.getByText('Status editorial: in_review',{exact:true})).toBeVisible();
 await admin.goto(editor);await admin.getByLabel('Alasan editorial').fill('Contoh catatan: perjelas konteks edukasi.');await admin.getByRole('button',{name:'Minta revisi',exact:true}).click();await expect(admin.getByText('Status editorial: revision_required',{exact:true})).toBeVisible();
 await media.reload();await media.locator('[contenteditable="true"]').fill('Isi contoh diperbaiki dan siap ditinjau kembali.');const saved=media.waitForResponse(r=>r.url().includes(`/api/articles/${id}`)&&r.request().method()==='PATCH');await media.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await saved).status(),200);await media.getByRole('button',{name:'Ajukan review',exact:true}).click();await expect(media.getByText('Status editorial: in_review',{exact:true})).toBeVisible();
 await admin.goto(editor);await admin.getByRole('button',{name:'Terbitkan',exact:true}).click();await expect(admin.getByText('Status editorial: published',{exact:true})).toBeVisible();await visitor.goto(publicURL);await expect(visitor.getByRole('heading',{name:'Contoh alur demo akhir',exact:true})).toBeVisible();await visitor.screenshot({path:'artifacts/T063-published.png',fullPage:true});
 await media.reload();await media.getByRole('button',{name:'Buat revisi baru',exact:true}).click();await expect(media.getByText('Status editorial: draft',{exact:true})).toBeVisible();await media.getByLabel(/^Title/).fill('Revisi contoh yang belum disetujui');const updated=media.waitForResponse(r=>r.url().includes(`/api/articles/${id}`)&&r.request().method()==='PATCH');await media.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await updated).status(),200);await visitor.reload();await expect(visitor.getByRole('heading',{name:'Contoh alur demo akhir',exact:true})).toBeVisible();
 await admin.goto(editor);await admin.getByLabel('Alasan editorial').fill('Penarikan untuk menyelesaikan latihan demo.');await admin.getByRole('button',{name:'Tarik publikasi',exact:true}).click();await expect(admin.getByText('Status editorial: draft',{exact:true})).toBeVisible();assert.equal((await visitor.goto(publicURL)).status(),404);
 const audits=await(await admin.request.get(`/api/editorial-audit?where[article][equals]=${id}&limit=100`,{headers})).json();for(const action of ['draft_created','submitted','revision_requested','published','revision_created','publication_withdrawn'])assert.ok(audits.docs.some(row=>row.action===action));
 const articles=await(await visitor.request.get('/api/public/articles?limit=48')).json();assert.equal(articles.totalDocs,24);
 proof.status='passed';proof.lifecycle=true;proof.publicArticles=24;proof.otherMediaDenied=true;proof.withdrawnDetail=404;proof.auditRetained=true;writeFileSync('artifacts/demo-handover.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{for(const context of contexts)await context.close();await browser.close();}
