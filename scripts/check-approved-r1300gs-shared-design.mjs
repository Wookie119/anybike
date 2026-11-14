import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const master=readFileSync('bmw-r1300gs.html','utf8');
const guide=readFileSync('motorcycle-model-guide.html','utf8');
const shared=readFileSync('model-template/approved-r1300gs-model-design.css','utf8');
const css=master.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert(css,'Approved R 1300 GS master CSS must exist');
// Preserve the approved reference CSS byte-for-byte except the already
// established AnyBike palette correction: remove burgundy/salmon accents.
const approvedPalette=css.trim()
 .replaceAll('#3b2023','#292929')
 .replaceAll('#82383c','#484848')
 .replaceAll('#352124','#292929')
 .replaceAll('#813438','#484848')
 .replaceAll('#ff5b62','#ed1c24');
const sharedBody=shared.slice(shared.indexOf('*/')+2).trim();
assert(sharedBody.startsWith(approvedPalette),
 'Shared stylesheet must retain the complete approved design and palette corrections');
assert(!/#(?:3b2023|82383c|352124|813438|ff5b62)/i.test(sharedBody),
 'Shared design must not reintroduce burgundy or salmon accents');
assert(sharedBody.slice(approvedPalette.length).includes('Universal approved R 1300 GS frame'),
 'Any additional universal CSS must follow, never replace, the approved reference');
assert(guide.includes('/model-template/approved-r1300gs-model-design.css?v=20261112-master1'),
 'Every shared model page must load approved master design');
for(const token of ['--red:#ed1c24','background:#000','background:var(--panel)',
 '.generation-panel','.factory-colour-card','.grid']){
 assert(shared.includes(token),'Approved design token missing: '+token);
}
assert(guide.includes('internationalHeading'),'Existing international enquiry route must remain available');
const dedicatedRoutes=JSON.parse(readFileSync('data/approved-dedicated-model-routes.json','utf8')).models;
assert(dedicatedRoutes.length>=45,'All approved dedicated routes must remain in the catalogue');
for(const {url} of dedicatedRoutes){
 const path=url.startsWith('/')?url.slice(1):url;
 if(path==='bmw-r1300gs.html')continue;
 const html=readFileSync(path,'utf8');
 assert(html.includes('/model-template/approved-r1300gs-model-design.css?v=20261112-master1'),
  'Dedicated model page must load approved R 1300 GS master design: '+path);
 assert(html.includes('<main'),'Dedicated model page content must remain: '+path);
}
console.log('PASS: generic model guide uses the exact approved R 1300 GS master design stylesheet');
