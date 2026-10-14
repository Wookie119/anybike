// node scripts/check-legacy-404-recovery.mjs
// Guard old public URLs without redirecting private paths or expired stock listings.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const aliases={
 'belgium.html':'/markets/belgium.html',
 'australia.html':'/markets/australia.html',
 'markets/index.html':'/international-markets.html'
};
for(const [path,to] of Object.entries(aliases)){
 const html=fs.readFileSync(path,'utf8');
 assert(html.includes('url='+to),'Missing legacy redirect '+path);
 assert(html.includes('window.location.replace'),'Missing JS fallback '+path);
 assert(html.includes('noindex,follow'),'Legacy redirect should not be indexed: '+path);
 assert(fs.existsSync(to.slice(1)),'Legacy redirect target missing: '+to);
}
const contact=fs.readFileSync('contact-us.html','utf8');
assert(contact.includes('window.location.search + window.location.hash'),'Legacy contact redirect must preserve enquiry details');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
assert(sitemap.includes('<loc>https://www.anybike.co.uk/anybike-connect.html</loc>'),'Canonical contact missing from sitemap');
assert(!sitemap.includes('<loc>https://www.anybike.co.uk/contact.html</loc>'),'Nonexistent contact.html remains in sitemap');
for(const unsafe of ['/available-stock.html','/admin-','/login','/register']){
 assert(!Object.keys(aliases).some(p=>p.startsWith(unsafe.slice(1))),'Never redirect private/hidden addresses through public recovery');
}
console.log('PASS: public legacy redirects and sitemap contact target are consistent.');
