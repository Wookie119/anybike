import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exactVerifiedModelFacts,mountVerifiedModelFacts,installVerifiedModelFacts} from '../model-template/public-verified-model-facts.mjs';
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
})],'Suzuki','RM250')[0].display.map(x=>x.label),['Amount','Unit','Model year'],
 'Invalid units must never be treated as approved measurement markup');

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
assert.equal(mountVerifiedModelFacts(body,[sample()],'Suzuki','RM250'),1);
assert.equal(body.children.length,1);
assert.equal(body.children[0].dataset.anybikeVerifiedModelFacts,'1');
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
assert(html.includes('/model-template/public-verified-model-facts.mjs?v=20261111e'));
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
assert(renderSource.includes('background:#242424;color:#fff;border:1px solid #666'),
 'Shared model specification cards must have legible foreground and background');
assert(renderSource.includes('minmax(min(100%,420px),1fr)'),
 'Factory research columns must be wide enough for legible specifications');
assert(renderSource.includes('minmax(0,1fr);gap:9px 14px'),
 'Long technical values must wrap instead of forming cramped columns');
assert(renderSource.includes("term.style.cssText='color:#e1e1e1"),'Technical labels must remain readable');
assert(renderSource.includes("value.style.cssText='color:#fff"),'Verified values must remain readable');
assert(renderSource.includes("source.style.cssText='display:inline-block;color:#fff"),'Factory source links must have legible colour');
assert(renderSource.includes("groupHeading.style.cssText='color:#fff"),'Research headings must remain readable');
console.log('PASS: shared exact-model verified records, no foreign/draft records, safe source URLs, reused renderer and missing-data fallback');
