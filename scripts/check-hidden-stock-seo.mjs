// node scripts/check-hidden-stock-seo.mjs
// Keep individual stock pages and the stock directory out of public search indexing.
import fs from 'node:fs';
import assert from 'node:assert/strict';
for(const path of ['available-stock.html','bike-details.html']){
 const html=fs.readFileSync(path,'utf8');
 const meta=html.match(/<meta\s+name=["']robots["'][^>]*content=["']([^"']+)/i);
 assert(meta, path+': missing robots meta');
 assert(/noindex/i.test(meta[1]),path+': must remain noindex while stock hidden');
 assert(/nofollow/i.test(meta[1]),path+': must remain nofollow while stock hidden');
}
const sitemap=fs.readFileSync('sitemap.xml','utf8');
for(const path of ['available-stock.html','bike-details.html'])
 assert(!sitemap.includes('<loc>https://www.anybike.co.uk/'+path+'</loc>'),'Hidden stock URL in sitemap: '+path);
console.log('PASS: stock directory and individual motorcycle details excluded from index and sitemap.');
