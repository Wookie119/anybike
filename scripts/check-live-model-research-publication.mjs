// Read-only live Supabase publication smoke test. Run with:
// node scripts/check-live-model-research-publication.mjs
// Uses only the public publishable key; never fetches drafts or customer data.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exactVerifiedModelFacts} from '../model-template/public-verified-model-facts.mjs';

const source=readFileSync(new URL('../model-template/public-verified-model-facts.mjs',import.meta.url),'utf8');
const endpoint=source.match(/const ENDPOINT='([^']+)'/)?.[1];
const key=source.match(/const PUBLIC_KEY='([^']+)'/)?.[1];
assert(endpoint?.startsWith('https://')&&key?.startsWith('sb_publishable_'),
 'Shared renderer must use the public Supabase endpoint and publishable key');
const samples=[
 ['BMW','R 1250 GS'],
 ['BMW','S 1000 RR'],
 ['BMW','F 900 GS'],
 ['Honda','NX500'],
 ['Honda','CB650R'],
 ['Suzuki','RM250'],
 ['Yamaha','MT-09']
];
const headers={'apikey':key,'Content-Type':'application/json'};
async function rpc(name,args){
 const response=await fetch(endpoint+'/rest/v1/rpc/'+name,{
  method:'POST',headers,body:JSON.stringify(args),signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw new Error(name+' HTTP '+response.status+': '+(await response.text()).slice(0,250));
 return response.json();
}
let checked=0,renderable=0;
for(const [make,model] of samples){
 const raw=await rpc('public_anybike_verified_model_facts_v1',{p_make:make,p_model:model});
 assert(Array.isArray(raw),make+' '+model+' public RPC must return a JSON array');
 const facts=exactVerifiedModelFacts(raw,make,model);
 assert(facts.length>0,make+' '+model+' must have at least one safe, renderable approved fact');
 assert(facts.every(f=>f.display.length>0),make+' '+model+' must not publish empty specification cards');
 console.log('PASS',make,model,facts.length+' approved display facts');
 checked++;renderable+=facts.length;
}
const routes=await rpc('public_anybike_manufacturer_model_routes_v1',{p_make:'BMW'});
assert(Array.isArray(routes),'BMW route registry must return a JSON array');
for(const model of ['R 1250 GS','S 1000 RR','F 900 GS']){
 const matches=routes.filter(r=>r.make==='BMW'&&r.model===model);
 assert.equal(matches.length,1,'Exact BMW route must be unique: '+model);
 assert(/^\/bmw-[a-z0-9-]+\.html$/.test(matches[0].url),
  'BMW verified facts must resolve to an approved public model route');
}
console.log('PASS',checked,'live model RPCs;',renderable,'renderable facts; exact BMW routes');
