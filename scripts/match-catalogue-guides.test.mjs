import test from 'node:test';
import assert from 'node:assert/strict';
import { matchCatalogueGuides } from './match-catalogue-guides.mjs';

const candidates=[
 {type:'manufacturer',path:'bmw-motorcycles.html',url:'https://www.anybike.co.uk/bmw-motorcycles.html',sourceEligible:true},
 {type:'manufacturer',path:'harley-davidson-motorcycles.html',url:'https://www.anybike.co.uk/harley-davidson-motorcycles.html',sourceEligible:true},
 {type:'model',path:'bmw-r1300gs.html',url:'https://www.anybike.co.uk/bmw-r1300gs.html',sourceEligible:true},
 {type:'model',path:'harley-davidson-fat-boy.html',url:'https://www.anybike.co.uk/harley-davidson-fat-boy.html',sourceEligible:true},
 {type:'model',path:'bmw-r1300gs-v2.html',url:'https://www.anybike.co.uk/bmw-r1300gs-v2.html',sourceEligible:false}
];
test('normalised matching maps real BMW and Harley guide names but never invents URLs',()=>{
 const r=matchCatalogueGuides({
  inventory:{candidates},
  manufacturers:[{id:15,display_name:'BMW'},{id:28,display_name:'Harley-Davidson'}],
  models:[{id:77,manufacturer:'BMW',model:'R 1300 GS'},{id:127,manufacturer:'Harley-Davidson',model:'Fat Boy'}]
 });
 assert.equal(r.pages.length,4);
 assert.equal(r.counts.matchedGuides,4);
 assert.equal(r.pages.find(p=>p.id==='manufacturer:15').url,'/bmw-motorcycles.html');
 assert.equal(r.pages.find(p=>p.id==='model:77').url,'/bmw-r1300gs.html');
 assert.equal(r.pages.some(p=>p.url.includes('-v2')),false);
});
test('ambiguous catalogue identities are never resolved arbitrarily',()=>{
 const r=matchCatalogueGuides({
  inventory:{candidates},
  manufacturers:[{id:15,display_name:'BMW'}],
  models:[{id:77,manufacturer:'BMW',model:'R 1300 GS'},{id:1000,manufacturer:'BMW',model:'R1300GS'}]
 });
 assert.equal(r.pages.some(p=>p.id==='model:77'),false);
 assert.ok(r.diagnostics.some(d=>d.path==='bmw-r1300gs.html'));
});
test('models with no exact, distinct public source are excluded',()=>{
 const r=matchCatalogueGuides({
  inventory:{candidates},
  manufacturers:[],
  models:[{id:21,manufacturer:'BMW',model:'R 1300 GS Adventure'}]
 });
 assert.equal(r.pages.length,0);
 assert.equal(r.counts.eligibleSourceGuides,4);
});

test('two eligible source paths with the same normalized filename are both blocked',()=>{
 const duplicated=[
  {type:'model',path:'bmw-r1300gs.html',sourceEligible:true},
  {type:'model',path:'global/bmw-r1300gs.html',sourceEligible:true}
 ];
 const r=matchCatalogueGuides({
  inventory:{candidates:duplicated},
  manufacturers:[],
  models:[{id:77,manufacturer:'BMW',model:'R 1300 GS'}]
 });
 assert.equal(r.pages.length,0);
 assert.equal(r.diagnostics.filter(x=>x.code==='duplicate-source-match').length,2);
});

test('three normalized duplicates remain permanently ambiguous regardless of order',()=>{
 const r=matchCatalogueGuides({
  inventory:{candidates},
  manufacturers:[{id:15,display_name:'BMW'},{id:150,display_name:' B M W '},{id:151,display_name:'bmw'}],
  models:[{id:77,manufacturer:'BMW',model:'R 1300 GS'},
   {id:777,manufacturer:'BMW',model:'R1300GS'},
   {id:778,manufacturer:'BMW',model:'R-1300-GS'}]
 });
 assert.equal(r.pages.some(p=>p.id==='manufacturer:15'||p.id==='manufacturer:151'),false);
 assert.equal(r.pages.some(p=>p.id==='model:77'||p.id==='model:778'),false);
 assert.ok(r.diagnostics.some(x=>x.path==='bmw-r1300gs.html'));
});
