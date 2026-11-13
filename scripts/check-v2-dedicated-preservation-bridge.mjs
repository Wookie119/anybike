#!/usr/bin/env node
// Exercise the pure archival adapter used by the ONE V2 renderer before
// replacing old page scripts. This does not confer publication approval.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preserveDedicatedModelResearch,preservedExistingHero}
 from '../model-template/approved-v2-dedicated-preservation.mjs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const harley=read('data/harley-v2-legacy-preservation.json');
const bmw=read('data/bmw-r1250gs-v2-preservation.json');
assert.equal(harley.models.length,18);
let retained=0,photos=0;
for(const archived of harley.models){
 const row={...archived,publication_status:harley.publication_status};
 const context={make:row.make,model:row.model,url:row.url};
 const baseline={...context,summary:'Approved V2 summary'};
 const result=preserveDedicatedModelResearch(baseline,row,context);
 assert.equal(result.summary,'Approved V2 summary');
 assert.equal(result.deep_dive.length,row.sections.length,'Lost previously published history: '+row.url);
 for(const section of result.deep_dive){
  assert(section.subtitle.includes('Previously published'),'Archived editorial must never claim factory verification');
  assert(section.paragraphs.some(x=>x.text),'Archived section lost text');
 }
 retained+=result.deep_dive.length;
 assert.equal(preserveDedicatedModelResearch(baseline,row,{...context,model:'Wrong Model'}),baseline,
  'Cross-model archived research must fail closed');
 const photo=preservedExistingHero(row,context);
 if(row.photographs.length){
  assert(photo,'Original credited Wikimedia photo lost for '+row.url);
  assert(photo.licence_url.startsWith('https://creativecommons.org/licenses/'));
  assert(photo.source_page_url.startsWith('https://commons.wikimedia.org/wiki/File:'));
  photos++;
 }else assert.equal(photo,null,'No archive licence should generate no photo');
 assert.equal(preservedExistingHero(row,{...context,url:'/wrong.html'}),null);
}
assert.equal(retained,212);
assert.equal(photos,13);
const r1250=preserveDedicatedModelResearch({make:'BMW',model:'R 1250 GS',summary:'Reviewed V2 content'},bmw,
 {make:'BMW',model:'R 1250 GS',url:'/bmw-r1250gs.html'});
assert.equal(r1250.summary,'Reviewed V2 content');
assert.equal(r1250.model_year_cards.length,5);
assert.deepEqual(r1250.model_year_cards.map(x=>x.year),[2019,2020,2021,2022,2023]);
// A real existing generic guide already contains 21 researched R1250 sections.
// Supplemental dedicated-page history must merge, not disappear or duplicate
// the five-year gallery which is separately displayed as model-year cards.
const publicGuides=Object.values(read('data/motorcycle-model-guides.json').models);
const originalGuide=publicGuides.find(x=>x.make==='BMW'&&x.model==='R 1250 GS');
assert(originalGuide&&originalGuide.sections.length===21);
const combined=preserveDedicatedModelResearch(originalGuide,bmw,
 {make:'BMW',model:'R 1250 GS',url:'/bmw-r1250gs.html'});
assert.equal(combined.sections.length,28,'Original 21 + seven preserved non-gallery historical sections');
assert.equal(combined.model_year_cards.length,5);
assert(combined.sections.some(x=>x[0]==='The R 1250 GS story'),'Dedicated GS story was dropped');
assert(!combined.sections.some(x=>x[0].startsWith('BMW R 1250 GS — model years:')),
 'Historical model year gallery must not duplicate five chronological V2 cards');

const photo=preservedExistingHero(bmw,{make:'BMW',model:'R 1250 GS',url:'/bmw-r1250gs.html'});
assert(photo&&photo.attribution.includes('Cjp24'));
assert.equal(preservedExistingHero(bmw,{make:'BMW',model:'R 1300 GS',url:'/bmw-r1250gs.html'}),null);
const renderer=readFileSync(new URL('../model-template/approved-v2-universal-preview.mjs',import.meta.url),'utf8');
assert(renderer.includes("if(!devCards.length&&!yearCards.length)development.hidden=true;"),
 'Published model-year cards must stay visible without separate development sections');
assert(renderer.includes('publication_status:archive.publication_status'),
 'Harley model snapshots must inherit the archive publication status');
console.log('PASS: 18 Harley stories (212 sections), 13 credited photos and R1250 five-year guide stay exact-model');
