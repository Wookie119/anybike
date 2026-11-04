import test from 'node:test';
import assert from 'node:assert/strict';
import {regionalMarketNavigation} from './regional-market-navigation.mjs';
const sample=[
 ['kenya','Kenya','Africa'],['ghana','Ghana','Africa'],['uganda','Uganda','Africa'],
 ['tanzania','Tanzania','Africa'],['morocco','Morocco','Africa'],
 ['belgium','Belgium','Europe'],['france','France','Europe']
].map(([slug,name,region])=>({
 entity_type:'country',country_slug:slug,country_name:name,country_region:region,
 public_path:'/markets/'+slug+'.html',publication_state:'candidate',
 source_verified_at:'2026-11-04',live_verified_at:null,editorial_verified_at:null
}));
test('staging links regional countries without inventing model availability',()=>{
 const r=regionalMarketNavigation({routes:sample,mode:'staging',maxLinks:3});
 assert.equal(r.counts.eligibleCountryRoutes,7);
 assert.equal(r.counts.regions,2);
 const kenya=r.pages.find(p=>p.id==='country:kenya');
 assert.equal(kenya.links.length,3);
 assert.ok(kenya.links.every(l=>l.type==='country'&&l.relationship==='same-region-navigation'));
 assert.ok(kenya.links.every(l=>!l.url.includes('/france')&&!l.url.includes('/belgium')));
 assert.equal(r.pages.find(p=>p.id==='country:france').links.length,1);
 assert.equal(r.pages.every(p=>p.published===false),true);
});
test('candidate routes NEVER appear in published navigation',()=>{
 const r=regionalMarketNavigation({routes:sample,mode:'published'});
 assert.equal(r.pages.length,0);
 assert.equal(r.counts.generatedNavigationLinks,0);
});
test('published navigation needs every independent verification gate',()=>{
 const verified=sample.map(r=>({...r,publication_state:'published',
  live_verified_at:'2026-11-04',editorial_verified_at:'2026-11-04'}));
 const missing={...verified[0],live_verified_at:null};
 const r=regionalMarketNavigation({routes:[missing,...verified.slice(1)],mode:'published',maxLinks:2});
 assert.equal(r.pages.some(p=>p.id==='country:kenya'),false);
 assert.equal(r.pages.length,6);
 assert.ok(r.pages.every(p=>p.published===true));
});
test('invalid geography and duplicate records do not create extra links',()=>{
 const r=regionalMarketNavigation({routes:[...sample,{...sample[0]},
 {...sample[0],country_slug:'wrong',public_path:'/admin-settings.html'},
 {...sample[0],country_slug:'bad',public_path:'/markets/bad.html',country_region:'Unknown'}],mode:'staging'});
 assert.equal(r.pages.length,7);
 assert.equal(r.diagnostics.filter(x=>x.code==='duplicate-country-route').length,1);
});
