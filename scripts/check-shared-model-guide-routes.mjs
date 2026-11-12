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


// Reused Harley photographs must keep an exact-model attribution and licence.
// V-Rod and Pan America 1250 must feature an actual motorcycle near the hero.
const creditedHarley=['breakout','fat-boy','electra-glide','iron-883','road-king','street-bob','heritage-classic','nightster','road-glide','street-glide','ultra-limited','sportster-s'];
for(const slug of creditedHarley){
 const page=fs.readFileSync('harley-davidson-'+slug+'.html','utf8');
 const hero=page.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0]||'';
 assert(hero.includes('<img '),'Harley '+slug+' exact-model hero missing');
 assert(hero.includes('<figcaption>')||hero.includes('<figcaption '),'Harley '+slug+' hero photographer acknowledgement missing');
 assert(hero.includes('creativecommons.org/licenses/'),'Harley '+slug+' hero licence link missing');
 assert(hero.includes('commons.wikimedia.org/wiki/File:'),'Harley '+slug+' photographer source link missing');
}
const panHero=fs.readFileSync('harley-davidson-pan-america-1250.html','utf8').match(/<section class="hero"[\s\S]*?<\/section>/)?.[0]||'';
assert(panHero.includes('Pan America 1250 Special')&&panHero.includes('2023'),'Pan America hero must identify the 2023 Special derivative exactly');
assert(panHero.includes('<img ')&&!panHero.includes('not an actual motorcycle photograph'),'Pan America must show a real photo, not decorative artwork');
const vRodPage=fs.readFileSync('harley-davidson-v-rod.html','utf8');
const vRodHero=vRodPage.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0]||'';
assert(vRodHero.includes('<img ')&&vRodHero.includes('Addvisor'),'V-Rod must have an exact-family licensed hero');
assert.equal((vRodPage.match(/class="model-archive-photo"/g)||[]).length,1,'V-Rod must not duplicate its museum archive image below the hero');
console.log('PASS: 14 Harley exact-model licensed hero photographs retain attribution; no new artwork/duplicate V-Rod archive.');


// Supplier-provided model photographs on these Harley guides belong in the
// existing hero, not below it. This does not grant external syndication rights.
for(const slug of ['cvo-pan-america','low-rider-s','pan-america-1250-st']){
 const page=fs.readFileSync('harley-davidson-'+slug+'.html','utf8');
 const hero=page.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0]||'';
 assert(hero.includes('<img '),'Harley '+slug+' has no photo inside the hero');
 assert(hero.includes('supplied to AnyBike'),'Harley '+slug+' source photo caption must be preserved');
 assert.equal((page.match(/<figure class="card(?: harley-user-photo)?"/g)||[]).length,1,'Harley '+slug+' photo should not be duplicated');
}
const standard=fs.readFileSync('harley-davidson-softail-standard.html','utf8');
assert(standard.includes('AI-generated illustration'),'Softail Standard unverified artwork must remain explicitly labelled');
console.log('PASS: existing Harley supplied photographs are inside their heroes without duplicate figures.');


// Universal catalogue model guides use the central approved, exact-model
// photo bank without allowing related model or trim photographs.
const universalHero=fs.readFileSync('model-template/public-approved-model-hero.mjs','utf8');
const universalGuide=fs.readFileSync('motorcycle-model-guide.html','utf8');
assert(universalGuide.includes('/model-template/public-approved-model-hero.mjs?v=20261112-japan1'),'Universal model guide must load exact-model hero renderer');
assert(universalHero.includes("public_anybike_model_hero_v1"),'Approved Supabase photo RPC missing');
assert(universalHero.includes('data.make===make&&data.model===model'),'Exact model identity guard missing');
assert(universalHero.includes('img.onload=()=>')&&universalHero.includes('img.onerror=next'),'Broken external image must not replace readable hero');
assert(!universalHero.includes('new MutationObserver('),'Photo renderer must not introduce another DOM observer loop');

// Migration-backed public hero lookup must be exact and rights-gated.
const heroMigration=fs.readFileSync('supabase/migrations/20261112123000_public_exact_model_licensed_hero.sql','utf8');
assert(heroMigration.includes('public.public_anybike_model_hero_v1'),'Shared photo RPC must be versioned');
assert(heroMigration.includes('p.manufacturer = r.manufacturer')&&heroMigration.includes('p.model = r.model'),'Never select an approximate model photo');
assert(heroMigration.includes("p.approval_status = 'approved'"),'Unapproved image access must stay blocked');
assert(heroMigration.includes("p.subject_category = 'whole_motorcycle'"),'Hero must show actual motorcycle');
assert(heroMigration.includes("'model_hero' = any(p.usage_contexts)"),'Use must be explicitly approved for model hero');
assert(heroMigration.includes('grant execute on function public.public_anybike_model_hero_v1(text,text)'),'Public read-only RPC must remain exposed');


