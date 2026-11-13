#!/usr/bin/env node
// AnyBike universal model rollout: source-level regression guard.
// Run from repository root: node scripts/check-universal-v2-rollout.mjs
// These checks do not assert that 123-reg is deployed or that browser QA passed.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const header=read('public-header.js');
const shared=read('motorcycle-model-guide.html');
const sourceMaster=read('motorcycle-v2-master.html');
const renderer=read('model-template/approved-v2-universal-preview.mjs');
const css=read('model-template/r1300-v2-universal-rollout.css');
const approved=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const master=read('bmw-r1300gs-v2.html');
const facts=read('model-template/public-verified-model-facts.mjs');
const stock=read('model-template/public-exact-model-stock.mjs');
const gallery=read('model-template/public-approved-model-gallery.mjs');
const hero=read('model-template/public-approved-model-hero.mjs');

const check=(label,fn)=>{
 try{fn();console.log('PASS',label);}
 catch(err){console.error('FAIL',label,err.message);process.exitCode=1;}
};
check('Generic model route uses the exact shared V2 renderer and section layout',()=>{
 assert.match(shared,/approved-v2-preview-style\.css\?v=/);
 assert.match(shared,/approved-v2-universal-preview\.mjs\?v=/);
 assert.match(shared,/approved-v2-dynamic-navigation\.mjs\?v=/);
 assert.match(shared,/id="generationPanel"/);
 assert.match(shared,/id="body"/);
 const sections=html=>[...html.matchAll(/<section\b([^>]*)>/g)].map(x=>x[1]);
 assert.deepEqual(sections(shared),sections(sourceMaster));
 assert.match(shared,/name="robots" content="index,follow"/);
});
check('V2 rollout never modifies the protected BMW master',()=>{
 assert.match(header,/protectedMaster/);
 assert.match(header,/path==='\/bmw-r1300gs-v2\.html'/);
 assert.doesNotMatch(master,/anybike-v2-model-rollout/);
});
check('Incompatible legacy designs fail closed',()=>{
 assert.match(header,/const compatible=!!document\.querySelector\('main #generationPanel'\)/);
 assert.match(header,/!!document\.querySelector\('main #body'\)/);
 assert.match(header,/!compatible/);
});
check('All 27 approved dedicated BMW routes contain a compatible surface',()=>{
 const bmw=approved.filter(row=>row.make==='BMW');
 assert.equal(bmw.length,27);
 for(const row of bmw){
  const html=read(row.url.slice(1));
  assert.match(html,/id="generationPanel"/,row.url);
  assert.match(html,/id="body"/,row.url);
  assert.match(html,/public-header\.js/,row.url);
 }
});
check('All 18 approved dedicated Harley pages preserved, not overwritten',()=>{
 const harley=approved.filter(row=>row.make==='Harley-Davidson');
 assert.equal(harley.length,18);
 for(const row of harley){
  const html=read(row.url.slice(1));
  assert.doesNotMatch(html,/anybike-v2-model-rollout/,row.url);
  assert.match(html,/public-header\.js/,row.url);
 }
});
check('The shared layout has accessible contrast, readable cards and mobile flow',()=>{
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/border-left:3px solid #ed1c24/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/focus-visible/);
});
check('V2 research, approved photography and exact-stock isolation remain in place',()=>{
 assert.match(renderer,/installVerifiedModelFacts/);
 assert.match(renderer,/public_anybike_model_hero_v1/);
 assert.match(renderer,/public_anybike_verified_model_gallery_v1/);
 assert.match(renderer,/stockForCanonicalModel/);
 assert.match(renderer,/international-public-stock/);
 assert.match(facts,/exactVerifiedModelFacts/);
 assert.match(stock,/matchingPublishedMotorcycles/);
 assert.match(hero,/approved/i);
 assert.match(gallery,/approved/i);
});
check('Customer lead and sourcing paths survive the V2 migration',()=>{
 assert.match(shared,/id="sourceBottom"/);
 assert.match(shared,/id="v2UkSellAction"/);
 assert.match(shared,/id="internationalGuestRequestForm"/);
 assert.match(renderer,/international-guest-enquiry/);
 assert.match(shared,/bulk-buying-request\.html/);
 assert.match(renderer,/sell-your-motorcycle\.html/);
});
check('Legacy guide research remains exact-identity-only',()=>{
 assert.match(renderer,/supplementPublishedV2Guide/);
 assert.match(renderer,/motorcycle-model-guides\.json/);
 assert.match(renderer,/exact.length===1/);
 assert.match(renderer,/canonicalPath/);
});
if(process.exitCode)console.error('Universal V2 source checks FAILED. Live role and visual checks are still required.');
else console.log('Universal V2 source checks passed. Live role and visual checks are still required.');
