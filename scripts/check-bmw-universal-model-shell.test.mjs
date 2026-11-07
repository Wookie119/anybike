import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pages=fs.readdirSync('.').filter(name=>
 /^bmw-[a-z0-9-]+\.html$/.test(name)&&
 !/(?:motorcycles|backup|development|approved|-v2)\.html$/.test(name));
const dedicated=new Set(['bmw-r1250gs.html','bmw-r1300gs.html','bmw-s1000rr.html']);
test('every published BMW model route loads a shared model shell and editorial sections',()=>{
 assert.equal(pages.length,27,'Unexpected BMW model-route count; inspect catalogue before rollout');
 for(const path of pages){
  const html=fs.readFileSync(path,'utf8');
  assert.match(html,/class="hero/,path+' hero missing');
  assert.match(html,/id="generationPanel"/,path+' documented model panel missing');
  assert.match(html,/id="body"/,path+' data-driven research grid missing');
  assert.match(html,/public-header\.js/,path+' shared renderer missing');
  if(!dedicated.has(path)){
   assert.match(html,/id="nextAction"/,path+' no sourcing action');
  }
 }
});
test('standard BMW models use one sales-first stock layout, standalone research and one enquiry',()=>{
 const shared=fs.readFileSync('public-header.js','utf8');
 assert.match(shared,/main\.classList\.add\('anybike-universal-model-layout'\)/);
 assert.match(shared,/if\(hero\)hero\.after\(section\)/);
 assert.match(shared,/else section\.after\(research\)/);
 assert.match(shared,/section\.append\(title,note,stockGrid,liveBrowse,stockLink\)/);
 assert.match(shared,/\}else research\.after\(enquiry\)/);
 assert.match(shared,/form\.style\.cssText='display:grid;gap:12px;width:100%;max-width:1280px/);
 assert.match(shared,/No '\+make\+' '\+model\+' motorcycles are currently published/);
 assert.match(shared,/stockLink\.textContent=matches\.length\?/);
 const css=fs.readFileSync('public-header.css','utf8');
 assert.match(css,/UNIVERSAL BMW\/HARLEY MODEL SHELL/);
 assert.match(css,/main\.anybike-universal-model-layout > \.anybike-model-research/);
 assert.match(css,/border:1px solid #ed1c24!important/);
 assert.match(css,/background:#252525!important/);
});
test('publication model discovery reuses pre-existing navigation rather than creating duplicates',()=>{
 const discovery=fs.readFileSync('public-model-discovery.js','utf8');
 assert.match(discovery,/const relatedPanel=document\.querySelector/);
 assert.match(discovery,/const existingNav=relatedPanel\?\.querySelector\('nav'\)/);
 assert.match(discovery,/if\(existingNav\)\{/);
 assert.match(discovery,/existingNav\.append\(link\)/);
 assert.match(discovery,/relatedPanel\.dataset\.anybikeModelDiscovery="1"/);
 const f900=fs.readFileSync('bmw-f900gs.html','utf8');
 assert.match(f900,/data-anybike-related-links=/);
});
test('dedicated R1300 approval stays intact, and empty R1250 sales use sourcing instead of unrelated bikes',()=>{
 const r1300=fs.readFileSync('bmw-r1300gs.html','utf8');
 const r1250=fs.readFileSync('bmw-r1250gs.html','utf8');
 assert.match(r1300,/id="internationalModelStock"/);
 assert.match(r1300,/id="ukR1300ModelGallery"/);
 assert.match(r1250,/id="r1250LiveStock"/);
 assert.match(r1250,/No BMW R 1250 GS motorcycles are currently published/);
 assert.match(r1250,/const matches=exact;/);
 assert.ok(r1300.indexOf('id="internationalModelStock"')<r1300.indexOf('id="generationPanel"'));
 assert.ok(r1250.indexOf('id="r1250LiveStock"')<r1250.indexOf('id="ukR1250ModelGallery"'));
});
