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
assert(html.includes('name="robots" content="noindex,follow"'),
 'Unreleased shared master must not be indexable');
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
 renderer.includes("normalize(x?.make)===normalize(make)&&normalize(x?.model)===normalize(model)"),
 'Master must filter research and stock to the exact make/model');
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
console.log('PASS: one approved V2 master / catalog, photos, model isolation, noindex, stock rights and route safety');
