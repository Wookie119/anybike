import assert from 'node:assert/strict';
import {loadAndRenderUniversalStage} from '../model-template/universal-page-stage-integration.mjs';

class FakeElement {
 constructor(tag,doc){
  this.tagName=tag;this.ownerDocument=doc;this.childNodes=[];
  this.dataset={};this.textContent='';this.className='';this.href='';
 }
 append(...nodes){this.childNodes.push(...nodes);}
 replaceChildren(...nodes){this.childNodes=[...nodes];}
}
const doc={
 createElement(tag){return new FakeElement(tag,this);},
 createDocumentFragment(){return new FakeElement('#fragment',this);}
};
const stage=()=>{
 const root=new FakeElement('main',doc);
 root.dataset.anybikeUniversalRoot='true';
 root.dataset.anybikeUniversalStage='true';
 root.append(new FakeElement('sentinel',doc));
 return root;
};
const published=(id=77,model='R 1300 GS')=>({
 entity_type:'model',entity_id:id,entity_name:model,manufacturer_id:15,
 source_section_id:1001,publication_review_reference:'BMW-REVIEW-2026-11-10',
 section_number:3,section_key:'section_03',section_title:'Model history',
 content:{timeline:[{period:'2024',description:'Factory model history'}]},
 editorial_status:'published',publication_eligible:true,
 published_at:'2026-11-10T08:00:00Z'
});
const client=(rows,error=null)=>({from(table){
 assert.equal(table,'motorcycle_universal_published_sections_v1');
 const chain={
  select(){return chain;},
  eq(){return chain;},
  order(){return chain;},
  limit(number){assert.equal(number,21);return Promise.resolve({data:rows,error});}
 };
 return chain;
}});
const match={
 catalog_model_id:77,item_id:500,make:'BMW',model:'R 1300 GS',year:2024,
 publication_eligible:true,catalogue_identity_status:'verified'
};
const wrong={...match,item_id:501,model:'R 1250 GS'};
const wrongMake={...match,item_id:502,make:'Harley-Davidson'};
const root=stage();
const view=await loadAndRenderUniversalStage({
 client:client([published()]),root,type:'model',id:77,
 manufacturerName:'BMW',permittedStock:[wrong,wrongMake,match]
});
assert.equal(view.identity.name,'R 1300 GS');
assert.equal(view.stock.length,1,'Conflicting motorcycle stock must be excluded');
assert.deepEqual(root.childNodes[0].childNodes.map(x=>x.dataset.anybikeRole||x.tagName),
 ['header','stock','research','customer-actions']);
assert.equal(root.dataset.anybikeRenderedEntity,'model:77');

const missingReview=stage(),reviewSentinel=missingReview.childNodes[0];
await assert.rejects(loadAndRenderUniversalStage({
 client:client([{...published(),publication_review_reference:''}]),
 root:missingReview,type:'model',id:77
}),/Missing reviewed publication provenance/);
assert.equal(missingReview.childNodes[0],reviewSentinel,'Missing review must not mutate stage');
const missingMake=stage(),makeSentinel=missingMake.childNodes[0];
await assert.rejects(loadAndRenderUniversalStage({
 client:client([published()]),root:missingMake,type:'model',id:77,
 permittedStock:[match]
}),/Trusted manufacturer name required/);
assert.equal(missingMake.childNodes[0],makeSentinel,'Missing manufacturer must not mutate stage');

const empty=stage(),sentinel=empty.childNodes[0];
assert.equal(await loadAndRenderUniversalStage({
 client:client([]),root:empty,type:'model',id:77,manufacturerName:'BMW',permittedStock:[match]
}),null);
assert.equal(empty.childNodes[0],sentinel,'No public approval must not replace stage content');

const bad=stage(),badSentinel=bad.childNodes[0];
await assert.rejects(loadAndRenderUniversalStage({
 client:client([{...published(),editorial_status:'draft'}]),
 root:bad,type:'model',id:77
}),/Unpublished/);
assert.equal(bad.childNodes[0],badSentinel,'Draft rejection must leave DOM unchanged');

