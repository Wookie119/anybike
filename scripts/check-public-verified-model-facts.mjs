import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exactVerifiedModelFacts,mountVerifiedModelFacts,installVerifiedModelFacts,verifiedFactoryDate,orderedVerifiedFactoryFacts,verifiedEngineeringVariants} from '../model-template/public-verified-model-facts.mjs';
import {approvedExactModelGallery,mountApprovedModelGallery,installApprovedModelGallery} from '../model-template/public-approved-model-gallery.mjs';
import {exactApprovedHarleyRoute,installApprovedHarleyResearch} from '../model-template/public-harley-verified-research.mjs';
const approvedHarleyRoutes=[
 {make:'Harley-Davidson',model:'Fat Boy',url:'/harley-davidson-fat-boy.html'},
 {make:'Harley-Davidson',model:'Road Glide',url:'/harley-davidson-road-glide.html'}
];
assert.equal(exactApprovedHarleyRoute(approvedHarleyRoutes,'/harley-davidson-fat-boy.html')?.model,'Fat Boy',
 'Published Harley page must resolve only its approved exact model');
assert.equal(exactApprovedHarleyRoute(approvedHarleyRoutes,'/harley-davidson-road-glide.html')?.model,'Road Glide');
assert.equal(exactApprovedHarleyRoute(approvedHarleyRoutes,'/harley-davidson-nightster.html'),null,
 'Do not derive or invent missing model routes from URL filenames');
assert.equal(exactApprovedHarleyRoute([...approvedHarleyRoutes,approvedHarleyRoutes[0]],'/harley-davidson-fat-boy.html'),null,
 'Duplicated model-route mappings must not accidentally publish research');
assert.equal(exactApprovedHarleyRoute([{make:'BMW',model:'Fat Boy',url:'/harley-davidson-fat-boy.html'}],'/harley-davidson-fat-boy.html'),null,
 'Harley research must never accept a foreign manufacturer identity');

const sample=(overrides={})=>({
 fact_id:49,make:'Suzuki',model:'RM250',category:'model_year',
 label:'RM250 1976 archive specifications',
 value:{engine_cc:246,power:'26.5 kW (36 PS)',weight:'97 kg'},
 start_year:1976,source_name:'Suzuki Digital Library',
 source_url:'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php',
 ...overrides
});
assert.equal(exactVerifiedModelFacts([sample(),sample({fact_id:50,start_year:2001})],'Suzuki','RM250').length,2);
assert.deepEqual(exactVerifiedModelFacts([sample({make:'Yamaha'})],'Suzuki','RM250'),[]);
assert.deepEqual(exactVerifiedModelFacts([sample({model:'RM125'})],'Suzuki','RM250'),[]);
assert.deepEqual(exactVerifiedModelFacts([sample({source_url:'javascript:alert(1)'})],'Suzuki','RM250'),[]);
assert.deepEqual(exactVerifiedModelFacts([sample({category:'draft_editorial'})],'Suzuki','RM250'),[]);
assert.deepEqual(exactVerifiedModelFacts([sample({value:{private_field:{unreviewed:true}}})],'Suzuki','RM250'),[]);
const clean=exactVerifiedModelFacts([
 sample({value:{engine_cc:246,power:'36 PS',unsafe_html:'<img src=x onerror=alert(1)>'}}),
 sample({fact_id:50,model:'RM125'})
],'Suzuki','RM250');
assert.equal(clean.length,1);
assert.equal(clean[0].display[0].label,'Engine capacity (cc)');
const measured=exactVerifiedModelFacts([
 sample({fact_id:141,make:'BMW',model:'R 1300 GS',category:'engine',
  label:'Engine displacement',value:{amount:1300,unit:'cc'}}),
 sample({fact_id:142,make:'BMW',model:'R 1300 GS',category:'performance',
  label:'Maximum power',value:{amount:145,unit:'hp',rpm:7750}}),
 sample({fact_id:143,make:'BMW',model:'R 1300 GS',category:'dimensions',
  label:'Road-ready weight',value:{amount:237,unit:'kg',qualifier:'manufacturer quoted'}})
],'BMW','R 1300 GS');
assert.deepEqual(measured[0].display,[{label:'Documented value',value:'1,300 cc'}],
 'Do not show disconnected amount and unit labels on BMW specifications');
