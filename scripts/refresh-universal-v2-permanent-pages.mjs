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
for(const [name,v] of Object.entries(target))assert(v,'Missing approved master asset '+name);
let changed=0;
for(const route of routes){
 const path=route.url.slice(1);
 let html=read(path);
 const original=html;
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
 if(html!==original){fs.writeFileSync(path,html);changed++;}
}
console.log('Updated',changed,'of',routes.length,'permanent model pages to shared master asset revisions',target);
