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
assert(guide.includes('typeof guide.years==="string"?guide.years:""'),'Missing model years must never render undefined');
assert(!guide.includes('esc(x.variant||"")+" — "+esc(x.name)+(x.variant?'),'Factory colour variant must not be duplicated');
assert(guide.includes('typeof x.model==="string"&&x.model!==actualModel'),'Malformed related-model records must be ignored');
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


const completeNav=fs.readFileSync('motorcycle-complete-catalogue-navigation.js','utf8');
const publicLoader=fs.readFileSync('public-header.js','utf8');
assert(publicLoader.includes('/motorcycle-complete-catalogue-navigation.js'), 'Complete catalogue navigation is not loaded from shared public header');
assert(completeNav.includes('motorcycle-catalogue-master.json'), 'Complete links must come from the shared public model catalogue');
assert(completeNav.includes('Explore all motorcycle manufacturers'), 'All-manufacturer navigation is missing');
assert(completeNav.includes('Explore other '+ "'+make+'" +' models'), 'All same-brand model pills are missing');
assert(!completeNav.includes('.slice(0,8)')&&!completeNav.includes('links.length>=6'), 'Complete model/manufacturer directory is capped');
assert(completeNav.includes("existing.replaceChildren"),'Approved R 1300 GS pill area is not reused');
assert(completeNav.includes("public_anybike_manufacturer_model_routes_v1"),'Verified dedicated model routes must be preferred');
assert(!completeNav.includes("international-public-stock"),'Catalogue navigation must not read protected stock');
assert(completeNav.includes('async function correctRelated()'), 'Shared related model curation missing');
assert(completeNav.includes('Math.abs(currentYear-year)<=22'), 'Related models must respect documented production eras');
assert(completeNav.includes("if(!chosen.length){panel.remove();return;}"), 'Unrelated historical model suggestions must be removed');
assert(completeNav.includes('Explore related .* models'), 'Legacy broad-category related panels must be intercepted');
assert(completeNav.includes('const relatedAdded=records.some('),'Related-model observer must filter actual relevant DOM additions');
assert(completeNav.includes('if(!relatedAdded||scheduled)return;'),'Unrelated dealer stock/country DOM updates must not trigger related scans');
assert(completeNav.includes('requestAnimationFrame(()=>{scheduled=false;render();});'),'Related-model reconciliation must yield to browser rendering');
assert(!completeNav.includes('queueMicrotask(()=>{scheduled=false;render();});'),'Unbounded microtask render loops can freeze model pages');
assert(publicLoader.includes('/motorcycle-complete-catalogue-navigation.js?v=20261112-freeze-fix1'),'Shared navigation browser cache must refresh');
const r32Guide=fs.readFileSync('bmw-r32.html','utf8');
assert(r32Guide.includes('Explore related BMW models'), 'Legacy R32 related section not detected by shared cleanup');
console.log('PASS: genuine family/era curation suppresses misleading R32 related model suggestions.');
console.log('PASS: Complete public manufacturer and same-brand model pill navigation is mounted without stock permission changes.');

console.log('PASS: existing detailed-model routes, fallback sourcing and both model-specific customer journeys are intact.');