assert.deepEqual(measured[1].display,[
 {label:'Documented value',value:'145 hp'},{label:'Rpm',value:'7750'}],
 'Performance cards must keep the documented source units and engine speed');
assert(measured[2].display.some(x=>x.value==='237 kg'));
assert.deepEqual(exactVerifiedModelFacts([sample({
 fact_id:144,value:{amount:5,unit:'<img onerror=alert(1)>',model_year:1976}
})],'Suzuki','RM250')[0].display.map(x=>x.label),['Model year'],
 'Invalid unit payloads must not appear as public specifications');


// Research grows over time: a model with more than sixty verified entries
// must not silently lose later history/production/colour information.
const manyYearRecords=Array.from({length:75},(_,i)=>sample({
 fact_id:5000+i,start_year:1950+i,label:'Verified production reference '+(1950+i)
}));
assert.equal(exactVerifiedModelFacts(manyYearRecords,'Suzuki','RM250').length,75,
 'The universal renderer must retain all 75 approved exact-model research entries');
const detailedFactoryRecord=exactVerifiedModelFacts([sample({
 fact_id:5999,category:'factory_colours',
 value:Object.fromEntries(Array.from({length:17},(_,i)=>['factory_colour_'+(i+1),'Documented colour '+(i+1)]))
})],'Suzuki','RM250');
assert.equal(detailedFactoryRecord[0].display.length,17,
 'A sourced record with seventeen fields must not silently drop five values');
const editions=exactVerifiedModelFacts([sample({
 fact_id:6000,category:'model_year',
 value:{editions:Array.from({length:16},(_,i)=>'Edition '+(i+1))}
})],'Suzuki','RM250');
assert.equal(editions[0].display[0].value.split(' · ').length,16,
 'Source-verified factory edition/colour lists beyond twelve must have a display location');

const factoryDocuments=exactVerifiedModelFacts([sample({
 fact_id:6700,make:'Ducati',model:'Monster 937',category:'factory_documents',
 label:'Official Ducati Monster manual',value:{
  document_title:'Choose owner manual for correct year',
  document_url:'https://www.ducati.com/gb/en/service-maintenance/owner-manuals',
  document_type:'Official manufacturer selector'
 }
})],'Ducati','Monster 937');
assert.equal(factoryDocuments.length,1,'Documented manufacturer archives need a place on model pages');
assert(!factoryDocuments[0].display.some(x=>x.label==='Document Url'),
 'Only safe clickable manufacturer document links should expose document URLs');
const documentedOwnership=exactVerifiedModelFacts([sample({
 fact_id:6701,category:'used_buying',
 label:'Official maintenance evidence',value:{checks:[
  'Check service dates','Match model year','Check factory campaigns'
 ]}
})],'Suzuki','RM250');
assert.equal(documentedOwnership[0].display[0].value.split(' · ').length,3,
 'Sourced used buying and ownership research needs a readable checklist');

// Manufacturing milestones have real dated places in the ONE model research
// panel, rather than being stored as unsorted technical-value placeholders.
const factoryRows=[
 sample({fact_id:7001,category:'manufacturing_evidence',start_year:2021,
  value:{date:'2021-03-04',factory:'Borgo Panigale',evidence:'Verified start of manufacture'}}),
 sample({fact_id:7002,category:'manufacturing_evidence',start_year:null,
  value:{date:'2017-11-15',evidence:'Verified earlier factory production'}}),
 sample({fact_id:7003,category:'manufacturing_evidence',start_year:2020,
  value:{date:'2020-10',evidence:'Source establishes the month only'}}),
 sample({fact_id:7004,category:'manufacturing_evidence',start_year:null,
  value:{evidence:'Source has no supported date'}})
];
assert.deepEqual(orderedVerifiedFactoryFacts(factoryRows).map(x=>x.fact_id),
 [7002,7003,7001,7004],'Only documented factory dates may define chronological order');
