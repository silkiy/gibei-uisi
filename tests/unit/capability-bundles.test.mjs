import assert from 'node:assert/strict';
import test from 'node:test';
test('separate server module instances recognize the same trusted capability but reject JSON lookalikes',async()=>{
 const first=await import('../../src/auth/policy.ts?bundle=first');
 const second=await import('../../src/auth/policy.ts?bundle=second');
 const context={[first.bootstrapCapability]:true};
 assert.equal(second.canCreateAccount(null,context),true);
 assert.equal(second.canCreateAccount(null,JSON.parse('{"bootstrapCapability":true,"gibei.local-admin-bootstrap.v1":true}')),false);
});
