// node scripts/check-manufacturer-shared-sections.mjs
// Regression checks: manufacturer sections must never vanish because of empty data.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const stories=fs.readFileSync('global-manufacturer-stories.js','utf8');
const related=fs.readFileSync('motorcycle-related-manufacturers.js','utf8');
new vm.Script(stories,{filename:'global-manufacturer-stories.js'});
new vm.Script(related,{filename:'motorcycle-related-manufacturers.js'});
assert(!stories.includes('.catch(()=>{root.hidden=true})'),'Global feed failure must not hide section');
assert(stories.includes('fallback();'),'Global section must be populated before async loading');
assert(!related.includes('if(!relevant.length){root.hidden=true;return}'),'Unknown manufacturers must not lose related links');
for(const path of ['bmw-motorcycles.html','harley-davidson-motorcycles.html','motorcycle-brand.html']){
 const html=fs.readFileSync(path,'utf8');
 assert(html.includes('data-global-stories-list'),path+': global story section missing');
 assert(html.includes('id="relatedManufacturers"'),path+': related brands section missing');
 assert(html.includes('global-manufacturer-stories.js'),path+': Global script not included');
 assert(html.includes('motorcycle-related-manufacturers.js'),path+': related brands script not included');
}
assert.equal(fs.readFileSync('bmw-motorcycles.html','utf8'),fs.readFileSync('templates/bmw-manufacturer-master.html','utf8'),'Protected BMW page was changed');
console.log('PASS: Shared manufacturer sections fail open; BMW master remains unchanged.');
