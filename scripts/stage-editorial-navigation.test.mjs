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
