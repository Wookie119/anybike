#!/usr/bin/env node
// Safety gate for BMW R 1250 GS before any shared V2 page replacement.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const d=JSON.parse(read('data/bmw-r1250gs-v2-preservation.json'));
const html=read('bmw-r1250gs.html');
assert.equal(d.publication_status,'migration_preservation_only');
assert.equal(d.make,'BMW');
assert.equal(d.model,'R 1250 GS');
assert.equal(d.url,'/bmw-r1250gs.html');
assert(/^[a-f0-9]{40}$/.test(d.source_blob_sha));
assert(d.sections.length>=8);
for(const s of d.sections)assert(s.heading&&s.text,'R1250 research section not captured');
assert.deepEqual(d.model_year_gallery.years,[2019,2020,2021,2022,2023]);
for(const year of d.model_year_gallery.years)
 assert(d.model_year_gallery.source_script_text.includes("year:"+year),'Year gallery note lost: '+year);
const hero=d.approved_existing_hero;
assert(hero.image_url.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/'));
assert(hero.reference_links.some(x=>x.startsWith('https://commons.wikimedia.org/wiki/File:')));
assert.equal(hero.licence_url,'https://creativecommons.org/licenses/by-sa/4.0/');
assert(hero.attribution.includes('Cjp24'));
if(!html.includes('/model-template/approved-v2-universal-preview.mjs')){
 assert(html.includes('id="ukR1250ModelGallery"'),'Original R1250 gallery must stay intact until V2 display parity');
 assert(html.includes('class="licensed-photo"'),'Original licensed hero must remain available');
}
console.log('PASS BMW R 1250 GS research and photo preservation gate; replacement not yet authorised');
