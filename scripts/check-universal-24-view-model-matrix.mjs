// Regression-only simulation of four verified canonical models x six audience
// views. Each stock payload is SUPPLIED AS AUTHORIZED INPUT: this test does
// not establish server RLS permissions or live inventory availability.
import assert from 'node:assert/strict';
import {loadAndRenderUniversalStage} from '../model-template/universal-page-stage-integration.mjs';

class Element {
 constructor(tag,doc){this.tagName=tag;this.ownerDocument=doc;this.childNodes=[];
  this.dataset={};this.textContent='';this.href='';this.className='';}
 append(...nodes){this.childNodes.push(...nodes);}
 replaceChildren(...nodes){this.childNodes=[...nodes];}
}
const document={
 createElement(tag){return new Element(tag,this);},
 createDocumentFragment(){return new Element('#fragment',this);}
};
const root=()=>{const el=new Element('main',document);
 el.dataset.anybikeUniversalRoot='true';el.dataset.anybikeUniversalStage='true';
 return el;
};
const all=n=>[n,...(n.childNodes||[]).flatMap(all)];
const models=[
 {id:68,name:'R 1250 GS',make:'BMW',manufacturerId:15},
 {id:77,name:'R 1300 GS',make:'BMW',manufacturerId:15},
 {id:153,name:'Sportster S',make:'Harley-Davidson',manufacturerId:28},
 {id:157,name:'Street Glide',make:'Harley-Davidson',manufacturerId:28}
];
const audiences=[
 {market:'UK',role:'guest'}, {market:'UK',role:'private'},
 {market:'UK',role:'dealer'}, {market:'international',role:'guest'},
 {market:'international',role:'private'}, {market:'international',role:'dealer'}
];
// This array deliberately exercises different already-authorised input
// shapes; it is NOT a description of production entitlements.
const authorisedStockView=new Set(['UK:private','UK:dealer',
 'international:guest','international:dealer']);
const canonical=(m,stockId)=>({
 catalog_model_id:m.id,item_id:stockId,make:m.make,model:m.name,
 catalogue_identity_status:'verified',publication_eligible:true,year:2025
});
const reviewed=m=>({
 entity_type:'model',entity_id:m.id,entity_name:m.name,
 manufacturer_id:m.manufacturerId,source_section_id:8000+m.id,
 section_number:7,section_key:'section_07',section_title:'Reviewed model history',
 content:{timeline:[{description:'Audited factory-history context'}]},
 editorial_status:'published',publication_eligible:true,
 publication_review_reference:'SYNTHETIC-QA-ONLY',
 published_at:'2026-11-09T00:00:00Z'
});
const mockClient=(rows,error=null)=>({from(table){
 assert.equal(table,'motorcycle_universal_published_sections_v1');
 const q={select(){return q},eq(){return q},order(){return q},
  limit(n){assert.equal(n,21);return Promise.resolve({data:rows,error});}};
 return q;
}});
let checked=0,withStock=0,noStock=0;
for(const m of models){
 for(const a of audiences){
  const label=a.market+':'+a.role;
  const include=authorisedStockView.has(label);
  const current=canonical(m,10000+m.id);
  const opposite=models.find(x=>x.id!==m.id);
  const supplied=include?[
   current,canonical(opposite,10000+opposite.id),
   {...current,item_id:30000+m.id,model:'WRONG MODEL'},
   {...current,item_id:40000+m.id,catalogue_identity_status:'candidate'},
   {...current,item_id:50000+m.id,publication_eligible:false}
  ]:[];
  const stage=root();
  const view=await loadAndRenderUniversalStage({
   client:mockClient([reviewed(m)]),root:stage,type:'model',id:m.id,
   manufacturerName:m.make,permittedStock:supplied
  });
  assert.equal(view.identity.id,m.id,'Wrong canonical entity in '+label);
  assert.equal(view.identity.name,m.name,'Wrong model in '+label);
  const visible=stage.childNodes[0].childNodes;
  assert.deepEqual(visible.map(x=>x.dataset.anybikeRole||x.tagName),
   ['header','stock','research','customer-actions'],
   'Stock must be before research in '+label+' for '+m.name);
  assert.equal(view.sections.length,1,'Reviewed research disappeared in '+label);
  assert.equal(view.stock.length,include?1:0,
   'Unentitled or wrong-model stock in '+label+' for '+m.name);
  assert(!all(stage).some(x=>String(x.textContent||'').includes('WRONG MODEL')));
  const displayedLinks=all(stage).filter(x=>x.tagName==='a'
   && String(x.href||'').includes('/international-vq-motorcycle.html?id='));
  assert.equal(displayedLinks.length,include?1:0,
   'Unexpected inventory card count in '+label);
  if(include){
   withStock++;
   assert(displayedLinks[0].href.endsWith('id='+current.item_id),
    'Wrong model stock link in '+label);
  } else noStock++;
  checked++;
 }
}
// An unapproved outer section must never become visible, independent of
// supplied stock or visitor's signed-in status.
for(const m of models){
 const stage=root();
 await assert.rejects(loadAndRenderUniversalStage({
  client:mockClient([{...reviewed(m),editorial_status:'draft'}]),
  root:stage,type:'model',id:m.id,manufacturerName:m.make
 }),/Unpublished content returned/);
 assert.equal(stage.childNodes.length,0,
  'Draft content replaced stage output: '+m.name);
}
assert.equal(checked,24);
assert.equal(withStock,16);assert.equal(noStock,8);
console.log('PASS: 24 synthetic UK/international guest/private/dealer views, four exact models; '+withStock+
 ' authorised-stock payloads and '+noStock+' empty payloads; stock above research, no cross-model or draft leakage');
