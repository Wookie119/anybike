#!/usr/bin/env node
// Indexable no-JavaScript content and functional make/model enquiry routes for
// all approved dedicated pages using the single universal V2 renderer.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const routes=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
let verified=0;
for(const row of routes){
 if(row.url==='/bmw-r1300gs.html')continue; // protected approved reference
 const html=read(row.url.slice(1));
 const query='make='+encodeURIComponent(row.make)+'&amp;model='+encodeURIComponent(row.model);
 const summary=html.match(/<div class="intro" id="summary">([\s\S]*?)<\/div>/)?.[1]||'';
 const years=html.match(/<div id="years">([\s\S]*?)<\/div>/)?.[1]||'';
 assert(summary.replace(/<[^>]+>/g,' ').trim().length>=65,'Static intro empty '+row.url);
 assert(years.trim().length>=25,'Model year fallback missing '+row.url);
 for(const [id,base] of [
  ['source','/bulk-buying-request.html'],
  ['sourceBottom','/bulk-buying-request.html'],
  ['v2UkSellAction','/sell-your-motorcycle.html']
 ]){
  const anchor=html.match(new RegExp('<a\\b[^>]*\\bid="'+id+'"[^>]*>','i'))?.[0]||'';
  assert(anchor.includes(base+'?'+query),'Wrong or missing exact-model fallback '+id+' '+row.url);
 }
 assert(html.includes('name="robots" content="index,follow"'),'Indexable source route missing '+row.url);
 assert(html.includes('approved-v2-universal-preview.mjs'),'Missing V2 renderer '+row.url);
 verified++;
}
assert.equal(verified,44);
console.log('PASS: 44 dedicated V2 pages have static original model copy and exact make/model enquiry links without JavaScript');