const crossed=stage(),crossSentinel=crossed.childNodes[0];
await assert.rejects(loadAndRenderUniversalStage({
 client:client([published(68,'R 1250 GS')]),root:crossed,type:'model',id:77
}),/identity mismatch/);
assert.equal(crossed.childNodes[0],crossSentinel,'Cross-model rejection must leave DOM unchanged');

const denied=stage(),denySentinel=denied.childNodes[0];
await assert.rejects(loadAndRenderUniversalStage({
 client:client([], {message:'RLS denied'}),root:denied,type:'model',id:77
}),/unavailable/);
assert.equal(denied.childNodes[0],denySentinel,'Access failure must not render');

await assert.rejects(loadAndRenderUniversalStage({
 client:client([published()]),
 root:new FakeElement('main',doc),type:'model',id:77
}),/opt-in universal stage root/);
await assert.rejects(loadAndRenderUniversalStage({
 client:client([published()]),root:stage(),type:'model',id:77,
 permittedStock:{items:[match]}
}),/Permitted stock must be an array/);

const manufacturerRow={
 ...published(15,'BMW'),entity_type:'manufacturer',entity_name:'BMW',
 manufacturer_id:15
};
const manufacturerRoot=stage();
const manufacturerView=await loadAndRenderUniversalStage({
 client:client([manufacturerRow]),root:manufacturerRoot,
 type:'manufacturer',id:15,permittedStock:[match]
});
assert.equal(manufacturerView.stock.length,0,'Manufacturer pages must not inherit model stock');


const raceRoot=stage();
let finishOld,finishNew;
const oldClient=client([published()]);
const newClient=client([published(68,'R 1250 GS')]);
function delayed(base,setFinish){
 return {from(table){
  const q=base.from(table);
  return {
   select(...args){q.select(...args);return this;},
   eq(...args){q.eq(...args);return this;},
   order(...args){q.order(...args);return this;},
   limit(...args){return new Promise(resolve=>setFinish(()=>q.limit(...args).then(resolve))); }
  };
 }};
}
const oldRequest=loadAndRenderUniversalStage({
 client:delayed(oldClient,finish=>{finishOld=finish}),root:raceRoot,
 type:'model',id:77,manufacturerName:'BMW'
});
const newRequest=loadAndRenderUniversalStage({
 client:delayed(newClient,finish=>{finishNew=finish}),root:raceRoot,
 type:'model',id:68,manufacturerName:'BMW'
});
finishNew();
const newest=await newRequest;
assert.equal(newest.identity.id,68,'Newest selection must render');
finishOld();
assert.equal(await oldRequest,null,'Older response must be ignored');
assert.equal(raceRoot.dataset.anybikeRenderedEntity,'model:68',
 'Slow older research response overwrote new model selection');

const raceEmptyRoot=stage();
let finishFirst,finishEmpty;
const first=loadAndRenderUniversalStage({
 client:delayed(oldClient,finish=>{finishFirst=finish}),
 root:raceEmptyRoot,type:'model',id:77,manufacturerName:'BMW'
});
const second=loadAndRenderUniversalStage({
 client:delayed(client([]),finish=>{finishEmpty=finish}),
 root:raceEmptyRoot,type:'model',id:68,manufacturerName:'BMW'
});
finishEmpty();
assert.equal(await second,null,'Empty newer selection must be preserved');
finishFirst();
assert.equal(await first,null,'Older response must not display after newer empty selection');
assert.equal(raceEmptyRoot.childNodes[0].tagName,'sentinel','Older result replaced empty view');


const mutableStock=[{...match}];
const mutableRoot=stage();
let finishMutable;
const pendingMutable=loadAndRenderUniversalStage({
 client:delayed(client([published()]),finish=>{finishMutable=finish}),
 root:mutableRoot,type:'model',id:77,manufacturerName:'BMW',
 permittedStock:mutableStock
});
mutableStock[0].model='R 1250 GS';
mutableStock.push({...match,item_id:900});
finishMutable();
const immutableResult=await pendingMutable;
assert.equal(immutableResult.stock.length,1,
 'Late changes to the input feed must not change an in-flight rendering');
assert.equal(immutableResult.stock[0].model,'R 1300 GS',
 'Existing authorized stock identity mutated during research load');

console.log('PASS: stage-only public integration, safe stock ordering, no drafts, no cross-model fallback and no live-page mutation');
