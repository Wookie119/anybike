// node scripts/check-connect-canonical.mjs
// SEO: prefilling an enquiry must not create indexable duplicate landing pages.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('anybike-connect.html','utf8');
const head=html.split('</head>')[0];
const canonicals=[...head.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)].map(x=>x[0]);
assert.equal(canonicals.length,1,'Exactly one canonical link required');
assert(canonicals[0].includes('href="https://www.anybike.co.uk/anybike-connect.html"'),'Contact page must canonicalize to URL without query parameters');
assert(!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(head),'Do not accidentally exclude the canonical contact page');
for(const token of ['new URLSearchParams(window.location.search)','params.get("journey")','params.get("destination")||params.get("market")','attributionParams.get("from")','attributionParams.get("pageTitle")']){
 assert(html.includes(token),'Enquiry-prefill or attribution handling removed: '+token);
}
console.log('PASS: Contact page has one stable canonical while preserving enquiry query parameters.');
