import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const approved=JSON.parse(readFileSync(new URL('data/motorcycle-index-identities.json',root),'utf8')).models;
const counts=new Map();
for(const row of approved){
 assert(typeof row.make==='string'&&row.make.trim()&&typeof row.model==='string'&&row.model.trim(),'Invalid approved model identity');
 counts.set(row.make,(counts.get(row.make)||0)+1);
}
const report={
 generated:'2026-11-12',
 source:'data/motorcycle-index-identities.json',
 approved_model_count:approved.length,
 manufacturer_count:counts.size,
 models_by_manufacturer:[...counts.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([manufacturer,approved_models])=>({manufacturer,approved_models})),
 publication_scope:'Approved model identities and route coverage only. This report does not establish verified specifications, images, stock availability or browser-rendered content.',
 shared_renderer:'motorcycle-model-guide.html',
 research_enrichment:'model-template/public-verified-model-facts.mjs',
 hero_enrichment:'model-template/public-approved-model-hero.mjs',
 gallery_enrichment:'model-template/public-approved-model-gallery.mjs'
};
const file=new URL('data/model-rollout-coverage-2026-11-12.json',root);
const expected=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check')){
 assert.equal(readFileSync(file,'utf8'),expected,'Model rollout coverage snapshot is stale; run node scripts/build-model-rollout-coverage.mjs');
 console.log('PASS: model rollout coverage snapshot matches the approved catalogue');
}else{
 writeFileSync(file,expected);
 console.log('Updated model rollout coverage snapshot');
}
