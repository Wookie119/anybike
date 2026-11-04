import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkRegisteredEditorialIndexability} from './check-registered-editorial-indexability.mjs';

function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-index-audit-'));
 const filename='bmw-r1300gs.html';
 const url='https://www.anybike.co.uk/'+filename;
 const html='<html><head><meta name="robots" content="index,follow"><link rel="canonical" href="'+url+'"></head><body><main><h1>BMW R 1300 GS</h1></main></body></html>';
 fs.writeFileSync(path.join(root,filename),html);
 fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset><url><loc>'+url+'</loc></url></urlset>');
 fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\n\nSitemap: https://www.anybike.co.uk/sitemap.xml\n');
 return {root,filename,html};
}
const models=[{id:77,manufacturer:'BMW',model:'R 1300 GS'}];
const opts=root=>({root,models,manufacturers:[],expectedPaths:['/bmw-r1300gs.html']});
test('source-page Google crawlability guards pass a clean guide',t=>{
 const {root}=setup();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const r=checkRegisteredEditorialIndexability(opts(root));
 assert.equal(r.checkedCount,1);
 assert.equal(r.sourceEligibleCount,1);
 assert.deepEqual(r.issues,[]);
});
test('source checks reject Google noindex and canonical mismatch',t=>{
 const {root,filename,html}=setup();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,filename),html.replace('index,follow','noindex,follow').replace('bmw-r1300gs.html','bmw-wrong.html'));
 const r=checkRegisteredEditorialIndexability(opts(root));
 assert.ok(r.issues.some(i=>i.code==='expected-route-not-source-eligible'));
});
test('robots policy and sitemap absence block a green source report',t=>{
 const {root,filename}=setup();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nDisallow: /\n');
 fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset></urlset>');
 const r=checkRegisteredEditorialIndexability(opts(root));
 assert.ok(r.issues.some(i=>i.code==='robots-crawl-policy-needs-review'));
 assert.ok(r.issues.some(i=>i.code==='expected-route-not-source-eligible'));
});
