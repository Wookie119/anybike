import assert from 'node:assert/strict';
import {composeUniversalPage,renderUniversalPage} from '../model-template/universal-page-renderer.mjs';
const mk=(entity,n,content)=>({entity_type:entity.type,entity_id:entity.id,section_number:n,
 section_key:'section_'+String(n).padStart(2,'0'),section_title:'Research '+n,content,
 editorial_status:'published',published_at:'2026-11-09T08:00:00Z',publication_eligible:true});
const gs={type:'model',id:68,manufacturer_id:15,name:'R 1250 GS'};
const bmw={type:'manufacturer',id:15,name:'BMW'};
const good={catalog_model_id:68,item_id:123,make:'BMW',model:'R 1250 GS',year:2021,
 catalogue_identity_status:'verified',publication_eligible:true,price:8900};
const view=composeUniversalPage({entity:gs,sections:[mk(gs,3,{title:'Factory reference',description:'Verified source'}),{...mk(gs,7,'draft'),editorial_status:'draft'}],
 stock:[good,{...good,item_id:124,catalog_model_id:77},{...good,item_id:125,catalogue_identity_status:'candidate'}]});
assert.equal(view.sections.length,1);
assert.equal(view.stock.length,1);
assert.deepEqual(view.order,['hero','stock','research','customer_actions']);
assert.deepEqual(composeUniversalPage({entity:bmw,sections:[mk(bmw,20,'Export')],stock:[good]}).stock,[]);
assert.throws(()=>composeUniversalPage({entity:gs,sections:[mk({...gs,id:77},3,'Other GS')]}),/Cross-entity/);
assert.throws(()=>renderUniversalPage({dataset:{}},{entity:gs,sections:[]}),/Dedicated universal/);
console.log('PASS: universal shared renderer, canonical stock only, strict publish gates and stock-before-research layout');
