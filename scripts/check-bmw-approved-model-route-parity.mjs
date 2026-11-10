/**
 * AnyBike: approved BMW model-route source parity gate.
 * Read-only; checks all 27 dedicated BMW routes, never writes HTML.
 * Source parity is not a deployed-page screenshot or a buyer stock permission test.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const routes=Object.freeze([
 'bmw-c400gt.html','bmw-c400x.html','bmw-ce02.html','bmw-ce04.html',
 'bmw-f850gs.html','bmw-f900gs.html','bmw-f900r.html','bmw-f900xr.html',
 'bmw-g650gs.html','bmw-hp4.html','bmw-k1600gt.html','bmw-k1600gtl.html',
 'bmw-m1000rr.html','bmw-r1200gs.html','bmw-r1200rt.html',
 'bmw-r1250gs.html','bmw-r1250r.html','bmw-r1250rt.html',
 'bmw-r1300gs.html','bmw-r18.html','bmw-r32.html','bmw-r80gs.html',
 'bmw-r90s.html','bmw-rninet.html','bmw-s1000r.html',
 'bmw-s1000rr.html','bmw-s1000xr.html'
]);
assert.equal(routes.length,27,'Expected all 27 approved BMW guides');
assert.equal(new Set(routes).size,routes.length,'Duplicate guide route');
for(const path of routes){
 const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const required=[
  ['/public-header.js','shared stock renderer'],
  ['id="body"','research container'],
  ['id="generationPanel"','generation panel'],
  ['id="nextAction"','next action'],
  ['https://www.anybike.co.uk/'+path,'canonical URL'],
  ['name="robots" content="index,follow"','indexability metadata']
 ];
 for(const [needle,what] of required)
  assert(html.includes(needle),path+' missing '+what);
 assert.match(html,/enquir/i,path+' missing enquiry functionality');
 assert(!html.includes('data-anybike-universal-stage="true"'),
  path+' unexpectedly activated unapproved staged page');
 if(path==='bmw-r1300gs.html'){
  assert(!html.includes('approved-bmw-page-shell.mjs'),
   'R 1300 GS reference layout was unexpectedly replaced');
  assert(html.includes('id="ukR1300ModelGallery"'),
   'R 1300 GS approved gallery missing');
  assert(html.includes('id="internationalModelStock"'),
   'R 1300 GS stock panel missing');
 }else assert(html.includes('approved-bmw-page-shell.mjs'),
  path+' missing shared approved shell');
 if(path==='bmw-r1250gs.html'){
  assert(html.includes('id="ukR1250ModelGallery"'),
   'R 1250 GS approved gallery missing');
  assert(html.includes('id="r1250LiveStock"'),
   'R 1250 GS stock panel missing');
 }
}
const shared=readFileSync(new URL('../public-header.js',import.meta.url),'utf8');
assert(shared.includes('if(hero)hero.after(section)'),
 'Model stock must follow the hero');
assert(shared.includes('const exactIds=new Set(candidates.map(x=>Number(x.catalog_model_id)))'),
 'Exact catalogue-ID safety guard missing');
assert(!shared.includes('exact.length ? exact : brandStock'),
 'Wrong-model stock fallback returned');
console.log('PASS: all 27 BMW source routes retain approved layout, research, canonical, stock and enquiry anchors');
