// Full-repository 217+ real market-page navigation regression.
// Existing synthetic route tests are useful, but do not cover actual HTML.
// This script is read-only and does not fetch or infer stock availability.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=new URL('..',import.meta.url);
const folder=new URL('../markets/',import.meta.url);
const files=fs.readdirSync(folder).filter(name=>/^[a-z0-9-]+\.html$/.test(name));
assert(files.length>=217,
 'Expected at least the 217 live country HTML routes, found '+files.length);
let withHeader=0,unsafeJumpLinks=0;
const duplicateNames=new Set();
for(const name of files){
 assert(!duplicateNames.has(name),'Duplicate country route: '+name);
 duplicateNames.add(name);
 const html=fs.readFileSync(new URL('../markets/'+name,import.meta.url),'utf8');
 assert(/<html\b/i.test(html),'Missing HTML document: '+name);
 assert(/<main\b/i.test(html),'Country main content missing: '+name);
 if(/(?:^|\/)public-header\.js(?:\?|["'])/.test(html))withHeader++;
 // A country-to-brand link must reach the top of that manufacturer page.
 // Local manufacturer's own "Explore models" jump links are intentionally
 // excluded from this test: those are correct within the brand page.
 const re=/(?:href\s*=\s*["'])([^"']*motorcycle-brand\.html\?make=[^"']+)/gi;
 for(const match of html.matchAll(re)){
  assert(!/#models(?:$|&|\?)/i.test(match[1]),
   'Country route skips manufacturer introduction: '+name+' -> '+match[1]);
  unsafeJumpLinks+=0; // Count only violations; any violation throws above.
 }
}
assert.equal(withHeader,files.length,
 'Every market route must load the shared public header/heritage installer');
const shared=fs.readFileSync(new URL('../market-global-editorial-links.js',import.meta.url),'utf8');
const header=fs.readFileSync(new URL('../public-header.js',import.meta.url),'utf8');
assert(header.includes('/market-global-editorial-links.js?v='),
 'Shared header is not installing the regional heritage layer');
assert(shared.includes("'/motorcycle-brand.html?make='+encodeURIComponent(make)"),
 'Manufacturer heritage must link to page introduction, not #models');
assert(!shared.includes("encodeURIComponent(make)+'#models'"),
 'Manufacturer heritage link skips introduction');
assert(shared.includes('regionalHistory[slug]'),
 'Historical regional context must remain shared and brand-specific');
console.log('PASS: '+files.length+
 ' real market HTML pages have the shared header and safe top-of-brand links');
