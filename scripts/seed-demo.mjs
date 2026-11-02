import pg from 'pg';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { localTestConnection, assertOwnedTestTarget } from './database/test-config.mjs';
import { divisionNames } from '../src/validation/organization.mjs';

// Fail closed before authentication or any write. A loopback HTTP URL alone is
// insufficient: the application's DB could still be hosted Supabase.
export async function seedDemo({env=process.env,baseURL=env.SERVER_URL,adminEmail=env.DEMO_ADMIN_EMAIL,adminPassword=env.DEMO_ADMIN_PASSWORD,mediaEmail=env.DEMO_MEDIA_EMAIL,mediaPassword=env.DEMO_MEDIA_PASSWORD,benchmark=false}={}) {
 const origin=new URL(baseURL);
 if(origin.origin!==baseURL || origin.hostname!=='127.0.0.1' || origin.protocol!=='http:') throw Error('Seed only supports an explicit loopback application origin');
 const pool=new pg.Pool(localTestConnection(env,env.TEST_MIGRATION_DATABASE_URL));
 try {assertOwnedTestTarget(env.GIBEI_TEST_RUN_ID,(await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);}finally{await pool.end();}
 if(!adminEmail || !adminPassword || !mediaEmail || !mediaPassword || adminPassword.length<16 || mediaPassword.length<16) throw Error('Provide two distinct demo accounts and strong passwords through environment');
 if(adminEmail===mediaEmail) throw Error('Demo roles require separate accounts');
 async function call(path,{method='GET',data,cookie,bytes,headers={}}={}) {
  const r=await fetch(new URL(path,origin),{method,redirect:'error',signal:AbortSignal.timeout(30000),headers:{Origin:origin.origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...headers},...(bytes?{body:bytes}:data?{body:JSON.stringify(data)}:{})});
  if(!r.ok) throw Error(`Demo operation failed (${r.status}): ${method} ${path.split('?')[0]}`);
  return r;
 }
 async function login(email,password){const r=await call('/api/users/login',{method:'POST',data:{email,password}});const cookie=r.headers.getSetCookie().find(s=>s.startsWith('payload-token='))?.split(';')[0];if(!cookie)throw Error('Session missing');return cookie;}
 const cookie=await login(adminEmail,adminPassword),request=async(path,options={})=>(await call(path,{cookie,...options})).json();
 const me=await request('/api/users/me');if(me.user?.role!=='admin' || me.user.status!=='active')throw Error('Seed requires active Admin');
 let media=(await request(`/api/users?where[email][equals]=${encodeURIComponent(mediaEmail)}&depth=0`)).docs[0];
 if(!media)media=(await request('/api/users',{method:'POST',data:{email:mediaEmail,password:mediaPassword,name:'Media demo',role:'media',status:'active'}})).doc;
 if(media.role!=='media'||media.status!=='active')throw Error('Existing demo Media account has incompatible role');
 await login(mediaEmail,mediaPassword);
 const rich=text=>({root:{type:'root',version:1,children:[{type:'paragraph',version:1,children:[{type:'text',version:1,text}]}]}});
 const find=async(collection,key,value)=>(await request(`/api/${collection}?where[${key}][equals]=${encodeURIComponent(value)}&depth=0&limit=1`)).docs[0];
 const roots={periods:'organizational-periods',divisions:'divisions',members:'members',research:'research-publications',events:'events',recruitment:'recruitment-periods',galleries:'galleries',partners:'partners',achievements:'achievements'};
 let created=0,skipped=0;
 async function reviewed(kind,identity,fields){const key=kind==='periods'?'label':'slug';let doc=await find(roots[kind],key,identity);if(doc){skipped++;return doc;}
  doc=(await request(`/api/${roots[kind]}`,{method:'POST',data:{[key]:identity,owner:media.id,...fields}})).doc;
  const command=async(action,extra={})=>request(`/api/editorial/organization/${kind}/${doc.id}/${action}`,{method:'POST',data:{expectedLockVersion:doc.lockVersion,expectedRevisionId:doc.workingRevision,...extra}});
  const review=await command('submit');doc=review.doc;doc=(await command('publish',{submissionId:review.submission.id})).doc;created++;return doc;
 }
 const note='Data contoh untuk demonstrasi; bukan informasi resmi organisasi.';
 const assetAlt='Ilustrasi geometris orisinal GIBEI demo 01';let image=await find('media','alt',assetAlt);
 if(!image){const bytes=await sharp({create:{width:960,height:640,channels:3,background:'#1c5846'}}).png().toBuffer();image=(await (await call('/api/media/upload',{method:'POST',cookie,bytes,headers:{'Content-Type':'image/png','X-Filename':'demo-original.png','X-Alt':assetAlt}})).json()).doc;}
 let pdf=await find('media','alt','Dokumen edukasi contoh orisinal');
 if(!pdf){const document=await PDFDocument.create();document.addPage().drawText('DEMO - Educational sample only');pdf=(await (await call('/api/media/upload',{method:'POST',cookie,bytes:await document.save(),headers:{'Content-Type':'application/pdf','X-Filename':'demo-education.pdf','X-Alt':'Dokumen edukasi contoh orisinal'}})).json()).doc;}
 const past=await reviewed('periods','Contoh periode 2025',{startDate:'2025-01-01',endDate:'2025-12-31'}),current=await reviewed('periods','Contoh periode 2026',{startDate:'2026-01-01',endDate:'2026-12-31'});
 const divisions=[];for(const [slug,name]of Object.entries(divisionNames))divisions.push(await reviewed('divisions',slug,{description:`Contoh profil ${name}. ${note}`,workPrograms:`Contoh program belajar ${name}.`,displayOrder:divisions.length,example:true,period:current.id}));
 for(let i=0;i<4;i++)await reviewed('members',`demo-pengurus-${i+1}`,{name:`Pengurus contoh ${i+1}`,position:i%2?'Anggota contoh':'Koordinator contoh',period:i<2?past.id:current.id,division:i%2?divisions[i].id:null,displayOrder:i,example:true,photo:image.id});
 let category=await find('article-categories','slug','demo-edukasi');if(!category)category=(await request('/api/article-categories',{method:'POST',data:{name:'Contoh Edukasi',slug:'demo-edukasi'}})).doc;
 for(let i=1;i<=(benchmark?24:3);i++){
  const slug=`demo-artikel-${String(i).padStart(2,'0')}`;if(await find('articles','slug',slug)){skipped++;continue;}
  let doc=(await request('/api/articles',{method:'POST',data:{slug,title:`Contoh artikel ${i}: mengenal pasar modal`,excerpt:note,body:rich(`Contoh materi literasi dan risiko investasi. ${note}`),publicAuthor:'Tim contoh',category:category.id,assets:[{asset:image.id,alt:assetAlt}]}})).doc;
  const command=async(action,extra={})=>request(`/api/editorial/articles/${doc.id}/${action}`,{method:'POST',data:{expectedLockVersion:doc.lockVersion,expectedRevisionId:doc.workingRevision,...extra}});
  const pending=await command('submit');doc=pending.doc;await command('publish',{submissionId:pending.submission.id});created++;
 }
 const categories=(await request('/api/research-categories?limit=10')).docs;if(!categories.length)throw Error('Run research category migration before seed');
 for(let i=1;i<=2;i++)await reviewed('research',`demo-riset-${i}`,{title:`Contoh riset ${i}`,excerpt:note,body:rich(note),publicAuthor:'Tim riset contoh',category:categories[0].id,analysisDate:`2026-10-0${i}`,sources:[{title:'Referensi demonstrasi',url:'https://example.com/education'}],cover:image.id,pdf:pdf.id});
 const events=[];for(let i=1;i<=3;i++)events.push(await reviewed('events',`demo-kegiatan-${i}`,{title:`Contoh kegiatan ${i}`,description:note,startAt:`${i===1?'2025':'2099'}-11-0${i}T09:00`,endAt:`${i===1?'2025':'2099'}-11-0${i}T11:00`,locationType:'offline',location:'Lokasi contoh',organizer:'Tim contoh',poster:image.id,registrationStatus:'closed'}));
 for(let i=1;i<=2;i++)await reviewed('recruitment',`demo-rekrutmen-${i}`,{title:`Contoh rekrutmen ${i}`,description:note,period:i===1?past.id:current.id,positions:[{title:'Pengurus contoh',requirements:note,division:divisions[0].id}],selectionStages:[{title:'Seleksi contoh',description:note}],opensAt:`${i===1?'2025':'2099'}-11-01T09:00`,closesAt:`${i===1?'2025':'2099'}-11-10T09:00`,registrationConfirmed:false});
 for(let i=1;i<=2;i++)await reviewed('galleries',`demo-album-${i}`,{title:`Contoh album ${i}`,description:note,date:`2026-10-0${i}`,event:events[0].id,photos:[{asset:image.id,alt:`Ilustrasi kegiatan contoh ${i}`,caption:note}],example:true,videoURL:'https://example.com/video'});
 for(let i=1;i<=2;i++)await reviewed('partners',`demo-mitra-${i}`,{title:`Contoh mitra ${i} (fiktif)`,description:note,collaboration:'Simulasi edukasi, tidak ada kerja sama resmi',website:'https://example.com',showOnHomepage:true,example:true,logo:i===1?image.id:null});
 for(let i=1;i<=2;i++)await reviewed('achievements',`demo-prestasi-${i}`,{title:`Contoh prestasi ${i} (fiktif)`,description:note,category:'Simulasi edukasi',recipient:'Tim contoh',date:`${i===1?'2025':'2026'}-12-31`,documentation:image.id,example:true});
 for(const pageKey of ['homepage','about']){
  if(await find('pages','pageKey',pageKey)){skipped++;continue;}
  let doc=(await request('/api/pages',{method:'POST',data:{pageKey,owner:media.id,title:pageKey==='homepage'?'Beranda contoh':'Tentang contoh',seoTitle:`${pageKey} contoh`,seoDescription:note,sections:pageKey==='homepage'?[{blockType:'hero',heading:'Belajar pasar modal bersama. (Contoh)',summary:note},{blockType:'program',heading:'Program unggulan contoh',description:note}]:[{blockType:'profile',heading:'Profil contoh',description:note,history:'Riwayat demonstrasi, belum dikonfirmasi.',vision:'Visi contoh.',mission:'Misi contoh.'}]}})).doc;
  const command=async(action,extra={})=>request(`/api/editorial/pages/${doc.id}/${action}`,{method:'POST',data:{expectedLockVersion:doc.lockVersion,expectedRevisionId:doc.workingRevision,...extra}});const pending=await command('submit');doc=pending.doc;await command('publish',{submissionId:pending.submission.id});created++;
 }
 const state=await request('/api/globals/organization-state');if(!state.activePeriod)await request('/api/globals/organization-state',{method:'POST',data:{expectedVersion:state.expectedVersion,activePeriod:current.id}});
 return {created,skipped,benchmark,assets:[image.key,pdf.key]};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 try {if(existsSync('.env.demo.local'))loadEnvFile('.env.demo.local');if(process.argv.slice(2).some(arg=>arg!=='--benchmark'))throw Error('Only --benchmark is supported; reset is never implicit');console.log(await seedDemo({benchmark:process.argv.includes('--benchmark')}));}
 catch {console.error('Seed refused or failed. Verify the isolated local target, account inputs and application logs. No credentials printed.');process.exitCode=1;}
}