assert.equal(verifiedFactoryDate(factoryRows[2]),'2020-10',
 'Do not invent a day of month where the factory source gave only year and month');
assert.equal(verifiedFactoryDate(factoryRows[3]),'',
 'Missing factory dates must not be invented');
assert.equal(verifiedFactoryDate(sample({fact_id:7005,category:'market_launch',start_year:2020})), '',
 'Press launch dates must not be mislabeled as factory production dates');
assert.equal(verifiedFactoryDate(factoryRows[0]),'2021-03-04');

// Real BMW R 12 / R 12 nineT factory comparison (fact 77) used to be
// silently dropped because both power/torque variants are nested objects.
const modelVariants={reference_year:2023,
 'R 12':{power_hp:95,power_kw:70,torque_nm:110},
 'R 12 nineT':{power_hp:109,power_kw:80,torque_nm:115}
};
assert.deepEqual(verifiedEngineeringVariants(modelVariants),[
 {label:'R 12',value:'Power 95 hp · Power 70 kW · Torque 110 Nm'},
 {label:'R 12 nineT',value:'Power 109 hp · Power 80 kW · Torque 115 Nm'}
], 'Approved BMW factory engineering comparison must show both derivatives and verified measurements');
const sourceCompared=exactVerifiedModelFacts([sample({
 fact_id:77,make:'BMW',model:'R 12',category:'engineering',
 label:'R 12 versus R 12 nineT original launch outputs',
 value:modelVariants
})],'BMW','R 12');
assert.equal(sourceCompared.length,1);
assert.equal(sourceCompared[0].display.length,3,
 'Both separate power and torque comparison lines must reach one existing Engineering card');
assert.deepEqual(verifiedEngineeringVariants({
 private:{power_hp:120},
 'Not a real variant':{power_hp:'draft',torque_nm:100},
 'Unreviewed <script>':{power_hp:140,power_kw:102}
}),[],'Incomplete, unverified or unsafe nested structures must never display');

const documentedColour=exactVerifiedModelFacts([sample({
 fact_id:52,category:'factory_colours',label:'Factory colour: Blackstorm metallic',
 value:{name:'Blackstorm metallic',source:'https://example.org/press',source_url:'https://example.org/press',model_year:2024}
})],'Suzuki','RM250');
assert.equal(documentedColour.length,1);
assert.deepEqual(documentedColour[0].display.map(x=>x.label),['Name','Model year'],
 'Factory citation URLs belong only in source links, not technical values');
const competition=exactVerifiedModelFacts([sample({
 fact_id:53,category:'competition',label:'Race result',value:'Documented rider achievement'
})],'Suzuki','RM250');
assert.equal(competition.length,1,'Verified competition history must display through shared renderer');
const factoryStyles=exactVerifiedModelFacts([sample({
 fact_id:54,make:'BMW',model:'R 1300 RS',category:'factory_colours',
 label:'Initial factory style names',value:{styles:['Basic','Triple Black','Performance','Option 719 Cuyamaca'],launch_year:2025}
})],'BMW','R 1300 RS');
assert.equal(factoryStyles.length,1);
assert(factoryStyles[0].display.some(x=>x.label==='Styles'&&x.value==='Basic · Triple Black · Performance · Option 719 Cuyamaca'),
 'Verified launch style arrays should display as readable text');
