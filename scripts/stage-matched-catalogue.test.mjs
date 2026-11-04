import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {stageMatchedCatalogue} from './stage-matched-catalogue.mjs';

test('matched catalogue staging uses existing canonical guide files only',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-matched-src-'));
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-matched-preview-'));
 t.after(()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(output,{recursive:true,force:true});});
 const names=['bmw-motorcycles.html','bmw-r1300gs.html'];
 for(const file of names){
  fs.writeFileSync(path.join(root,file),'<html><head><meta name="robots" content="index,follow"><link rel="canonical" href="https://www.anybike.co.uk/'+file+'"></head><body><main><h1>Existing approved guide</h1></main></body></html>');
 }
 fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset>'+names.map(f=>'<url><loc>https://www.anybike.co.uk/'+f+'</loc></url>').join('')+'</urlset>');
 const snapshot=path.join(root,'snapshot.json');
 fs.writeFileSync(snapshot,JSON.stringify({manufacturers:[{id:15,display_name:'BMW'}],models:[{id:77,manufacturer:'BMW',model:'R 1300 GS'},{id:999,manufacturer:'BMW',model:'Unmatched Variant'}]}));
 const original=fs.readFileSync(path.join(root,names[0]),'utf8');
 const result=stageMatchedCatalogue({root,snapshot,output});
 assert.equal(result.catalogueModels,2);
 assert.equal(result.matchedPublicGuideSources,2);
 assert.equal(result.reciprocalPreviewLinks,2);
 assert.equal(result.staged.length,2);
 assert.equal(result.stageErrors.length,0);
 assert.equal(result.sourceFilesModified,false);
 assert.equal(fs.readFileSync(path.join(root,names[0]),'utf8'),original);
 assert.match(fs.readFileSync(path.join(output,names[0]),'utf8'),/href="\/bmw-r1300gs\.html"/);
 assert.equal(fs.existsSync(path.join(output,'bmw-unmatched-variant.html')),false);
});
