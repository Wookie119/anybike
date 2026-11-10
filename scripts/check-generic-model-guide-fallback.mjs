/**
 * A public model link must remain usable when optional deep-research JSON
 * is unavailable. Verify exact catalogue identity and sourcing URLs rather
 * than creating fake production facts or bypassing stock permissions.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const html=readFileSync(new URL('../motorcycle-model-guide.html',import.meta.url),'utf8');
const catalog=JSON.parse(readFileSync(
 new URL('../data/motorcycle-catalogue-master.json',import.meta.url),'utf8'));
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(m=>m[1]).filter(Boolean);
assert.equal(scripts.length,1,'Generic model guide must have one core inline script');
const script=new Script(scripts[0]);

function fakeDOM(){
 const map=new Map(),queries=new Map();
 const create=(tag='div')=>({
  tag,hidden:false,href:'',textContent:'',innerHTML:'',className:'',
  children:[],classList:{toggle(){}},
  appendChild(x){this.children.push(x);return x;},
  append(...items){this.children.push(...items);},
  after(){}
 });
 const get=id=>{
  if(!map.has(id))map.set(id,create());
  return map.get(id);
 };
 const query=selector=>{
  if(!queries.has(selector))queries.set(selector,create());
  return queries.get(selector);
 };
 return {get,query,document:{
  title:'',getElementById:get,querySelector:query,
  createElement:create,createTextNode:text=>({textContent:text})
 }};
}
async function check(make,model,{guidesAvailable=false,databaseRows=null,databaseError=false,catalogueAvailable=true}={}){
 const {document,get}=fakeDOM(),warnings=[],rpcCalls=[],requests=[];
 const fetch=async path=>{
  requests.push(path);
  if(path==='/data/motorcycle-catalogue-master.json')
   return catalogueAvailable?{ok:true,json:async()=>catalog}:{ok:false,status:503};
  if(path==='/data/motorcycle-model-guides.json')
   return guidesAvailable?
    {ok:true,json:async()=>({schema_version:2,models:{}})}:
    {ok:false,status:503};
  throw Error('Unexpected resource '+path);
 };
 const search='?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(model);
 const window={supabase:databaseRows!==null||databaseError?{
  createClient:()=>({rpc:async (name,args)=>{
   rpcCalls.push({name,args});
   return databaseError?{data:null,error:{message:'Denied'}}:
    {data:databaseRows,error:null};
  }})
 }:undefined};
 const result=script.runInNewContext({
  document,window,fetch,URLSearchParams,location:{search},
  console:{warn(...args){warnings.push(args.join(' '));}}
 },{timeout:2000});
 await result;
 return {get,warnings,document,rpcCalls,requests};
}
for(const [make,model] of [
 ['Suzuki','RM250'],
 ['Suzuki','GSX1300R HAYABUSA'],
 ['Honda','Dream D-Type'],
 ['Honda','Super Cub C100'],
 ['Yamaha','YZM400F (0WH2)'],
 ['Triumph','Speed Twin 900']
]){
 assert(catalog.models.some(x=>x.make===make&&x.model===model),
  'Catalogue source missing for test model '+make+' '+model);
 for(const guidesAvailable of [true,false]){
  const {get,document}=await check(make,model,{guidesAvailable});
  assert.equal(get('heading').textContent,make+' '+model,
   'Model page failed when optional research unavailable');
  assert(get('summary').textContent.includes('AnyBike can help'),
   'Unverified model intro was invented or blank');
  assert(get('source').href.includes('make='+encodeURIComponent(make)),
   'Sourcing link lost manufacturer');
  assert(get('source').href.includes('model='+encodeURIComponent(model)),
   'Sourcing link lost exact model');
  assert.equal(get('sourceBottom').href,get('source').href);
  assert.equal(get('nextAction').hidden,false,
   'Optional research failure must not hide customer next action');
  assert(get('body').children.length>=2,
   'Customer research fallback sections failed to render');
  assert(!get('years').textContent,
   'Unverified model production years were guessed');
  assert(document.title.includes(make+' '+model));
 }
}
// Supabase public identity must use an exact make AND model, never a related
// model, and must not require privately staged editorial or invented facts.
const supabaseOnly=await check('Suzuki','Clean Example Model',{
 catalogueAvailable:false,databaseRows:[
  {make:'Suzuki',model:'Clean Example Model',category:'Sports'},
  {make:'Yamaha',model:'Clean Example Model',category:'Touring'},
  {make:'Suzuki',model:'Clean Example Model 2',category:'Off-road'}
 ]});
assert.equal(supabaseOnly.get('heading').textContent,'Suzuki Clean Example Model');
assert.equal(supabaseOnly.get('category').textContent,'Sports');
assert(supabaseOnly.get('source').href.includes('model=Clean%20Example%20Model'));
assert(supabaseOnly.get('summary').textContent.includes('AnyBike can help'));
assert.equal(supabaseOnly.rpcCalls[0]?.name,'public_anybike_manufacturer_catalogue_names_v1');
assert.equal(supabaseOnly.rpcCalls[0]?.args?.p_make,'Suzuki');
const denied=await check('Honda','Dream D-Type',{databaseError:true});
assert.equal(denied.get('heading').textContent,'Honda Dream D-Type',
 'Denied public database access must preserve existing static catalogue');
const ambiguous=await check('Suzuki','Clean Example Model',{
 catalogueAvailable:false,databaseRows:[
  {make:'Suzuki',model:'Clean Example Model',category:'Sports'},
  {make:'Suzuki',model:'Clean Example Model',category:'Touring'}
 ]});
assert(ambiguous.get('summary').textContent.includes('could not find'),
 'Ambiguous database identity must never invent a model or choose a variant');
assert.equal(ambiguous.get('nextAction').hidden,false,
 'Ambiguous model data must not block a buyer sourcing enquiry');
assert(ambiguous.get('sourceBottom').href.includes('model=Clean%20Example%20Model'),
 'Sourcing link must retain the requested exact model when database identity is ambiguous');
const wrongMake=await check('Suzuki','Clean Example Model',{
 catalogueAvailable:false,databaseRows:[{make:'Yamaha',model:'Clean Example Model',category:'Touring'}]
});
assert(wrongMake.get('summary').textContent.includes('could not find'),
 'One manufacturer must not receive another manufacturer’s model');
assert.equal(wrongMake.get('nextAction').hidden,false,
 'Unknown models still need a functioning UK sourcing request');
assert(wrongMake.get('source').href.includes('make=Suzuki'),
 'Wrong-manufacturer database records must not alter buyer sourcing make');
assert.equal((await check('Suzuki','RM250')).get('heading').textContent,'Suzuki RM250',
 'Pages must remain usable without a Supabase client');

console.log('PASS: six newly surfaced exact model guides preserve customer sourcing and avoid invented research when optional guide JSON is unavailable');
