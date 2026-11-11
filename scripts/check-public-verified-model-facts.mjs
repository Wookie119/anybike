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
assert(html.includes('/model-template/public-verified-model-facts.mjs?v=20261111b'));
assert(html.indexOf('id="body"')>html.indexOf('id="generationPanel"'));
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
