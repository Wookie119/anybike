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
assert(brand.includes('const href="/motorcycle-model-guide.html?make="'),'All models must use shared model-guide routing');
assert(brand.includes('const request="/bulk-buying-request.html?make="'),'Manufacturer sourcing action must remain available');
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
const gallery=shared.slice(shared.indexOf('/* International model stock and guest enquiries: model guides only.'));
assert(gallery.length>5000,'Shared international model gallery missing');
// International sales QA: only one server-verified exact catalogue model, never cross-model trims.
// Research notes are separate from real motorcycles for sale; no photo-logo cards.
for(const [fragment,reason] of [
 ["const dedicatedStock=", 'Dedicated model galleries must take precedence'],
 ["const requested=safe(model)", 'Exact model matching missing'],
 ["x.catalogue_identity_status!=='verified'", 'Verified canonical identity requirement missing'],
 ["return safe(x.model)===requested;", 'Exact-model acceptance removed'],
 ["const exactIds=new Set(candidates.map(x=>Number(x.catalog_model_id)))", 'Canonical model-ID isolation missing'],
 ["for(const n of notes.slice(0,14))researchCard(n.label,n.body,n.image)", 'Only documented model research must create research cards'],
 ["if(!notes.length){research.remove();}", 'Research with no documented notes must disappear'],
 ["const matches=exactIds.size===1?candidates.slice(0,6):[]", 'Only one verified model identity may appear in stock'],
 ["international-public-stock", 'Protected stock endpoint changed'],
 ["international-guest-enquiry", 'Guest enquiry route removed'],
 ["if(dedicatedStock)return;", 'Dedicated approved gallery must never be replaced']
])assert(gallery.includes(fragment),reason);
assert(!gallery.includes('alternativeBMW'), 'Cross-model BMW alternative-stock fallback returned');
assert(!gallery.includes('r1250StockFallback'), 'R1250-specific alternative override returned');
assert(!gallery.includes("card.append(brand,name,status)"), 'False logo motorcycle-photo cards returned');
assert(!gallery.includes('for(let i=matches.length;i<6;i++)'),'Do not restore six repetitive placeholders');
const r1250=fs.readFileSync('bmw-r1250gs.html','utf8');
assert(r1250.includes('const matches=exact;'), 'R1250GS must never show other BMW models');
assert(!r1250.includes('const matches=exact.length?exact:bmw'), 'Cross-model R1250 fallback returned');
assert(r1250.indexOf('id="r1250LiveStock"')<r1250.indexOf('id="ukR1250ModelGallery"'), 'R1250 live stock must precede research');
assert(!r1250.includes('id="r1250StockResearch"'), 'Duplicate factory research panel returned');
assert(r1250.includes('BMW_R_1250_GS_'), 'Licensed R1250 hero must remain');

const r1300=fs.readFileSync('bmw-r1300gs.html','utf8');
assert(r1300.includes('id="internationalModelCards"'),'R 1300 GS published stock gallery missing');
assert(r1300.includes('id="r1300gsModelHistory"'),'R 1300 GS model history cards missing');
assert(r1300.includes('BMW R 1300 GS — development and ownership'),'R 1300 GS history heading missing');
assert(r1300.includes('internationalGuestRequestForm'),'R 1300 GS guest enquiry missing');
console.log('PASS: international model galleries, Fat Boy/Africa Twin year cards, real-stock priority and enquiry hooks are preserved.');

console.log('PASS: existing detailed-model routes, fallback sourcing and both model-specific customer journeys are intact.');
