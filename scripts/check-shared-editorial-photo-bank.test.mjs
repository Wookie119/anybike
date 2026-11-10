// Regression tests for the shared editorial photo bank. No network or credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('shared-editorial-photo-bank.js','utf8');
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:'shared-editorial-photo-bank.js'});
const {findPhotos,selectPhoto}=sandbox.window.AnyBikeEditorialPhotos;
const rights={source_page_url:'https://example.test/source',licence_url:'https://example.test/licence',licence:'CC BY-SA 4.0',attribution:'Photographer credit'};
const records=[
 {...rights,asset_key:'bmw-r1300',manufacturer:'BMW',model:'R 1300 GS',model_year_start:2024,model_year_end:2026,subject_category:'whole_motorcycle',feature_tags:['hero'],usage_contexts:['model'],image_url:'https://example.test/r1300.jpg',approval_status:'approved'},
 {...rights,asset_key:'bmw-r1250',manufacturer:'BMW',model:'R 1250 GS',model_year_start:2019,model_year_end:2023,subject_category:'whole_motorcycle',feature_tags:['hero'],usage_contexts:['model'],image_url:'https://example.test/r1250.jpg',approval_status:'approved'},
 {asset_key:'bmw-unreviewed',manufacturer:'BMW',model:'R 1300 GS',model_year_start:2025,model_year_end:2025,subject_category:'whole_motorcycle',feature_tags:['hero'],usage_contexts:['model'],approval_status:'candidate'},
 {asset_key:'harley',manufacturer:'Harley-Davidson',model:'Road King',model_year_start:2020,model_year_end:2020,subject_category:'whole_motorcycle',usage_contexts:['model'],approval_status:'approved'}
];
function client(){
 const state={filters:[],selected:''};
 const builder={
  select(fields){state.selected=fields;return builder},
  eq(key,value){state.filters.push([key,value]);return builder},
  order(){return builder},
  limit(){return builder},
  then(resolve,reject){return Promise.resolve({data:records.filter(row=>state.filters.every(([key,value])=>row[key]===value)).map(row=>Object.fromEntries(state.selected.split(',').map(key=>[key,row[key]]))),error:null}).then(resolve,reject)}
 };
 return {from(table){assert.equal(table,'anybike_editorial_photo_bank');return builder}};
}
test('approved exact-model photo only, with year and context filtering',async()=>{
 const photos=await findPhotos(client(),{manufacturer:'BMW',model:'R 1300 GS',year:2025,category:'whole_motorcycle',context:'model'});
 assert.deepEqual(Array.from(photos,p=>p.asset_key),['bmw-r1300']);
 assert.equal(selectPhoto(photos,{manufacturer:'BMW',model:'R 1250 GS'}),null);
 assert.equal(selectPhoto(photos,{manufacturer:'BMW',model:'R 1300 GS',year:2023}),null);
 assert.equal(selectPhoto(photos,{manufacturer:'BMW',model:'R 1300 GS',year:2025})?.asset_key,'bmw-r1300');
});
test('candidate and other-manufacturer images are never returned',async()=>{
 const photos=await findPhotos(client(),{manufacturer:'BMW'});
 assert.deepEqual(Array.from(photos,p=>p.asset_key).sort(),['bmw-r1250','bmw-r1300']);
 assert.equal(selectPhoto(photos,{manufacturer:'Harley-Davidson'}),null);
});
test('selector rejects unapproved candidates even if supplied directly',()=>{
 const valid=records[0];
 const candidate={...valid,asset_key:'candidate-first',approval_status:'candidate'};
 const rejected={...valid,asset_key:'rejected-first',approval_status:'rejected'};
 const photos=[candidate,rejected,valid];
 assert.equal(selectPhoto(photos,{manufacturer:'BMW',model:'R 1300 GS',year:2025})?.asset_key,'bmw-r1300');
 assert.equal(selectPhoto([candidate,rejected],{manufacturer:'BMW',model:'R 1300 GS',year:2025}),null);
});
test('photo publication requires verified licensing metadata and HTTPS sources',async()=>{
 const valid=records[0];
 for(const field of ['image_url','source_page_url','licence_url','licence','attribution']){
  const invalid={...valid,[field]:field.endsWith('_url')||field==='image_url'?'http://insecure.test/photo':''};
  assert.equal(selectPhoto([invalid],{manufacturer:'BMW',model:'R 1300 GS',year:2025}),null,field);
 }
 const bad={...valid,attribution:''};
 const customClient={from(){return {
  select(){return this},eq(){return this},order(){return this},limit(){return this},
  then(resolve,reject){return Promise.resolve({data:[bad,valid],error:null}).then(resolve,reject)}
 }}}};
 const photos=await findPhotos(customClient,{manufacturer:'BMW',model:'R 1300 GS'});
 assert.deepEqual(Array.from(photos,p=>p.asset_key),['bmw-r1300']);
});
test('missing manufacturer or database client fails closed',async()=>{
 await assert.rejects(()=>findPhotos(null,{manufacturer:'BMW'}),/Supabase client required/);
 await assert.rejects(()=>findPhotos(client(),{}),/Manufacturer required/);
});
