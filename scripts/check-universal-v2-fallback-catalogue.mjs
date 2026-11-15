#!/usr/bin/env node
// Source-only guard for the one approved universal V2 model identity contract.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const routes=read('data/universal-v2-model-routes.json').models;
const fallback=read('data/motorcycle-catalogue-master.json').models;
const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const identity=row=>normalize(row.make)+'|'+normalize(row.model);
assert.equal(routes.length,978,'Expected 978 approved permanent routes');
assert.equal(fallback.length,routes.length,'Fallback and route counts differ');
const routeIds=new Map(),routeNames=new Set();
for(const route of routes){
 assert(Number.isSafeInteger(route.model_id)&&route.model_id>0,'Invalid route ID');
 assert(!routeIds.has(route.model_id),'Duplicate route ID '+route.model_id);
 assert(!routeNames.has(identity(route)),'Duplicate route identity '+identity(route));
 routeIds.set(route.model_id,route);routeNames.add(identity(route));
}
const seen=new Set();
for(const entry of fallback){
 const route=routeIds.get(entry.model_id);
 assert(route,'Fallback has unknown model ID '+entry.model_id);
 assert.equal(identity(entry),identity(route),'Fallback ID points to wrong make/model: '+entry.model_id);
 assert(!seen.has(entry.model_id),'Duplicate fallback ID '+entry.model_id);
 seen.add(entry.model_id);
 assert(typeof entry.category==='string'&&entry.category.trim()&&!/^(other|unknown|uncategorised|uncategorized|n\/a)$/i.test(entry.category.trim()),'Generic category for '+entry.model_id);
}
const renderer=fs.readFileSync('model-template/approved-v2-universal-preview.mjs','utf8');
assert(renderer.includes("const categoryCandidates=[str(selected.motorcycle_type),str(selected.category),str(guide?.page_metadata?.category)]"),'Catalogue category no longer first');
assert(renderer.includes('const canonicalId=Number(selected.model_id||selected.catalogue_model_id)'), 'Canonical ID lookup changed');
assert(!renderer.includes("'Explore source-verified '+title+' model years, specifications and documented manufacturer history."),
 'Universal fallback must not claim unpublished research is verified');
assert(renderer.includes('any verified model-year research available'),
 'Honest universal research fallback missing');
const manufacturer=fs.readFileSync('motorcycle-brand.html','utf8');
const mapDeclaration=manufacturer.indexOf('const permanentModelRoutes=new Map();');
const loader=manufacturer.indexOf('loadManufacturerCatalogue().then(async data=>');
const cardRenderer=manufacturer.indexOf('function renderManufacturerModels(){');
assert(mapDeclaration>=0&&loader>mapDeclaration&&cardRenderer>loader,
 'Permanent model route map must be declared in the shared manufacturer renderer scope');
assert(!manufacturer.includes('categoryResult.replaceChildren(heading,intro,links)'),
 'Manufacturer page must not render duplicate selected-category model cards');
assert(manufacturer.includes("'#category-'+i"),
 'Manufacturer category cards must link to the single model library');
assert(manufacturer.includes('permanentModelRoutes.get('),
 'Manufacturer cards must use permanent model routes');
assert(manufacturer.includes("fetch('/data/motorcycle-catalogue-master.json'"),
 'Manufacturer cards must merge complete published fallback identities');
console.log('PASS 978/978 route IDs, fallback model identities and categories match the one universal renderer');
