import pg from 'pg';
import {localTestConnection,assertOwnedTestTarget} from '../../scripts/database/test-config.mjs';
export async function withRevokedRead(table,work){
 if(!['site_settings','gallery_revisions'].includes(table))throw Error('Only reviewed test tables are supported');
 const pool=new pg.Pool(localTestConnection(process.env,process.env.TEST_MIGRATION_DATABASE_URL));
 try{
  assertOwnedTestTarget(process.env.GIBEI_TEST_RUN_ID,(await pool.query('SELECT current_database() AS database,current_user AS role,(SELECT run_id FROM test_meta.run LIMIT 1) AS marker')).rows[0]);
  await pool.query(`REVOKE SELECT ON payload.${pg.escapeIdentifier(table)} FROM gibei_runtime`);
  try{return await work();}finally{await pool.query(`GRANT SELECT ON payload.${pg.escapeIdentifier(table)} TO gibei_runtime`);}
 }finally{await pool.end();}
}
