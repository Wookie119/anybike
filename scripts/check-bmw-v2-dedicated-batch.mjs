#!/usr/bin/env node
// Release gate for the first approved dedicated BMW V2 conversion batch.
// Compare the actual section structure with the protected shared master.
// Complex BMW pages remain deliberately untouched until their unique galleries
// and research have been migrated, not merely restyled.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const routes=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const master=read('motorcycle-v2-master.html');
const masterSections=[...master.matchAll(/<section\b([^>]*)>/g)].map(m=>m[1]);
const protectedRoutes=new Set(['/bmw-r1300gs.html']);
const bmw=routes.filter(x=>x.make==='BMW');
assert.equal(bmw.length,27);
let migrated=0;
for(const row of bmw){
 const html=read(row.url.slice(1));
 const realV2=html.includes('/model-template/approved-v2-universal-preview.mjs');
 if(protectedRoutes.has(row.url)){
  assert(!realV2,'Complex approved model requires its own content preservation: '+row.url);
  assert(html.includes('/public-header.js'),'Protected original header missing '+row.url);
  continue;
 }
 assert(realV2,'Published BMW route has not adopted real shared V2: '+row.url);
 const sections=[...html.matchAll(/<section\b([^>]*)>/g)].map(m=>m[1]);
 assert.deepEqual(sections,masterSections,'Section drift from R 1300 V2 master: '+row.url);
 assert(html.includes('id="internationalGuestRequestForm"'),'Guest enquiry missing '+row.url);
 assert(html.includes('id="internationalModelStock"'),'Exact-model stock region missing '+row.url);
 assert(html.includes('id="databaseHeroPhoto"'),'Licensed hero region missing '+row.url);
 assert(html.includes('approved-v2-dynamic-navigation.mjs'),'Shared navigation missing '+row.url);
 assert(html.includes('id="v2UkSellAction"'),'UK seller link missing '+row.url);
 assert(html.includes('name="robots" content="index,follow"'),'Model should be indexable '+row.url);
 assert(html.includes('https://www.anybike.co.uk'+row.url),'Exact canonical missing '+row.url);
 assert(html.includes('id="heading">BMW '+row.model+'</h1>'),'Wrong model heading '+row.url);
 assert(!html.includes('approved-bmw-page-shell.mjs'),'Old renderer must not run alongside V2 '+row.url);
 migrated++;
}
assert.equal(migrated,26,'BMW V2 initial batch should contain exactly 26 fully shared routes');
assert(read('bmw-r1300gs-v2-approved-20261102.html').includes('id="generationPanel"'));
console.log('PASS: 26 dedicated BMW pages share the exact V2 master; 5 protected originals retained');
