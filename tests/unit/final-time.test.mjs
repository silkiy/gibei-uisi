import test from 'node:test';
import assert from 'node:assert/strict';
import {eventStatus} from '../../src/events/status.mjs';
import {recruitmentStatus} from '../../src/recruitment/policy.mjs';
test('controlled server clock is inclusive at opening and exclusive at closing, including cancellation and confirmation',()=>{
 const start=Date.parse('2026-12-31T17:00:00Z'),end=start+3600000;
 const event={startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString(),registrationStatus:'open',registrationURL:'https://example.com/apply',registrationConfirmed:true};
 for(const [now,status,canRegister]of [[start-1,'upcoming',true],[start,'ongoing',true],[end-1,'ongoing',true],[end,'completed',false],[end+1,'completed',false]]){assert.equal(eventStatus(event,now).status,status);assert.equal(eventStatus(event,now).canRegister,canRegister);}
 assert.equal(eventStatus({...event,cancelled:true},start).canRegister,false);assert.equal(eventStatus({...event,registrationConfirmed:false},start).canRegister,false);
 const campaign={published:true,enabledByAdmin:true,opensAt:event.startAt,closesAt:event.endAt,registrationURL:event.registrationURL,registrationConfirmed:true};
 for(const [now,expected]of [[start-1,false],[start,true],[end-1,true],[end,false],[end+1,false]])assert.equal(recruitmentStatus(campaign,true,now).canRegister,expected);
});
