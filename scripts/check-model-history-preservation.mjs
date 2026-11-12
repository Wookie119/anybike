#!/usr/bin/env node
// Read-only audit. Never infer duplicates solely from shared model names.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const catalogue=JSON.parse(readFileSync(resolve(root,'data/motorcycle-index-identities.json'),'utf8'));
const rows=catalogue.models;
const key=x=>String(x.make).trim().toLowerCase()+'|'+String(x.model).trim().toLowerCase();
if(!Array.isArray(rows)||rows.length===0)throw Error('Approved model snapshot is empty');
const seen=new Map();
for(const row of rows){
 if(!row.make||!row.model)throw Error('Empty manufacturer or model identity');
 const k=key(row);
 if(seen.has(k))throw Error('Public identity collision requires generation review: '+k);
 seen.set(k,row);
}
const aliasCases=[
 ['Aprilia','RS660','Aprilia','RS 660'],
 ['BMW','CE 02 AM 7.9% APR Representative','BMW','CE 02 AM'],
 ['BMW','K 1600 B GRAND AMERICA','BMW','K 1600 Grand America'],
 ['Indian','SCOUT','Indian Motorcycle','Scout'],
 ['Indian','SCOUT BOBBER','Indian Motorcycle','Scout Bobber'],
 ['Kawasaki','Z900RS','Kawasaki','Z900 RS']
];
for(const [make,model,targetMake,targetModel] of aliasCases){
 if(seen.has(key({make,model})))throw Error('Known alias incorrectly published as independent model: '+make+' '+model);
 if(!seen.has(key({make:targetMake,model:targetModel})))throw Error('Alias target missing from approved catalogue: '+targetMake+' '+targetModel);
}
const reviewCases=['F 900 GS Adventure','F450 GS','K 1600','M 1000 XR Full','M 1000 XR M','R 12','R 12 S','S 1000 RR M'];
for(const model of reviewCases){
 if(seen.has(key({make:'BMW',model})))throw Error('Pending BMW identity published before review: '+model);
}
console.log('PASS: '+rows.length+' approved model identities; aliases and pending review identities excluded.');
console.log('Policy: matching names do not imply same production generation; preserve raw source rows.');

// Protect the existing shared generation comparison and the locked visual template.
const renderer=readFileSync(resolve(root,'motorcycle-model-guide.html'),'utf8');
const design=readFileSync(resolve(root,'model-template/approved-r1300gs-model-design.css'),'utf8');
for(const id of ['generationPanel','generationControls','generationDetail','generationCompareRows']){
 assert(renderer.includes('id="'+id+'"'),'Approved shared model generation component missing: '+id);
}
assert(renderer.includes('an unknown end date does not mean production continues'),'Generation warning about unknown end dates must remain visible');
assert(renderer.includes('const generations=guide.production?.generations||[];'),'Existing sourced generation research must remain available');
assert(renderer.includes('g.image.permission_status==="approved"'),'Unapproved generation photographs must not be shown');
assert(renderer.includes('if(Number.isInteger(production.first_model_year)&&!Number.isInteger(production.production_end_year)'),'Unknown production end year must not imply ongoing production');
assert(design.includes('body:has(#generationPanel) main'),'R 1300 GS shared design frame must remain in use');
console.log('PASS: generation comparison, photo approval and shared design safeguards preserved');

assert(renderer.includes('if(indexedModels.length>0&&!indexed&&!clean)'),'Unapproved legacy identities must not become indexable merely because an old catalogue record exists');
assert(renderer.includes('The motorcycle record is preserved; specifications are not published until verified.'),'Pending identity pages must explain preservation without inventing specifications');
assert(renderer.includes('el("sourceBottom").href=request;'),'Pending model enquiries must retain the exact model in the request link');
