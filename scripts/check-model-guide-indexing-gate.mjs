import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const guide=readFileSync(new URL('../motorcycle-model-guide.html',import.meta.url),'utf8');
const brand=readFileSync(new URL('../motorcycle-brand.html',import.meta.url),'utf8');
const sitemap=readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');
const approved=JSON.parse(readFileSync(new URL('../data/motorcycle-index-identities.json',import.meta.url),'utf8')).models;
assert(guide.includes('<meta name="robots" content="index,follow" id="modelRobots">'),'Model pages must be indexable without waiting for Supabase');
assert(guide.includes('<header id="publicHeader"></header>'),'Shared model guide must preserve the standard AnyBike header');
const approvedMaster=readFileSync(new URL('../design/model-template/approved-bmw-r1300gs-v2-2026-11-02.html',import.meta.url),'utf8');
for(const sharedElement of ['<section class="hero">','<div class="intro" id="summary">','<div id="years">','<section id="generationPanel" class="generation-panel" hidden>','<div id="generationControls"','<div id="generationDetail"','<div id="generationCompare"']){
 assert(approvedMaster.includes(sharedElement),'Approved BMW design missing shared structural element: '+sharedElement);
 assert(guide.includes(sharedElement),'Universal model guide must preserve BMW-approved structural element: '+sharedElement);
}
assert(guide.includes('--red:#ed1c24;--panel:#151515'),'Universal model guide must retain approved AnyBike charcoal/red palette');
assert(approvedMaster.includes('class="model-sources-footer"'),'BMW master must retain its source-reference footer');
assert(guide.includes('id="modelSources" class="model-sources-footer"'),'Every universal model guide must include the approved source-reference footer');
assert(guide.includes('id="verifiedModelSources"'),'Universal source footer must provide an audited research destination');
const verifiedRenderer=readFileSync(new URL('../model-template/public-verified-model-facts.mjs',import.meta.url),'utf8');
assert(verifiedRenderer.includes("const allFacts=exactVerifiedModelFacts(rows,make,model)"),'Research sources must come from exact verified model identity');
assert(verifiedRenderer.includes("sourceList.replaceChildren()"),'Source footer must remove withdrawn source links on refresh');
assert(verifiedRenderer.includes("sourceFooter.hidden=sources.size===0"),'Models without approved research must not show an empty sources footer');


assert(guide.includes('/shared-model-catalogue.js'),'Shared model guide must retain catalogue-based model identity resolution');
assert(guide.includes('/model-template/public-verified-model-facts.mjs'),'All models must use the shared verified facts enrichment');
assert(guide.includes('/model-template/public-approved-model-hero.mjs'),'All models must use the approved hero system');
assert(guide.includes('/model-template/public-approved-model-gallery.mjs'),'All models must use the approved gallery system');
assert(!approved.some(x=>x.make==='Indian'&&['Scout','Chief','Four'].includes(x.model)),'Original Indian heritage identities must not leak into modern public model routes');

assert(guide.includes('if(!make||!model){el("modelRobots").content="noindex,follow"'),'Empty model identities must be noindex');
assert(!guide.includes('if(clean)el("modelRobots").content="index,follow"'),'Indexing must not depend on an asynchronous Supabase response');
assert(brand.includes('<meta name="robots" content="index,follow">'),'Manufacturer pages must be indexable');
assert(brand.includes('motorcycle-brand.html?make="+encodeURIComponent(make)'),'Manufacturer canonical must identify the brand');
assert(sitemap.includes('motorcycle-model-guide.html?make='),'Sitemap must include models');
assert(sitemap.includes('motorcycle-brand.html?make='),'Sitemap must include manufacturers');
assert(sitemap.includes('/markets/japan.html'),'Sitemap must retain international markets');
const locs=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.equal(locs.length,new Set(locs).size,'Sitemap must not repeat URLs');
assert.equal(locs.filter(x=>x.includes('/motorcycle-model-guide.html?')).length,approved.length,'Sitemap must match approved public model identities');
const identities=locs.filter(x=>x.includes('/motorcycle-model-guide.html?')).map(x=>{const decoded=x.replace(/&amp;/g,'&');const make=decoded.match(/[?&]make=([^&]+)/)?.[1]||'';const model=decoded.match(/[?&]model=([^&]+)/)?.[1]||'';return decodeURIComponent(make).trim().toLowerCase()+'|'+decodeURIComponent(model).trim().toLowerCase()});
assert.equal(new Set(identities).size,identities.length,'Model identity duplicates must not re-enter the sitemap');
const expectedModelIdentities=approved.map(x=>x.make.trim().toLowerCase()+'|'+x.model.trim().toLowerCase());
assert.equal(new Set(expectedModelIdentities).size,expectedModelIdentities.length,'Approved public catalogue must have unique make/model pairs');
assert.deepEqual(identities.slice().sort(),expectedModelIdentities.slice().sort(),'Every approved make/model must have exactly one matching sitemap URL');
assert(approved.every(x=>typeof x.make==='string'&&x.make.trim()&&typeof x.model==='string'&&x.model.trim()),'All public catalogue identities require a make and model');

