import assert from 'node:assert/strict';
import pg from 'pg';
import {setTimeout as delay} from 'node:timers/promises';
import {localTestConnection,assertOwnedTestTarget} from '../../scripts/database/test-config.mjs';
export async function coordinated(work){
 const pool=new pg.Pool(localTestConnection(process.env,process.env.TEST_MIGRATION_DATABASE_URL)),barrier=await pool.connect();let requests;
 try{
  assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID,(await barrier.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
  await barrier.query('BEGIN');await barrier.query('SELECT pg_advisory_xact_lock(697816,0)');
  requests=work().map(p=>p.then(response=>({response}),error=>({error})));let queued=false;
  for(let i=0;i<160;i++){queued=(await pool.query("SELECT count(*)::int n FROM pg_locks WHERE locktype='advisory' AND classid=697816 AND objid=0 AND NOT granted")).rows[0].n>=2;if(queued)break;await delay(25);}
  assert.ok(queued,'Both requests must reach the graph barrier');await barrier.query('COMMIT');
  return (await Promise.all(requests)).map(row=>{if(row.error)throw row.error;return row.response;});
 }finally{await barrier.query('ROLLBACK');if(requests)await Promise.all(requests);barrier.release();await pool.end();}
}
