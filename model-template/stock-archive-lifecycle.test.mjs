import assert from 'node:assert/strict';
import {stockLifecycle,stockSitemapEligible,similarStock} from './stock-archive-lifecycle.mjs';

const base={item_id:1,publication_permission:true,channel_eligible:true,source_status:'live',substantive_content:true,indexing_permission:true,canonical_ready:true};
assert.equal(stockLifecycle(base),'available');
assert.equal(stockLifecycle({...base,reserved:true}),'reserved');
const ended={...base,source_status:'ended',removal_confirmed:true,archive_permission:true};
assert.equal(stockLifecycle(ended),'archived');
assert.equal(stockSitemapEligible(ended),true);
for(const patch of [{archive_permission:false},{removal_confirmed:false},{publication_permission:false},{channel_eligible:false},{excluded:true},{substantive_content:false}]){
 assert.equal(stockLifecycle({...ended,...patch}),'withdrawn');
 assert.equal(stockSitemapEligible({...ended,...patch}),false);
}
assert.equal(stockSitemapEligible({...ended,canonical_ready:false}),false);
assert.equal(stockSitemapEligible({...ended,indexing_permission:false}),false);
assert.equal(stockLifecycle({...ended,source_status:'live'}),'available');
const target={item_id:1,catalog_model_id:70};
const bike=(item_id,catalog_model_id,extra={})=>({item_id,catalog_model_id,publication_eligible:true,catalogue_identity_status:'verified',source_status:'live',...extra});
const candidates=[bike(9,99),bike(8,73),bike(7,72),bike(6,71),bike(5,70),bike(5,70),bike(1,70),bike(10,70,{reserved:true}),bike(11,70,{source_status:'ended'}),bike(12,70,{publication_eligible:false}),bike(13,70,{catalogue_identity_status:'candidate'})];
const relationships={variants:[71],relatedModels:[72],comparable:[73],sameManufacturer:[99]};
assert.deepEqual(similarStock(target,candidates,relationships).map(x=>x.item_id),[5,6,7,8]);
assert.deepEqual(similarStock(target,candidates,relationships,2).map(x=>x.item_id),[5,6]);
assert.deepEqual(similarStock(target,[bike(9,99)],relationships),[]);
assert.deepEqual(similarStock({item_id:1},candidates,relationships),[]);
console.log('PASS: stock lifecycle, archive rights, sitemap gates and exact-model recommendation ranking');
