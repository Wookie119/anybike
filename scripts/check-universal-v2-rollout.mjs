#!/usr/bin/env node
// AnyBike universal model rollout: source-level regression guard.
// Run from repository root: node scripts/check-universal-v2-rollout.mjs
// These checks do not assert that 123-reg is deployed or that browser QA passed.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const header=read('public-header.js');
const shared=read('motorcycle-model-guide.html');
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
check('One shared V2 layout directly loaded by universal model route',()=>{
 assert.match(shared,/r1300-v2-universal-rollout\.css\?v=/);
 assert.match(shared,/<body class="anybike-v2-model-rollout">/);
 assert.match(shared,/id="generationPanel"/);
 assert.match(shared,/id="body"/);
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
check('Verified model data, approved photography and exact-stock isolation remain in place',()=>{
 assert.match(shared,/public-verified-model-facts\.mjs/);
 assert.match(shared,/public-approved-model-hero\.mjs/);
 assert.match(shared,/public-approved-model-gallery\.mjs/);
 assert.match(shared,/public-exact-model-stock\.mjs/);
 assert.match(facts,/exactVerifiedModelFacts/);
 assert.match(stock,/matchingPublishedMotorcycles/);
 assert.match(hero,/approved/i);
 assert.match(gallery,/approved/i);
});
check('Customer lead/sourcing paths survive',()=>{
 assert.match(shared,/id="sourceBottom"/);
 assert.match(shared,/id="sellBottom"/);
 assert.match(shared,/bulk-buying-request\.html/);
 assert.match(shared,/uk-motorcycle-selling\.html/);
});
if(process.exitCode)console.error('Universal V2 source checks FAILED. Live role and visual checks are still required.');
else console.log('Universal V2 source checks passed. Live role and visual checks are still required.');
