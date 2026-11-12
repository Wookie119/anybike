import assert from 'node:assert/strict';
import {identity,selectDailyModels,validatePublicRows,fetchProjection,runDailyAudit,toMarkdown}
 from './audit-daily-public-model-publication.mjs';

assert.equal(identity(' BMW ','R 1300 GS'),identity('bmw','r 1300 gs'));
const catalogue=Array.from({length:75},(_,i)=>({make:'Example',model:'M'+i}));
const a=selectDailyModels(catalogue,new Date('2026-11-12T00:00:00Z'),30);
const b=selectDailyModels(catalogue,new Date('2026-11-13T00:00:00Z'),30);
assert(a.length>=30&&b.length>=30);
assert.notDeepEqual(a,b,'The daily audit must rotate through the local catalogue');
assert(a.some(x=>x.make==='BMW'&&x.model==='R 1300 GS'),
 'The approved flagship model must be checked every day');
assert.throws(()=>validatePublicRows([{make:'BMW',model:'R 1250 GS'}],'BMW','R 1300 GS','facts'),
 /another motorcycle/);
assert.throws(()=>validatePublicRows([{make:'BMW',model:'R 1300 GS',
 image_url:'http://unsafe',licence_url:'https://example.com/licence',
 licence:'CC BY-SA',attribution:'Author'}],'BMW','R 1300 GS','gallery'),
 /unlicensed or unsafe/);
const requests=[];
const fetcher=async (url,options)=>{
 requests.push({url,options});
 const input=JSON.parse(options.body);
 return {ok:true,json:async()=>url.includes('facts_v1')?
  [{make:input.p_make,model:input.p_model,fact_id:1}]:[]};
};
assert.equal(await fetchProjection(fetcher,'BMW','R 1300 GS','facts'),1);
assert.equal(requests[0].options.method,'POST');
assert.equal(JSON.parse(requests[0].options.body).p_model,'R 1300 GS');
const report=await runDailyAudit({
 fetcher,models:[{make:'Example',model:'M1'}],
 date:new Date('2026-11-12T12:00:00Z')
});
assert.equal(report.errors,0);
assert.equal(report.checkedModels,12);
assert.equal(report.withFacts,12);
assert.equal(report.withGallery,0);
assert(toMarkdown(report).includes('not** a full catalogue'));
const bad=await runDailyAudit({
 fetcher:async()=>({ok:false,status:503}),
 models:[],date:new Date('2026-11-12T12:00:00Z')
});
assert.equal(bad.errors,bad.checkedModels);
assert(bad.rows.every(x=>x.error.includes('503')));
console.log('PASS: daily model publication audit rotation, public RPC guards, errors and markdown');
