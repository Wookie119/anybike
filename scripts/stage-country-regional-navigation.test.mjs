import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {stageCountryRegionalNavigation} from './stage-country-regional-navigation.mjs';
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-country-nav-'));
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-country-preview-'));
 const info=[['kenya','Kenya','Africa'],['ghana','Ghana','Africa'],
 ['belgium','Belgium','Europe'],['france','France','Europe']];
 fs.mkdirSync(path.join(root,'markets'));
 fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: https://www.anybike.co.uk/sitemap.xml\n');
 const html=(slug,name)=>'<html><head><title>'+name+'</title><meta name="description" content="A country guide"><meta name="robots" content="index,follow"><link rel="canonical" href="https://www.anybike.co.uk/markets/'+slug+'.html"></head><body><main><h1>'+name+'</h1><p>Protected content.</p></main></body></html>';
 for(const [slug,name] of info) fs.writeFileSync(path.join(root,'markets',slug+'.html'),html(slug,name));
 fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset>'+info.map(([slug])=>'<url><loc>https://www.anybike.co.uk/markets/'+slug+'.html</loc></url>').join('')+'</urlset>');
 fs.writeFileSync(path.join(root,'international-markets.html'),'<script>const markets = '+JSON.stringify(info.map(([slug,name,region])=>({name,region,status:'available',url:'/markets/'+slug+'.html'})))+';</script>');
 const snapshot=path.join(root,'routes.json');
 fs.writeFileSync(snapshot,JSON.stringify({routes:info.map(([slug,name,region])=>({
 entity_type:'country',country_slug:slug,country_name:name,country_region:region,
 public_path:'/markets/'+slug+'.html',publication_state:'candidate',
 source_verified_at:'2026-11-04',live_verified_at:null,editorial_verified_at:null
 }))}));
 return {root,output,snapshot,info};
}
test('regional preview stages four verified pages without touching original layouts',t=>{
 const d=fixture();
 t.after(()=>{fs.rmSync(d.root,{recursive:true,force:true});fs.rmSync(d.output,{recursive:true,force:true});});
 const original=fs.readFileSync(path.join(d.root,'markets','kenya.html'),'utf8');
 const result=stageCountryRegionalNavigation({...d,expectedCount:4,expectedRegions:2});
 assert.equal(result.countries,4);
 assert.equal(result.regions,2);
 assert.equal(result.generatedCountryLinks,4);
 assert.equal(result.stagedPages,4);
 assert.equal(result.originalsModified,false);
 assert.deepEqual(result.errors,[]);
 assert.equal(fs.readFileSync(path.join(d.root,'markets','kenya.html'),'utf8'),original);
 assert.match(fs.readFileSync(path.join(d.output,'markets','kenya.html'),'utf8'),/href="\/markets\/ghana\.html"/);
 assert.doesNotMatch(fs.readFileSync(path.join(d.output,'markets','kenya.html'),'utf8'),/href="\/markets\/france\.html"/);
});
test('wrong country name in snapshot cannot pass the source directory gate',t=>{
 const d=fixture();
 t.after(()=>{fs.rmSync(d.root,{recursive:true,force:true});fs.rmSync(d.output,{recursive:true,force:true});});
 const data=JSON.parse(fs.readFileSync(d.snapshot,'utf8'));
 data.routes[0].country_name='Made-up name';
 fs.writeFileSync(d.snapshot,JSON.stringify(data));
 assert.throws(()=>stageCountryRegionalNavigation({...d,expectedCount:4,expectedRegions:2}),/mismatched market route/);
});
test('country source noindex prevents staging',t=>{
 const d=fixture();
 t.after(()=>{fs.rmSync(d.root,{recursive:true,force:true});fs.rmSync(d.output,{recursive:true,force:true});});
 const file=path.join(d.root,'markets','kenya.html');
 fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('index,follow','noindex,follow'));
 assert.throws(()=>stageCountryRegionalNavigation({...d,expectedCount:4,expectedRegions:2}),/Country source audit failed/);
});