assert.deepEqual(exactVerifiedModelFacts([sample({
 fact_id:55,value:{nested:[{private:'draft'}],image_url:'https://example.com/img.jpg',styles:['Valid',{private:'draft'}]}
})],'Suzuki','RM250'),[],
 'Never publish mixed nested draft content or image metadata as research');
const touring=exactVerifiedModelFacts([sample({
 fact_id:56,make:'BMW',model:'R 18 B',category:'touring',
 label:'Original R 18 B equipment specifications',value:{engine_cc:1802,power_hp:91,tft_screen_in:10.25}
})],'BMW','R 18 B');
assert.equal(touring.length,1,'Exact-model sourced touring specifications must display');

const motorsport=exactVerifiedModelFacts([sample({
 fact_id:57,category:'motorsport',label:'Factory racing history',
 value:{result:'Documented factory race achievement'}
})],'Suzuki','RM250');
assert.equal(motorsport.length,1,'Audited motorsport history must render through the shared model research panel');
const metadataSafe=exactVerifiedModelFacts([sample({
 fact_id:58,value:{
  engine_cc:246,editorial_status:'draft',publication_status:'unapproved',
  internal_notes:'Never display',reviewer_notes:'Confidential',
  source_name:'Internal database copy',created_at:'2026-11-11'
 }
})],'Suzuki','RM250');
assert.deepEqual(metadataSafe[0].display,[{label:'Engine capacity (cc)',value:'246'}],
 'Never expose administrative publication, provenance or reviewer metadata as model facts');
assert.deepEqual(exactVerifiedModelFacts([
 sample({fact_id:60}),sample({fact_id:'60'})
],'Suzuki','RM250').length,1,
 'Numeric and string representations of one fact ID must not duplicate cards');


assert.deepEqual(exactVerifiedModelFacts([sample({value:'  '})],'Suzuki','RM250'),[],
 'Whitespace-only source values must never create empty research cards');
assert.equal(exactVerifiedModelFacts([sample({make:' Suzuki ',model:' RM250 '})],'Suzuki','RM250').length,1,
 'Identity comparison should tolerate surrounding whitespace but never another model');
function fakeElement(tag){
 return {
  tag,children:[],dataset:{},style:{},textContent:'',href:'',target:'',rel:'',
  append(...xs){this.children.push(...xs)},
  insertBefore(child){this.children.unshift(child)},
  querySelector(){return null}
 };
}
const doc={createElement:fakeElement};
const body={ownerDocument:doc,children:[],firstChild:null,querySelector(){return this.children.find(x=>x.dataset?.anybikeVerifiedModelFacts)||null},
 insertBefore(child){this.children.unshift(child);this.firstChild=this.children[0];}};
const documentBody={...body,children:[],firstChild:null};
assert.equal(mountVerifiedModelFacts(documentBody,[sample({
 fact_id:6702,make:'Ducati',model:'Monster 937',category:'factory_documents',
 label:'Official owner handbook',value:{
  document_title:'Choose exact factory manual',
  document_url:'https://www.ducati.com/gb/en/service-maintenance/owner-manuals',
  document_type:'Official archive'
 }
})],'Ducati','Monster 937'),1);
const documentGroups=documentBody.children[0].children.filter(x=>x.tag==='div');
const documentArticle=documentGroups[0].children.find(x=>x.tag==='div')?.children[0];
assert(documentArticle?.children.some(x=>x.tag==='a'&&x.href==='https://www.ducati.com/gb/en/service-maintenance/owner-manuals'),
 'Factory archive document links should actually display in the shared public page');
const badDocumentBody={...body,children:[],firstChild:null};
mountVerifiedModelFacts(badDocumentBody,[sample({
 fact_id:6703,category:'factory_documents',value:{
  document_type:'Official archive',document_url:'javascript:alert(1)'
 }
})],'Suzuki','RM250');
const badArticle=badDocumentBody.children[0].children.filter(x=>x.tag==='div')[0].children.find(x=>x.tag==='div').children[0];
assert(!badArticle.children.some(x=>x.tag==='a'),'Unsafe document links must not render');

