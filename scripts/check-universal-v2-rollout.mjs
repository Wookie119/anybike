#!/usr/bin/env node
// AnyBike universal model rollout: source-level regression guard.
// Run from repository root: node scripts/check-universal-v2-rollout.mjs
// These checks do not assert that 123-reg is deployed or that browser QA passed.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const header=read('public-header.js');
const shared=read('motorcycle-model-guide.html');
const sourceMaster=read('motorcycle-v2-master.html');
const renderer=read('model-template/approved-v2-universal-preview.mjs');
const css=read('model-template/r1300-v2-universal-rollout.css');
const approved=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const master=read('bmw-r1300gs-v2.html');
const facts=read('model-template/public-verified-model-facts.mjs');
const stock=read('model-template/public-exact-model-stock.mjs');
const gallery=read('model-template/public-approved-model-gallery.mjs');
const hero=read('model-template/public-approved-model-hero.mjs');
const navigation=read('model-template/approved-v2-dynamic-navigation.mjs');

// Import the actual shared publication contract: this is a runtime assertion,
// not a string-only check of twenty placeholder anchors.
const {SECTION_COUNT,SECTION_KEYS}=await import('../model-template/universal-page-section-contract.mjs');
const check=(label,fn)=>{
 try{fn();console.log('PASS',label);}
 catch(err){console.error('FAIL',label,err.message);process.exitCode=1;}
};
check('Every published permanent model route uses the ONE approved dynamic renderer',()=>{
 const manifest=JSON.parse(read('data/universal-v2-model-routes.json'));
 assert(Array.isArray(manifest.models)&&manifest.models.length>=900,'Permanent route catalogue unexpectedly incomplete');
 assert.equal(manifest.count,manifest.models.length,'Manifest count mismatch');
 const urls=new Set();
 for(const model of manifest.models){
  assert.match(model.url,/^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/);
  assert(!urls.has(model.url),'Duplicate permanent URL '+model.url);
  urls.add(model.url);
  const html=read(model.url.slice(1));
  assert.match(html,/id="anybikeV2RouteIdentity"/,'Identity missing '+model.url);
  const identityText=html.match(/<script id="anybikeV2RouteIdentity" type="application\/json">([^<]+)<\/script>/)?.[1];
  assert(identityText,'Missing identity payload '+model.url);
  const identity=JSON.parse(identityText);
  assert.equal(identity.make,model.make,model.url);
  assert.equal(identity.model,model.model,model.url);
  assert.equal(identity.model_id,model.model_id,model.url);
  assert.match(html,/approved-v2-universal-preview\.mjs\?v=/,model.url);
  assert.match(html,/approved-v2-dynamic-navigation\.mjs\?v=/,model.url);
  assert.match(html,/id="generationPanel"/,model.url);
  assert.match(html,/id="body"/,model.url);
  assert.match(html,/name="robots" content="index,follow"/,model.url);
  const canonical=html.match(/<link id="modelCanonical" rel="canonical" href="([^"]+)"/)?.[1];
  const expected='https://www.anybike.co.uk'+model.url;
  if(canonical!==expected){
   const target=canonical?.replace('https://www.anybike.co.uk','');
   assert(html.includes('location.replace(')&&manifest.models.some(row=>row.url===target),
    'Invalid canonical alias '+model.url);
  }
 }
 console.log('Audited',urls.size,'permanent model routes across',new Set(manifest.models.map(x=>x.make)).size,'manufacturers');
});
check('Approved publication cannot mount duplicate canonical slots',()=>{
 assert.match(renderer,/matches\[0\]\.querySelector\('\[data-anybike-reviewed-publication\]\[data-section-key=/);
 assert.match(renderer,/destination\.querySelector\('\.anybike-v2-reviewed-universal-section\[data-section-key=/);
 assert.match(renderer,/if\(seen\.has\(section\.dataset\.sectionKey\)\)\{/);
 assert.match(renderer,/existing\.append\(section\)/);
});
check('One exact canonical set of 20 section identifiers for every model',()=>{
 assert.equal(SECTION_COUNT,20);
 assert.equal(SECTION_KEYS.length,SECTION_COUNT);
 assert.equal(new Set(SECTION_KEYS).size,SECTION_COUNT);
 assert.deepEqual(SECTION_KEYS,Array.from({length:20},(_,i)=>'section_'+String(i+1).padStart(2,'0')));
 assert.match(renderer,/UNIVERSAL_SLOT_KEYS\.includes\(section\.dataset\.sectionKey\)/);
 assert.match(renderer,/const identity=JSON\.stringify\(\[String\(make\)\.toLowerCase\(\),String\(model\)\.toLowerCase\(\)\]\)/);
});
check('All model routes use one canonical 20-slot contract and shared approved research panel',()=>{
 assert.match(renderer,/SECTION_KEYS as UNIVERSAL_SLOT_KEYS,SECTION_COUNT as UNIVERSAL_SLOT_COUNT/);
 assert.match(renderer,/function integratePublishedResearch\(body,make,model\)/);
 assert.match(renderer,/integratePublishedResearch\(\$\('body'\),make,model\)/);
 assert.match(renderer,/panel\.dataset\.anybikeResearchIdentity!==identity/);
 assert.match(renderer,/if\(seen\.has\(section\.dataset\.sectionKey\)\)\{/);
 assert.match(renderer,/existing\.append\(section\)/);
 assert.match(renderer,/if\(!panel\)\{/);
 assert.match(renderer,/panel\.dataset\.anybikeVerifiedModelFacts='1'/);
 assert.doesNotMatch(renderer,/panel=makeSection\('v2EditorialResearch'/);
 assert.match(renderer,/if\(supplied\.length&&!panel\)\{/);
 assert.match(renderer,/panel\.dataset\.anybikeResearchIdentity!==guideIdentity/);
 assert.match(renderer,/panel\.dataset\.anybikeResearchIdentity=guideIdentity/);
 assert.match(renderer,/group\.dataset\.anybikeV2CanonicalSlot=section\.dataset\.sectionKey/);
 assert.match(renderer,/organiseCanonicalResearchSlots\(\$\('body'\)\)/);
 assert.match(renderer,/organiseUniversalFactoryResearch\(\$\('body'\)\)/);
 assert.match(renderer,/updateDynamicResearchNavigation\(\$\('body'\)\)/);
 assert.match(renderer,/const details=section\.querySelector/);
 assert.match(facts,/function mountVerifiedModelFacts\(body,rows,make,model\)/);
 assert.doesNotMatch(facts,/if\(referenceYearText\)/);
});
check('Public motorcycle model library prefers the same permanent V2 routes',()=>{
 const library=read('motorcycle-model-library.html');
 assert.match(library,/const permanentModelRoutes=new Map\(\)/);
 assert.match(library,/fetch\('\/data\/universal-v2-model-routes\.json'/);
 assert.match(library,/permanentModelRoutes\.get\(routeKey\(m\.make,m\.model\)\)/);
 assert.match(library,/motorcycle-model-guide\.html\?make=/);
});
check('All generic manufacturer model cards prefer the permanent shared V2 SEO route',()=>{
 const brand=read('motorcycle-brand.html');
 assert.match(brand,/const permanentModelRoutes=new Map\(\)/);
 assert.match(brand,/fetch\('\/data\/universal-v2-model-routes\.json'/);
 assert.match(brand,/const href=permanentModelRoutes\.get\(/);
 assert.match(brand,/loadManufacturerCatalogue\(\)\.then\(async data=>/);
 assert.match(brand,/motorcycle-model-guide\.html\?make=/);
});
check('Both model routes use identical renderer and expanded manufacturer navigation',()=>{
 const revision=(html,filename)=>{
  const pattern=filename==='renderer'?/approved-v2-universal-preview\.mjs\?v=([^"'<>]+)/:/approved-v2-dynamic-navigation\.mjs\?v=([^"'<>]+)/;
  const match=html.match(pattern);
  assert(match,'Missing versioned '+filename);
  return match[1];
 };
 for(const filename of ['renderer','navigation'])
  assert.equal(revision(shared,filename),revision(sourceMaster,filename),filename+' routes diverged');
 assert.match(navigation,/directory\.open=true/);
 assert.doesNotMatch(navigation,/directory\.open=false/);
});
check('Generic model route uses the exact shared V2 renderer and section layout',()=>{
 assert.match(shared,/approved-v2-preview-style\.css\?v=/);
 assert.match(shared,/approved-v2-universal-preview\.mjs\?v=/);
 assert.match(shared,/approved-v2-dynamic-navigation\.mjs\?v=/);
 assert.match(shared,/id="generationPanel"/);
 assert.match(shared,/id="body"/);
 const sections=html=>[...html.matchAll(/<section\b([^>]*)>/g)].map(x=>x[1]);
 assert.deepEqual(sections(shared),sections(sourceMaster));
 assert.match(shared,/name="robots" content="index,follow"/);
});
check('V2 rollout never modifies the protected BMW master',()=>{
 assert.match(header,/protectedMaster/);
 assert.match(header,/path==='\/bmw-r1300gs-v2\.html'/);
 assert.doesNotMatch(master,/anybike-v2-model-rollout/);
});
check('Legacy public header detects V2 before module script parses',()=>{
 assert.match(header,/const actualV2=!!document\.getElementById\('databaseHeroPhoto'\)/);
 assert.match(header,/const sharedV2Guide=!!document\.getElementById\('databaseHeroPhoto'\)/);
 assert.match(header,/getElementById\('internationalGuestRequestForm'\)/);
 assert.match(header,/getElementById\('v2FormSubmit'\)/);
 assert.doesNotMatch(header,/script\[src\*="\/model-template\/approved-v2-universal-preview\.mjs"\]/);
});
check('Incompatible legacy designs fail closed',()=>{
 assert.match(header,/const compatible=!!document\.querySelector\('main #generationPanel'\)/);
 assert.match(header,/!!document\.querySelector\('main #body'\)/);
 assert.match(header,/!compatible/);
});
check('All 27 approved dedicated BMW routes contain a compatible surface',()=>{
 const bmw=approved.filter(row=>row.make==='BMW');
 assert.equal(bmw.length,27);
 for(const row of bmw){
  const html=read(row.url.slice(1));
  assert.match(html,/id="generationPanel"/,row.url);
  assert.match(html,/id="body"/,row.url);
  assert.match(html,/public-header\.js/,row.url);
 }
});
check('All 18 Harley dedicated routes run the shared V2 renderer and retain archival research',()=>{
 const harley=approved.filter(row=>row.make==='Harley-Davidson');
 const archive=JSON.parse(read('data/harley-v2-legacy-preservation.json')).models;
 assert.equal(harley.length,18);
 assert.equal(archive.length,18);
 for(const row of harley){
  const html=read(row.url.slice(1));
  assert.match(html,/approved-v2-universal-preview\.mjs/,row.url);
  assert.match(html,/approved-v2-dynamic-navigation\.mjs/,row.url);
  assert.match(html,/public-header\.js/,row.url);
  assert.match(html,/id="internationalGuestRequestForm"/,row.url);
  assert(archive.some(entry=>entry.url===row.url&&entry.make===row.make&&entry.model===row.model),row.url);
 }
});
check('The shared layout has accessible contrast, readable cards and mobile flow',()=>{
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/border-left:3px solid #ed1c24/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/focus-visible/);
});
check('V2 research, approved photography and exact-stock isolation remain in place',()=>{
 assert.match(renderer,/installVerifiedModelFacts/);
 assert.match(renderer,/public_anybike_model_hero_v1/);
 assert.match(renderer,/public_anybike_verified_model_gallery_v1/);
 assert.match(renderer,/stockForCanonicalModel/);
 assert.match(renderer,/international-public-stock/);
 assert.match(facts,/exactVerifiedModelFacts/);
 assert.match(stock,/matchingPublishedMotorcycles/);
 assert.match(hero,/approved/i);
 assert.match(gallery,/approved/i);
});
check('Customer lead and sourcing paths survive the V2 migration',()=>{
 assert.match(shared,/id="sourceBottom"/);
 assert.match(shared,/id="v2UkSellAction"/);
 assert.match(shared,/id="internationalGuestRequestForm"/);
 assert.match(renderer,/international-guest-enquiry/);
 assert.match(shared,/bulk-buying-request\.html/);
 assert.match(renderer,/sell-your-motorcycle\.html/);
});
check('Legacy guide research remains exact-identity-only',()=>{
 assert.match(renderer,/supplementPublishedV2Guide/);
 assert.match(renderer,/motorcycle-model-guides\.json/);
 assert.match(renderer,/exact.length===1/);
 assert.match(renderer,/canonicalPath/);
});
if(process.exitCode)console.error('Universal V2 source checks FAILED. Live role and visual checks are still required.');
else console.log('Universal V2 source checks passed. Live role and visual checks are still required.');