assert(!locs.some(x=>{const u=new URL(x.replace(/&amp;/g,'&'));return u.pathname==='/motorcycle-brand.html'&&u.searchParams.get('make')?.toLowerCase()==='indian'}),'Indian alias must not be indexed');
assert.equal(locs.filter(x=>x.includes('/motorcycle-brand.html?')).length,new Set(approved.map(x=>x.make.toLowerCase()).filter(x=>!['indian','indian motorcycle','bmw','harley-davidson'].includes(x))).size,'Sitemap must exclude redirected manufacturer aliases');
assert(locs.includes('https://www.anybike.co.uk/bmw-motorcycles.html'),'BMW manufacturer sitemap entry missing');
assert(locs.includes('https://www.anybike.co.uk/harley-davidson-motorcycles.html'),'Harley manufacturer sitemap entry missing');
assert(locs.includes('https://www.anybike.co.uk/indian-motorcycles.html'),'Indian historical manufacturer sitemap entry missing');
const indianPage=readFileSync(new URL('../indian-motorcycles.html',import.meta.url),'utf8');
const directory=readFileSync(new URL('../motorcycle-manufacturers.html',import.meta.url),'utf8');
assert(indianPage.includes('rel="canonical" href="https://www.anybike.co.uk/indian-motorcycles.html"'),'Indian history page canonical must point to dedicated route');
assert(indianPage.includes('Burt Munro')&&indianPage.includes('Victory and Polaris'),'Indian page must preserve Munro and Victory history');
assert(indianPage.includes('/data/motorcycle-index-identities.json'),'Indian models must use the approved catalogue');
assert(indianPage.includes('<header id="publicHeader"></header>'),'Indian manufacturer missing shared AnyBike header');
assert(indianPage.includes('Indian-labelled dealer stock aliases are not proof'),'Indian page must distinguish historic motorcycles from modern dealer aliases');
for(const id of ['history','historical-catalogue','munro','global-stories','models','research'])assert(indianPage.includes('href="#'+id+'"')&&indianPage.includes('id="'+id+'"'),'Indian section navigation broken: '+id);
assert(directory.includes('data-name="indian motorcycle" href="/indian-motorcycles.html"'),'All-manufacturer directory must link to Indian history');
assert(brand.includes('location.replace("/indian-motorcycles.html")'),'Old Indian manufacturer query routes must redirect to the history page');
assert.equal(locs.filter(x=>x.includes('/markets/')).length,217,'Sitemap must retain all country pages');
console.log('PASS: model, manufacturer and country discoverability safeguards');

const globalPage=readFileSync(new URL('../anybike-global.html',import.meta.url),'utf8');
for(const slug of ['burt-munro-worlds-fastest-indian','indian-scout-chief-and-springfield-history','victory-polaris-indian-motorcycle-revival']){
 const url='https://www.anybike.co.uk/global/'+slug+'.html';
 assert(locs.includes(url),'Indian story missing from sitemap: '+slug);
 assert(globalPage.includes('/global/'+slug+'.html'),'Indian story missing from AnyBike Global: '+slug);
 assert(indianPage.includes('/global/'+slug+'.html'),'Indian story missing from manufacturer page: '+slug);
 const story=readFileSync(new URL('../global/'+slug+'.html',import.meta.url),'utf8');
 assert(story.includes('rel="canonical" href="'+url+'"'),'Indian story missing canonical: '+slug);
 assert(story.includes('/indian-motorcycles.html'),'Indian story must link back to manufacturer: '+slug);
 assert(story.includes('<header id="publicHeader"></header>'),'Indian story missing shared AnyBike header: '+slug);
 assert(story.includes('/indian-motorcycles.html#historical-catalogue'),'Indian story must link to original model research: '+slug);
 assert(story.includes('/indian-motorcycles.html#models'),'Indian story must link to modern model guides: '+slug);
}

