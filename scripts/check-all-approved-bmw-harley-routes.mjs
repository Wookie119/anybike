// Approved dedicated route manifest: all 27 BMW + 18 exact-model Harley
// source pages. Read-only; does not imply live deployment or buyer entitlement.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const bmw=readFileSync(new URL('./check-bmw-approved-model-route-parity.mjs',import.meta.url),'utf8');
const harley=readFileSync(new URL('./check-harley-source-intake.mjs',import.meta.url),'utf8');
const bmwList=bmw.match(/const routes=Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1];
assert(bmwList,'BMW approved route manifest not found');
const bmwRoutes=[...bmwList.matchAll(/'(bmw-[a-z0-9-]+\.html)'/g)].map(m=>m[1]);
const harleyList=harley.match(/const exact=\[([\s\S]*?)\];/)?.[1];
assert(harleyList,'Harley exact model identity manifest not found');
const harleyRoutes=[...harleyList.matchAll(/\['([a-z0-9-]+)',\d+,'([^']+)'\]/g)]
 .map(m=>({file:'harley-davidson-'+m[1]+'.html',model:m[2]}));
assert.equal(bmwRoutes.length,27,'27 approved BMW routes required');
assert.equal(harleyRoutes.length,18,'18 exact Harley model routes required');
const allRoutes=[...bmwRoutes,...harleyRoutes.map(x=>x.file)];
assert.equal(new Set(allRoutes).size,45,'Duplicate dedicated motorcycle URL');
for(const route of allRoutes){
 const html=readFileSync(new URL('../'+route,import.meta.url),'utf8');
 assert(html.includes('https://www.anybike.co.uk/'+route),
  route+' has incorrect self canonical');
 assert(html.includes('/public-header.js'),
  route+' missing shared authorised stock loader');
 assert(html.includes('name="robots" content="index,follow"'),
  route+' missing existing public indexability');
 assert(/enquir/i.test(html),route+' customer enquiry removed');
 assert(!html.includes('data-anybike-universal-stage="true"'),
  route+' accidentally activated draft-only research stage');
}
for(const {file,model} of harleyRoutes){
 const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const heading=(html.match(/<h1[^>]*>([\\s\\S]*?)<\\/h1>/i)?.[1]||'')
  .replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&')
  .replace(/\\s+/g,' ').trim();
 assert.equal(heading,'Harley-Davidson '+model,
  file+' points at wrong Harley model identity');
}
for(const file of bmwRoutes){
 const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 assert(html.includes('id="body"')&&html.includes('id="generationPanel"'),
  file+' lost approved BMW research container');
 assert(html.includes('id="nextAction"'),
  file+' lost BMW seller/buyer next action');
}
const source=readFileSync(new URL('../public-header.js',import.meta.url),'utf8');
assert(source.includes('if(hero)hero.after(section)'),
 'Available Stock is not following approved hero');
assert(source.includes('const exactIds=new Set(candidates.map(x=>Number(x.catalog_model_id)))'),
 'Canonical model stock guard removed');
assert(!source.includes('exact.length ? exact : brandStock'),
 'Cross-model inventory fallback reinstated');
console.log('PASS: all 45 dedicated BMW and exact Harley model routes retain canonical, enquiry, research and stock protections');
