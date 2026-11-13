// Public end-to-end Supabase research smoke test. Uses only the same publishable
// browser key and approved read-only RPC as the AnyBike model renderer.
import assert from 'node:assert/strict';
const endpoint='https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_verified_model_facts_v1';
const publishableKey='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
async function research(make,model){
 const response=await fetch(endpoint,{
  method:'POST',
  headers:{apikey:publishableKey,'Content-Type':'application/json'},
  body:JSON.stringify({p_make:make,p_model:model}),
  signal:AbortSignal.timeout(20000)
 });
 assert.equal(response.status,200,'Public research RPC HTTP status for '+make+' '+model);
 const result=await response.json();
 assert(Array.isArray(result),'Public research RPC must return an array');
 return result;
}
for(const [make,model,minimum] of [['Ducati','851',9],['Ducati','916',13],['Ducati','Monster 900',11]]){
 const facts=await research(make,model);
 assert(facts.length>=minimum,'Missing verified '+make+' '+model+' research: '+facts.length+'/'+minimum);
 const ids=new Set();
 for(const fact of facts){
  assert.equal(fact.make,make,'Cross-manufacturer fact leakage');
  assert.equal(fact.model,model,'Cross-model fact leakage');
  assert(Number.isSafeInteger(Number(fact.fact_id)),'Missing numeric fact ID');
  assert(!ids.has(fact.fact_id),'Duplicate fact ID');ids.add(fact.fact_id);
  assert(/^https:\/\/\S+$/.test(fact.source_url),'Research must link to a secure source');
  assert(typeof fact.label==='string'&&fact.label.trim(),'Research must have a label');
 }
 console.log('PASS: public RPC returned '+facts.length+' verified facts for '+make+' '+model);
}
const invalid=await research('Ducati','not-a-real-model-identity-xyz');
assert.equal(invalid.length,0,'Unknown model identity must never inherit other model research');
console.log('PASS: public model research identity isolation');
