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
const wrongLabelRoot=new FakeElement('main',documentFake);
wrongLabelRoot.dataset.anybikeUniversalRoot='true';
renderUniversalPage(wrongLabelRoot,{entity:gs,sections:[],stock:[{
 ...good,make:'Harley-Davidson',model:'R 1300 GS',year:2021
}]});
const wrongLabelStock=wrongLabelRoot.childNodes[0].childNodes[1];
assert.equal(wrongLabelStock.childNodes.length,2,'Conflicting advert model must be excluded, not relabelled');
assert.equal(wrongLabelStock.childNodes[1].tagName,'p','Rejected stock must not produce a listing card');
const wrongManufacturerRoot=new FakeElement('main',documentFake);
wrongManufacturerRoot.dataset.anybikeUniversalRoot='true';
const makeGuard=renderUniversalPage(wrongManufacturerRoot,{
 entity:{...gs,manufacturer_name:'BMW'},sections:[],
 stock:[{...good,make:'Harley-Davidson'}]
});
assert.equal(makeGuard.stock.length,0,'Contradictory manufacturer must never appear on model stock');
const validManufacturerRoot=new FakeElement('main',documentFake);
validManufacturerRoot.dataset.anybikeUniversalRoot='true';
const validMake=renderUniversalPage(validManufacturerRoot,{
 entity:{...gs,manufacturer_name:'BMW'},sections:[],
 stock:[{...good,make:'BMW'}]
});
assert.equal(validMake.stock.length,1,'Matching manufacturer should preserve verified stock');


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
  {label:'Hidden source candidate',description:'Source not yet verified',
   source_verification_status:'pending_review'},
  {label:'Unpublished editorial record',description:'Editorial review required',
   editorial_status:'draft'},
  {label:'Verified source record',description:'Source checked',
   source_verification_status:'verified'},
  {label:'Manufacturer verified generation',description:'Reference retained',
   verification_status:'verified'}
 ]
})]});
const guardedNodes=collect(guardedRoot);
const shownText=guardedNodes.map(x=>x.textContent||'').join(' | ');
assert(!shownText.includes('Unverified generation'),'Pending generation leaked from approved section');
assert(!shownText.includes('Pending editorial card'),'Pending editorial card leaked from approved section');
assert(!shownText.includes('Hidden source candidate'),'Pending source record leaked');
assert(!shownText.includes('Unpublished editorial record'),'Nested draft editorial record leaked');
assert(shownText.includes('Verified source record'),'Verified source record incorrectly suppressed');
assert(shownText.includes('Manufacturer verified generation'),'Verified generation was incorrectly suppressed');
console.log('PASS: nested draft model research cannot leak through published parent sections');

const detailRoot=new FakeElement('main',documentFake);
detailRoot.dataset.anybikeUniversalRoot='true';
renderUniversalPage(detailRoot,{entity:gs,sections:[
 mk(gs,3,{timeline:[
  {period:'September 2018',description:'Factory introduction, not verified build date',
   source:'https://www.press.bmwgroup.com/example'},
  {period:'2021 model year',description:'Updated electronics'}
 ]}),
 mk(gs,4,{production_evidence:[
  {date:'2023-06-21',evidence:'A documented Berlin factory milestone'}
 ]}),
 mk(gs,5,{engineering:{verification_status:'approved',rows:[
  ['Engine','1,254 cc boxer'],['Torque','143 Nm'],
  ['Unapproved HTML','<script>alert(1)</script>'],['Malformed'],['Blank','']
 ]}})
]});
const detailNodes=collect(detailRoot);
const detailText=detailNodes.map(x=>x.textContent||'').join(' | ');
assert(detailText.includes('September 2018'),'Model history timeline was not rendered');
const citations=detailNodes.filter(x=>x.className==='anybike-universal-source-link');
assert(citations.some(x=>x.href==='https://www.press.bmwgroup.com/example'),'Factory citation link missing');
assert(citations.every(x=>x.rel==='noopener noreferrer'),'Source link lacks safe external navigation');

assert(detailText.includes('2021 model year'),'Dated generation history was not rendered');
assert(detailText.includes('2023-06-21'),'Production evidence date was not rendered');
assert(detailText.includes('A documented Berlin factory milestone'),'Production evidence not displayed');
assert(detailText.includes('1,254 cc boxer'),'Approved engineering pair not rendered');
assert(detailText.includes('143 Nm'),'Approved torque row missing');
assert(!detailNodes.some(x=>x.tagName==='script'),'Research data created an HTML script');
const approvedSpecs=detailNodes.find(x=>x.className==='anybike-universal-specification-rows');
assert(approvedSpecs,'Approved technical rows need a semantic description list');
assert.equal(approvedSpecs.childNodes.filter(x=>x.tagName==='dt').length,3,'Malformed or blank rows must be suppressed');