const photo=(overrides={})=>({
 make:'BMW',model:'R 1300 GS',canonical_model:'R 1300 GS',
 title:'2025 factory edition',image_url:'https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg',
 source_page_url:'https://commons.wikimedia.org/wiki/File:Example.jpg',
 licence_url:'https://creativecommons.org/licenses/by-sa/4.0/',
 licence:'CC BY-SA 4.0',attribution:'Licensed photographer · CC BY-SA 4.0',
 subject_category:'whole_motorcycle',model_year_start:2025,model_year_end:2025,...overrides
});
assert.equal(approvedExactModelGallery([photo()],'BMW','R 1300 GS').length,1);
assert.equal(approvedExactModelGallery([photo({model:'R 1250 GS'})],'BMW','R 1300 GS').length,0,
 'Never display R 1250 GS photos on R 1300 GS pages');
assert.equal(approvedExactModelGallery([photo({licence:''})],'BMW','R 1300 GS').length,0,
 'Reject images without documented rights');
assert.equal(approvedExactModelGallery([photo({image_url:'javascript:alert(1)'})],'BMW','R 1300 GS').length,0,
 'Never display unsafe photo URL');
assert.equal(approvedExactModelGallery([photo(),photo()],'BMW','R 1300 GS').length,1,
 'Never duplicate the same photograph in the gallery');
const photoBody={ownerDocument:doc,children:[],querySelector(){return null},append(x){this.children.push(x)}};
assert.equal(mountApprovedModelGallery(photoBody,[photo()],'BMW','R 1300 GS'),1);
const photoPanel=photoBody.children[0];
assert.equal(photoPanel.dataset.anybikeModelResearchGallery,'1');
const photoFigure=photoPanel.children.find(x=>x.tag==='div').children[0];
assert(photoFigure.children.some(x=>x.tag==='img'&&x.alt.includes('R 1300 GS')),
 'Exact-model photo must have relevant accessible alt text');
assert(photoFigure.children.find(x=>x.tag==='figcaption').children.some(x=>x.tag==='a'&&x.href.includes('wikimedia.org/wiki/File:')),
 'Every approved photograph must link to its credited source');
const unloaded={ownerDocument:doc,children:[],querySelector(){return null},append(x){this.children.push(x)}};
const countPhotos=await installApprovedModelGallery({
 body:unloaded,make:'BMW',model:'R 1300 GS',
 client:{rpc:async(name,args)=>{
  assert.equal(name,'public_anybike_verified_model_gallery_v1');
  assert.deepEqual(args,{p_make:'BMW',p_model:'R 1300 GS'});
  return {data:[photo(),photo({model:'R 1250 GS'})],error:null};
 }},
 imageFactory:()=>({set src(_url){this.onload?.()}})
});
assert.equal(countPhotos,1,'Only actually loaded, matching, licensed photographs should mount');
assert.equal(unloaded.children.length,1);
assert.equal(await installApprovedModelGallery({
 body:{...unloaded,children:[]},make:'BMW',model:'R 1300 GS',
 client:{rpc:async()=>({data:[photo()],error:null})},
 imageFactory:()=>({set src(_url){this.onerror?.()}})
}),0,'Failed image load must not create an empty research gallery');

