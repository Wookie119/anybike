import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const origin='https://www.anybike.co.uk';
function sitemap(file){
 const urls=[...read(file).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1].replaceAll('&amp;','&'));
 assert.equal(urls.length,new Set(urls).size,'Duplicate URLs in '+file);
 return urls.map(url=>{
  const parsed=new URL(url);
  assert.equal(parsed.origin,origin,'Unexpected sitemap domain');
  return parsed;
 });
}

const urls=sitemap('sitemap.xml');
const models=urls.filter(url=>url.pathname.startsWith('/models/'));
const modelSitemap=sitemap('sitemap-motorcycle-models.xml');
assert.deepEqual(models.map(url=>url.href).sort(),modelSitemap.map(url=>url.href).sort(),
 'Main and model sitemaps must list the same canonical model URLs');
assert(models.every(url=>!url.search&&!url.hash),'Published model URLs must be permanent paths');
assert(!urls.some(url=>url.pathname==='/motorcycle-model-guide.html'),'Keep the model lookup route out of the sitemap');

const dedicated=new Map([
 ['bmw','/bmw-motorcycles.html'],
 ['harley-davidson','/harley-davidson-motorcycles.html'],
 ['indian','/indian-motorcycles.html'],
 ['indian motorcycle','/indian-motorcycles.html']
]);
for(const route of new Set(dedicated.values())){
 assert(urls.some(url=>url.pathname===route&&!url.search),'Dedicated manufacturer missing: '+route);
}

const registry=JSON.parse(read('data/universal-v2-model-routes.json')).models;
const expectedBrands=new Set(registry.map(row=>row.make.toLowerCase()).filter(make=>!dedicated.has(make)));
const brands=urls.filter(url=>url.pathname==='/motorcycle-brand.html');
const listedBrands=brands.map(url=>url.searchParams.get('make')?.toLowerCase());
assert.deepEqual(listedBrands.sort(),[...expectedBrands].sort(),
 'Shared manufacturer URLs must match the published model registry');

const markets=urls.filter(url=>url.pathname.startsWith('/markets/'));
assert.equal(markets.length,217,'International markets sitemap incomplete');
for(const url of markets){
 const html=read(url.pathname.slice(1));
 assert(!/<meta[^>]+name=["']robots["'][^>]+content=["']noindex/i.test(html),'Noindex international market: '+url.pathname);
 assert(/<link[^>]+rel=["']canonical["']/i.test(html),'Missing canonical: '+url.pathname);
}
console.log('PASS: '+models.length+' models, '+(brands.length+new Set(dedicated.values()).size)+
 ' manufacturers and '+markets.length+' international market pages');
