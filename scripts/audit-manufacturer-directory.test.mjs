import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {auditManufacturerDirectory} from './audit-manufacturer-directory.mjs';
function currentSources(){
 const base=process.cwd();
 return {
  html:fs.readFileSync(path.join(base,'motorcycle-manufacturers.html'),'utf8'),
  legacyHtml:fs.readFileSync(path.join(base,'motorcycle-brand.html'),'utf8'),
  requestHtml:fs.readFileSync(path.join(base,'bulk-buying-request.html'),'utf8'),
  manufacturers:JSON.parse(fs.readFileSync(path.join(base,'scripts/fixtures/manufacturer-directory-50-20261104.json'),'utf8')).manufacturers
 };
}
test('50 Supabase manufacturers plus separately featured Mugen retain real navigation',()=>{
 const report=auditManufacturerDirectory(currentSources());
 assert.deepEqual(report.issues,[]);
 assert.equal(report.counts.catalogueManufacturers,50);
 assert.equal(report.counts.directoryCards,51);
 assert.equal(report.counts.linksToApprovedGuides,3);
 assert.equal(report.counts.linksToSharedManufacturer,47);
 assert.equal(report.counts.linksToSourcing,0);
});
test('missing MGB, wrong manufacturer route and incorrect SEO counts fail',()=>{
 const v=currentSources();
 const missing=auditManufacturerDirectory({...v,html:v.html.replace(/<a class="brand" data-name="mgb"[^>]*>[\s\S]*?<\/a>\s*/, '')});
 assert.ok(missing.issues.some(x=>x.includes('directory-card-count-mismatch')));
 assert.ok(missing.issues.some(x=>x.includes('missing-directory-manufacturer:MGB')));
 const wrongRoute=auditManufacturerDirectory({...v,html:v.html.replace('/motorcycle-brand.html?make=MGB','/bulk-buying-request.html?make=MGB')});
 assert.ok(wrongRoute.issues.some(x=>x.includes('unexpected-brand-destination:MGB')));
 const wrongCount=auditManufacturerDirectory({...v,html:v.html.replace('Explore 50 motorcycle manufacturers','Explore 49 motorcycle manufacturers')});
 assert.ok(wrongCount.issues.includes('directory-count-description-mismatch'));
});
test('sourcing query and catalogue identity duplicates remain guarded',()=>{
 const v=currentSources();
 const noQuery=auditManufacturerDirectory({...v,requestHtml:v.requestHtml.replace(/new URLSearchParams\(location\.search\)/,'new Object()')});
 assert.ok(noQuery.issues.includes('manufacturer-sourcing-query-not-supported'));
 const duplicate=auditManufacturerDirectory({...v,manufacturers:[...v.manufacturers,{id:500,display_name:'BMW',slug:'duplicate'}]});
 assert.ok(duplicate.issues.some(x=>x.startsWith('duplicate-catalogue-manufacturer')));
 const missingMugen=auditManufacturerDirectory({...v,html:v.html.replace(/<a class="brand" data-name="mugen"[^>]*>[\s\S]*?<\/a>\s*/, '')});
 assert.ok(missingMugen.issues.includes('directory-card-count-mismatch'));
});
