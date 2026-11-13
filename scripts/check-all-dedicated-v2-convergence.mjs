#!/usr/bin/env node
// Source-level regression for ONE approved V2 model design on every reviewed
// BMW and Harley-Davidson dedicated URL. This is not live deployment QA.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const approved=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const harley=JSON.parse(read('data/harley-v2-legacy-preservation.json')).models;
const r1250=JSON.parse(read('data/bmw-r1250gs-v2-preservation.json'));
const v2=read('model-template/approved-v2-universal-preview.mjs');
const master=read('motorcycle-v2-master.html');
const rendererAsset=master.match(/src="(\/model-template\/approved-v2-universal-preview\.mjs\?v=[^"]+)"/)?.[1];
assert(rendererAsset,'Approved master renderer version missing');
const headerAsset=master.match(/src="(\/public-header\.js\?v=[^"]+)"/)?.[1];
assert(headerAsset,'Approved master public-header version missing');
const sections=s=>[...s.matchAll(/<section\b([^>]*)>/g)].map(m=>m[1]);
const reference='bmw-r1300gs.html';
assert.equal(approved.length,45);
assert.equal(approved.filter(r=>r.make==='BMW').length,27);
assert.equal(approved.filter(r=>r.make==='Harley-Davidson').length,18);
assert.equal(harley.length,18);
let migrated=0;
for(const row of approved){
 const page=read(row.url.slice(1));
 assert(page.includes('https://www.anybike.co.uk'+row.url),'Canonical URL missing '+row.url);
 assert(page.includes('name="robots" content="index,follow"'),'Model must be indexable '+row.url);
 if(row.url==='/'+reference){
  assert(!page.includes('approved-v2-universal-preview.mjs'),'Protected R1300 reference must remain original');
  assert(page.includes('id="ukR1300ModelGallery"'),'Approved BMW reference gallery missing');
  continue;
 }
 assert(page.includes('/model-template/approved-v2-universal-preview.mjs'),'Unmigrated dedicated model '+row.url);
 assert(page.includes('src="'+rendererAsset+'"'),'V2 renderer browser cache version differs from master '+row.url);
 assert(page.includes('src="'+headerAsset+'"'),'Shared V2 header browser cache version differs from master '+row.url);
 assert.deepEqual(sections(page),sections(master),'Different V2 section structure '+row.url);
 assert(page.includes('id="heading">'+row.make+' '+row.model+'</h1>'),'Wrong motorcycle heading '+row.url);
 assert(page.includes('id="internationalModelStock"'),'Exact-model stock region missing '+row.url);
 assert(page.includes('id="internationalGuestRequestForm"'),'Guest enquiry region missing '+row.url);
 assert(page.includes('id="databaseHeroPhoto"'),'Photo rights region missing '+row.url);
 assert(page.includes('id="v2UkSellAction"'),'Seller action missing '+row.url);
 assert(page.includes('approved-v2-dynamic-navigation.mjs'),'Model navigation missing '+row.url);
 assert(!page.includes('approved-bmw-page-shell.mjs')&&!page.includes('public-harley-verified-research.mjs'),
  'Parallel legacy renderer still running '+row.url);
 if(row.make==='Harley-Davidson'){
  const archive=harley.filter(x=>x.url===row.url&&x.make===row.make&&x.model===row.model);
  assert.equal(archive.length,1,'Harley archived identity missing '+row.url);
  assert(archive[0].sections.length>0,'Harley historical copy lost '+row.url);
 }
 migrated++;
}
assert.equal(migrated,44,'All 44 non-reference dedicated models must share V2');
assert.deepEqual(r1250.model_year_gallery.years,[2019,2020,2021,2022,2023]);
assert.equal(r1250.model_year_gallery.model_year_cards.length,5);
assert(v2.includes('preserveDedicatedModelResearch'),'Preserved historical model sections must load');
assert(v2.includes('preservedExistingHero'),'Original licensed photo fallback must load');
assert(v2.includes('stockForCanonicalModel'),'Exact catalogue-ID stock filter missing');
assert(v2.includes('res.status===401||res.status===403'),'Stock-entitlement checks missing');
assert(v2.includes('international-guest-enquiry'),'Guest enquiries missing');
assert(v2.includes('public_anybike_verified_model_gallery_v1'),'Approved photo gallery endpoint missing');
console.log('PASS 44/45 dedicated URLs on actual V2 renderer; protected R1300 reference retained; archival research and stock gates present');
