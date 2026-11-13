// Run from repository root: node scripts/check-v2-master-contract.mjs
// Read-only regression guard for the ONE approved universal model template.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>fs.readFileSync(path,'utf8');
const master=read('motorcycle-v2-master.html');
const guide=read('motorcycle-model-guide.html');
const renderer=read('model-template/approved-v2-universal-preview.mjs');
const facts=read('model-template/public-verified-model-facts.mjs');
const nav=read('model-template/approved-v2-dynamic-navigation.mjs');
const ids=html=>[...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(ids(guide),ids(master),'Generic route diverges from approved master section order');
for(const html of [master,guide]){
 const all=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(all).size,all.length,'Duplicate V2 HTML IDs');
 for(const id of ['internationalModelStock','generationPanel','v2UkSelling','internationalGuestRequest','nextAction','modelSources'])
  assert(all.includes(id),'Approved V2 section missing: '+id);
 assert(html.includes('approved-v2-universal-preview.mjs'),'Shared renderer missing');
 assert(html.includes('approved-v2-dynamic-navigation.mjs'),'Shared navigation missing');
}
assert(renderer.includes('installVerifiedModelFacts'),'Verified facts integration missing');
assert(renderer.includes('publicCatalogueRpc(wantMake)'),'Public catalogue fallback missing');
assert(facts.includes('public_anybike_verified_model_facts_v1'),'Verified facts RPC missing');
assert(nav.includes('window.__anybikeV2ModelIdentity'),'Exact model navigation identity missing');
const match=facts.match(/const researchOrder=\[([\s\S]*?)\];/);
assert(match,'Verified research ordering contract missing');
const categories=[...match[1].matchAll(/'([a-z_]+)'/g)].map(m=>m[1]);
assert.equal(new Set(categories).size,categories.length,'Duplicate research destination');
for(const key of ['model_year','history','engineering','engine','specification','factory_colours','manufacturing_evidence','factory_documents','used_buying'])
 assert(categories.includes(key),'Verified research destination missing: '+key);
assert(categories.length>=20,'Research category coverage reduced unexpectedly');
for(const [name,html] of [['master',master],['guide',guide]]) {
 const stock=html.indexOf('id="internationalModelStock"');
 const generations=html.indexOf('id="generationPanel"');
 const research=html.indexOf('id="body"');
 assert(stock>0 && stock<generations && stock<research, name+': international exact-model stock must precede research in source order');
}
console.log('PASS: shared V2 structure, unique IDs, public RPC and '+categories.length+' research categories.');