// Real integration shape: a dedicated Harley guide keeps its original
// content and receives the same sourced-facts section at the correct route.
const legacyContent=fakeElement('section');
const existingMain={
 children:[legacyContent],
 querySelector(){return null},
 insertBefore(item,before){
  const index=before?this.children.indexOf(before):-1;
  if(index<0)this.children.push(item);else this.children.splice(index,0,item);
  item.parentNode=this;
 }
};
legacyContent.parentNode=existingMain;
const harleyPage={
 querySelector(selector){return selector==='main'?existingMain:null},
 createElement(tag){
  const item=fakeElement(tag);
  item.ownerDocument=this;
  item.remove=()=>{
   const parent=item.parentNode;
   if(parent?.children)parent.children=parent.children.filter(x=>x!==item);
  };
  return item;
 }
};
const harleyFactoryFact=sample({
 fact_id:7801,make:'Harley-Davidson',model:'Fat Boy',category:'history',
 label:'1990 factory origin',value:{original_engine:'Evolution V-twin'},
 source_url:'https://www.harley-davidson.com/us/en/motorcycles/2025/fat-boy-gray-ghost.html'
});
const harleyCalls=[];
const harleyCount=await installApprovedHarleyResearch({
 doc:harleyPage,pathname:'/harley-davidson-fat-boy.html',
 client:{async rpc(name,args){
  harleyCalls.push({name,args});
  if(name==='public_anybike_manufacturer_model_routes_v1')
   return {data:approvedHarleyRoutes,error:null};
  if(name==='public_anybike_verified_model_facts_v1')
   return {data:[harleyFactoryFact],error:null};
  throw Error('Unexpected Harley RPC '+name);
 }}
});
assert.equal(harleyCount,1,'Published Fat Boy factory facts must mount on dedicated Harley guide');
assert.equal(existingMain.children[0],legacyContent,'Existing Harley guide content must not be removed or reordered');
assert.equal(existingMain.children.length,2,'Only one new optional factory-research slot should mount');
assert.equal(existingMain.children[1].dataset.anybikeHarleyResearchSlot,'1');
assert.equal(existingMain.children[1].children[0].dataset.anybikeVerifiedModelFacts,'1');
assert.equal(harleyCalls[1].args.p_model,'Fat Boy','Never guess model identity from filename');
const blankHarleyMain={...existingMain,children:[legacyContent]};
const blankHarleyPage={...harleyPage,querySelector:sel=>sel==='main'?blankHarleyMain:null};
assert.equal(await installApprovedHarleyResearch({
 doc:blankHarleyPage,pathname:'/harley-davidson-unknown.html',
 client:{rpc:async()=>({data:approvedHarleyRoutes,error:null})}
}),0,'Unregistered Harley pages must not inherit any source research');
assert.equal(blankHarleyMain.children.length,1);

assert.equal(mountVerifiedModelFacts(body,[sample()],'Suzuki','RM250'),1);
assert.equal(body.children.length,1);
assert.equal(body.children[0].dataset.anybikeVerifiedModelFacts,'1');

const factoryBody={ownerDocument:doc,children:[],firstChild:null,
 querySelector(){return null},insertBefore(child){this.children.unshift(child)}};
assert.equal(mountVerifiedModelFacts(factoryBody,factoryRows,'Suzuki','RM250'),4);
const manufacturingGroup=factoryBody.children[0].children.filter(x=>x.tag==='div').find(x=>x.children.some(c=>c.tag==='h3'&&c.textContent==='Factory and manufacturing evidence'));
assert(manufacturingGroup,'Factory chronology must appear in the approved research section');
const factoryCards=manufacturingGroup.children.find(x=>x.tag==='div').children;
assert.equal(factoryCards[0].children[0].textContent,'Factory record: 2017-11-15');
assert.equal(factoryCards[1].children[0].textContent,'Factory record: 2020-10');
assert.equal(factoryCards[2].children[0].textContent,'Factory record: 2021-03-04');
assert.equal(factoryCards[3].children[0].tag,'h4','Unknown factory date must not become a fabricated chronology marker');

assert(body.children[0].children.some(x=>x.tag==='p'&&
 String(x.textContent).includes('1976')&&String(x.textContent).includes('not a claim of continuous production')),
 'Factory chronology must identify sourced reference years without inventing continuous production');
