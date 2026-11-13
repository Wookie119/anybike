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
const counts={routes:rows.length,brands:Object.fromEntries([...new Set(rows.map(x=>x.make))].map(make=>[make,rows.filter(x=>x.make===make).length])),using_shared_renderer:rows.filter(x=>x.shared_v2_renderer).length,pending_full_convergence:rows.filter(x=>!x.shared_v2_renderer).length,missing_canonical:rows.filter(x=>!x.canonical).map(x=>x.url)};
console.log(JSON.stringify({counts,pages:rows},null,2));
if(!fs.existsSync(path.join(root,reference))||!fs.existsSync(path.join(root,'motorcycle-v2-master.html'))){
 console.error('FAIL: approved V2 master or reference missing');process.exitCode=1;
}
if(counts.missing_canonical.length){console.error('FAIL: dedicated page canonical mismatch');process.exitCode=1;}
if(counts.pending_full_convergence){
 console.error('ROLL OUTSTANDING: '+counts.pending_full_convergence+' dedicated model URLs have not adopted the shared V2 renderer. CSS-only compatibility is not completed convergence.');
}
