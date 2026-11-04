import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedIdentitiesFromRoutes} from './verified-editorial-route-identities.mjs';

const verified={id:1,entity_type:'manufacturer',manufacturer_id:15,public_path:'/bmw-motorcycles.html',
 publication_state:'published',source_verified_at:'2026-11-04',live_verified_at:'2026-11-04',editorial_verified_at:'2026-11-04'};
const makes=[{id:15,display_name:'BMW'}];
test('current candidates cannot enter published graph',()=>{
 const r=verifiedIdentitiesFromRoutes({
  routes:[{...verified,publication_state:'candidate',live_verified_at:null}],
  manufacturers:makes
 });
 assert.equal(r.identities.length,0);
 assert.equal(r.skippedUnpublished,1);
});
test('all three checks plus canonical database identity required',()=>{
 const r=verifiedIdentitiesFromRoutes({
  routes:[verified,{...verified,id:2,entity_type:'model',model_id:77,manufacturer_id:null,public_path:'/bmw-r1300gs.html'},
   {...verified,id:3,entity_type:'model',model_id:999,public_path:'/bmw-made-up.html'}],
  manufacturers:makes,
  models:[{id:77,manufacturer:'BMW',model:'R 1300 GS'}]
 });
 assert.deepEqual(r.identities.map(p=>p.id),['manufacturer:15','model:77']);
 assert.equal(r.diagnostics.length,1);
 assert.equal(r.identities[0].url,'https://www.anybike.co.uk/bmw-motorcycles.html');
});
test('pending story cannot be published even with registered route',()=>{
 const r=verifiedIdentitiesFromRoutes({
  routes:[{...verified,id:4,entity_type:'global',manufacturer_id:null,story_id:10,public_path:'/global/history.html'}],
  stories:[{id:10,headline:'History',story_url:'/global/history.html',editorial_status:'draft'}]
 });
 assert.equal(r.identities.length,0);
 assert.equal(r.diagnostics[0].code,'unmatched-route-identity');
});
test('incomplete verification blocks all page types',()=>{
 for(const field of ['source_verified_at','live_verified_at','editorial_verified_at']){
  const r=verifiedIdentitiesFromRoutes({routes:[{...verified,[field]:null}],manufacturers:makes});
  assert.equal(r.identities.length,0,field);
 }
});


test('verified country route identity comes from private registry name and region',()=>{
 const route={id:80,entity_type:'country',country_slug:'kenya',country_name:'Kenya',
  country_region:'Africa',public_path:'/markets/kenya.html',
  publication_state:'published',source_verified_at:'2026-11-04',
  live_verified_at:'2026-11-04',editorial_verified_at:'2026-11-04'};
 const r=verifiedIdentitiesFromRoutes({routes:[route]});
 assert.equal(r.identities.length,1);
 assert.deepEqual(r.identities[0],{
  id:'country:kenya',type:'country',title:'Kenya',
  url:'https://www.anybike.co.uk/markets/kenya.html',
  published:true,liveVerified:true
 });
 const tampered=verifiedIdentitiesFromRoutes({routes:[{...route,country_region:'Imaginary'}]});
 assert.equal(tampered.identities.length,0);
});
