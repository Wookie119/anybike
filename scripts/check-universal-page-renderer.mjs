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

class FakeElement {
 constructor(tag,doc){this.tagName=tag;this.ownerDocument=doc;this.childNodes=[];this.dataset={};this.className='';this.href='';this.textContent='';}
 append(...children){this.childNodes.push(...children);}
 replaceChildren(...children){this.childNodes=[...children];}
}
const documentFake={
 createElement(tag){return new FakeElement(tag,this);},
 createDocumentFragment(){return new FakeElement('#fragment',this);}
};
const root=new FakeElement('main',documentFake);root.dataset.anybikeUniversalRoot='true';
const rendered=renderUniversalPage(root,{entity:gs,sections:[mk(gs,12,{
 verified_catalogue_facts:[{fact_id:1,label:'Verified engine output',
  source_verification_status:'verified',source_url:'https://example.org/source',
  source_name:'Factory records',start_year:2024,market:'UK',
  value:{power_hp:145,engine_cc:1300}}]
})],stock:[good,{...good,item_id:99,catalog_model_id:77}]});
assert.equal(rendered.stock.length,1);
const page=root.childNodes[0];
assert.deepEqual(page.childNodes.map(el=>el.dataset.anybikeRole||el.tagName),
 ['header','stock','research','customer-actions']);
const research=page.childNodes[2],section=research.childNodes[0];
assert.equal(section.dataset.sectionKey,'section_12');
const facts=section.childNodes.find(e=>e.className==='anybike-universal-verified-facts');
assert(facts,'Verified manufacturer evidence must render');
const entry=facts.childNodes[0];
assert(entry.childNodes.some(x=>x.tagName==='a'&&x.href==='https://example.org/source'),'Original source missing');
assert(!entry.childNodes.some(x=>x.tagName==='script'),'Raw HTML/source injection');
assert.equal(root.dataset.anybikeRenderedEntity,'model:68');
console.log('PASS: actual DOM ordering, source provenance and no cross-model stock on one renderer');

const blankRoot=new FakeElement('main',documentFake);blankRoot.dataset.anybikeUniversalRoot='true';
const renderedBlank=renderUniversalPage(blankRoot,{entity:gs,sections:[
 mk(gs,11,{source_blocks:[{source_file:'private/source.html'}]}),
 mk(gs,18,{related_model_links:[{label:'BMW R 1300 GS',url:'/bmw-r1300gs.html'}]})
],stock:[]});
assert.equal(renderedBlank.sections.length,2,'Published sections remain in data contract');
const publicResearch=blankRoot.childNodes[0].childNodes[2];
assert.equal(publicResearch.childNodes.length,1,'Source-only sections must never create empty public cards');
const related=publicResearch.childNodes[0];
assert.equal(related.dataset.sectionKey,'section_18');
const collect=(item,all=[])=>{all.push(item);for(const c of item.childNodes||[])collect(c,all);return all;};
assert(collect(related).some(e=>e.tagName==='a'&&e.href==='/bmw-r1300gs.html'),'Published related-model link not rendered');
console.log('PASS: database related-model links and no empty research cards');

const guardedRoot=new FakeElement('main',documentFake);
guardedRoot.dataset.anybikeUniversalRoot='true';
renderUniversalPage(guardedRoot,{entity:gs,sections:[mk(gs,6,{
 generations:[
  {label:'Unverified generation',description:'Draft figures must not appear',
   verification_status:'pending_review'},
  {label:'Pending editorial card',description:'Needs source review',
   content_status:'pending_editorial_review'},
  {label:'Manufacturer verified generation',description:'Reference retained',
   verification_status:'verified'}
 ]
})]});
const guardedNodes=collect(guardedRoot);
const shownText=guardedNodes.map(x=>x.textContent||'').join(' | ');
assert(!shownText.includes('Unverified generation'),'Pending generation leaked from approved section');
assert(!shownText.includes('Pending editorial card'),'Pending editorial card leaked from approved section');
assert(shownText.includes('Manufacturer verified generation'),'Verified generation was incorrectly suppressed');
console.log('PASS: nested draft model research cannot leak through published parent sections');
