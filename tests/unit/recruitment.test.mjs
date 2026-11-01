import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recruitmentStatus, validateRecruitment } from '../../src/recruitment/policy.mjs';
const valid = {title:'Kampanye contoh',description:'Informasi contoh',period:1,opensAt:'2026-11-01T09:00+07:00',closesAt:'2026-11-02T09:00+07:00',registrationURL:'https://example.com/apply',registrationConfirmed:true,positions:[{title:'Ketua',requirements:'Persyaratan contoh'}],selectionStages:[{title:'Seleksi',description:'Tahapan contoh'}]};
test('recruitment requires reviewed positions, stages, calendar and confirmed HTTPS destination',()=>{
  assert.doesNotThrow(()=>validateRecruitment(valid,true));
  for(const invalid of [{period:null},{positions:[]},{selectionStages:[]},{positions:[{title:'X',requirements:''}]},{closesAt:valid.opensAt},{opensAt:'2026-02-30T09:00'},{registrationURL:'javascript:alert(1)'},{enabledByAdmin:true}]) assert.throws(()=>validateRecruitment({...valid,...invalid},true));
});
test('recruitment is open-inclusive, close-exclusive and independent of operational activation',()=>{
  const start=Date.parse(valid.opensAt),end=Date.parse(valid.closesAt);
  assert.equal(recruitmentStatus(valid,true,start-1).status,'not_open');
  assert.equal(recruitmentStatus(valid,true,start).canRegister,true);
  assert.equal(recruitmentStatus(valid,true,end-1).canRegister,true);
  assert.equal(recruitmentStatus(valid,true,end).canRegister,false);
  assert.equal(recruitmentStatus(valid,false,start).status,'disabled');
  assert.equal(recruitmentStatus({...valid,registrationConfirmed:false},true,start).registrationURL,null);
  assert.equal(recruitmentStatus(valid,true,end).enabledByAdmin,true);
});