const sourceCode=readFileSync(new URL('../model-template/public-verified-model-facts.mjs',import.meta.url),'utf8');
assert(sourceCode.includes("engine_cc:'Engine capacity (cc)'"),
 'Engine displacement should use meaningful English units in every shared model card');
assert(sourceCode.includes("technical_changes:'Engineering changes'"),
 'Verified engineering changes must have a readable public label');
assert.equal(mountVerifiedModelFacts(body,[sample()],'Suzuki','RM250'),0);

const reordered={...body,children:[],firstChild:null};
assert.equal(mountVerifiedModelFacts(reordered,[
 sample({fact_id:91,category:'motorsport',start_year:null,label:'Racing record',value:{result:'Verified'}}),
 sample({fact_id:92,category:'engine',start_year:2001,label:'Engine record',value:{engine_cc:249}}),
 sample({fact_id:93,category:'model_year',start_year:null,label:'Documented model',value:{engine_cc:246}})
],'Suzuki','RM250'),3);
const researchPanel=reordered.children[0];
const categoryHeadings=researchPanel.children.filter(x=>x.tag==='div')
 .map(section=>section.children.find(x=>x.tag==='h3')?.textContent);
assert.deepEqual(categoryHeadings,[
 'Documented model years and specifications','Engine and powertrain','Documented racing and motorsport'
], 'Supabase return order must not change the approved shared research section order');
assert(!researchPanel.children.some(x=>x.tag==='p'&&String(x.textContent).includes('reference year')),
 'Missing model-year values must not be converted to a false year zero');

const empty={...body,children:[],firstChild:null};
let call;
const count=await installVerifiedModelFacts({
 body:empty,make:'Suzuki',model:'RM125',
 client:{rpc:async(name,args)=>{
  call={name,args};
  return {data:[sample({fact_id:77,model:'RM125'})],error:null};
 }}
});
assert.equal(count,1);
assert.equal(call.name,'public_anybike_verified_model_facts_v1');
assert.deepEqual(call.args,{p_make:'Suzuki',p_model:'RM125'});
const denied=await installVerifiedModelFacts({
 body:{...body,children:[],firstChild:null},make:'Suzuki',model:'RM250',
 client:{rpc:async()=>({data:[],error:{message:'not available'}})}
});
assert.equal(denied,0,'Never hide or alter the approved page when public facts unavailable');
const html=readFileSync(new URL('../motorcycle-model-guide.html',import.meta.url),'utf8');
assert(html.includes('/model-template/public-verified-model-facts.mjs?v=20261112-research5'));
assert(html.indexOf('id="body"')>html.indexOf('id="generationPanel"'));
assert(html.includes('catalogue.models.find(x=>x&&typeof x.make==="string"&&typeof x.model==="string"'),
 'Malformed catalogue entries must not crash public model guides');
assert(html.includes('Object.values(guides.models).find(g=>g&&typeof g.make==="string"&&typeof g.model==="string"'),
 'Malformed optional research entries must not blank the model and enquiry cards');
assert(html.includes('el("sourceBottom").href=request'),
 'Unavailable model research must retain the customer sourcing enquiry route');

assert(html.includes('Array.isArray(x)&&typeof x[0]==="string"&&typeof x[1]==="string"'),
 'Deep-dive topic filters must ignore malformed optional section rows');
assert(html.includes('Array.isArray(guide.production?.documented_production_evidence)'),
 'Optional factory evidence must not break model and stock content');
assert(html.includes('Array.isArray(guide.production?.generation_milestones)'),
 'Optional generation milestones must not break customer enquiries');


const relatedScript=readFileSync(new URL('../shared-model-catalogue.js',import.meta.url),'utf8');
assert(relatedScript.includes('.filter(x=>x&&typeof x.make==="string"&&typeof x.model==="string"'),
 'Malformed master catalogue entries must never blank linked model research');
assert(html.includes('/shared-model-catalogue.js?v=20261111safe1'),
 'Generic model pages must load the validated shared catalogue script');


