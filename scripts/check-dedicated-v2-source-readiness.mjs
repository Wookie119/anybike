#!/usr/bin/env node
// Read-only evidence gate before replacing an existing dedicated model guide.
// Every source identity must match exactly; do not equate CSS parity to rollout.
// BMW R 1300 GS approved reference is never a migration candidate.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const routes=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const published=Object.values(JSON.parse(read('data/motorcycle-model-guides.json')).models);
const normal=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const matches=(row,guide)=>normal(row.make)===normal(guide.make)&&normal(row.model)===normal(guide.model);
const statuses=routes.map(row=>{
 const guideMatches=published.filter(guide=>matches(row,guide));
 const page=read(row.url.slice(1));
 const protectedBMW=row.url==='/bmw-r1300gs.html';
 const originalSections=(page.match(/<section\b/gi)||[]).length;
 const heroOrPhoto=/<(?:img|figure)\b/i.test(page);
 const originalScriptCount=(page.match(/<script\b/gi)||[]).length;
 return {url:row.url,make:row.make,model:row.model,protectedBMW,
  publishedGuideMatches:guideMatches.length,originalSections,heroOrPhoto,originalScriptCount,
  hasSourceGuide:guideMatches.length===1,
  hasLegacyFunctionality:originalScriptCount>1};
});
assert.equal(statuses.length,45,'Expected all 45 approved dedicated model routes');
assert.equal(new Set(statuses.map(x=>x.url)).size,statuses.length);
assert.equal(statuses.filter(x=>x.make==='BMW').length,27);
assert.equal(statuses.filter(x=>x.make==='Harley-Davidson').length,18);
for(const result of statuses){
 assert(result.publishedGuideMatches<=1,'Ambiguous published guide identity: '+result.url);
 assert(result.originalSections>0,'Missing legacy content: '+result.url);
}
const counts={
 dedicated_pages:statuses.length,
 bmw_pages:statuses.filter(x=>x.make==='BMW').length,
 harley_pages:statuses.filter(x=>x.make==='Harley-Davidson').length,
 exact_published_guides:statuses.filter(x=>x.hasSourceGuide).length,
 outstanding_legacy_research_capture:statuses.filter(x=>!x.hasSourceGuide).map(x=>x.url),
 protected_reference:statuses.filter(x=>x.protectedBMW).map(x=>x.url),
 pages_with_existing_photography:statuses.filter(x=>x.heroOrPhoto).length,
 pages_with_embedded_scripts:statuses.filter(x=>x.hasLegacyFunctionality).length
};
console.log(JSON.stringify(counts,null,2));
console.log('PASS dedicated V2 source readiness inventory. This is NOT approval to overwrite existing pages or remove legacy history.');
