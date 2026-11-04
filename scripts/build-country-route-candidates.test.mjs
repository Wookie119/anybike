import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCountryRouteCandidates} from './build-country-route-candidates.mjs';

test('only source-eligible market pages become private candidate rows',()=>{
 const result=makeCountryRouteCandidates({pages:[
  {path:'markets/kenya.html',url:'https://www.anybike.co.uk/markets/kenya.html',sourceEligible:true},
  {path:'markets/france.html',url:'https://www.anybike.co.uk/markets/france.html',sourceEligible:false},
  {path:'markets/../admin.html',url:'https://www.anybike.co.uk/markets/../admin.html',sourceEligible:true}
 ],issues:[]});
 assert.equal(result.rows.length,1);
 assert.equal(result.rows[0].country_slug,'kenya');
 assert.equal(result.rows[0].publication_state,'candidate');
 assert.equal(result.rows[0].public_path,'/markets/kenya.html');
 assert.equal(result.excluded.length,2);
});
test('rejects duplicate and flagged market sitemap entries',()=>{
 const page={path:'markets/kenya.html',url:'https://www.anybike.co.uk/markets/kenya.html',sourceEligible:true};
 const out=makeCountryRouteCandidates({pages:[page,{...page,path:'markets/samoa.html',url:'https://www.anybike.co.uk/markets/samoa.html'}],issues:[
  {code:'duplicate-market-sitemap-loc',path:'https://www.anybike.co.uk/markets/kenya.html'}
 ]});
 assert.deepEqual(out.rows.map(r=>r.country_slug),['samoa']);
});
test('no publisher credentials or live-verification claims appear in candidates',()=>{
 const result=makeCountryRouteCandidates({pages:[
  {path:'markets/samoa.html',url:'https://www.anybike.co.uk/markets/samoa.html',sourceEligible:true}
 ],issues:[]});
 assert.equal(Object.hasOwn(result.rows[0],'live_verified_at'),false);
 assert.equal(Object.hasOwn(result.rows[0],'editorial_verified_at'),false);
 assert.match(result.scope,/no automatic/);
});
