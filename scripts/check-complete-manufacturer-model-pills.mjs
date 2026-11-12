// Every reviewed public manufacturer/model identity must remain navigable.
// Run: node scripts/check-complete-manufacturer-model-pills.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const catalogue=JSON.parse(readFileSync('data/motorcycle-catalogue-master.json','utf8'));
const script=readFileSync('motorcycle-complete-catalogue-navigation.js','utf8');
const header=readFileSync('public-header.js','utf8');
const brand=readFileSync('motorcycle-brand.html','utf8');
const guide=readFileSync('motorcycle-model-guide.html','utf8');
const models=catalogue.models.filter(x=>x&&x.make?.trim()&&x.model?.trim());
const key=x=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
const manufacturers=new Map();
for(const row of models){
 const k=key(row.make),entry=manufacturers.get(k)||new Map(),m=key(row.model);
 assert(!entry.has(m),'Duplicate model pill identity: '+row.make+' '+row.model);
 entry.set(m,row.model);manufacturers.set(k,entry);
 const url='/motorcycle-model-guide.html?make='+encodeURIComponent(row.make)+'&model='+encodeURIComponent(row.model);
 assert(url.includes('make=')&&url.includes('&model='),'Unroutable catalogue model');
}
assert(manufacturers.size>=45,'Manufacturer catalogue unexpectedly shrunk');
assert(models.length>=850,'Public model catalogue unexpectedly shrunk');
for(const [make,min] of [['bmw',25],['harleydavidson',18],['honda',60],['yamaha',60],['suzuki',40],['kawasaki',40]]){
 assert((manufacturers.get(make)?.size||0)>=min,make+' model directory incomplete');
}
for(const phrase of [
 'if(isBrand){',
 'public_anybike_manufacturer_catalogue_names_v1',
 'Public catalogue fallback unavailable; trying canonical Supabase directory',
 'databaseModels.length?databaseModels:publicModels','const models=[...new Map([...(databaseModels.length?databaseModels:publicModels).map(x=>x.model),...routes.map(x=>x.model)]',
 "rows.filter(x=>normalize(x.make)===normalize(make)",
 'const byModel=new Map(routes.map(x=>[normalize(x.model),x.url]))',
 "name=>byModel.get(normalize(name))||genericUrl(make,name)",
 "const entries=models;",
 "entries,currentName,m=>byModel.get(normalize(m))||genericUrl(make,m)",
 "existing.replaceChildren",
 "const modelGroups=main.querySelector('#modelGroups,#models')",
 "nav.dataset.completeCatalogueNavigation='1'"
])assert(script.includes(phrase),'Missing manufacturer/model pill guarantee: '+phrase);
assert(header.includes('/motorcycle-complete-catalogue-navigation.js?v='),'Shared loader missing');
assert(brand.includes('id="modelGroups"'),'Manufacturer model collection missing');
assert(brand.includes('const groups=key&&guides[key]?Object.fromEntries('),'Manufacturers without legacy curated models must render their database models');
assert(brand.includes('public_anybike_manufacturer_catalogue_names_v1'),'Manufacturer cards must read the canonical public model names');
assert(brand.includes('rest/v1/rpc/public_anybike_manufacturer_catalogue_names_v1'),'Manufacturer model cards must work without the optional Supabase JS client');
assert(brand.includes('if(models.length)return {models};'),'Canonical model cards must take precedence over stale static catalogue');
assert(guide.includes('motorcycle-model-guide.html')||guide.includes('id="nextAction"'),'Shared model guide missing');
assert(!script.includes('international-public-stock'),'Pill navigation must never query private stock');
assert(!script.includes("if(!rows.length)return;"),'Static catalogue outage must not suppress database model pills');
console.log('PASS: '+models.length+' approved public model identities across '+manufacturers.size+' manufacturers; all manufacturer and model pages use shared same-make pill navigation.');
