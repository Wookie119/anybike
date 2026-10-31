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

// Regression guard for the approved AnyBike international model galleries.
// Run this check before changing public-header.js or model-page templates.
// Real approved motorcycles must be listed first. With no matching stock,
// the information cards must use distinct model-specific year/spec notes.
const shared=fs.readFileSync('public-header.js','utf8');
const gallery=shared.slice(shared.indexOf('/* International model stock and guest enquiries: model guides only. */'));
assert(gallery.length>5000,'Shared international model gallery missing');
for(const [fragment,reason] of [
 ["const matches=(data.items||[]).filter", 'Published motorcycle matching removed'],
 ["if(matches.length){matches.forEach", 'Published motorcycle cards no longer render first'],
 ["if(matches.length===0)", 'Empty-stock model-year cards removed'],
 ["if(safe(make)==='honda'&&safe(model)==='africatwin')", 'Africa Twin generation cards missing'],
 ["if(safe(make)==='harleydavidson'&&safe(model)==='fatboy')", 'Fat Boy generation cards missing'],
 ["const emptyCardCount=matches.length?0:(cardNotes.length||1)", 'Variable-length informational cards or stock priority broken'],
 ["name.textContent=note.title||make+' '+model", 'Distinct model-year card titles missing'],
 ["status.textContent=note.body", 'Distinct model-year descriptions missing'],
 ["brand.src='/anybike-logo-new.jpg'", 'Approved AnyBike placeholder logo missing'],
 ["international-public-stock", 'International stock authorization endpoint removed'],
 ["international-guest-enquiry", 'Working quick enquiry submission removed'],
 ["const reveal=()", 'Gallery visibility handling removed']
])assert(gallery.includes(fragment),reason);
assert(!gallery.includes('for(let i=matches.length;i<6;i++)'),'Do not restore six repetitive placeholders');
console.log('PASS: international model galleries, Fat Boy/Africa Twin year cards, real-stock priority and enquiry hooks are preserved.');

console.log('PASS: existing detailed-model routes, fallback sourcing and both model-specific customer journeys are intact.');
