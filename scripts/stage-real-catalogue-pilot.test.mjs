import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stageRealCataloguePilot } from './stage-real-catalogue-pilot.mjs';
const BASE='https://www.anybike.co.uk';
function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-pilot-'));
 const preview=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-pilot-preview-'));
 const directory=path.join(root,'scripts','fixtures');
 fs.mkdirSync(directory,{recursive:true});
 const html=(p)=>'<html><head><link rel="canonical" href="'+BASE+p+'"><meta name="robots" content="index,follow"></head><body><main><h1>Approved source</h1></main></body></html>';
 const files=['bmw-motorcycles.html','harley-davidson-motorcycles.html','bmw-r1300gs.html','harley-davidson-fat-boy.html'];
 for(const file of files)fs.writeFileSync(path.join(root,file),html('/'+file));
 fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset>'+files.map(f=>'<url><loc>'+BASE+'/'+f+'</loc></url>').join('')+'</urlset>');
 const snapshot=path.join(root,'data.json');
 fs.writeFileSync(snapshot,JSON.stringify({
  manufacturers:[{id:15,display_name:'BMW',url:'/bmw-motorcycles.html'},{id:28,display_name:'Harley-Davidson',url:'/harley-davidson-motorcycles.html'}],
  models:[{id:77,manufacturer:'BMW',model:'R 1300 GS',url:'/bmw-r1300gs.html'},{id:127,manufacturer:'Harley-Davidson',model:'Fat Boy',url:'/harley-davidson-fat-boy.html'}]
 }));
 return {root,preview,snapshot};
}
test('pilot creates four source-based previews, four reciprocal links and leaves source unchanged',t=>{
 const {root,preview,snapshot}=setup();
 t.after(()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(preview,{recursive:true,force:true});});
 const original=fs.readFileSync(path.join(root,'bmw-motorcycles.html'),'utf8');
 const report=stageRealCataloguePilot({root,output:preview,snapshot});
 assert.equal(report.candidatePages,4);
 assert.equal(report.links,4);
 assert.equal(report.staging.staged.length,4);
 assert.equal(report.staging.errors.length,0);
 assert.equal(report.staging.sourceFilesModified,false);
 assert.equal(fs.readFileSync(path.join(root,'bmw-motorcycles.html'),'utf8'),original);
 assert.match(fs.readFileSync(path.join(preview,'bmw-motorcycles.html'),'utf8'),/BMW R 1300 GS/);
 assert.match(fs.readFileSync(path.join(preview,'bmw-r1300gs.html'),'utf8'),/href="\/bmw-motorcycles\.html"/);
});
test('noindex source pages do not enter pilot graph',t=>{
 const {root,preview,snapshot}=setup();
 t.after(()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(preview,{recursive:true,force:true});});
 const fat=path.join(root,'harley-davidson-fat-boy.html');
 fs.writeFileSync(fat,fs.readFileSync(fat,'utf8').replace('index,follow','noindex,follow'));
 const report=stageRealCataloguePilot({root,output:preview,snapshot});
 assert.equal(report.exclusions.length,1);
 assert.equal(report.candidatePages,3);
 assert.equal(report.links,2);
 assert.equal(fs.existsSync(path.join(preview,'harley-davidson-fat-boy.html')),false);
});
