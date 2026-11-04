import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inventoryEditorialUrls } from './build-editorial-url-inventory.mjs';

function fixture({ includeSecond=false } = {}) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-editorial-'));
 fs.mkdirSync(path.join(root,'markets'));
 const write=(rel,body)=>fs.writeFileSync(path.join(root,rel),body);
 const page=(canonical,extra='')=>`<!doctype html><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}"><h1>Guide</h1>${extra}`;
 write('markets/kenya.html',page('https://www.anybike.co.uk/markets/kenya.html'));
 write('bmw-motorcycles.html',page('https://www.anybike.co.uk/bmw-motorcycles.html'));
 write('admin-dashboard.html',page('https://www.anybike.co.uk/admin-dashboard.html'));
 write('bmw-r1250gs.html',page('https://www.anybike.co.uk/bmw-r1250gs.html','<meta name="robots" content="noindex">'));
 if(includeSecond)write('anybike-global.html',page('https://www.anybike.co.uk/anybike-global.html'));
 write('sitemap.xml','<urlset><url><loc>https://www.anybike.co.uk/markets/kenya.html</loc></url><url><loc>https://www.anybike.co.uk/bmw-motorcycles.html</loc></url><url><loc>https://www.anybike.co.uk/bmw-r1250gs.html</loc></url></urlset>');
 return root;
}
test('counts selected public source files without treating them as published',t=>{
 const root=fixture();
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const r=inventoryEditorialUrls(root);
 assert.equal(r.scope.includes('not proof'),true);
 assert.equal(r.counts.total,3);
 assert.equal(r.counts.eligible,2);
 assert.equal(r.candidates.some(x=>x.path==='admin-dashboard.html'),false);
 assert.equal(r.candidates.find(x=>x.path==='bmw-r1250gs.html').sourceEligible,false);
});
test('missing sitemap entry is flagged even when source canonical exists',t=>{
 const root=fixture({includeSecond:true});
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const r=inventoryEditorialUrls(root);
 assert.equal(r.candidates.find(x=>x.path==='anybike-global.html').sourceEligible,false);
 assert.ok(r.issues.some(x=>x.path==='anybike-global.html'&&x.reasons.includes('not-in-sitemap')));
});

test('other manufacturers and models are discovered only from supplied catalogue identities',t=>{
 const root=fixture();
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const name='ducati-monster-1200.html';
 const make='ducati-motorcycles.html';
 const html=(f)=>'<link rel="canonical" href="https://www.anybike.co.uk/'+f+'"><h1>Guide</h1>';
 fs.writeFileSync(path.join(root,name),html(name));
 fs.writeFileSync(path.join(root,make),html(make));
 fs.appendFileSync(path.join(root,'sitemap.xml'),'<loc>https://www.anybike.co.uk/'+name+'</loc><loc>https://www.anybike.co.uk/'+make+'</loc>');
 const without=inventoryEditorialUrls(root);
 assert.equal(without.candidates.some(x=>x.path===name),false);
 const withCatalogue=inventoryEditorialUrls(root,{manufacturers:[{id:99,display_name:'Ducati'}],models:[{id:100,manufacturer:'Ducati',model:'Monster 1200'}]});
 assert.equal(withCatalogue.candidates.find(x=>x.path===name).type,'model');
 assert.equal(withCatalogue.candidates.find(x=>x.path===make).type,'manufacturer');
 assert.equal(withCatalogue.candidates.find(x=>x.path===name).sourceEligible,true);
});
