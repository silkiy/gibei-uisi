import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalURL, jsonLD } from '../../src/seo/policy.mjs';
test('canonical URL uses configured origin and rejects credentials, paths and insecure remote hosts',()=>{
 assert.equal(canonicalURL('/galeri/demo','http://127.0.0.1:3400'),'http://127.0.0.1:3400/galeri/demo');
 assert.equal(canonicalURL('/galeri/demo','http://localhost:3500'),'http://localhost:3500/galeri/demo');
 for(const origin of ['http://example.com','https://u:p@example.com','https://example.com/path','https://example.com/?x=1']) assert.throws(()=>canonicalURL('/',origin));
 assert.throws(()=>canonicalURL('//example.com','http://localhost:3000'));
});
test('structured JSON cannot terminate the script element',()=>{assert.ok(!jsonLD({name:'</script><script>bad</script>'}).includes('<'));});