const pendingDetailRoot=new FakeElement('main',documentFake);
pendingDetailRoot.dataset.anybikeUniversalRoot='true';
renderUniversalPage(pendingDetailRoot,{entity:gs,sections:[
 mk(gs,5,{engineering:{verification_status:'pending_editorial_review',rows:[['Power','UNVERIFIED VALUE']]}})
]});
assert(!collect(pendingDetailRoot).some(x=>String(x.textContent).includes('UNVERIFIED VALUE')),
 'Nested pending engineering was published');
console.log('PASS: shared approved timeline, provenance and technical row rendering; pending engineering suppressed');

const verifiedAmountRoot=new FakeElement('main',documentFake);
verifiedAmountRoot.dataset.anybikeUniversalRoot='true';
renderUniversalPage(verifiedAmountRoot,{entity:gs,sections:[mk(gs,12,{
 verified_catalogue_facts:[
  {label:'Verified engine capacity',source_verification_status:'verified',
   source_url:'https://www.press.bmwgroup.com/engine',value:{amount:1254,unit:'cc'}},
  {label:'BMW press announcement',source_verification_status:'verified',
   source_url:'https://www.press.bmwgroup.com/launch',value:{announcement_date:'2018-09-17'}},
  {label:'Pending fact',source_verification_status:'candidate',
   source_url:'https://www.press.bmwgroup.com/candidate',value:{amount:9999,unit:'hp'}}
 ]
})]});
const verifiedNodes=collect(verifiedAmountRoot),verifiedText=verifiedNodes.map(x=>x.textContent||'').join(' | ');
assert(verifiedText.includes('1254 cc'),'Verified numeric amount and unit missing');
assert(verifiedText.includes('2018-09-17'),'Announcement date missing');
assert(!verifiedText.includes('9999 hp'),'Candidate fact leaked');
assert(verifiedNodes.some(x=>x.tagName==='a'&&x.href==='https://www.press.bmwgroup.com/engine'),
 'Documented capacity source URL missing');

const yearContextRoot=new FakeElement('main',documentFake);
yearContextRoot.dataset.anybikeUniversalRoot='true';
renderUniversalPage(yearContextRoot,{entity:gs,sections:[
 mk(gs,1,{hero:{years:'2018 launch, 2019 model references; exact production start not asserted',
  paragraphs:['Original factory-documented launch overview']}}),
 mk(gs,16,{deep_dive:[{title:'BMW ownership notes',subtitle:'Documented owner guidance'}]})
]});
const yearContextNodes=collect(yearContextRoot);
const yearContextText=yearContextNodes.map(x=>x.textContent||'').join(' | ');
assert(yearContextText.includes('2018 launch, 2019 model references'),
 'Documented model-year note suppressed by generic renderer');
assert(yearContextText.includes('Documented owner guidance'),
 'Approved research subtitle suppressed by generic renderer');
assert(yearContextNodes.some(x=>x.className==='anybike-universal-model-years'),
 'Model-year context class missing from shared layout');


const imageRoot=new FakeElement('main',documentFake);
imageRoot.dataset.anybikeUniversalRoot='true';
renderUniversalPage(imageRoot,{entity:{...gs,manufacturer_name:'BMW'},sections:[],stock:[
 {...good,item_id:990,image_url:'https://cdn.example.org/stock-990.jpg',model:'R 1250 GS',make:'BMW'},
 {...good,item_id:991,image_url:'http://cdn.example.org/insecure.jpg',model:'R 1250 GS',make:'BMW'},
 {...good,item_id:992,image_url:'https://cdn.example.org/wrong-model.jpg',model:'R 1300 GS',make:'BMW'}
]});
const imageNodes=collect(imageRoot),images=imageNodes.filter(x=>x.tagName==='img');
assert.equal(images.length,1,'Only HTTPS exact-model stock photography may be rendered');
assert.equal(images[0].src,'https://cdn.example.org/stock-990.jpg');
assert.equal(images[0].alt,'R 1250 GS motorcycle available in stock');
assert.equal(images[0].loading,'lazy');
assert(!imageNodes.some(x=>String(x.src||'').includes('wrong-model.jpg')),
 'A mismatched motorcycle image leaked into stock cards');
