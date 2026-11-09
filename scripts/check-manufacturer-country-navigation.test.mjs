import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {groupDatabaseCountryRoutes} from '../model-template/public-country-market-navigation.mjs';

test('BMW and Harley-Davidson retain approved manufacturer pages and load the same database-driven market component',()=>{
 const script='/model-template/public-country-market-navigation.mjs?v=20261109-1';
 for(const page of ['bmw-motorcycles.html','harley-davidson-motorcycles.html']){
  const html=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  assert.ok(html.includes('<script type="module" src="'+script+'"></script>'),page+' shared market module');
  assert.ok(html.includes('<main class="wide">'),page+' original manufacturer page retained');
  assert.ok(html.includes('/public-header.js'),page+' original public header retained');
 }
});

test('manufacturer and model navigation share a single market-route parser and preserve approved destination shapes',()=>{
 const source=readFileSync(new URL('../model-template/bmw-db-research-sections.mjs',import.meta.url),'utf8');
 const shared=readFileSync(new URL('../model-template/public-country-market-navigation.mjs',import.meta.url),'utf8');
 assert.ok(source.includes("from './public-country-market-navigation.mjs'"));
 assert.ok(shared.includes("client.rpc('public_anybike_country_navigation_v1')")||
           shared.includes("db.rpc('public_anybike_country_navigation_v1')"));
 assert.ok(shared.includes("new MutationObserver("),'Legacy model loader cannot permanently discard country navigation');
 assert.ok(shared.includes("if(!el.isConnected&&body.isConnected"),'Re-attach only when the existing section disappears');
 const groups=groupDatabaseCountryRoutes([
  {region:'Europe',label:'France',url:'/markets/france.html'},
  {region:'Europe',label:'France duplicate',url:'/markets/france.html'},
  {region:'Africa',label:'Kenya',url:'/markets/kenya.html'}
 ]);
 assert.equal(groups.length,2);
 assert.equal(groups.reduce((n,g)=>n+g.entries.length,0),2);
});
