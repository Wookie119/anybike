import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validatedManufacturerModelLinks} from '../model-template/public-manufacturer-model-index.mjs';

test('database manufacturer route index never inserts another make or a fabricated page URL',()=>{
 const entries=[
  {make:'BMW',model:'R 1250 GS',url:'/bmw-r1250gs.html'},
  {make:'BMW',model:'R 1250 GS again',url:'/bmw-r1250gs.html'},
  {make:'BMW',model:'R 1300 GS',url:'/bmw-r1300gs.html'},
  {make:'Harley-Davidson',model:'Fat Boy',url:'/harley-davidson-fat-boy.html'},
  {make:'BMW',model:'Unsafe external',url:'https://example.com/bmw-r1250gs.html'},
  {make:'BMW',model:'Bad query',url:'/bmw-r1250gs.html?preview=1'}
 ];
 assert.deepEqual(validatedManufacturerModelLinks(entries,'BMW'),[
  {model:'R 1250 GS',url:'/bmw-r1250gs.html'},
  {model:'R 1300 GS',url:'/bmw-r1300gs.html'}
 ]);
 assert.deepEqual(validatedManufacturerModelLinks(entries,'Harley-Davidson'),[
  {model:'Fat Boy',url:'/harley-davidson-fat-boy.html'}
 ]);
 assert.deepEqual(validatedManufacturerModelLinks(entries,'Ducati'),[]);
});

test('all manufacturer frontends reuse the same database model index without changing approved page content',()=>{
 const module='/model-template/public-manufacturer-model-index.mjs?v=20261109-1';
 for(const page of ['bmw-motorcycles.html','harley-davidson-motorcycles.html','motorcycle-brand.html']){
  const html=fs.readFileSync(page,'utf8');
  assert.ok(html.includes('<script type="module" src="'+module+'"></script>'),page);
  assert.ok(html.includes('/public-header.js'),page+' approved header remains');
  assert.ok(html.includes('motorcycle-related-manufacturers.js'),page+' original manufacturer links remain');
 }
 const code=fs.readFileSync('model-template/public-manufacturer-model-index.mjs','utf8');
 assert.ok(code.includes("db.rpc('public_anybike_manufacturer_model_routes_v1'"));
 assert.ok(code.includes("details.addEventListener('toggle'"));
 assert.ok(!code.includes('preview_visible'));
 assert.ok(!code.includes('service_role'));
 assert.ok(!code.includes('#813438'),'Off-brand burgundy must not appear in shared model chips');
 assert.ok(code.includes('border:1px solid #555'),'Database-backed directory uses approved neutral outlines');
});
