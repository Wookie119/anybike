// Every reviewed public manufacturer/model identity must remain navigable.
// Run: node scripts/check-complete-manufacturer-model-pills.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const catalogue=JSON.parse(readFileSync('data/motorcycle-catalogue-master.json','utf8'));
const script=readFileSync('motorcycle-complete-catalogue-navigation.js','utf8');
const header=readFileSync('public-header.js','utf8');
const brand=readFileSync('motorcycle-brand.html','utf8');
const guide=readFileSync('motorcycle-model-guide.html','utf8');
const dedicatedRoutes=JSON.parse(readFileSync('data/approved-dedicated-model-routes.json','utf8')).models;
assert.equal(dedicatedRoutes.filter(x=>x.make==='BMW').length,27,'BMW dedicated fallback route count');
assert.equal(dedicatedRoutes.filter(x=>x.make==='Harley-Davidson').length,18,'Harley dedicated fallback route count');
for(const route of dedicatedRoutes){assert(/^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(route.url),'Dedicated route must be a safe local guide');assert(readFileSync('.'+route.url,'utf8').includes('<main'),'Dedicated route must exist and contain a model page');}
assert(script.includes('/data/approved-dedicated-model-routes.json'),'Canonical navigation must use verified dedicated offline fallback');
assert(script.includes("normalize(m)===normalize('BMW')"),'BMW manufacturer navigation must normalize canonical names');
assert(script.includes("normalize(m)===normalize('Harley-Davidson')"),'Harley manufacturer navigation must normalize canonical names');
assert(script.includes('routes.push(...reviewed.filter(x=>!liveKeys.has(normalize(x.model))))'),'Partial Supabase route results must be supplemented by reviewed dedicated links');
const models=catalogue.models.filter(x=>x&&x.make?.trim()&&x.model?.trim());
const key=x=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
const manufacturers=new Map();
for(const row of models){
 const k=key(row.make),entry=manufacturers.get(k)||new Map(),m=key(row.model);
 // The shared model navigation deliberately deduplicates aliases that differ
 // only by spacing/punctuation (for example RS660 and RS 660).
 if(entry.has(m))continue;
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
 'public_anybike_manufacturer_names_v1',
 'rest/v1/rpc/public_anybike_manufacturer_model_routes_v1',
 "const heading=main.querySelector('h1')?.textContent?.trim()||'';",
 'const current=currentName;',
 'let mounting=false;',
 'if(!main||mounting||document.querySelector',
 "if(document.querySelector('main')){void mount();return;}",
 "observer.observe(document.documentElement,{childList:true,subtree:true});",
 'Public catalogue fallback unavailable; trying canonical Supabase directory',
 'const models=[...new Map([...publicModels.filter(',
 '...databaseModels.map(x=>x.model),...routes.map(x=>x.model),...permanentNames]',
 '.filter(Boolean).map(name=>[normalize(name),name])).values()]',
 "rows.filter(x=>normalize(x.make)===normalize(make)",
 'const byModel=new Map(permanentRoutes)', 'if(!byModel.has(identity))byModel.set(identity,route.url)',
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
assert(brand.includes('if(models.length)return await mergePublishedManufacturerModels(models);'),
 'Canonical Supabase model cards must be merged with reviewed published identities');
assert(brand.includes('for(const item of [...published,...liveModels])'),
 'Newly returned canonical models must take precedence over older published snapshot entries');
assert(brand.includes('merged.set(item.model.trim().toLowerCase(),item)'),
 'Canonical duplicate model identities must be resolved during merge');
assert(brand.includes('groups[category]=list.filter(name=>approved.has(match(name))&&match(matching.find(row=>match(row.model)===match(name))?.category)===match(category))'),'Manufacturer cards must not mix stale curated names into the canonical model directory');
assert(guide.includes('motorcycle-model-guide.html')||guide.includes('id="nextAction"'),'Shared model guide missing');
assert(!script.includes('international-public-stock'),'Pill navigation must never query private stock');
assert(!script.includes("if(!rows.length)return;"),'Static catalogue outage must not suppress database model pills');
assert(!script.includes('window.supabase?.createClient'),'Approved dedicated model route lookup must not depend on optional client library');
const start=script.indexOf(' const byModel=new Map(permanentRoutes);');
const end=script.indexOf(' if(!models.length)return;',start);
assert(start>=0&&end>start,'Model directory merge is missing');
const merge=new Script(script.slice(start,end)+'\n({models,byModel})');
const modelRows=[
 {model:'R 1300 GS',model_id:42},
 {model:'R 80 G/S',model_id:45}
];
const permanentRoutes=new Map([['r1300gs','/models/bmw/r-1300-gs.html']]);
for(const databaseModels of [[],[{model:'R 1300 GS MULTI'},modelRows[0]]]){
 const merged=merge.runInNewContext({
  permanentRoutes,
  publicModels:modelRows,
  databaseModels,
  permanentNames:['R 1300 GS'],
  routes:[{model:'R 1300 GS',url:'/bmw-r1300gs.html'},{model:'R 32',url:'/bmw-r32.html'}],
  normalize:key
 });
 assert(merged.models.includes('R 80 G/S'),'A partial database response must retain reviewed offline identities');
 assert.equal(merged.models.includes('R 1300 GS MULTI'),databaseModels.length>0,'Live names must join the directory');
 assert.equal(merged.models.filter(model=>model==='R 1300 GS').length,1,'A published identity must appear once');
 assert.equal(merged.byModel.get('r1300gs'),'/models/bmw/r-1300-gs.html','Prefer the permanent route over the legacy URL');
 assert.equal(merged.byModel.get('r32'),'/bmw-r32.html','Retain the reviewed legacy fallback when needed');
}
console.log('PASS: '+models.length+' approved public model identities across '+manufacturers.size+' manufacturers; all manufacturer and model pages use shared same-make pill navigation.');
