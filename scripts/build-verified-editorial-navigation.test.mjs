import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildVerifiedEditorialNavigation} from './build-verified-editorial-navigation.mjs';

const BASE='https://www.anybike.co.uk';
function setup() {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-publisher-source-'));
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-publisher-preview-'));
 fs.mkdirSync(path.join(root,'markets'));
 const pages=['bmw-motorcycles.html','bmw-r1300gs.html','markets/kenya.html','markets/ghana.html'];
 for(const rel of pages){
  const html='<html><head><meta name="robots" content="index,follow">'+
    '<link rel="canonical" href="'+BASE+'/'+rel+'"></head>'+
    '<body><main><h1>Approved existing guide</h1><p>Do not change this text</p></main></body></html>';
  fs.writeFileSync(path.join(root,rel),html);
 }
 fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset>'+pages.map(rel=>
   '<url><loc>'+BASE+'/'+rel+'</loc></url>').join('')+'</urlset>');
 const common={publication_state:'published',
  source_verified_at:'2026-11-04',live_verified_at:'2026-11-04',editorial_verified_at:'2026-11-04'};
 const route=(slug,name,code)=>({...common,entity_type:'country',
  country_slug:slug,country_name:name,country_region:'Africa',
  country_code:code,public_path:'/markets/'+slug+'.html'});
 const data={
  routes:[
   {...common,entity_type:'manufacturer',manufacturer_id:15,public_path:'/bmw-motorcycles.html'},
   {...common,entity_type:'model',model_id:77,public_path:'/bmw-r1300gs.html'},
   route('kenya','Kenya','KE'),route('ghana','Ghana','GH')
  ],
  manufacturers:[{id:15,display_name:'BMW'}],
  models:[{id:77,manufacturer:'BMW',model:'R 1300 GS'},
   {id:999,manufacturer:'BMW',model:'Unpublished variant'}],
  countryLinks:[{model_id:77,country_code:'KE',market_url:'/markets/kenya.html',is_published:true}],
  globalStories:[],
  storyManufacturers:[],
  modelRelationships:[]
 };
 return {root,output,data,pages};
}
test('full verified pipeline stages reciprocal manufacturer, model and region links',t=>{
 const d=setup();
 t.after(()=>{fs.rmSync(d.root,{recursive:true,force:true});fs.rmSync(d.output,{recursive:true,force:true});});
 const original=fs.readFileSync(path.join(d.root,'bmw-r1300gs.html'),'utf8');
 const report=buildVerifiedEditorialNavigation(d);
 assert.equal(report.inputRoutes,4);
 assert.equal(report.publicationGatePassed,4);
 assert.equal(report.publishedSourceEligiblePages,4);
 assert.equal(report.generatedLinks,6);
 assert.equal(report.stagedPages,4);
 assert.equal(report.sourceFilesModified,false);
 assert.deepEqual(report.diagnostics,[]);
 assert.equal(fs.readFileSync(path.join(d.root,'bmw-r1300gs.html'),'utf8'),original);
 const model=fs.readFileSync(path.join(d.output,'bmw-r1300gs.html'),'utf8');
 assert.match(model,/href="\/bmw-motorcycles\.html"/);
 assert.match(model,/href="\/markets\/kenya\.html"/);
 assert.doesNotMatch(model,/Unpublished variant/);
});
test('264-style candidate-only export cannot generate published pages or links',t=>{
 const d=setup();
 t.after(()=>{fs.rmSync(d.root,{recursive:true,force:true});fs.rmSync(d.output,{recursive:true,force:true});});
 d.data.routes=d.data.routes.map(r=>({...r,publication_state:'candidate',live_verified_at:null}));
 const report=buildVerifiedEditorialNavigation(d);
 assert.equal(report.publicationGatePassed,0);
 assert.equal(report.publicationGateBlocked,4);
 assert.equal(report.generatedLinks,0);
 assert.equal(report.stagedPages,0);
 assert.equal(report.diagnostics.length,0);
});
test('source noindex prevents even independently verified database identity',t=>{
 const d=setup();
 t.after(()=>{fs.rmSync(d.root,{recursive:true,force:true});fs.rmSync(d.output,{recursive:true,force:true});});
 const src=path.join(d.root,'bmw-r1300gs.html');
 fs.writeFileSync(src,fs.readFileSync(src,'utf8').replace('index,follow','noindex,follow'));
 const report=buildVerifiedEditorialNavigation(d);
 assert.equal(report.publishedSourceEligiblePages,3);
 assert.equal(report.stagedPages,2);
 assert.ok(report.diagnostics.some(x=>x.code==='not-source-eligible'));
});
