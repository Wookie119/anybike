#!/usr/bin/env node
// Reconcile every permanent model URL with the ONE approved dynamic V2 assets.
// Does not alter approved HTML layout, identity, canonical, research or content.
// DealerWebs readiness: refresh all permanent model URLs in one audited batch.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const routes=JSON.parse(read('data/universal-v2-model-routes.json')).models;
const master=read('motorcycle-v2-master.html');
const names=['approved-v2-preview-style.css','approved-v2-universal-preview.mjs','approved-v2-dynamic-navigation.mjs'];
const version=(html,name)=>html.split(name+'?v=')[1]?.split(/["'<>]/)[0];
const target=Object.fromEntries(names.map(name=>[name,version(master,name)]));
// ONE HTML shell: model-specific identity/SEO are in <head>, never in <main>.
const masterMain=master.match(/<main>[\s\S]*?<\/main>/)?.[0];
assert(masterMain,'Approved master has no complete main shell');

for(const [name,v] of Object.entries(target))assert(v,'Missing approved master asset '+name);
const changes=[];
const seenUrls=new Set();
for(const route of routes){
 assert(!seenUrls.has(route.url),'Duplicate model route '+route.url);
 seenUrls.add(route.url);
 const path=route.url.slice(1);
 let html=read(path);
 const original=html;
 const routeMain=html.match(/<main>[\s\S]*?<\/main>/)?.[0];
 assert(routeMain,'Missing universal main shell '+route.url);
 // The approved master is the only source of page structure. Preserve SEO
 // metadata, route identity and all model-specific database content.
 if(routeMain!==masterMain)html=html.replace(routeMain,masterMain);
 for(const name of names){
  const marker=name+'?v=';
  assert(html.includes(marker),'Missing '+name+' at '+route.url);
  const pieces=html.split(marker);
  html=pieces[0];
  for(const piece of pieces.slice(1)){
   const end=piece.search(/["'<>]/);
   assert(end>=0,'Unterminated asset version '+name+' at '+route.url);
   html+=marker+target[name]+piece.slice(end);
  }
 }
 const identity=JSON.parse(html.match(/<script id="anybikeV2RouteIdentity" type="application\/json">([^<]+)<\/script>/)?.[1]||'null');
 assert.equal(identity?.make,route.make,route.url);
 assert.equal(identity?.model,route.model,route.url);
 assert.equal(identity?.model_id,route.model_id,route.url);
 const canonical=html.match(/<link id="modelCanonical" rel="canonical" href="([^"]+)"/)?.[1];
 const expected='https://www.anybike.co.uk'+route.url;
 if(canonical!==expected){
  const target=canonical?.replace('https://www.anybike.co.uk','');
  assert(html.includes('location.replace(')&&routes.some(row=>row.url===target),
   'Invalid canonical alias '+route.url);
 }
 if(html!==original)changes.push({path,html});
}
// Validate the ENTIRE batch before writing a single model page.
assert.equal(seenUrls.size,routes.length);
for(const change of changes)fs.writeFileSync(change.path,change.html);
console.log('Updated',changes.length,'of',routes.length,'permanent model pages to shared master asset revisions',target);