const renderSource=readFileSync(new URL('../model-template/public-verified-model-facts.mjs',import.meta.url),'utf8');
assert(!renderSource.includes('background:#242424')&&!renderSource.includes('background:#171717'),\n 'Universal verified research must not introduce a separate black research panel');\nassert(renderSource.includes('background:#fafafa;color:#171717;border:1px solid #dedede'),
 'Shared model specification cards must have legible foreground and background');
assert(renderSource.includes('minmax(min(100%,420px),1fr)'),
 'Factory research columns must be wide enough for legible specifications');
assert(renderSource.includes('minmax(0,1fr);gap:9px 14px'),
 'Long technical values must wrap instead of forming cramped columns');
assert(renderSource.includes("term.style.cssText='color:#444"),'Technical labels must remain readable');
assert(renderSource.includes("value.style.cssText='color:#171717"),'Verified values must remain readable');
assert(renderSource.includes("source.style.cssText='display:inline-block;color:#171717"),'Factory source links must have legible colour');
assert(renderSource.includes("groupHeading.style.cssText='color:#171717"),'Research headings must remain readable');

// Database publication and browser rendering must agree about every approved
// research destination. A new category must have a working display section
// before an editor can mark a new fact as verified.
const contractSql=readFileSync(new URL('../supabase/migrations/20261112190000_guard_verified_research_section_destinations.sql',import.meta.url),'utf8');
const projectionSql=readFileSync(new URL('../supabase/migrations/20261112191500_use_section_registry_in_public_model_facts.sql',import.meta.url),'utf8');
const newSectionsSql=readFileSync(new URL('../supabase/migrations/20261112194500_model_factory_documents_and_ownership_sections.sql',import.meta.url),'utf8');
const approvedSections=[...contractSql.matchAll(/^\('([a-z_]+)','([^']+)',(\d+)\),?$/gm),
 ...newSectionsSql.matchAll(/^\('([a-z_]+)','([^']+)',(\d+)\),?$/gm)]
 .map(([,category,label,order])=>({category,label,order:Number(order)}));
assert.equal(approvedSections.length,22,'Preserve the 20 existing research categories plus document and ownership subsections');
const rendererSource=sourceCode.slice(sourceCode.indexOf('const sections={'),sourceCode.indexOf('};',sourceCode.indexOf('const sections={'))+2);
const rendererSections=[...rendererSource.matchAll(/\b([a-z_]+):'([^']+)'/g)]
  .map(([,category,label])=>({category,label}));
assert.deepEqual(
 approvedSections.map(({category,label})=>({category,label})).sort((a,b)=>a.category.localeCompare(b.category)),
 rendererSections.sort((a,b)=>a.category.localeCompare(b.category)),
 'Every verified database research category must have the exact public renderer heading'
);
const orderSource=sourceCode.slice(sourceCode.indexOf('const researchOrder=['),sourceCode.indexOf('];',sourceCode.indexOf('const researchOrder=['))+2);
const clientOrder=[...orderSource.matchAll(/'([a-z_]+)'/g)].map(x=>x[1]);
assert.deepEqual(approvedSections.map(x=>x.category),clientOrder,
 'The approved publication section order must equal the universal page order');
assert(contractSql.includes('anybike_verified_fact_requires_render_section')&&contractSql.includes("new.verification_status='verified'"),
 'Unsupported verified facts must be rejected before publication');
assert(projectionSql.includes('join public.anybike_model_research_section_registry section on section.category=f.category'),
 'Public Supabase projection must read the very same approved section registry');
assert(projectionSql.includes('motorcycle_catalog_fact_verification_audit'),
 'Unverified or unaudited research must stay private');
console.log('PASS: approved model research destinations agree between Supabase and the one universal renderer.');

console.log('PASS: shared exact-model verified records, no foreign/draft records, safe source URLs, reused renderer and missing-data fallback');
