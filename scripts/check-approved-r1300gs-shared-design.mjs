import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const master=readFileSync('bmw-r1300gs.html','utf8');
const guide=readFileSync('motorcycle-model-guide.html','utf8');
const shared=readFileSync('model-template/approved-r1300gs-model-design.css','utf8');
const css=master.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert(css,'Approved R 1300 GS master CSS must exist');
assert.equal(shared.slice(shared.indexOf('*/')+2).trim(),css.trim(),
 'Shared model stylesheet must exactly match approved R 1300 GS master');
assert(guide.includes('/model-template/approved-r1300gs-model-design.css?v=20261112-master1'),
 'Every shared model page must load approved master design');
for(const token of ['--red:#ed1c24','background:#000','background:var(--panel)',
 '.generation-panel','.factory-colour-card','.grid']){
 assert(shared.includes(token),'Approved design token missing: '+token);
}
assert(guide.includes('internationalHeading'),'Existing international enquiry route must remain available');
console.log('PASS: generic model guide uses the exact approved R 1300 GS master design stylesheet');
