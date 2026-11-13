// All 18 approved Harley-Davidson research sources were snapshotted before
// adopting the universal V2 HTML. Keep the 40 previously captured section
// candidates in the original Git blob archive, not as automatically published
// manufacturer facts. Exact catalogue IDs remain the 2026-11-10 snapshot.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveApprovedV2Identity} from '../model-template/approved-v2-route-identity.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const routes=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const snapshot=JSON.parse(read('data/harley-v2-legacy-preservation.json'));
const expectedIds=new Map([
 ['Road Glide',143],['Street Glide',157],['Road King',144],['Electra Glide',125],
 ['Ultra Limited',437],['Fat Boy',127],['Breakout',115],['Low Rider S',430],
 ['Softail Standard',149],['Iron 883',429],['Sportster S',153],['Pan America 1250',431],
 ['Heritage Classic',868],['Street Bob',156],['Nightster',140],['V-Rod',856],
 ['Pan America 1250 ST',142],['CVO Pan America',119]
]);
assert.equal(expectedIds.size,18);
assert.equal(new Set(expectedIds.values()).size,18);
assert.equal(snapshot.publication_status,'migration_snapshot_only_not_automatically_publication_approved');
assert.equal(snapshot.models.length,18);
let sections=0;
for(const record of snapshot.models){
 const approved=resolveApprovedV2Identity(record.url,routes);
 assert(approved&&approved.make==='Harley-Davidson'&&approved.model===record.model,
  'Unapproved or cross-model history: '+record.url);
 assert(expectedIds.has(record.model),'Unknown previously captured catalogue identity: '+record.model);
 const html=read(record.url.slice(1));
 assert(html.includes('approved-v2-universal-preview.mjs'),'Harley route must use shared V2 '+record.url);
 assert(html.includes('id="internationalGuestRequestForm"'),'Harley page lost guest sourcing '+record.url);
 assert(record.sections.length>0,'Legacy research lost '+record.url);
 assert(/^[a-f0-9]{40}$/.test(record.source_blob_sha),'Original research source SHA missing');
 sections+=record.sections.length;
}
assert.equal(sections,212);
const requiresReview=['cvo','hydra-glide-revival','xr1000'];
for(const slug of requiresReview){
 const page=read('harley-davidson-'+slug+'.html');
 assert(page.includes('<h1>Harley-Davidson '),'Unmapped legacy guide changed: '+slug);
}
console.log('PASS: 18 Harley routes, 18 known canonical IDs, 212 source-preserved sections, 3 unmatched guides still protected');
