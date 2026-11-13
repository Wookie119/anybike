#!/usr/bin/env node
// AnyBike V2 rollout coverage audit. Read-only: does not change routes or content.
// Distinguishes an approved shared renderer from legacy pages with CSS-only parity.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalogue=JSON.parse(read('data/motorcycle-catalogue-master.json')).models;
const master=read('motorcycle-v2-master.html');
const generic=read('motorcycle-model-guide.html');
const header=read('public-header.js');
const renderer=read('model-template/approved-v2-universal-preview.mjs');
const modelKey=(make,model)=>[make,model].map(v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()).join('|');
const identities=new Set(catalogue.filter(x=>x?.make&&x?.model).map(x=>modelKey(x.make,x.model)));
const approved=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const dedicatedCount=Array.isArray(approved)?approved.length:Object.keys(approved||{}).length;
const results={
 catalogue_records:catalogue.length,
 distinct_model_identities:identities.size,
 dedicated_route_entries:dedicatedCount,
 master_has_shared_renderer:master.includes('/model-template/approved-v2-universal-preview.mjs'),
 master_has_index_follow:master.includes('name="robots" content="index,follow"'),
 generic_uses_shared_renderer:generic.includes('/model-template/approved-v2-universal-preview.mjs'),
 generic_redirects_to_master:/location\.replace\([^;]*motorcycle-v2-master/.test(generic),
 legacy_header_uses_presentation_only:header.includes('Pure presentation: never alters stock access'),
 approved_reference_intact:fs.existsSync(path.join(root,'bmw-r1300gs-v2-approved-20261102.html')),
};
console.log(JSON.stringify(results,null,2));
if(!results.master_has_shared_renderer||!results.master_has_index_follow||!results.approved_reference_intact){
 console.error('FAIL: approved V2 master contract is broken');process.exitCode=1;
}
if(!results.generic_uses_shared_renderer&&!results.generic_redirects_to_master){
 console.error('GAP: catalogue model guide still uses its legacy renderer. A CSS-only rollout is not full V2 template convergence.');
 process.exitCode=2;
}