console.log('PASS: exact-model authorized stock pictures, HTTPS only, with accessible labels');


const embargoedFactsRoot=new FakeElement('main',documentFake);
embargoedFactsRoot.dataset.anybikeUniversalRoot='true';
renderUniversalPage(embargoedFactsRoot,{entity:gs,sections:[mk(gs,12,{
 verified_catalogue_facts:[
  {label:'Verified source but editorial draft',source_verification_status:'verified',
   editorial_status:'draft',source_url:'https://example.org/draft',value:{power_hp:9999}},
  {label:'Verified source but denied for publication',source_verification_status:'verified',
   publication_eligible:false,source_url:'https://example.org/denied',value:{power_hp:9998}},
  {label:'Verified source with pending copy review',source_verification_status:'verified',
   content_status:'pending_review',source_url:'https://example.org/pending',value:{power_hp:9997}},
  {label:'Verified future release',source_verification_status:'verified',
   published_at:'2099-01-01T00:00:00Z',source_url:'https://example.org/future',value:{power_hp:9996}},
  {label:'Verified invalid release',source_verification_status:'verified',
   published_at:'invalid-date',source_url:'https://example.org/invalid',value:{power_hp:9995}},
  {label:'Reviewed and released fact',source_verification_status:'verified',
   editorial_status:'published',published_at:'2026-11-09T00:00:00Z',
   source_url:'https://example.org/approved',value:{power_hp:145}}
 ]
})]});
const embargoedNodes=collect(embargoedFactsRoot);
const visibleFactsText=embargoedNodes.map(x=>x.textContent||'').join(' | ');
for(const forbidden of ['9999','9998','9997','9996','9995'])
 assert(!visibleFactsText.includes(forbidden),'Unapproved verified-source fact leaked: '+forbidden);
assert(visibleFactsText.includes('145 hp'),'Approved verified fact was hidden');
assert(embargoedNodes.some(x=>x.href==='https://example.org/approved'),'Approved fact source missing');
console.log('PASS: verified source facts still require editorial approval and release time');

const photo={approval_status:'approved',manufacturer:'BMW',model:'R 1250 GS',
 image_url:'https://example.org/bmw-r1250.jpg',
 source_page_url:'https://example.org/rights',
 licence_url:'https://example.org/licence',licence:'CC BY 4.0',
 attribution:'BMW source photo'};
const approvedHeroRoot=new FakeElement('main',documentFake);
approvedHeroRoot.dataset.anybikeUniversalRoot='true';
const heroView=renderUniversalPage(approvedHeroRoot,{
 entity:{...gs,manufacturer_name:'BMW'},sections:[],heroPhoto:photo
});
assert(heroView.heroPhoto,'Exact-model approved photography must survive validation');
const heroNodes=collect(approvedHeroRoot);
const heroImages=heroNodes.filter(x=>x.tagName==='img');
assert.equal(heroImages.length,1,'Approved model hero should render exactly once');
assert.equal(heroImages[0].src,photo.image_url);
assert(heroNodes.some(x=>x.tagName==='a'&&x.href===photo.licence_url),
 'Approved hero must provide licence link');
assert(heroNodes.some(x=>x.tagName==='a'&&x.href===photo.source_page_url),
 'Approved hero must retain attribution source');

for(const invalid of [
 {...photo,model:'R 1300 GS'},
 {...photo,manufacturer:'Harley-Davidson'},
 {...photo,approval_status:'candidate'},
 {...photo,licence:''},
 {...photo,attribution:''},
 {...photo,image_url:'http://example.org/insecure.jpg'},
 {...photo,source_page_url:'javascript:alert(1)'},
 {...photo,licence_url:'http://example.org/not-licensed'}
]){
 const wrongRoot=new FakeElement('main',documentFake);
 wrongRoot.dataset.anybikeUniversalRoot='true';
 const wrongView=renderUniversalPage(wrongRoot,{
  entity:{...gs,manufacturer_name:'BMW'},sections:[],heroPhoto:invalid
 });
 assert.equal(wrongView.heroPhoto,null,'Invalid hero asset passed publication gate');
 assert(!collect(wrongRoot).some(x=>x.tagName==='img'),
  'Different model or unlicensed image leaked into hero');
}
console.log('PASS: editorial hero photography requires exact model and complete rights');


console.log('PASS: source-verified facts retain numeric units and announcement dates');


