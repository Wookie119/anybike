// Synthetic contract QA: 20 reviewed section slots on four exact canonical
// models across BMW and Harley. This DOES NOT fabricate real factory content,
// approve images, or mark any model ready for release.
import assert from 'node:assert/strict';
import {loadAndRenderUniversalStage} from '../model-template/universal-page-stage-integration.mjs';
import {SECTION_COUNT,SECTION_KEYS} from '../model-template/universal-page-section-contract.mjs';
class Node{
 constructor(tag,doc){this.tagName=tag;this.ownerDocument=doc;this.childNodes=[];
  this.dataset={};this.textContent='';this.href='';this.className='';}
 append(...nodes){this.childNodes.push(...nodes)}
 replaceChildren(...nodes){this.childNodes=[...nodes]}
}
const document={createElement(t){return new Node(t,this)},
 createDocumentFragment(){return new Node('#fragment',this)}};
const root=()=>{const el=new Node('main',document);
 el.dataset.anybikeUniversalRoot='true';el.dataset.anybikeUniversalStage='true';return el};
const all=x=>[x,...(x.childNodes||[]).flatMap(all)];
const cases=[
 [68,15,'BMW','R 1250 GS'],[77,15,'BMW','R 1300 GS'],
 [153,28,'Harley-Davidson','Sportster S'],
 [157,28,'Harley-Davidson','Street Glide']
];
const published=(m,n)=>({
 entity_type:'model',entity_id:m[0],entity_name:m[3],
 manufacturer_id:m[1],source_section_id:80000+m[0]*100+n,
 publication_review_reference:'SYNTHETIC-TEST-ONLY',section_number:n,
 section_key:SECTION_KEYS[n-1],section_title:'Reviewed slot '+n,
 content:{summary:'Synthetic approved structure for slot '+n},
 editorial_status:'published',publication_eligible:true,
 published_at:'2026-11-09T00:00:00Z'
});
const client=rows=>({from(){
 const chain={select(){return chain},eq(){return chain},order(){return chain},
  limit(){return Promise.resolve({data:rows,error:null})}};
 return chain;
}});
assert.equal(SECTION_COUNT,20);
for(const m of cases){
 const rows=Array.from({length:20},(_,i)=>published(m,i+1));
 const stage=root();
 const view=await loadAndRenderUniversalStage({
  client:client(rows),root:stage,type:'model',id:m[0],manufacturerName:m[2]
 });
 assert.equal(view.sections.length,20,'Lost reviewed slot in '+m[3]);
 assert.deepEqual(view.sections.map(s=>s.key),SECTION_KEYS,
  'Universal research slots reordered for '+m[3]);
 assert.deepEqual(stage.childNodes[0].childNodes.map(x=>x.dataset.anybikeRole||x.tagName),
  ['header','stock','research','customer-actions'],
  'Research placed above Available Stock for '+m[3]);
 const cards=stage.childNodes[0].childNodes[2].childNodes;
 assert.equal(cards.length,20,'20 reviewed summaries should be readable for '+m[3]);
 assert.equal(view.heroPhoto,null,'Absent licensed hero must not invent one');
 assert.equal(all(stage).filter(x=>x.tagName==='img').length,0,
  'Unapproved hero/stock imagery appeared for '+m[3]);
 const over=root();
 await assert.rejects(loadAndRenderUniversalStage({
  client:client([...rows,published(m,21)]),root:over,
  type:'model',id:m[0],manufacturerName:m[2]
 }),/exceeds 20 sections/);
 assert.equal(over.childNodes.length,0,'Overflow mutated stage for '+m[3]);
 const crossed=root();
 await assert.rejects(loadAndRenderUniversalStage({
  client:client([...rows.slice(0,19),published(cases.find(x=>x[0]!==m[0]),20)]),
  root:crossed,type:'model',id:m[0],manufacturerName:m[2]
 }),/Mixed manufacturer\/model publication records/);
 assert.equal(crossed.childNodes.length,0,
  'Cross-model section mutated stage for '+m[3]);
}
console.log('PASS: 20 exact numbered universal section slots, stock-before-research, no placeholder photos, overflow and cross-model records rejected across BMW and Harley');
