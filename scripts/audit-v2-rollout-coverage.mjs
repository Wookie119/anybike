#!/usr/bin/env node
// AnyBike V2 rollout coverage audit. Source-only: does not prove live deployment.
// Distinguishes one shared renderer from CSS-only parity, and fails on route drift.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const catalogue=JSON.parse(read('data/motorcycle-catalogue-master.json')).models;
const approved=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const master=read('motorcycle-v2-master.html');
const generic=read('motorcycle-model-guide.html');
const reference=read('bmw-r1300gs.html');
const renderer='/model-template/approved-v2-universal-preview.mjs';
const normalize=s=>String(s||'').toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,' ').trim();
const key=(make,model)=>normalize(make)+'|'+normalize(model);
const failures=[];
const warnings=[];
const verify=(condition,message)=>{if(!condition)failures.push(message);};
const sections=html=>[...html.matchAll(/<section\b([^>]*)>/g)].map(m=>m[1]);
const rendererVersion=master.match(/src="(\/model-template\/approved-v2-universal-preview\.mjs\?v=[^"]+)"/)?.[1];
const registered=new Set();
let sharedDedicated=0;
let retainedReference=0;
for(const row of approved){
 const route=row?.url;
 const identity=key(row?.make,row?.model);
 verify(typeof route==='string'&&/^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(route||''),'Unapproved dedicated route: '+route);
 verify(!registered.has(route),'Duplicate dedicated route: '+route);
 registered.add(route);
 if(!catalogue.some(item=>key(item.make,item.model)===identity))warnings.push('Dedicated identity absent from offline fallback; verify live public catalogue: '+route);
 if(typeof route!=='string'||!route.startsWith('/')||!exists(route.slice(1))){failures.push('Missing dedicated HTML: '+route);continue;}
 const html=read(route.slice(1));
 verify(html.includes('https://www.anybike.co.uk'+route),'Missing exact canonical: '+route);
 verify(html.includes('name="robots" content="index,follow"'),'Not indexable: '+route);
 if(route==='/bmw-r1300gs.html'){
  retainedReference++;
  verify(!html.includes(renderer),'Protected R 1300 GS page unexpectedly changed renderer');
  verify(html.includes('id="ukR1300ModelGallery"'),'Protected R 1300 GS gallery missing');
  continue;
 }
 sharedDedicated++;
 verify(html.includes(renderer),'Dedicated page not on shared V2 renderer: '+route);
 verify(!!rendererVersion&&html.includes('src="'+rendererVersion+'"'),'Renderer version differs from master: '+route);
 verify(JSON.stringify(sections(html))===JSON.stringify(sections(master)),'V2 section layout differs from master: '+route);
 verify(html.includes('id="heading">'+row.make+' '+row.model+'</h1>'),'Wrong static model heading: '+route);
 for(const id of ['internationalModelStock','internationalGuestRequestForm','databaseHeroPhoto','v2UkSellAction']){
  verify(html.includes('id="'+id+'"'),'Missing '+id+': '+route);
 }
 verify(!html.includes('public-harley-verified-research.mjs')&&!html.includes('approved-bmw-page-shell.mjs'),'Parallel legacy renderer: '+route);
}
const catalogueIdentities=new Set(catalogue.filter(x=>x?.make&&x?.model).map(x=>key(x.make,x.model)));
verify(catalogueIdentities.size===catalogue.length,'Duplicate or malformed offline catalogue model identities');
verify(master.includes(renderer)&&generic.includes(renderer),'Master/generic guide not on the shared renderer');
verify(JSON.stringify(sections(master))===JSON.stringify(sections(generic)),'Master/generic page section drift');
verify(master.includes('name="robots" content="index,follow"')&&generic.includes('name="robots" content="index,follow"'),'Shared guides not indexable');
verify(!!rendererVersion,'Shared renderer cache version missing');
verify(exists('bmw-r1300gs-v2-approved-20261102.html'),'Immutable approved V2 reference missing');
verify(retainedReference===1,'Expected one protected R 1300 GS dedicated reference');
verify(approved.length===45&&sharedDedicated===44,'Expected 44 migrated dedicated pages plus 1 protected reference');
verify(reference.includes('id="ukR1300ModelGallery"'),'Protected reference lacks model-year gallery');

const report={
 catalogue_records:catalogue.length,
 distinct_catalogue_models:catalogueIdentities.size,
 generic_catalogue_models_served_by_shared_template:catalogueIdentities.size,
 dedicated_routes:approved.length,
 dedicated_shared_v2:sharedDedicated,
 protected_r1300_reference:retainedReference,
 master_and_generic_same_structure:JSON.stringify(sections(master))===JSON.stringify(sections(generic)),
 source_audit_passed:failures.length===0,
 source_audit_limitations:'Does not verify live 123-reg deployment, Supabase published facts, roles, actual browser rendering, or photo rights.',
 warnings,
 errors:failures
};
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
