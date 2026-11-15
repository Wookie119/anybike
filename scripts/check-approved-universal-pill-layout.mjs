// Protect the user-approved motorcycle-type pill layout across the V2 rollout.
// Read-only contract: never changes the BMW R 1300 GS master or shared CSS.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const css=read('model-template/approved-v2-preview-style.css');
const master=read('motorcycle-v2-master.html');
const guide=read('motorcycle-model-guide.html');
const routes=JSON.parse(read('data/universal-v2-model-routes.json')).models;
const sitemap=read('sitemap-motorcycle-models.xml');
const exact='main > section.bmw-explore[aria-label="Browse motorcycle types"] > nav#databaseMotorcycleTypes';
assert(css.includes('Correct the root cause of the mobile riding-style layout'),
 'The approved full-width pill-layout override was removed');
assert(css.includes('main > section.bmw-explore[aria-label="Browse motorcycle types"]:has(> #databaseMotorcycleTypes){'),
 'The parent card must not constrain the pill grid to a narrow column');
assert(css.includes('display:block!important;')&&css.includes('grid-template-columns:none!important;'),
 'The parent must release its legacy grid columns');
assert(css.includes(exact),'The shared stylesheet must target the approved pill navigation');
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))!important;'),
 'Desktop must show four equal-width pill columns');
assert(css.includes('@media(max-width:900px)')&&
 css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important;'),
 'Mobile must show two equal-width pill columns');
assert(css.includes('width:100%!important;')&&css.includes('max-width:none!important;'),
 'The pill grid must fill the available card width');
for(const [name,html] of [['master',master],['guide',guide]]){
 assert(html.includes('id="databaseMotorcycleTypes"'),name+' missing pill navigation');
 assert(html.includes('/model-template/approved-v2-preview-style.css?v='),
  name+' must use the shared approved stylesheet');
}
assert.equal(routes.length,965,'Unexpected universal model count');
assert.equal(new Set(routes.map(r=>r.url)).size,965,'Duplicate permanent model URLs');
const assetPattern=/(?:approved-v2-preview-style\\.css|approved-v2-universal-preview\\.mjs|approved-v2-dynamic-navigation\\.mjs)\\?v=[^"']+/g;
const masterAssets=master.match(assetPattern)||[];
assert.equal(masterAssets.length,3,'Master must load all three approved shared V2 assets');
const seenTitles=new Set();
for(const r of routes){
 assert(/^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(r.url),
  'Invalid permanent model URL: '+r.url);
 const html=read(r.url.slice(1));
 assert(html.includes('id="databaseMotorcycleTypes"'),
  'Permanent model route missing shared pill navigation: '+r.url);
 assert.deepEqual(html.match(assetPattern)||[],masterAssets,
  'Model route has stale shared V2 CSS or JavaScript versions: '+r.url);
 assert(html.includes('name="robots" content="index,follow"'),
  'Published model route must remain index,follow: '+r.url);
 const identity=html.match(/<script id="anybikeV2RouteIdentity" type="application\\/json">([^<]+)<\\/script>/)?.[1];
 assert(identity,'Missing exact-model identity: '+r.url);
 const model=JSON.parse(identity);
 assert.equal(model.make,r.make,'Wrong manufacturer identity: '+r.url);
 assert.equal(model.model,r.model,'Wrong model identity: '+r.url);
 assert.equal(model.model_id,r.model_id,'Wrong catalogue model ID: '+r.url);
 assert(html.includes('href="https://www.anybike.co.uk'+r.url+'"'),
  'Permanent route must have a model-specific static canonical: '+r.url);
 const title=html.match(/<title>([^<]+)<\\/title>/)?.[1];
 assert(title&&!seenTitles.has(title),'Missing or duplicate SEO title: '+r.url);
 seenTitles.add(title);
}
assert(sitemap.includes('https://www.anybike.co.uk/models/yamaha/mt-09.html'),
 'The permanent Yamaha MT-09 model must be in the sitemap');
console.log('PASS: approved 2-column mobile / 4-column desktop pill layout and 965 V2 routes retained');
