// Run from the repository root: node scripts/check-harley-library-seo.mjs
// Static guard for 21 public Harley guides. No network, auth, stock or database access.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const manufacturer=fs.readFileSync('harley-davidson-motorcycles.html','utf8');
const match=manufacturer.match(/const curatedHarley=(\[[^\n]+\]);/);
assert(match,'Harley model catalogue not found');
const entries=JSON.parse(match[1]).flatMap(f=>f.entries);
assert.equal(entries.length,21,'The Harley library must contain 21 guides');
const errors=[];
for(const entry of entries){
 const file=entry.url.replace(/^\//,'');
 if(!fs.existsSync(file)){errors.push(file+' not found');continue}
 const html=fs.readFileSync(file,'utf8');
 const expected=encodeURIComponent(entry.url==='/harley-davidson-cvo.html'?'CVO':entry.url==='/harley-davidson-cvo-pan-america.html'?'CVO Pan America':entry.name);
 const fragment='?make=Harley-Davidson&amp;model='+expected;
 const require=(condition,detail)=>{if(!condition)errors.push(file+': '+detail)};
 require(html.includes('<title>')&&html.includes('</title>'),'Missing title');
 require(html.includes('name="description"'),'Missing meta description');
 require(html.includes('rel="canonical"'),'Missing canonical');
 require(html.includes('application/ld+json'),'Missing structured article data');
 require(html.includes('/bulk-buying-request.html'+fragment),'Missing model-specific trade sourcing');
 require(html.includes('/uk-motorcycle-selling.html'+fragment),'Missing model-specific UK selling');
 require(html.includes('harley-davidson-motorcycles.html'),'Missing manufacturer navigation');
 require(html.includes('AnyBike Global'),'Missing stories connection');
 require(!html.includes('/available-stock.html'),'Hidden Available Stock link present');
 for(const tag of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
  try{JSON.parse(tag[1])}catch(e){errors.push(file+': invalid JSON-LD '+e.message)}
 }
 for(const [index,source] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(x=>x.trim()&&!x.trim().startsWith('{')).entries()){
  try{new vm.Script(source,{filename:file+':script'+index})}catch(e){errors.push(file+': JS syntax '+e.message)}
 }
}
if(errors.length){for(const error of errors)console.error('FAIL '+error);process.exitCode=1}
else console.log('PASS: 21 Harley guides retain SEO, model-specific trade sourcing, confidential UK selling and links without public stock leakage.');
