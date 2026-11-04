import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {stageApprovedModelPhotoReferences} from './stage-approved-model-photo-references.mjs';

test('stages verified public Commons reference only without modifying source',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-model-photo-ref-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const file='harley-davidson-fat-boy.html',url='/'+file;
 const html='<html><head><link rel="canonical" href="https://www.anybike.co.uk'+url+'"></head>'+
 '<body><h1>Harley-Davidson Fat Boy</h1>'+
 '<img src="https://commons.wikimedia.org/wiki/Special:FilePath/Fat_Boy.jpg" alt="Photo">'+
 '<a href="https://commons.wikimedia.org/wiki/File:Fat_Boy.jpg">Attribution</a>'+
 '<img src="https://example.com/private-seller-photo.jpg">'+
 '</body></html>';
 fs.writeFileSync(path.join(root,file),html);
 const data={models:[{id:127,manufacturer:'Harley-Davidson',model:'Fat Boy'}],
  routes:[{entity_type:'model',model_id:127,public_path:url,source_verified_at:'2026-11-04'},
   {entity_type:'model',model_id:128,public_path:'/missing.html',source_verified_at:'2026-11-04'}]};
 const r=stageApprovedModelPhotoReferences({root,data});
 assert.equal(r.counts.candidates,1);
 assert.equal(r.candidates[0].rights_review_status,'requires_review');
 assert.equal(r.candidates[0].year_accuracy_status,'unverified');
 assert.equal(r.skipped.length,1);
 assert.equal(fs.readFileSync(path.join(root,file),'utf8'),html);
});
test('unverified source identities and duplicate model URLs never enter photo bank',()=>{
 const result=stageApprovedModelPhotoReferences({
  data:{models:[{id:127}],routes:[
   {entity_type:'model',model_id:127,public_path:'/harley-davidson-fat-boy.html',
    source_verified_at:null},
   {entity_type:'model',model_id:127,public_path:'/harley-davidson-fat-boy.html',
    source_verified_at:null}]}
 });
 assert.equal(result.counts.candidates,0);
 assert.equal(result.skipped.length,2);
});