const historicIndian=JSON.parse(readFileSync(new URL('../data/indian-heritage-research.json',import.meta.url),'utf8'));
assert.equal(historicIndian.editorial_status,'historical_research_not_stock','Historic Indian research must not be presented as approved stock');
assert.deepEqual(historicIndian.models.map(x=>x.name).sort(),['Chief','Four','Scout'],'Original Indian research families must remain distinct');
assert(historicIndian.models.every(x=>x.technical_specs_status==='awaiting_year_specific_primary_sources'),'Do not publish unverified historic factory specifications');
assert(indianPage.includes('/data/indian-heritage-research.json'),'Indian manufacturer must render source-controlled historical research');
assert(indianPage.includes('historical_research_not_stock'),'Historical Indian renderer must reject stock-like research status');

assert(historicIndian.models.every(x=>x.review_gate?.stock_identity==='not_approved'),'Historical Indian models must not become modern stock identities without review');
assert(historicIndian.models.every(x=>x.review_gate?.photography==='rights_approval_required'),'Historic photography requires rights approval');
assert.equal(historicIndian.publication_rules.technical_specifications,'blocked_until_model_year_and_primary_source_verified','Unverified historic specifications must remain blocked');
assert(indianPage.includes('historicContainer.replaceChildren()'),'Historic research should render once without duplicate placeholder cards');
assert(!indianPage.includes('<h3>Indian Scout · original era</h3>'),'Do not duplicate static and database-driven historical Scout cards');

assert(Array.isArray(historicIndian.timeline)&&historicIndian.timeline.length>=7,'Indian heritage timeline must include key eras');
assert(historicIndian.timeline.every(x=>/^\d{4}$/.test(String(x.year))&&x.source.startsWith('/global/')),'Indian timeline events require valid dates and source-linked Global articles');
assert(indianPage.includes('id="indianMilestones"')&&indianPage.includes('research.timeline'),'Indian history timeline must render from the structured research source');
assert(indianPage.includes('href="#heritage-milestones"'),'Indian history timeline must be reachable from page navigation');

const approvedIndian=approved.filter(x=>x.make==='Indian Motorcycle');
assert(approvedIndian.length>=10,'Modern Indian catalogue identities unexpectedly missing');
assert(approvedIndian.some(x=>x.model==='Scout')&&approvedIndian.some(x=>x.model==='Chief'),'Modern Scout and Chief must remain in approved catalogue');
assert(!historicIndian.models.some(x=>approvedIndian.some(y=>y.model===x.name&&x.identity===y.model)),'Historic Indian identity must not reuse modern stock identity');
assert(indianPage.includes('A modern Scout or Chief is not the same motorcycle'),'Indian page must explain modern and original model distinction');
assert(indianPage.includes('Catalogue category:'),'Modern Indian catalogue cards must show their approved classification');
const allowedIndianStories=new Set(['burt-munro-worlds-fastest-indian','indian-scout-chief-and-springfield-history','victory-polaris-indian-motorcycle-revival']);
for(const event of historicIndian.timeline){
 const slug=event.source.match(/^\/global\/([a-z0-9-]+)\.html$/)?.[1];
 assert(slug&&allowedIndianStories.has(slug),'Timeline source must point to an approved Indian story');
}

console.log('PASS: Indian historical identity, cross-link and timeline publication safeguards');

assert(!indianPage.includes('id="legends"'),'Indian manufacturer must not duplicate the structured historical model cards');
assert(!indianPage.includes('<article class="era"><strong>1901</strong>'),'Indian manufacturer must not duplicate the source-linked history timeline');
assert(indianPage.includes('<noscript>'),'Indian heritage and model research must have non-JavaScript fallback links');
assert(indianPage.includes('/motorcycle-brand.html?make=Indian%20Motorcycle'),'Indian manufacturer must preserve fallback modern model navigation');

const rollout=JSON.parse(readFileSync(new URL('../data/model-rollout-coverage-2026-11-12.json',import.meta.url),'utf8'));
assert.equal(rollout.approved_model_count,approved.length,'Rollout coverage report must match current approved model count');
const counts=new Map();
for(const x of approved)counts.set(x.make,(counts.get(x.make)||0)+1);
assert.equal(rollout.manufacturer_count,counts.size,'Rollout report manufacturer count must match approved identities');
assert.deepEqual(rollout.models_by_manufacturer.map(x=>[x.manufacturer,x.approved_models]).sort((a,b)=>a[0].localeCompare(b[0])),[...counts.entries()].sort((a,b)=>a[0].localeCompare(b[0])),'Rollout coverage per manufacturer must match approved catalogue');
