import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { renderStagedEditorialHtml, stageEditorialNavigation } from './stage-editorial-navigation.mjs';
const html='<!doctype html><html><head><title>BMW</title></head><body><main><h1>BMW guide</h1><p>Protected layout</p></main></body></html>';
const page={id:'manufacturer:15',url:'/bmw-motorcycles.html',links:[{type:'model',title:'BMW R 1300 GS',url:'/bmw-r1300gs.html'}]};
test('staged navigation appends crawlable links without deleting approved HTML',()=>{
 const out=renderStagedEditorialHtml(html,page);
 assert.match(out,/<h1>BMW guide<\/h1><p>Protected layout<\/p>/);
 assert.match(out,/<a href="\/bmw-r1300gs\.html">BMW R 1300 GS<\/a>/);
 assert.match(out,/ANYBIKE GENERATED EDITORIAL NAVIGATION START/);
 assert.equal((out.match(/<\/main>/g)||[]).length,1);
 assert.ok(out.indexOf('<h1>')<out.indexOf('ANYBIKE GENERATED'));
});
test('does not replace already modified or malformed pages',()=>{
 assert.throws(()=>renderStagedEditorialHtml(html.replace('</main>',''),page),/no closing main/);
 assert.throws(()=>renderStagedEditorialHtml(html+'<!-- ANYBIKE GENERATED EDITORIAL NAVIGATION START -->',page),/explicit review/);
});
test('staging writes copies but leaves source byte-for-byte unchanged',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-stage-src-'));
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-stage-preview-'));
 t.after(()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(output,{recursive:true,force:true});});
 fs.writeFileSync(path.join(root,'bmw-motorcycles.html'),html);
 const report=stageEditorialNavigation({root,output,graph:{pages:[page]}});
 assert.equal(report.errors.length,0);
 assert.equal(report.staged.length,1);
 assert.equal(report.sourceFilesModified,false);
 assert.equal(fs.readFileSync(path.join(root,'bmw-motorcycles.html'),'utf8'),html);
 assert.match(fs.readFileSync(path.join(output,'bmw-motorcycles.html'),'utf8'),/BMW R 1300 GS/);
});

test('one broken page blocks the whole preview batch before any file is written',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-stage-atomic-src-'));
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-stage-atomic-preview-'));
 t.after(()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(output,{recursive:true,force:true});});
 fs.writeFileSync(path.join(root,'bmw-motorcycles.html'),html);
 const bad={id:'model:999',url:'/missing-model.html',links:[{type:'manufacturer',title:'BMW',url:'/bmw-motorcycles.html'}]};
 const report=stageEditorialNavigation({root,output,graph:{pages:[page,bad]}});
 assert.equal(report.staged.length,0);
 assert.equal(report.errors.length,1);
 assert.equal(fs.existsSync(path.join(output,'bmw-motorcycles.html')),false);
 assert.equal(fs.readFileSync(path.join(root,'bmw-motorcycles.html'),'utf8'),html);
});
test('existing stale preview file cannot be silently overwritten',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-stage-reuse-src-'));
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-stage-reuse-preview-'));
 t.after(()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(output,{recursive:true,force:true});});
 fs.writeFileSync(path.join(root,'bmw-motorcycles.html'),html);
 fs.writeFileSync(path.join(output,'bmw-motorcycles.html'),'PREVIOUS STAGING FILE');
 const report=stageEditorialNavigation({root,output,graph:{pages:[page]}});
 assert.equal(report.staged.length,0);
 assert.equal(report.errors.length,1);
 assert.equal(fs.readFileSync(path.join(output,'bmw-motorcycles.html'),'utf8'),'PREVIOUS STAGING FILE');
});
test('invalid and repeated destination paths fail closed rather than silently skip',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-stage-invalid-src-'));
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-stage-invalid-preview-'));
 t.after(()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(output,{recursive:true,force:true});});
 fs.writeFileSync(path.join(root,'bmw-motorcycles.html'),html);
 const bad={...page,id:'model:bad',url:'/../private.html'};
 const duplicate={...page,id:'manufacturer:duplicate'};
 const report=stageEditorialNavigation({root,output,graph:{pages:[page,bad,duplicate]}});
 assert.equal(report.staged.length,0);
 assert.equal(report.errors.length,2);
 assert.equal(fs.readdirSync(output).length,0);
});
