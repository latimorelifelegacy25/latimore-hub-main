const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
function load(path,mocks,extra={}) {
 const module={exports:{}};
 const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:n=>mocks[n],console,Intl,Date,URLSearchParams,setTimeout,clearTimeout,AbortController,crypto:require('node:crypto').webcrypto,...extra});
 return module.exports;
}
class Component {setState(update){Object.assign(this.state,typeof update==='function'?update(this.state):update)}}
(async()=>{
 let mode='failure',calls=0,payload;
 const pending={}; pending.promise=new Promise(r=>pending.resolve=r);
 const {default:Logic}=load('app/book/booking-logic.js',{'react':{Component},'@/lib/lead':{getEventContext:()=>({})}},{window:{location:{pathname:'/book',search:''}},fetch:async(url,options)=>{calls++;payload=JSON.parse(options.body);if(mode==='pending')await pending.promise;return {ok:mode!=='failure',status:mode==='failure'?500:200,json:async()=>mode==='failure'?{ok:false,error:'Unable to book'}:{ok:true,appointmentId:'a1'}}}});
 const flow=new Logic();flow.active=true;Object.assign(flow.state,{step:3,consent:true,availability:[{date:'2026-10-12',slots:['2026-10-12T14:00:00.000Z']}],slot:0,interest:'Whole life',f:{first:'Test',last:'Client',email:'test@example.com',phone:'5709001977'}});
 await flow.submit();assert.equal(flow.state.step,3);assert.equal(flow.state.booked,null);assert.equal(flow.state.save,'err');
 mode='pending';const submit=flow.submit();assert.equal(flow.state.step,3);assert.equal(flow.state.save,'saving');await flow.submit();assert.equal(calls,2);pending.resolve();await submit;assert.equal(flow.state.step,4);assert.equal(flow.state.booked.appointmentId,'a1');assert.equal(payload.consentToContact,true);assert.equal(payload.meetingFormat,'Phone');
 flow.state.consent=false;await flow.submit();assert.equal(calls,2);
 let request;
 const {createGoogleCalendarEvent}=load('lib/calendar/events.ts',{'@/lib/booking/config':{BOOKING_CONFIG:{calendarId:'primary',timezone:'America/New_York'}},'@/lib/calendar/authenticated-fetch':{fetchGoogleCalendarApi:async(url,options)=>{request={url,body:JSON.parse(options.body)};return {ok:true,json:async()=>({id:'event1'})}}}});
 await createGoogleCalendarEvent({summary:'Phone',start:'a',end:'b'});assert.ok(request.url.includes('sendUpdates=all'));assert.equal(request.body.conferenceData,undefined);
 await createGoogleCalendarEvent({summary:'Meet',start:'a',end:'b',createMeeting:true});assert.ok(request.url.includes('conferenceDataVersion=1'));assert.equal(request.body.conferenceData.createRequest.conferenceSolutionKey.type,'hangoutsMeet');
 console.log('PASS: failed/pending bookings never confirm; duplicate submits blocked; consent recorded; calendar invitations and Google Meet requests verified.');
})().catch(e=>{console.error(e);process.exitCode=1});
