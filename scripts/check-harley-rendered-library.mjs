// Run from repository root: node scripts/check-harley-rendered-library.mjs
// Regression guard for disappearing manufacturer model cards.
// Pure local simulated DOM: does not touch BMW, authentication, stock, or Supabase.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync('harley-davidson-motorcycles.html','utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
 .filter(([,attrs,body])=>body.trim()&&!/application\/ld\+json/i.test(attrs))
 .map(([,attrs,body])=>body);
const sections=new Map();
const modelFamilies={
 innerHTML:'',
 children:[],
 appendChild(el){this.children.push(el)}
};
const document={
 getElementById(id){return id==='modelFamilies'?modelFamilies:null},
 createElement(tag){return {tagName:tag,innerHTML:'',className:'',id:''}}
};
const errors=[];
for(const [i,script] of scripts.entries()){
 try{new vm.Script(script,{filename:'harley-davidson-motorcycles.html:inline-'+i}).runInNewContext({document},{timeout:3000})}
 catch(err){errors.push('Inline script '+i+' failed: '+err.message)}
}
assert.deepEqual(errors,[],errors.join('\n'));
const catalogue=html.match(/const curatedHarley=(\[[^\n]+\]);/);
assert(catalogue,'Catalogue data missing');
const families=JSON.parse(catalogue[1]);
const entries=families.flatMap(f=>f.entries);
assert.equal(families.length,5,'Expected five model families');
assert.equal(entries.length,20,'Expected 20 catalogue models');
assert.equal(new Set(entries.map(m=>m.url)).size,20,'Duplicate model URL');
assert.equal(new Set(entries.map(m=>m.name)).size,20,'Duplicate model name');
const cards=[...modelFamilies.innerHTML.matchAll(/<div class="model(?: model--text-only)?">/g)];
assert.equal(cards.length,20,'Rendered manufacturer library must contain all 20 cards');
for(const entry of entries){
 assert(fs.existsSync(entry.url.slice(1)),'Missing guide '+entry.url);
 assert(modelFamilies.innerHTML.includes('href="'+entry.url+'"'),'Missing rendered model link '+entry.url);
 assert(modelFamilies.innerHTML.includes('Harley-Davidson '+entry.name),'Missing rendered model title '+entry.name);
}
for(const family of families){
 assert(modelFamilies.innerHTML.includes('id="'+family.key+'"'),'Missing dynamically rendered category anchor '+family.key);
}
const allIds=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
for(const family of families)allIds.add(family.key);
for(const href of html.matchAll(/href="#([^"]+)"/g)){
 assert(allIds.has(href[1]),'Missing manufacturer anchor #'+href[1]);
}
assert(!html.includes('href="/available-stock.html"'),'Public hidden-stock link detected');
console.log('PASS: inline JavaScript executed; 20 unique rendered cards and guide links; 5 category anchors; public stock link absent.');
