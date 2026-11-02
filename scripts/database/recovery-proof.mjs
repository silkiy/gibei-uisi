import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,cpSync,rmSync,realpathSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import pg from 'pg';
import sharp from 'sharp';
import {localTestConnection,assertOwnedTestTarget} from './test-config.mjs';
import {authenticate} from '../../tests/support/http.mjs';

// This proof has no hosted-database mode. Source and destination are generated,
// marker-owned loopback databases. No password is placed in command arguments.
export async function recoveryProof({env,adminPassword,log,stopSource}) {
 const sourceURL=new URL(env.TEST_MIGRATION_DATABASE_URL),restoreId=randomBytes(6).toString('hex'),database=`gibei_test_${restoreId}`;
 const source=new pg.Pool(localTestConnection(env,sourceURL.href));
 const root=realpathSync('.tools/test-databases'),directory=path.join(root,restoreId),sourceDirectory=path.join(root,env.GIBEI_TEST_RUN_ID);
 assert.match(env.GIBEI_TEST_RUN_ID,/^[a-f0-9]{12}$/);assert.equal(realpathSync(sourceDirectory),sourceDirectory);assert.ok(root.startsWith(realpathSync(process.cwd())+path.sep));assert.ok(!existsSync(directory));
 const operator=new pg.Pool({host:'127.0.0.1',port:Number(sourceURL.port),user:'postgres',password:adminPassword,database:'postgres',ssl:false,max:1});
 let target,server,created=false;
 const marker={runId:restoreId,database,sourceRun:env.GIBEI_TEST_RUN_ID,kind:'recovery-proof'};
 const executable=name=>path.resolve(process.env.GIBEI_TEST_PG_BIN,`${name}${process.platform==='win32'?'.exe':''}`);
 const command=(name,args)=>execFileSync(executable(name),args,{env:{...process.env,PGPASSWORD:sourceURL.password},stdio:['ignore',log,log],timeout:60000,windowsHide:true});
 const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
 try {
  assertOwnedTestTarget(env.GIBEI_TEST_RUN_ID,(await source.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
  const accounts=JSON.parse(env.GIBEI_TEST_ACCOUNTS),media=await authenticate(accounts.mediaA,env.SERVER_URL);
  const upload=await media.request('/api/media/upload',{method:'POST',bytes:await sharp({create:{width:32,height:24,channels:3,background:'#234536'}}).png().toBuffer(),headers:{'Content-Type':'image/png','X-Filename':'recovery-private.png','X-Alt':'Private restore fixture'}});assert.equal(upload.status,201);const privateAsset=(await upload.json()).doc;
  const publicFiles=(await source.query("SELECT key FROM payload.media WHERE alt IN ('Ilustrasi geometris orisinal GIBEI demo 01','Dokumen edukasi contoh orisinal') ORDER BY key")).rows;
  assert.equal(publicFiles.length,2);
  const fileHashes=await Promise.all(publicFiles.map(async row=>{const r=await fetch(`${env.SERVER_URL}/api/media/${row.key}/original`);assert.equal(r.status,200);return digest(Buffer.from(await r.arrayBuffer()));}));
  await stopSource(); // No writer may change the DB/file pair during the snapshot.
  mkdirSync(directory);writeFileSync(path.join(directory,'run-owner.json'),JSON.stringify(marker));
  const backup=path.join(sourceDirectory,'recovery.dump');
  command('pg_dump',['--host','127.0.0.1','--port',sourceURL.port,'--username','gibei_migrator','--dbname',sourceURL.pathname.slice(1),'--format=custom','--no-owner','--schema=payload','--schema=test_meta','--file',backup]);
  cpSync(path.join(sourceDirectory,'assets'),path.join(directory,'assets'),{recursive:true,errorOnExist:true,force:false});
  await operator.query(`CREATE DATABASE ${pg.escapeIdentifier(database)} OWNER gibei_migrator`);created=true;
  command('pg_restore',['--host','127.0.0.1','--port',sourceURL.port,'--username','gibei_migrator','--dbname',database,'--no-owner','--exit-on-error',backup]);
  const targetURL=new URL(sourceURL);targetURL.pathname='/'+database;
  const runtimeURL=new URL(env.TEST_DATABASE_URL);runtimeURL.pathname='/'+database;
  const listener=createServer();await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
  const restored={...env,GIBEI_TEST_RUN_ID:restoreId,TEST_MIGRATION_DATABASE_URL:targetURL.href,MIGRATION_DATABASE_URL:targetURL.href,TEST_DATABASE_URL:runtimeURL.href,DATABASE_URL:runtimeURL.href,SERVER_URL:`http://127.0.0.1:${port}`};
  target=new pg.Pool(localTestConnection(restored,targetURL.href));
  assert.equal((await target.query('SELECT run_id FROM test_meta.run')).rows[0].run_id,env.GIBEI_TEST_RUN_ID);
  await target.query('UPDATE test_meta.run SET run_id=$1',[restoreId]);
  assertOwnedTestTarget(restoreId,(await target.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
  const tables=(await source.query("SELECT table_name FROM information_schema.tables WHERE table_schema='payload' AND table_type='BASE TABLE' ORDER BY table_name")).rows;
  for(const {table_name}of tables){const query=`SELECT count(*)::int n FROM payload.${pg.escapeIdentifier(table_name)}`;assert.equal((await target.query(query)).rows[0].n,(await source.query(query)).rows[0].n,table_name);}
  for(const table of ['account_audit','editorial_audit','page_audit','settings_audit','organization_audit','organization_state_audit','recruitment_state_audit','media_audit','partner_logo_permissions'])assert.equal((await target.query("SELECT has_table_privilege('gibei_runtime',$1,'UPDATE') allowed",[`payload.${table}`])).rows[0].allowed,false,table);
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:restored,stdio:['ignore',log,log],windowsHide:true});
  let ready=false;for(let i=0;i<60;i++){try{if((await fetch(restored.SERVER_URL+'/api/users')).status===403){ready=true;break;}}catch{}await delay(500);}assert.ok(ready);
  assert.equal((await(await fetch(restored.SERVER_URL+'/api/public/articles?limit=48')).json()).docs.filter(row=>row.slug.startsWith('demo-artikel')).length,24);
  for(let i=0;i<publicFiles.length;i++){const r=await fetch(`${restored.SERVER_URL}/api/media/${publicFiles[i].key}/original`);assert.equal(r.status,200);assert.equal(digest(Buffer.from(await r.arrayBuffer())),fileHashes[i]);}
  for(const variant of ['original','thumbnail'])assert.equal((await fetch(`${restored.SERVER_URL}/api/media/${privateAsset.key}/${variant}`)).status,404);
  const admin=await authenticate(accounts.admin,restored.SERVER_URL);assert.equal((await admin.request('/api/partner-logo-permissions')).status,200);assert.equal((await fetch(restored.SERVER_URL+'/api/partner-logo-permissions')).status,403);
  return {status:'passed',tables:tables.length,publicFiles:2,privateVariantsDenied:2,immutableAuditTables:9,backupDigest:digest(readFileSync(backup)),sourceUntouched:true};
 }finally{
  if(server?.pid && server.exitCode===null){if(process.platform==='win32')execFileSync('taskkill',['/PID',String(server.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else server.kill('SIGTERM');}
  if(target)await target.end();await source.end();
  if(created){assert.match(database,/^gibei_test_[a-f0-9]{12}$/);assert.deepEqual(JSON.parse(readFileSync(path.join(directory,'run-owner.json'),'utf8')),marker);await operator.query(`DROP DATABASE ${pg.escapeIdentifier(database)}`);}
  await operator.end();
  if(existsSync(directory)){assert.equal(realpathSync(directory),path.join(realpathSync(root),restoreId));assert.deepEqual(JSON.parse(readFileSync(path.join(directory,'run-owner.json'),'utf8')),marker);rmSync(directory,{recursive:true,force:false});}
 }
}
