import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {stageModelContentEvidence} from './stage-model-content-evidence.mjs';

function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-research-'));
 const filename='harley-davidson-road-king.html',url='/'+filename;
 const html='<html><head><link rel="canonical" href="https://www.anybike.co.uk'+url+'">'+
 '<meta name="robots" content="index,follow"></head><body>'+
 '<section><h2>UK buyer\'s model-specific checklist</h2><p>'+
 'Check service records and registered motorcycle year, engine family, original options, condition and VIN before buying.</p></section>'+
 '<section><h2>Detailed model generations and factory references</h2><p>'+
 'Compare the factory model-year documents and distinguish historic generations from current machines before citing technical figures.</p></section>'+
 '<section><h2>Photo policy</h2><p>Unrelated photographic rights instructions must never become specifications.</p></section>'+
 '</body></html>';
 fs.writeFileSync(path.join(root,filename),html);
 return {root,url,html,data:{
  models:[{id:144,manufacturer:'Harley-Davidson',model:'Road King'}],
  routes:[{entity_type:'model',model_id:144,public_path:url,
   publication_state:'candidate',source_verified_at:'2026-11-04'}]
 }};
}
test('stages only labelled exact source content without editing pages',t=>{
 const d=fixture();t.after(()=>fs.rmSync(d.root,{recursive:true,force:true}));
 const r=stageModelContentEvidence(d);
 assert.equal(r.counts.knownModelRoutes,1);
 assert.equal(r.counts.sectionCandidates,2);
 assert.deepEqual(r.candidates.map(x=>x.category_key),['buying_guidance','chronology']);
 assert.ok(r.candidates.every(x=>x.review_state==='source_captured'));
 assert.equal(fs.readFileSync(path.join(d.root,d.url.slice(1)),'utf8'),d.html);
});
test('unverified, duplicated and unsafe source routes are rejected',t=>{
 const d=fixture();t.after(()=>fs.rmSync(d.root,{recursive:true,force:true}));
 const source=d.data.routes[0];
 d.data.routes=[{...source,source_verified_at:null},{...source},{...source}];
 const r=stageModelContentEvidence(d);
 assert.equal(r.counts.sectionCandidates,2);
 assert.equal(r.skipped.length,2);
 assert.equal(r.skipped[0].reason,'unverified-or-duplicate-model-route');
});
test('source noindex does not enter the review queue',t=>{
 const d=fixture();t.after(()=>fs.rmSync(d.root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(d.root,d.url.slice(1)),d.html.replace('index,follow','noindex,follow'));
 const r=stageModelContentEvidence(d);
 assert.equal(r.counts.sectionCandidates,0);
 assert.ok(r.skipped.some(x=>x.reason==='source-noindex'));
});
