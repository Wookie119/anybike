import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const xml=read('sitemap.xml');
const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replace(/&amp;/g,'&'));
assert.equal(urls.length,new Set(urls).size,'Duplicate sitemap URLs');
const models=urls.filter(x=>x.includes('/motorcycle-model-guide.html?'));
const brands=urls.filter(x=>x.includes('/motorcycle-brand.html?'));
const markets=urls.filter(x=>x.includes('/markets/'));
const published=JSON.parse(read('data/motorcycle-index-identities.json')).models;
assert.equal(models.length,published.length,'Model sitemap must match approved public snapshot');
const publishedGenericMakes=new Set(published.map(x=>x.make.toLowerCase()).filter(x=>x!=='bmw'&&x!=='harley-davidson'&&x!=='indian'));
assert.equal(brands.length,publishedGenericMakes.size,'Generic manufacturer sitemap count must follow approved public snapshot');
assert(urls.includes('https://www.anybike.co.uk/bmw-motorcycles.html'),'BMW dedicated manufacturer route missing');
assert(urls.includes('https://www.anybike.co.uk/harley-davidson-motorcycles.html'),'Harley-Davidson dedicated manufacturer route missing');
assert.equal(markets.length,217,'International markets sitemap incomplete');
for(const url of urls){
 const u=new URL(url);
 assert.equal(u.origin,'https://www.anybike.co.uk','Unexpected sitemap domain');
 if(u.pathname==='/motorcycle-model-guide.html'){
  assert(u.searchParams.get('make')?.trim()&&u.searchParams.get('model')?.trim(),'Model missing identity');
  continue;
 }
 if(u.pathname==='/motorcycle-brand.html'){
  assert(u.searchParams.get('make')?.trim(),'Brand missing identity');
  continue;
 }
 if(u.pathname.startsWith('/markets/')){
  const path='.'+u.pathname;
  assert(existsSync(resolve(root,path)),'Missing international market HTML: '+path);
  const html=read(path);
  assert(!/<meta[^>]+name=["']robots["'][^>]+content=["']noindex/i.test(html),'Noindex international market: '+path);
  assert(html.includes('<link rel="canonical"')||/<link[^>]+rel=["']canonical["']/.test(html),'Missing canonical: '+path);
 }
}
const identity=models.map(x=>{const u=new URL(x);return u.searchParams.get('make').trim().toLowerCase()+'|'+u.searchParams.get('model').trim().toLowerCase()});
assert.equal(identity.length,new Set(identity).size,'Duplicate model identities');
const indexed=JSON.parse(read('data/motorcycle-index-identities.json'));
assert.equal(indexed.models.length,published.length,'Public identity fallback must match approved snapshot');
const indexedIdentity=indexed.models.map(x=>String(x.make).trim().toLowerCase()+'|'+String(x.model).trim().toLowerCase());
assert.equal(new Set(indexedIdentity).size,indexedIdentity.length,'Public identity fallback must not contain duplicate models');
assert.deepEqual([...new Set(identity)].sort(),[...new Set(indexedIdentity)].sort(),'Sitemap and public model fallback must have identical model identities');
const publishedMakes=new Set(indexed.models.map(x=>String(x.make).trim().toLowerCase()));
const genericMakes=new Set(brands.map(x=>new URL(x).searchParams.get('make').trim().toLowerCase()));
for(const make of publishedMakes){
 if(make==='bmw'||make==='harley-davidson')continue;
 assert(genericMakes.has(make),'Manufacturer missing from sitemap: '+make);
}
assert(!genericMakes.has('bmw')&&!genericMakes.has('harley-davidson'),'Dedicated brands must not use generic sitemap URLs');
assert(read('motorcycle-model-guide.html').includes('const row=clean||indexed||legacy;'),'Renderer must use the public index identity fallback');
const renderer=read('motorcycle-model-guide.html');
for(const alias of ['aprilia|rs660','indian|scout','kawasaki|z900rs'])assert(renderer.includes('"'+alias+'":'),'Missing canonical model alias redirect: '+alias);
for(const pending of ['bmw|f 900 gs adventure','bmw|r 12','bmw|s 1000 rr m'])assert(renderer.includes('"'+pending+'"'),'Pending BMW model must remain noindex: '+pending);
assert(renderer.includes('if(pendingModelNames.has('),'Pending models must be blocked before legacy catalogue rendering');
assert(read('motorcycle-model-guide.html').includes('content="index,follow" id="modelRobots"'),'Model renderer noindex');
assert(read('motorcycle-brand.html').includes('content="index,follow"'),'Brand renderer noindex');
assert(read('motorcycle-brand.html').includes('if(!knownBrand){'), 'Unknown manufacturer URLs must be noindex');
assert(read('motorcycle-brand.html').includes('if(knownBrand)document.getElementById("canonicalLink").href='), 'Unknown manufacturer URLs must not self-canonicalise');
assert(read('motorcycle-model-guide.html').includes('if(!row&&!guide){\n el("modelRobots").content="noindex,follow"'), 'Unknown model URLs must be noindex');
console.log('PASS: '+models.length+' models, '+(brands.length+2)+' manufacturers including BMW/Harley, '+markets.length+' international market pages, unique identities and canonical checks');
