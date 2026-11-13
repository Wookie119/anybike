// Static release gate for ONE shared approved V2 master, all makes/models.
// This does not certify live deployment or public stock entitlements.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('motorcycle-v2-master.html');
const renderer=read('model-template/approved-v2-universal-preview.mjs');
const nav=read('model-template/approved-v2-dynamic-navigation.mjs');
const facts=read('model-template/public-verified-model-facts.mjs');
const reference=read('bmw-r1300gs-v2-approved-20261102.html');
const required=['heading','category','summary','databaseHeroPhoto','generationPanel',
 'r1300V2VerifiedExtras','databaseModelTimeline','body','r1300DeepDive',
 'databaseRelatedModels','databaseMotorcycleTypes','r1300CountryMarkets',
 'internationalModelStock','internationalModelCards','internationalGuestRequest',
 'internationalGuestRequestForm','internationalGuestRequestStatus',
 'v2FormSubmit','nextAction','modelSources','modelCanonical','modelStructuredData'];
for(const id of required){
 assert(html.includes('id="'+id+'"'),'Missing approved master element '+id);
}
for(const path of [
 'model-template/approved-v2-universal-preview.mjs',
 'model-template/approved-v2-dynamic-navigation.mjs',
 'model-template/public-verified-model-facts.mjs'
])execFileSync(process.execPath,['--check',new URL('../'+path,import.meta.url).pathname]);
assert(html.includes('name="robots" content="index,follow"'),
 'Valid-model universal master must be eligible for indexing');
assert(renderer.includes('public_anybike_manufacturer_model_routes_v1')&&
 renderer.includes('const masterUrl=new URL(')&&renderer.includes('if(exact.length===1)canonical='),
 'A model's canonical must prefer its existing approved route and otherwise use the universal URL');
assert(renderer.includes("'@type':'Motorcycle'")&&!renderer.includes("'@type':'Product'"),
 'Model schema must describe research without inventing a product offer');
assert(renderer.includes("meta[property=\"og:image\"]")&&
 renderer.includes("if(fig&&safePhoto(approvedHero))"),
 'Social imagery must use the exact model rights-approved photograph');
const robots=read('robots.txt'),sitemap=read('sitemap.xml');
assert(robots.includes('Allow: /')&&
 robots.includes('Sitemap: https://www.anybike.co.uk/sitemap.xml'),
 'Google must be allowed to crawl indexed model guides');
assert(sitemap.includes('https://www.anybike.co.uk/motorcycle-model-guide.html?make=')||
 sitemap.includes('https://www.anybike.co.uk/motorcycle-model-guide.html?make='),
 'Keep the existing model guide URLs discoverable during phased migration');
assert(!html.includes('Suzuki RM250')&&!html.includes('BMW R 1300 GS'),
 'Master HTML must never contain model-specific example copy');
assert(html.includes('approved-v2-preview-style.css'),
 'Master must use same approved V2 CSS source');
assert(html.includes('approved-v2-dynamic-navigation.mjs'),
 'Master must load common navigation');
assert(renderer.includes('public_anybike_manufacturer_catalogue_names_v1'),
 'Master must read the public live model catalogue');
assert(renderer.includes('public_anybike_model_hero_v1')&&
 renderer.includes('public_anybike_verified_model_gallery_v1'),
 'Master must use rights-approved public photography');
assert(renderer.includes('installVerifiedModelFacts')&&
 renderer.includes('stockForCanonicalModel')&&renderer.includes('catalog_model_id:canonicalId'),
 'Master must isolate researched model identity and verified stock by canonical model ID');
const stockContract=read('model-template/canonical-public-stock-identity.mjs');
assert(stockContract.includes("item.catalogue_identity_status !== 'verified'")&&
 stockContract.includes('item.publication_eligible !== true'),
 'Stock identity verification and listing publication must remain mandatory');
assert(renderer.includes('selected.model_id||selected.catalogue_model_id')&&
 renderer.includes('loadUniversalPublishedPage')&&renderer.includes('renderUniversalPage'),
 'Master must connect canonical model ID to the existing published 20-slot renderer');
assert(renderer.includes('Cross-model universal publication blocked')&&
 renderer.includes("publishedCount=approved.length"),
 'Master must reject wrong-model published research and hide unpublished empty slots');
assert(renderer.includes('res.status===401||res.status===403')&&
 renderer.includes("feedState='restricted'"),
 'Master must respect server-enforced stock access restrictions');
assert(renderer.includes('meta[property="og:title"]')&&
 renderer.includes('modelStructuredData'),
 'Master metadata must be model-specific');
assert(!renderer.includes('eq("model_id",77)')&&
 !renderer.includes('bmw-r1300gs-v2-approved-20261102.html'),
 'Master must not depend on an individual BMW model identity or page');
assert(nav.includes('public_anybike_manufacturer_catalogue_names_v1')&&
 nav.includes('categories.get(normalize(item.label))'),
 'Related models must come from shared public model/category data');
assert(nav.includes("location.pathname==='/motorcycle-v2-master.html'"),
 'Model navigation within the universal master must remain in that master');
assert(reference.includes('id="generationPanel"')&&
 reference.includes('id="internationalModelStock"'),
 'Original approved V2 reference must remain intact');
assert(facts.includes('exactVerifiedModelFacts'),
 'Shared source-verified research must retain identity-filtered display');
console.log('PASS: one approved V2 master / catalog, photos, model isolation, indexable canonical, stock rights and route safety');
