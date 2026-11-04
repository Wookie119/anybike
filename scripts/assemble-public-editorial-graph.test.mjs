import test from 'node:test';
import assert from 'node:assert/strict';
import { makePublicEditorialManifest } from './public-editorial-manifest.mjs';
import { assemblePublicEditorialGraph } from './assemble-public-editorial-graph.mjs';

const inventory={
 candidates:[
  {type:'manufacturer',url:'https://www.anybike.co.uk/bmw-motorcycles.html',sourceEligible:true},
  {type:'model',url:'https://www.anybike.co.uk/bmw-r1300gs.html',sourceEligible:true},
  {type:'country',url:'https://www.anybike.co.uk/markets/kenya.html',sourceEligible:true},
  {type:'global',url:'https://www.anybike.co.uk/global/example-story.html',sourceEligible:true},
  {type:'global',url:'https://www.anybike.co.uk/global/draft.html',sourceEligible:false}
 ]
};
const identities=[
 {id:'manufacturer:15',type:'manufacturer',title:'BMW',url:'/bmw-motorcycles.html',published:true,liveVerified:true},
 {id:'model:72',type:'model',title:'R 1300 GS',url:'/bmw-r1300gs.html',published:true,liveVerified:true},
 {id:'country:KE',type:'country',title:'Kenya',url:'/markets/kenya.html',published:true,liveVerified:true},
 {id:'global:1',type:'global',title:'BMW story',url:'/global/example-story.html',published:true,liveVerified:true}
];
const absolute = identities.map(p=>({...p,url:'https://www.anybike.co.uk'+p.url}));
test('manifest requires approval, source indexability and deployment verification',()=>{
 const m=makePublicEditorialManifest({inventory,identities:[
  ...absolute,
  {id:'global:2',type:'global',title:'Draft',url:'https://www.anybike.co.uk/global/draft.html',published:true,liveVerified:true},
  {id:'model:73',type:'model',title:'Not deployed',url:'https://www.anybike.co.uk/bmw-r1250gs.html',published:true,liveVerified:true},
  {id:'country:FR',type:'country',title:'France',url:'https://www.anybike.co.uk/markets/france.html',published:true,liveVerified:false}
 ]});
 assert.equal(m.pages.length,4);
 assert.equal(m.diagnostics.filter(d=>d.code==='not-source-eligible').length,2);
});
test('manifest rejects duplicate and wrong-type identities',()=>{
 const m=makePublicEditorialManifest({inventory,identities:[
  absolute[0],absolute[0],
  {id:'model:55',type:'model',title:'Wrong type',url:'https://www.anybike.co.uk/markets/kenya.html',published:true,liveVerified:true}
 ]});
 assert.equal(m.pages.length,1);
 assert.deepEqual(m.diagnostics.map(d=>d.code).sort(),['duplicate-public-identity','not-source-eligible']);
});
test('complete pipeline generates reciprocal approved links and excludes draft story',()=>{
 const r=assemblePublicEditorialGraph({
  inventory,identities:absolute,
  countryLinks:[{model_id:72,country_code:'KE',market_url:'/markets/kenya.html',is_published:true}],
  globalStories:[{id:1,story_url:'/global/example-story.html',editorial_status:'draft'}],
  storyManufacturers:[{story_id:1,manufacturer_id:15}]
 });
 assert.equal(r.counts.verifiedPublicPages,4);
 assert.equal(r.counts.generatedLinks,2);
 assert.equal(r.pages.find(p=>p.id==='model:72').links[0].id,'country:KE');
 assert.equal(r.pages.find(p=>p.id==='global:1').links.length,0);
 assert.equal(r.livePublicationVerified,false);
});
test('end-to-end published manufacturer-model records generate reciprocal links',()=>{
 const r=assemblePublicEditorialGraph({
  inventory,identities:absolute,
  manufacturers:[{id:15,display_name:'BMW'}],
  models:[{id:72,manufacturer:'BMW',model:'R 1300 GS'},{id:999,manufacturer:'BMW',model:'Unpublished'}]
 });
 const bmw=r.pages.find(p=>p.id==='manufacturer:15');
 const gs=r.pages.find(p=>p.id==='model:72');
 assert.deepEqual(bmw.links.map(p=>p.id),['model:72']);
 assert.deepEqual(gs.links.map(p=>p.id),['manufacturer:15']);
 assert.equal(r.counts.generatedLinks,2);
});
test('no explicit approved deployment means no links, no pages',()=>{
 const r=assemblePublicEditorialGraph({inventory,identities:absolute.map(p=>({...p,liveVerified:false}))});
 assert.equal(r.pages.length,0);
 assert.equal(r.counts.generatedLinks,0);
});
