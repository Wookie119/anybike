// Run from the repository root: node scripts/check-manufacturer-template.mjs
// This protects the carefully reviewed BMW reference and checks each dedicated derivative.
import { readFileSync, existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const read = name => readFileSync(name,'utf8');
const BMW = 'bmw-motorcycles.html';
const MASTER = 'templates/bmw-manufacturer-master.html';
assert(existsSync(MASTER),'Protected BMW master is missing');
assert.equal(read(BMW),read(MASTER),'BMW page differs from the approved master. DO NOT overwrite BMW. Review changes deliberately and update the approved master only after user approval.');
const sections = [
 'class="hero"',
 'class="cards"',
 'id="models"',
 'id="modelFamilies"',
 'history and manufacturing',
 'stories from AnyBike Global',
 'id="relatedManufacturers"',
 'by motorcycle type',
 'motorcycle in the UK',
 'Compare other motorcycles',
 'your dealership needs',
 'model photographs'
];
const pages = [
 ['bmw-motorcycles.html','BMW'],
 ['harley-davidson-motorcycles.html','Harley-Davidson']
];
for (const [file,make] of pages) {
 assert(existsSync(file),`Missing manufacturer page: ${file}`);
 const html=read(file);
 for (const section of sections) {
  assert(html.includes(section),`${file}: missing BMW-template section '${section}'`);
 }
 assert(html.includes('/bulk-buying-request.html?make='+make),`${file}: missing make-specific sourcing route`);
 assert(html.includes('/uk-motorcycle-selling.html?make='+make),`${file}: missing make-specific UK selling route`);
 assert(!html.includes('/available-stock.html'),`${file}: public Available Stock must stay hidden`);
}
console.log('BMW original matches protected master; checked manufacturer layout and core journeys.');
