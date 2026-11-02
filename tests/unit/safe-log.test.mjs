import test from 'node:test';
import assert from 'node:assert/strict';
import { safeLogRecord } from '../../src/logging/safe.mjs';
test('diagnostic logs retain codes and correlation without serializing messages, SQL, tokens or request data',()=>{
 const secret='postgresql://admin:secret@host/private';
 const row=safeLogRecord([{err:Object.assign(new Error(secret),{code:'42501',query:secret,params:[secret]}),headers:{cookie:secret},password:secret},secret],50);
 assert.equal(row.code,'42501');assert.equal(row.event,'cms_error');assert.ok(!JSON.stringify(row).includes(secret));assert.ok(!('stack' in row));
});
