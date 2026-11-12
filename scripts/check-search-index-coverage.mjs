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
assert.equal(models.length,979,'Model sitemap must match reconciled Supabase snapshot');
assert.equal(brands.length,48,'Generic manufacturer URLs must exclude BMW and Harley redirects');
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
assert(read('motorcycle-model-guide.html').includes('content="index,follow" id="modelRobots"'),'Model renderer noindex');
assert(read('motorcycle-brand.html').includes('content="index,follow"'),'Brand renderer noindex');
assert(read('motorcycle-brand.html').includes('if(!knownBrand){'), 'Unknown manufacturer URLs must be noindex');
assert(read('motorcycle-brand.html').includes('if(knownBrand)document.getElementById("canonicalLink").href='), 'Unknown manufacturer URLs must not self-canonicalise');
assert(read('motorcycle-model-guide.html').includes('if(!row&&!guide){\n el("modelRobots").content="noindex,follow"'), 'Unknown model URLs must be noindex');
console.log('PASS: '+models.length+' models, '+(brands.length+2)+' manufacturers including BMW/Harley, '+markets.length+' international market pages, unique identities and canonical checks');