// Only verified identical catalogue names may share approved model photos.
// The public RPC must still refuse nearby generations and factory variants.
const aliasMigration=fs.readFileSync('supabase/migrations/20261112134500_verified_model_photo_identity_aliases.sql','utf8');
assert(aliasMigration.includes('public.anybike_model_identity_aliases'),'Explicit verified alias register missing');
assert(aliasMigration.includes("('Honda','Africa Twin CRF1000L','CRF1000L AFRICA TWIN'"),'Honda word-order alias missing');
assert(aliasMigration.includes("('Yamaha','Ténéré 700','Tenere 700'"),'Yamaha accent-only alias missing');
assert(aliasMigration.includes("('Kawasaki','Z900 RS','Z900RS'"),'Z900RS space-only alias missing');
assert(aliasMigration.includes("('Yamaha','XT660Z Ténéré','XT660Z Tenere'"),'XT660Z accent-only alias missing');
assert(aliasMigration.includes('p.manufacturer=r.manufacturer and p.model=r.model'),'Resolved hero lookup must be exact');
assert(aliasMigration.includes("p.approval_status='approved'"),'Only approved images may be returned');
assert(aliasMigration.includes("p.subject_category='whole_motorcycle'"),'Actual motorcycle photo gate missing');
assert(aliasMigration.includes('p.original_model'),'Photo response must preserve requested identity for strict model-page validation');
assert(!aliasMigration.includes("'Z900RS','Z900'"),'Never alias Kawasaki Z900RS to Z900');
assert(!aliasMigration.includes("'TENERE 700 RALLY','Tenere 700'"),'Never alias Rally to standard Ténéré');
console.log('PASS: approved identity aliases retain strict manufacturer, generation and trim photo guards.');


// A verified manufacturer fact must carry an audit and exact model identity.
// No permanent MutationObserver can rescan sourced research indefinitely.
const verifiedFactsScript=fs.readFileSync('model-template/public-verified-model-facts.mjs','utf8');
const factoryMigration=fs.readFileSync('supabase/migrations/20261112150000_japanese_factory_verified_model_research.sql','utf8');
assert(factoryMigration.includes('motorcycle_catalog_fact_verification_audit'),'Source audit for factory research missing');
assert(factoryMigration.includes("'Honda'")===false,'Factory records must reference audited canonical model IDs, not loose manufacturer matching');
for(const source of ['global.honda/en/newsroom/news/2015/','global.yamaha-motor.com/news/2013/','globalsuzuki.com/globalnews/2015/','global.kawasaki.com/en/corp/newsroom/','kawasaki.eu/en/Motorcycles/'])
 assert(factoryMigration.includes(source),'Factory source missing: '+source);
assert(verifiedFactsScript.includes('const placeholderAdded=records.some('),'Verified model facts observer must filter late placeholders');
assert(verifiedFactsScript.includes('watcher.disconnect();'),'Verified model facts observer must disconnect');
assert(!verifiedFactsScript.includes('new MutationObserver(()=>removeGenericPlaceholder())'),'Unbounded research observer reintroduced');
assert(universalGuide.includes('/model-template/public-verified-model-facts.mjs?v=20261112-research1'),'New approved research renderer must refresh browser cache');

// Additional dated factory research must stay versioned with its audit, not
// hardcoded into manufacturer-specific HTML pages.
const nextFactoryMigration=fs.readFileSync('supabase/migrations/20261112152000_factory_model_research_yamaha_suzuki_kawasaki.sql','utf8');
assert(nextFactoryMigration.includes('motorcycle_catalog_fact_verification_audit'),'Next batch of manufacturer research requires a source audit');
for(const url of ['global.yamaha-motor.com/news/2019/1010/tms.html','globalsuzuki.com/globalnews/2016/1004.html','global.kawasaki.com/en/corp/newsroom/'])
 assert(nextFactoryMigration.includes(url),'Additional documented factory source missing: '+url);
assert(nextFactoryMigration.includes('where not exists(select 1 from public.motorcycle_catalog_fact_verification_audit'),'Migrated research audit must remain idempotent');

