// Run from repository root: node scripts/check-shared-model-guide-routes.mjs
// Shared manufacturer/model guide integrity. Never change BMW or Harley source here.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const brand=fs.readFileSync('motorcycle-brand.html','utf8');
const guide=fs.readFileSync('motorcycle-model-guide.html','utf8');
const data=JSON.parse(fs.readFileSync('data/motorcycle-model-guides.json','utf8'));
const modelRecords=Object.values(data.models);
for(const [make,model] of [['Honda','Africa Twin'],['Ducati','Panigale V4']]){
 assert(modelRecords.some(g=>g.make===make&&g.model===model),make+' '+model+' guide data missing');
}
assert(brand.includes('(make==="Honda"&&model==="Africa Twin CRF1100L")'), 'Honda model guide routing missing');
assert(brand.includes('(make==="Ducati"&&model==="Panigale V4")'), 'Ducati model guide routing missing');
assert(brand.includes('guide?"/motorcycle-model-guide.html":"/bulk-buying-request.html"'),'Unverified models must retain direct sourcing route');
const seller=guide.indexOf('id="ukSellerAction"'),buyer=guide.indexOf('id="nextAction"');
assert(seller>=0&&buyer>seller,'UK seller box must precede separate international sourcing box');
for(const id of ['ownerHeading','sellBottom','internationalHeading','sourceBottom']){
 assert(guide.includes('id="'+id+'"'),'Missing model guide action #'+id);
}
assert(guide.includes('UK owners: Sell My '),'Dynamic UK seller heading missing');
assert(!/<nav\b[^>]*class="[^"]*\bcrumb\b/i.test(guide),'Breadcrumb returned');
const ids=[...guide.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate model guide HTML IDs');
console.log('PASS: existing detailed-model routes, fallback sourcing and both model-specific customer journeys are intact.');
