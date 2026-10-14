// Run from repository root: node scripts/check-public-seo-sitemap.mjs
// Prevent missing pages, private pages, noindex pages and duplicate URLs from entering sitemap.xml.
import fs from 'node:fs';
import path from 'node:path';
const xml=fs.readFileSync('sitemap.xml','utf8');
const locs=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const issues=[];
if(!xml.includes('<urlset')||!xml.includes('</urlset>'))issues.push('Invalid sitemap root');
if(new Set(locs).size!==locs.length)issues.push('Duplicate sitemap URLs');
const host='https://www.anybike.co.uk/';
const blocked=/(^|\/)(admin[^/]*|private[^/]*|customer[^/]*|dashboard[^/]*|available-stock|login|signup|register|deal-360|my-purchases)(?:[./?]|$)/i;
for(const url of locs){
 if(!url.startsWith(host)){issues.push('Noncanonical host: '+url);continue}
 const pathname=decodeURIComponent(url.slice(host.length).split(/[?#]/)[0])||'index.html';
 if(pathname.includes('..')||blocked.test(pathname)){issues.push('Private or unsafe sitemap entry: '+url);continue}
 if(!fs.existsSync(pathname)){issues.push('Missing page: '+pathname);continue}
 const html=fs.readFileSync(pathname,'utf8');
 if(/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))issues.push('Noindex page in sitemap: '+pathname);
 if(!/<h1\b/i.test(html))issues.push('Missing H1: '+pathname);
}
for(const prefix of ['bmw-','harley-davidson-']){
 const matching=locs.filter(x=>x.startsWith(host+prefix));
 if(matching.length<15)issues.push('Unexpectedly few '+prefix+' model guides in sitemap: '+matching.length);
}
if(issues.length){issues.forEach(x=>console.error('FAIL '+x));process.exitCode=1}
else console.log('PASS: '+locs.length+' sitemap URLs are unique, local, public and not noindex.');