// Next Honda/Yamaha/Suzuki/Kawasaki factory batch must remain exact-model
// sourced and auditable through the existing public model facts renderer.
const latestJapaneseResearch=fs.readFileSync('supabase/migrations/20261112161000_verified_japanese_model_research_batch4.sql','utf8');
for(const source of [
 'global.honda/en/newsroom/news/2012/2121113eng.html',
 'global.honda/en/newsroom/news/2018/2181106eng.html',
 'global.yamaha-motor.com/business/mc/lineup/xsr/xsr155.html',
 'globalsuzuki.com/globalnews/2016/1004.html',
 'globalsuzuki.com/motorcycle/smgs/digital-archive/',
 'global.kawasaki.com/en/corp/newsroom/news/detail/'
])assert(latestJapaneseResearch.includes(source),'Manufacturer primary source missing: '+source);
assert(latestJapaneseResearch.includes('motorcycle_catalog_fact_verification_audit'),'Factory source audit must be restored in migrations');
assert(latestJapaneseResearch.includes("f.catalog_model_id=d.catalog_model_id and f.label=d.label and f.source_url=d.source_url"),'Fact/audit identity must be exact model/label/source');

// Triumph and Ducati use the same verified research renderer as other makes.
// Model-year and trim-specific specs are not silently shared.
const triumphDucatiResearch=fs.readFileSync('supabase/migrations/20261112170000_triumph_ducati_verified_factory_model_research.sql','utf8');
for(const source of [
 'triumphmotorcycles.com/for-the-ride/news/motorcycles/street-triple-765-2022-11-03',
 'triumphmotorcycles.co.uk/for-the-ride/news/motorcycles/tiger-900-q-and-a-2024-05-28',
 'triumphmotorcycles.co.uk/motorcycles/adventure/tiger-900/tiger-900-rally-pro-2024',
 'mediahouse.ducati.com/light-compact-accessible-and-fun',
 'ducati.com/ww/en/news/v4-granturismo-'
])assert(triumphDucatiResearch.includes(source),'Verified Triumph/Ducati source missing: '+source);
assert(triumphDucatiResearch.includes('motorcycle_catalog_fact_verification_audit'),'Triumph/Ducati research must retain source verification audit');
assert(triumphDucatiResearch.includes('f.catalog_model_id=d.catalog_model_id and f.label=d.label and f.source_url=d.source_url'),'Only exact model + label + source may restore audit records');

// Triumph/Ducati factory additions must remain publicly reachable through
// the existing generic guide, without introducing parallel model templates.
const moreTriumphDucatiResearch=fs.readFileSync('supabase/migrations/20261112175000_more_verified_triumph_ducati_model_facts.sql','utf8');
for(const source of [
 'triumphmotorcycles.com/our-story/bonneville',
 'triumphmotorcycles.com/motorcycles/prior-model-years/t120-2021-my',
 'triumphmotorcycles.com/motorcycles/prior-model-years/speed-triple-1200-rs-2022',
 'mediahouse.ducati.com/350-000-times-monster',
 'mediahouse.ducati.com/la-nouvelle-panigale-v4-2020'
])assert(moreTriumphDucatiResearch.includes(source),'Triumph/Ducati verified manufacturer source missing: '+source);
assert(moreTriumphDucatiResearch.includes('motorcycle_catalog_fact_verification_audit'),'Manufacturer sources must carry audit verification');
const publicBrandPage=fs.readFileSync('motorcycle-brand.html','utf8');
assert(publicBrandPage.includes('/motorcycle-model-guide.html?make='),'Manufacturer public cards must link into the shared guide');
assert(universalGuide.includes('id="body"'),'Shared model guide must retain research insertion point');
assert(universalGuide.includes('/model-template/public-verified-model-facts.mjs'),'Shared guide must load verified factory facts');
console.log('PASS: Triumph/Ducati factory research remains source-audited and linked to universal public model pages.');

console.log('PASS: Triumph and Ducati dated source-linked research shares the approved universal model system.');

console.log('PASS: ten exact Japanese model guides have source-audited factory research migration.');

console.log('PASS: second model research migration preserves dated sources and audit history.');

console.log('PASS: four manufacturer factory research sources, audit and bounded page observer preserved.');

console.log('PASS: generic manufacturer/model photography uses approved exact-model RPC with image-load guard.');

console.log('PASS: existing detailed-model routes, fallback sourcing and both model-specific customer journeys are intact.');
