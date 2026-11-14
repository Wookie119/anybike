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
// Guard the runtime stock path, not only its static HTML position.
// A denied feed must never be treated as empty stock or replaced by a
// manufacturer-wide/name-matched fallback.
const stockIdentity=read('model-template/canonical-public-stock-identity.mjs');
for(const required of [
 'header.after(stock)',
 "res.status===401||res.status===403",
 "feedState='restricted'",
 'stockForCanonicalModel(data.items,pageIdentity,6)',
 "stock.dataset.stockFeedState=feedState"
]) assert(renderer.includes(required),'Exact-model stock runtime contract missing: '+required);
assert(stockIdentity.includes("item.catalogue_identity_status !== 'verified'"),'Stock canonical identity verification missing');
assert(stockIdentity.includes('item.publication_eligible !== true'),'Stock publication eligibility check missing');
assert(stockIdentity.includes('Number(item.catalog_model_id) !== Number(page.catalog_model_id)'),'Stock exact catalogue ID check missing');
assert(stockIdentity.includes('if (seen.has(id)) return false'),'Stock deduplication missing');

// The approved 20-slot published editorial projection is already connected
// to the shared V2 renderer. Prevent regressions that silently disconnect it
// or accidentally replace it with draft/editor-only data.
const publishedData=read('model-template/universal-page-data.mjs');
const publishedRenderer=read('model-template/universal-page-renderer.mjs');
for(const required of [
 "loadUniversalPublishedPage", "renderUniversalPage",
 "type:'model',id:canonicalId", "if(client&&hasCanonicalId)",
 "publication.entity.id!==canonicalId",
 "data-anybike-role=\"research\"",
 "approvedResearchSectionHeading",
 "data-anybike-research-category",
 "Reviewed 20-slot editorial projection unavailable or rejected"
]){
 // The selector is constructed as a JS string in the renderer, not literal HTML.
 const needle=required==='data-anybike-role="research"'?'[data-anybike-role="research"]':
  required==='data-anybike-research-category'?'[data-anybike-research-category]':required;
 assert(renderer.includes(needle),'V2 published editorial integration missing: '+required);
}
for(const required of [
 "motorcycle_universal_published_sections_v1",
 ".eq('publication_eligible',true)",
 "row.editorial_status!=='published'",
 "row.section_key!==expectedKey",
 "row.entity_name!==identity.name",
 "row.publication_review_reference",
 "if(data.length===0)return null"
])assert(publishedData.includes(required),'20-slot published-only loader guard missing: '+required);
for(const required of [
 "root.dataset?.anybikeUniversalRoot!=='true'",
 "buildUniversalPageSections",
 "visibleUniversalSections",
 "appendContent(doc,section,slot.content)",
 "if(section.childNodes.length>1)research.append(section)"
])assert(publishedRenderer.includes(required),'Approved universal research renderer guard missing: '+required);

console.log('PASS: shared V2 structure, unique IDs, public RPC and '+categories.length+' research categories.');
