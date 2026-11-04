import test from 'node:test';
import assert from 'node:assert/strict';
import {auditCatalogueManufacturerResolution} from './audit-catalogue-manufacturer-resolution.mjs';

const manufacturers=[{id:20,display_name:'Indian Motorcycle'},{id:11,display_name:'Honda'}];
const models=[{id:1,manufacturer:'Indian Motorcycle',model:'Scout'},
 {id:2,manufacturer:'Indian',model:'Scout Bobber'},
 {id:3,manufacturer:'Mugen',model:'Shinden'},
 {id:4,manufacturer:'Honda',model:'CBR'}];
const alias={source_manufacturer_name:'Indian',canonical_manufacturer_id:20,
 resolution_status:'verified_alias',verified_at:'2026-11-04'};
test('counts exact, reviewed alias and unknown manufacturer separately',()=>{
 const r=auditCatalogueManufacturerResolution({manufacturers,models,manufacturerAliases:[alias]});
 assert.equal(r.counts.totalModels,4);
 assert.equal(r.counts.exact,2);
 assert.equal(r.counts.verifiedAlias,1);
 assert.equal(r.counts.reviewRequired,1);
 assert.deepEqual(r.needsReview,[{manufacturer:'Mugen',models:1,reason:'unmapped-or-unreviewed'}]);
});
test('Mugen cannot become Honda through an unverified alias',()=>{
 const r=auditCatalogueManufacturerResolution({manufacturers,models,
  manufacturerAliases:[alias,{source_manufacturer_name:'Mugen',canonical_manufacturer_id:11,
    resolution_status:'review_required',verified_at:null}]});
 assert.equal(r.counts.reviewRequired,1);
 assert.ok(r.issues.some(x=>x.code==='invalid-or-unreviewed-alias'));
});
test('duplicate canonical names and colliding aliases remain untrusted',()=>{
 const dup=auditCatalogueManufacturerResolution({manufacturers:[...manufacturers,{id:99,display_name:'honda'}],
  models,manufacturerAliases:[alias]});
 assert.ok(dup.issues.length===0);
 assert.ok(dup.needsReview.some(x=>x.manufacturer==='Honda'));
 const collision=auditCatalogueManufacturerResolution({manufacturers,models,
  manufacturerAliases:[alias,{...alias,canonical_manufacturer_id:11}]});
 assert.equal(collision.counts.verifiedAlias,0);
 assert.ok(collision.issues.some(x=>x.code==='ambiguous-manufacturer-alias'));
});
test('empty, malformed inputs do not claim successful matching',()=>{
 assert.throws(()=>auditCatalogueManufacturerResolution({manufacturers:null,models:[]}),/arrays/);
 const r=auditCatalogueManufacturerResolution({manufacturers:[],models:[{id:1,manufacturer:'Unknown'}]});
 assert.equal(r.counts.reviewRequired,1);
 assert.equal(r.counts.exact,0);
});
