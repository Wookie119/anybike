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
test('real 50-manufacturer A-Z source matches catalogue, SEO and approved routes',()=>{
 const report=auditManufacturerDirectory(currentSources());
 assert.deepEqual(report.issues,[]);
 assert.equal(report.counts.catalogueManufacturers,50);
 assert.equal(report.counts.directoryCards,50);
 assert.equal(report.counts.linksToApprovedGuides,2);
 assert.equal(report.counts.linksToSourcing,48);
});
test('missing MGB, old generic route or incorrect SEO counts fail',()=>{
 const v=currentSources();
 const missing=auditManufacturerDirectory({...v,html:v.html.replace(/<a class="brand" data-name="mgb"[^>]*>[\s\S]*?<\/a>\s*/, '')});
 assert.ok(missing.issues.some(x=>x.includes('directory-card-count-mismatch')));
 assert.ok(missing.issues.some(x=>x.includes('missing-directory-manufacturer:MGB')));
 const legacy=auditManufacturerDirectory({...v,html:v.html.replace('/bulk-buying-request.html?make=MGB','/motorcycle-brand.html?make=MGB')});
 assert.ok(legacy.issues.some(x=>x.includes('unexpected-brand-destination:MGB')));
 const wrongCount=auditManufacturerDirectory({...v,html:v.html.replace('Explore 50 motorcycle manufacturers','Explore 49 motorcycle manufacturers')});
 assert.ok(wrongCount.issues.includes('directory-count-description-mismatch'));
});
test('legacy brand indexing, sourcing form and duplicate data identities are guarded',()=>{
 const v=currentSources();
 const indexed=auditManufacturerDirectory({...v,legacyHtml:v.legacyHtml.replace('content="noindex,follow"','content="index,follow"')});
 assert.ok(indexed.issues.includes('legacy-unapproved-brand-not-noindex'));
 const noQuery=auditManufacturerDirectory({...v,requestHtml:v.requestHtml.replace(/new URLSearchParams\(location\.search\)/,'new Object()')});
 assert.ok(noQuery.issues.includes('manufacturer-sourcing-query-not-supported'));
 const duplicate=auditManufacturerDirectory({...v,manufacturers:[...v.manufacturers,{id:500,display_name:'BMW',slug:'duplicate'}]});
 assert.ok(duplicate.issues.some(x=>x.startsWith('duplicate-catalogue-manufacturer')));
});
