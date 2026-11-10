/**
 * Regression for the live shared /motorcycle-brand.html?make=... model lists.
 * Executes the REAL inline browser script in a simulated DOM. Catches syntax
 * errors that would otherwise leave every brand section blank, checks all
 * catalogue manufacturers, and proves source outages retain curated cards.
 * Does not access unpublished research, update stock, or alter page layouts.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const html=readFileSync(new URL('../motorcycle-brand.html',import.meta.url),'utf8');
const catalog=JSON.parse(readFileSync(
 new URL('../data/motorcycle-catalogue-master.json',import.meta.url),'utf8'));
assert(Array.isArray(catalog.models),'Master catalogue has no model array');
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(m=>m[1]).filter(s=>s.trim());
assert(inline.length>=2,'Shared brand scripts missing');
for(const code of inline)new Script(code); // syntax-check every inline script
// Linked generic model-guide destination must parse too. A working card
// is not useful if the shared destination script is syntactically broken.
const modelGuideHtml=readFileSync(
 new URL('../motorcycle-model-guide.html',import.meta.url),'utf8');
const modelGuideScripts=[...modelGuideHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(m=>m[1]).filter(s=>s.trim());
assert(modelGuideScripts.length>0,'Generic model-guide script missing');
for(const code of modelGuideScripts)new Script(code);

const main=inline.find(s=>s.includes('function renderManufacturerModels()'));
assert(main,'Shared category and model renderer missing');
const mainScript=new Script(main,{filename:'motorcycle-brand.html:inline-brand'});

function dom(){
 const elements=new Map();
 const get=id=>{
  if(!elements.has(id))elements.set(id,{
   id,hidden:false,dataset:{},innerHTML:'',textContent:'',className:'',
   href:'',content:'',style:{},
   setAttribute(name,value){this[name]=value;},
   closest(){return{after(){}};}
  });
  return elements.get(id);
 };
 return {get,elements,document:{
  title:'',
  getElementById:get,
  querySelectorAll(){return[];},
  querySelector(){return{content:''};},
  createElement(tag){return {...get('_element_'+elements.size),tagName:tag};}
 }};
}
async function verify(make,{catalogueAvailable=true}={}){
 const {document,get}=dom(),warnings=[],redirects=[];
 const fetch=async path=>{
  if(path==='/data/motorcycle-catalogue-master.json')
   return catalogueAvailable?{ok:true,json:async()=>catalog}:{ok:false};
  return {ok:true,json:async()=>({results:[]})};
 };
 mainScript.runInNewContext({
  document,location:{search:'?make='+encodeURIComponent(make),
   replace(to){redirects.push(to);}},
  URLSearchParams,fetch,
  console:{warn(...args){warnings.push(args.join(' '));}}
 },{timeout:2500});
 for(let i=0;i<12;i++)await Promise.resolve();
 return {make,groupHtml:get('modelGroups').innerHTML,
  categoryHtml:get('categoryCards').innerHTML,redirects,warnings,
  title:get('title').textContent};
}
const normal=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const makes=[...new Set(catalog.models.map(x=>x.make).filter(Boolean))];
let checked=0;
for(const make of makes){
 const result=await verify(make);
 if(make==='BMW'||make==='Harley-Davidson'){
  assert.equal(result.redirects.length,1,make+' lost dedicated page redirect');
  continue;
 }
 const expected=new Set(catalog.models
  .filter(x=>normal(x.make)===normal(make)&&x.model)
  .map(x=>normal(x.model))).size;
 const cards=(result.groupHtml.match(/class="card manufacturer-model-card"/g)||[]).length;
 assert(expected>0,'Catalogue make has no models: '+make);
 assert(cards>=expected,
  make+' lost model cards: expected '+expected+', rendered '+cards);
 assert(result.categoryHtml.includes('category-card'),make+' category navigation missing');
 assert(!result.warnings.some(x=>x.includes('model rendering')),
  make+' rendering failed');
 checked++;
}
for(const make of ['Suzuki','Honda','Yamaha','Kawasaki','Ducati']){
 const failure=await verify(make,{catalogueAvailable:false});
 const cards=(failure.groupHtml.match(/class="card manufacturer-model-card"/g)||[]).length;
 assert(cards>0,make+' lost curated model cards when catalogue fetch failed');
 assert(failure.categoryHtml.includes('category-card'),
  make+' category navigation disappeared during a catalogue outage');
}
const suzuki=await verify('Suzuki'),honda=await verify('Honda');
assert(suzuki.groupHtml.includes('Hayabusa'),'Suzuki Hayabusa missing');
assert(honda.groupHtml.includes('Africa Twin'),'Honda Africa Twin missing');
assert(suzuki.groupHtml.includes('motorcycle-model-guide.html?make=Suzuki'),
 'Suzuki model guide URL lost');
assert(honda.groupHtml.includes('motorcycle-model-guide.html?make=Honda'),
 'Honda model guide URL lost');
console.log('PASS: '+checked+' generic manufacturer pages render their master model lists; Honda, Suzuki and three other brands retain fallback cards; dedicated BMW/Harley redirects intact');
