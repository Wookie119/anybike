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
for(const r of routes){
 assert(/^\\/models\\/[a-z0-9-]+\\/[a-z0-9-]+\\.html$/.test(r.url),
  'Invalid permanent model URL: '+r.url);
 assert(read(r.url.slice(1)).includes('id="databaseMotorcycleTypes"'),
  'Permanent model route missing shared pill navigation: '+r.url);
}
assert(sitemap.includes('https://www.anybike.co.uk/models/yamaha/mt-09.html'),
 'The permanent Yamaha MT-09 model must be in the sitemap');
console.log('PASS: approved 2-column mobile / 4-column desktop pill layout and 965 V2 routes retained');
