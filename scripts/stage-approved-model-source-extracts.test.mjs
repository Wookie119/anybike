import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {stageApprovedModelSourceExtracts} from './stage-approved-model-source-extracts.mjs';

const BASE='https://www.anybike.co.uk';
function prepare() {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-extract-model-'));
 const name='harley-davidson-fat-boy.html';
 const source='<html><head><link rel="canonical" href="'+BASE+'/'+name+'">'+
 '<meta name="robots" content="index,follow"></head><body><main><h1>Harley-Davidson Fat Boy</h1>'+
 '<p class="lead">Introduced in 1990 with later Softail revisions and year-specific technology.</p>'+
 '</main></body></html>';
 fs.writeFileSync(path.join(root,name),source);
 const data={
  routes:[{entity_type:'model',model_id:127,public_path:'/'+name,source_verified_at:'2026-11-04',publication_state:'candidate'},
   {entity_type:'model',model_id:999,public_path:'/unpublished.html',source_verified_at:'2026-11-04',publication_state:'candidate'}],
  models:[{id:127,manufacturer:'Harley-Davidson',model:'Fat Boy'},
   {id:999,manufacturer:'BMW',model:'Unpublished'}]
 };
 return {root,name,source,data};
}
test('extracts only verified existing model source with Git blob SHA',t=>{
 const d=prepare();t.after(()=>fs.rmSync(d.root,{recursive:true,force:true}));
 const report=stageApprovedModelSourceExtracts(d);
 assert.equal(report.summary.captured,1);
 assert.equal(report.summary.skipped,1);
 assert.equal(report.candidates[0].model_id,127);
 assert.match(report.candidates[0].source_sha,/^[a-f0-9]{40}$/);
 assert.equal(report.candidates[0].extraction_status,'source_capture_only');
 assert.equal(fs.readFileSync(path.join(d.root,d.name),'utf8'),d.source);
});
test('name mismatch does not enter model research',t=>{
 const d=prepare();t.after(()=>fs.rmSync(d.root,{recursive:true,force:true}));
 d.data.models[0].model='Street Glide';
 const report=stageApprovedModelSourceExtracts(d);
 assert.equal(report.summary.captured,0);
 assert.ok(report.skipped.some(x=>x.reason==='source-model-name-mismatch'));
});
test('invalid or duplicate model route cannot publish twice',t=>{
 const d=prepare();t.after(()=>fs.rmSync(d.root,{recursive:true,force:true}));
 d.data.routes.push({...d.data.routes[0]});
 const report=stageApprovedModelSourceExtracts(d);
 assert.equal(report.summary.captured,1);
 assert.ok(report.skipped.some(x=>x.reason==='invalid-or-duplicate-source-route'));
});
