#!/usr/bin/env node
// Read-only inventory of dedicated pages that still require V2 convergence.
// Never destroy editorial research just to achieve visual parity.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const approved=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const reference='bmw-r1300gs-v2-approved-20261102.html';
const renderer='/model-template/approved-v2-universal-preview.mjs';
const rows=approved.map(({url,make,model})=>{
 const file=url.slice(1),html=read(file);
 const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)/g)].map(m=>m[1]);
 const features={
  shared_v2_renderer:html.includes(renderer),
  research_sections:/(?:id="body"|id="documented-specifications"|id="r1300DeepDive"|class="[^"]*(?:history|research|generation))/i.test(html),
  generations:/(?:id="generationPanel"|generation-grid|generation-entry)/.test(html),
  stock_module:/internationalModelStock|public-exact-model-stock|international-public-stock/.test(html),
  enquiries:/bulk-buying-request|internationalGuestRequestForm|guest-enquiry/.test(html),
  photography:/(?:<figure|<img |approved-model-hero|licensed-photo)/i.test(html),
  canonical:html.includes('rel="canonical"')&&html.includes('https://www.anybike.co.uk'+url),
  v2_style_only:html.includes('public-header.js')&&!html.includes(renderer),
  research_scripts:scripts.filter(src=>/research|model|shell/.test(src)).length
 };
 return {url,make,model,...features};
});
const protectedReference='/bmw-r1300gs.html';
const referenceRow=rows.find(x=>x.url===protectedReference);
const pending=rows.filter(x=>!x.shared_v2_renderer&&x.url!==protectedReference);
const counts={
 routes:rows.length,
 brands:Object.fromEntries([...new Set(rows.map(x=>x.make))].map(make=>[make,rows.filter(x=>x.make===make).length])),
 shared_v2_models:rows.filter(x=>x.shared_v2_renderer).length,
 protected_approved_reference:referenceRow?.url||null,
 pending_full_convergence:pending.length,
 missing_canonical:rows.filter(x=>!x.canonical).map(x=>x.url)
};
console.log(JSON.stringify({counts,pages:rows},null,2));
if(!fs.existsSync(path.join(root,reference))||!fs.existsSync(path.join(root,'motorcycle-v2-master.html'))){
 console.error('FAIL: approved V2 master or reference missing');process.exitCode=1;
}
if(counts.missing_canonical.length){console.error('FAIL: dedicated page canonical mismatch');process.exitCode=1;}
if(!referenceRow||referenceRow.shared_v2_renderer){
 console.error('FAIL: approved BMW R1300GS reference must remain on original protected design');process.exitCode=1;
}
if(counts.pending_full_convergence){
 console.error('FAIL: '+counts.pending_full_convergence+' unprotected dedicated model URLs have not adopted the shared V2 renderer.');process.exitCode=1;
}else console.log('PASS: 44 dedicated V2 model routes; one protected approved R1300GS reference.');
