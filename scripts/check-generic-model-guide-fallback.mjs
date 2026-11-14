/**
 * Universal V2 generic route regression: the previous inline-script guide
 * has been replaced with the approved single V2 module renderer.
 * Fail if a migration loses URL identity, public catalogue fallback, sourcing,
 * guest enquiry, source-verified facts or exact-model stock protection.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('motorcycle-model-guide.html');
const master=read('motorcycle-v2-master.html');
const renderer=read('model-template/approved-v2-universal-preview.mjs');
const catalogue=JSON.parse(read('data/motorcycle-catalogue-master.json'));
const guides=JSON.parse(read('data/motorcycle-model-guides.json'));
const sections=s=>[...s.matchAll(/<section\b([^>]*)>/g)].map(m=>m[1]);
assert.deepEqual(sections(html),sections(master),'Generic model pages must have identical approved V2 structure');
assert.match(html,/approved-v2-universal-preview\.mjs/);
assert.match(html,/approved-v2-dynamic-navigation\.mjs/);
assert.match(html,/name="robots" content="index,follow"/);
assert.match(renderer,/public_anybike_manufacturer_catalogue_names_v1/);
assert.match(renderer,/publicCatalogueRpc\(wantMake\)/);
assert.match(renderer,/if\(!liveCatalogueLoaded\)/);
assert.match(renderer,/fetch\('\/data\/motorcycle-catalogue-master.json'/);
assert.match(renderer,/found\.length!==1/,'Ambiguous catalogue names must fail closed');
assert.match(renderer,/fetch\('\/data\/motorcycle-model-guides.json'/);
assert.match(renderer,/if\(exact.length===1\)\{/);
assert.match(renderer,/if\(!guide\)guide=exact\[0\]/);
assert.match(renderer,/supplementPublishedV2Guide\(guide,exact\[0\],\{make,model\}\)/,
 'An existing approved guide must be supplemented with matching published facts, not overwritten');
assert.match(renderer,/const canonicalPath=/);
assert.match(renderer,/\/motorcycle-model-guide\.html/);
assert.match(renderer,/sourceBottom/);
assert.match(renderer,/international-guest-enquiry/);
assert.match(renderer,/installVerifiedModelFacts/);
assert.match(renderer,/stockForCanonicalModel/);
assert.match(renderer,/res\.status===401\|\|res\.status===403/);
for(const [make,model] of [
 ['Suzuki','RM250'],['Suzuki','GSX1300R HAYABUSA'],
 ['Honda','Dream D-Type'],['Honda','Super Cub C100'],
 ['Yamaha','YZM400F (0WH2)'],['Triumph','Speed Twin 900']
]){
 assert(catalogue.models.some(x=>x.make===make&&x.model===model),
  'Fallback catalogue must retain '+make+' '+model);
}
assert(guides.models&&typeof guides.models==='object');
console.log('PASS: shared V2 generic route preserves six catalogue identities, published legacy guides, approved stock and sourcing contracts');
