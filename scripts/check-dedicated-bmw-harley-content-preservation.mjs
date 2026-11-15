// Dedicated BMW and Harley page quality guard.
// Never replace researched model pages with an empty generic shell merely to
// satisfy a shared-template layout or asset-version regression.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const routes=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const master=read('motorcycle-v2-master.html');
const approved=read('bmw-r1300gs-v2-approved-20261102.html');
assert.equal(routes.length,45,'Expected all 45 approved dedicated model routes');
const keys=new Set();
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
for(const {make,model,url} of routes){
 assert(make&&model&&url,'Missing dedicated make/model identity');
 assert(!keys.has(url),'Duplicate dedicated URL: '+url);
 keys.add(url);
 const html=read(url.slice(1));
 assert(html.includes('id="heading">'+make+' '+model+'</h1>'),
  'Missing model-specific heading; do not replace with generic master: '+url);
 assert(html.includes('href="https://www.anybike.co.uk'+url+'"'),
  'Model-specific canonical missing: '+url);
 assert(html.includes('name="robots" content="index,follow"'),
  'Model page inadvertently deindexed: '+url);
 if(url==='/bmw-r1300gs.html'){
  assert(html.includes('id="ukR1300ModelGallery"'),
   'Protected BMW R1300 GS gallery removed');
  assert(html.includes('id="r1300gsModelHistory"'),
   'Protected BMW R1300 GS model-development research removed');
  continue;
 }
 for(const id of ['databaseHeroPhoto','internationalModelStock','internationalGuestRequestForm',
  'databaseMotorcycleTypes','modelSources','ukR1300ModelGallery']){
  assert(html.includes('id="'+id+'"'),'Dedicated model content slot lost ('+id+'): '+url);
 }
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||'';
 assert(title.includes(make)&&title.includes(model),
  'Model-specific SEO title lost: '+url);
 assert(html.includes('/model-template/approved-v2-universal-preview.mjs'),
  'Dedicated route lost shared verified research renderer: '+url);
 const approvedCss=master.match(/approved-v2-preview-style\.css\?v=[^"']+/)?.[0];
 assert(approvedCss&&html.includes(approvedCss),
  'Dedicated model must use the approved V2 riding-style stylesheet: '+url);
 // The dedicated pages can contain valuable, individually reviewed hero
 // copy and research that must not be blanked by a mass HTML replacement.
 const summary=html.match(/<div class="intro" id="summary">([\s\S]*?)<\/div>/)?.[1]||'';
 const years=html.match(/<div id="years">([\s\S]*?)<\/div>/)?.[1]||'';
 assert(summary.trim()||years.trim(),
  'Dedicated model hero research has been erased: '+url);
}
assert(master.includes('id="databaseMotorcycleTypes"'));
assert(approved.includes('id="ukR1300ModelGallery"'));
console.log('PASS: all 45 dedicated BMW/Harley URLs retain model identity, research slots, SEO and original hero content');
