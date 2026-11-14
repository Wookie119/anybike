#!/usr/bin/env node
// Universal model master regression guard. Read-only; no live requests or secrets.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canonicalStockMatches,stockForCanonicalModel} from '../model-template/canonical-public-stock-identity.mjs';
import {SECTION_COUNT,SECTION_KEYS,buildUniversalPageSections,visibleUniversalSections} from '../model-template/universal-page-section-contract.mjs';

const load=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS '+name)};
const [html,genericRouteHtml,referenceHtml,approvedCss,renderer,nav,rawCatalogue]=await Promise.all([
 load('motorcycle-v2-master.html'),
 load('motorcycle-model-guide.html'),
 load('bmw-r1300gs-v2-approved-20261102.html'),
 load('model-template/approved-v2-preview-style.css'),
 load('model-template/approved-v2-universal-preview.mjs'),
 load('model-template/approved-v2-dynamic-navigation.mjs'),
 load('data/motorcycle-catalogue-master.json')
]);
const catalogue=JSON.parse(rawCatalogue);
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
check('All approved V2 reference styles are present verbatim in the shared stylesheet',()=>{
 const approved=[...referenceHtml.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(match=>match[1]);
 assert(approved.length>=30,'Expected approved V2 style reference');
 for(const [index,style] of approved.entries())
  assert(approvedCss.includes(style),'Approved reference style block missing: '+index);
});
check('Approved V2 model-section structure matches the exact reference',()=>{
 const sectionClasses=source=>[...source.matchAll(/<section\b([^>]*)>/g)].map(match=>
  (match[1].match(/\bclass="([^"]+)"/)||[])[1]||'');
 // The universal rollout moves the existing Available Stock block below hero.
 // It must not move, remove or restyle any other approved reference section.
 const approvedOrder=sectionClasses(referenceHtml),masterOrder=sectionClasses(html);
 assert.equal(approvedOrder.filter(x=>x==='end-action').length,5);
 assert.equal(masterOrder.filter(x=>x==='end-action').length,5);
 const stockPosition=html.indexOf('id="internationalModelStock"');
 const heroPosition=html.indexOf('<section class="hero"');
 const generationPosition=html.indexOf('id="generationPanel"');
 assert(heroPosition>=0&&stockPosition>heroPosition&&generationPosition>stockPosition,
  'International exact-model stock must appear after hero and before research');
 const stockMoved=masterOrder.slice();
 assert.equal(stockMoved[1],'end-action','Stock must be the only relocated end-action');
 stockMoved.splice(1,1);
 const expected=approvedOrder.slice();
 expected.splice(expected.lastIndexOf('end-action'),1);
 assert.deepEqual(stockMoved,expected,'Every other approved reference section must retain its order');
 const required=['publicHeader','category','heading','summary','years','databaseHeroPhoto','source',
  'generationPanel','generationControls','generationDetail','generationCompare',
  'r1300V2VerifiedExtras','databaseModelTimeline','body','r1300DeepDive',
  'databaseDeepDive','databaseRelatedModels','databaseMotorcycleTypes',
  'r1300CountryMarkets','internationalModelStock','internationalModelCards',
  'internationalGuestRequest','internationalGuestRequestForm','v2FormSubmit',
  'internationalGuestRequestStatus','nextAction','sourceBottom','modelSources',
  'verifiedModelSources'];
 for(const id of required){
  assert(referenceHtml.includes('id="'+id+'"'),'Reference missing '+id);
  assert(html.includes('id="'+id+'"'),'Master missing '+id);
 }
});
check('Static fallback has unique make/model identities',()=>{
 assert(Array.isArray(catalogue.models)&&catalogue.models.length>0);
 const keys=catalogue.models.map(row=>normalize(row.make)+'|'+normalize(row.model));
 assert(keys.every(key=>!key.startsWith('|')&&!key.endsWith('|')));
 assert.equal(new Set(keys).size,keys.length);
});
check('Hidden or unpublished sections stay hidden across the shared V2 design',()=>{
 assert.match(html,/main \[hidden\]\{display:none!important\}/);
 assert.match(renderer,/if\(!factCount&&!guide&&!publishedCount\)/);
 assert.doesNotMatch(renderer,/makeSection\('v2ResearchPending'/);
});
check('Established generic model-guide route uses exactly the same V2 page composition',()=>{
 const generic=genericRouteHtml;
 const stripEntry=source=>source.replaceAll('motorcycle-model-guide.html','SHARED-MODEL-ENTRY.html')
  .replaceAll('motorcycle-v2-master.html','SHARED-MODEL-ENTRY.html');
 assert.equal(stripEntry(generic),stripEntry(html),
  'Generic and master HTML have diverged; change the same approved V2 shell, never fork the layout');
 assert.match(generic,/name="robots" content="index,follow"/);
});
check('One indexable V2 master and identical asset versions',()=>{
 assert.match(html,/name="robots" content="index,follow"/);
 assert.doesNotMatch(html,/noindex/i);
 assert.match(html,/approved-v2-universal-preview\.mjs\?v=/);
 assert.match(html,/approved-v2-dynamic-navigation\.mjs\?v=/);
});
check('Shared catalogue reads public RPC before offline JSON',()=>{
 assert(renderer.indexOf('publicCatalogueRpc(wantMake)')<renderer.indexOf("fetch('/data/motorcycle-catalogue-master.json'"));
 assert.match(renderer,/if\(!liveCatalogueLoaded\)/);
 assert.match(nav,/rest\/v1\/rpc\/public_anybike_manufacturer_catalogue_names_v1/);
});
check('Country market panels stay hidden until shared navigation finishes',()=>{
 assert.match(html,/id="r1300CountryMarkets" hidden/);
 assert.match(nav,/section\.hidden=true/);
 assert.match(nav,/section\.hidden=false/);
 assert.match(nav,/__anybikeV2NavigationReady=true/);
});
check('All 217 published country markets use the safe public RPC fallback',()=>{
 assert.match(nav,/rest\/v1\/rpc\/public_anybike_country_navigation_v1/);
 assert.match(nav,/public_anybike_country_navigation_v1/);
 assert.match(nav,/if\(!data\)/);
 assert.match(nav,/section\.hidden=true/);
 assert.match(nav,/validCountryPath\(x\.url\)/);
});
check('Established published canonical model URLs are preserved',()=>{
 assert.match(renderer,/public_anybike_manufacturer_model_routes_v1/);
 assert.match(nav,/for\(const \[key,item\] of approved\)combined\.set\(key,item\)/);
});
check('Verified facts and authorised photos only',()=>{
 assert.match(renderer,/installVerifiedModelFacts/);
 assert.match(renderer,/public_anybike_verified_model_gallery_v1/);
 assert.match(renderer,/safePhoto\(approvedHero\)/);
 assert.match(renderer,/galleryUrls\.has\(photo\.image_url\)/);
});
check('Twenty reviewed research slots with no empty or cross-model substitutions',()=>{
 const entity={type:'model',id:77,manufacturer_id:5,name:'R 1300 GS'};
 const now=new Date(Date.now()-1000).toISOString();
 const published={entity_type:'model',entity_id:77,manufacturer_id:5,section_number:1,section_key:'section_01',section_title:'Documented research',editorial_status:'published',publication_eligible:true,published_at:now,content:{paragraphs:['Official manufacturer reference']}};
 assert.equal(SECTION_COUNT,20);assert.equal(SECTION_KEYS.length,20);
 assert.equal(visibleUniversalSections(buildUniversalPageSections(entity,[published])).length,1);
 assert.equal(visibleUniversalSections(buildUniversalPageSections(entity,[{...published,editorial_status:'draft'}])).length,0);
 assert.equal(visibleUniversalSections(buildUniversalPageSections(entity,[])).length,0);
 assert.throws(()=>buildUniversalPageSections(entity,[{...published,entity_id:68}]),/Cross-entity/);
 assert.throws(()=>buildUniversalPageSections(entity,[published,published]),/Duplicate/);
});
check('Restricted public stock is exact-model, entitlement-verified and deduplicated',()=>{
 const page={catalog_model_id:77,model_name:'R 1300 GS',manufacturer_name:'BMW'};
 const item={item_id:125,catalog_model_id:77,catalogue_identity_status:'verified',publication_eligible:true,make:'BMW',model:'R 1300 GS'};
 assert(canonicalStockMatches(item,page));
 assert(!canonicalStockMatches({...item,catalog_model_id:68},page));
 assert(!canonicalStockMatches({...item,catalogue_identity_status:'pending'},page));
 assert(!canonicalStockMatches({...item,publication_eligible:false},page));
 assert(!canonicalStockMatches({...item,model:'R 1250 GS'},page));
 assert.equal(stockForCanonicalModel([item,item,{...item,item_id:126}],page).length,2);
 assert.match(renderer,/res\.status===401\|\|res\.status===403/);
 assert.match(renderer,/stockForCanonicalModel\(data\.items,pageIdentity,6\)/);
});
check('Guest enquiry is available before slow research, even without a visitor session',()=>{
 const form=renderer.indexOf("const form=$('internationalGuestRequestForm')");
 const photos=renderer.indexOf("const publicMedia=async");
 const research=renderer.indexOf("await installVerifiedModelFacts");
 assert(form>=0&&photos>form&&research>form,'Guest enquiry must initialize before model research and media');
 assert.match(renderer,/const optionalVisitorToken=async/);
 assert.match(renderer,/await client\?\.auth\?\.getSession\?\.\(\)/);
 assert.match(renderer,/const reply=await res\.json\(\)\.catch\(\(\)=>null\)/);
});
check('Unexpected model failures do not leave stock permanently checking',()=>{
 assert.match(renderer,/pendingStock\?\.dataset\.stockFeedState==='checking'/);
 assert.match(renderer,/pendingStock\.dataset\.stockFeedState='unavailable'/);
});
check('Approved model photo galleries reuse the approved BMW shell and preserve stock order',()=>{
 for(const route of [html,genericRouteHtml]){
  const stock=route.indexOf('id="internationalModelStock"');
  const gallery=route.indexOf('id="ukR1300ModelGallery"');
  const research=route.indexOf('id="body"');
  assert(stock>0&&gallery>stock&&research>gallery,
   'One master shell must place stock, gallery, then research in BMW order');
  assert.match(route,/id="manufacturer"/,
   'BMW-style manufacturer link must be on every shared model hero');
 }
 assert.match(renderer,/const gallerySection=\$\('ukR1300ModelGallery'\)/);
 assert(!renderer.includes("makeSection('v2ApprovedGallery'"),
  'Renderer must not create a second independent gallery');
});
check('Shared enquiries and available stock remain available before research',()=>{
 assert.match(renderer,/international-guest-enquiry/);
 assert.match(renderer,/if\(header&&stock\)header\.after\(stock\)/);
 assert.match(renderer,/loadUniversalPublishedPage\(client,\{/);
 assert.match(renderer,/type:'model',id:canonicalId,restEndpoint:ENDPOINT,restKey:KEY/);
});
check('Verified-facts outages do not block exact-model stock or public enquiries',()=>{
 const factStart=renderer.indexOf('factCount=await installVerifiedModelFacts(');
 const catchStart=renderer.indexOf("console.warn('Source-verified model research unavailable; continuing model page'");
 const stockStart=renderer.indexOf("fetch(ENDPOINT+'/functions/v1/international-public-stock'");
 assert(factStart>=0&&catchStart>factStart&&stockStart>catchStart);
 const beforeFacts=renderer.slice(Math.max(0,factStart-100),factStart);
 assert.match(beforeFacts,/try\s*\{/);
 assert.match(renderer.slice(factStart,catchStart),/catch\(error\)\s*\{/);
});
check('Verified factory specifications appear before model years on every V2 route',()=>{
 assert.match(renderer,/const firstDevelopment=\$\('generationPanel'\)/);
 assert.match(renderer,/if\(firstDevelopment\)firstDevelopment\.before\(section\)/);
 for(const route of [html,genericRouteHtml]){
  assert.match(route,/id="generationPanel"/);
  assert.match(route,/id="r1300V2VerifiedExtras"/);
 }
});
check('Documented BMW milestone and specification rows display with sources',()=>{
 assert(renderer.includes('production.documented_milestones'));
 assert(renderer.includes('production.specifications'));
 assert(renderer.includes("makeSection('v2DocumentedSpecifications'"));
 assert(renderer.includes('sourceLink(article,spec.source'));
 assert(renderer.includes('sourceLink(p,e.source'));
});
console.log('Universal V2 regression checks: '+passed+' passed');
