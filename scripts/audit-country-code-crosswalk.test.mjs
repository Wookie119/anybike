import test from 'node:test';
import assert from 'node:assert/strict';
import {auditCountryCodeCrosswalk} from './audit-country-code-crosswalk.mjs';

const directory=[
 {name:'Kenya',region:'Africa',url:'/markets/kenya.html'},
 {name:'France',region:'Europe',url:'/markets/france.html'},
 {name:'Belgium',region:'Europe',url:'/markets/belgium.html'}
];
const marketData={
 KE:{country:'Kenya'},FR:{country:'France'},MQ:{country:'France'},
 BE:{country:'Belgium'}
};
const mk=(slug,name,region,code)=>({
 entity_type:'country',country_slug:slug,country_name:name,country_region:region,
 public_path:'/markets/'+slug+'.html',country_code:code
});
const routes=[mk('kenya','Kenya','Africa','KE'),
 mk('france','France','Europe',null),mk('belgium','Belgium','Europe','BE')];
test('exact codes pass while ambiguous France stays unresolved',()=>{
 const r=auditCountryCodeCrosswalk({routes,directory,marketData});
 assert.equal(r.counts.routes,3);
 assert.equal(r.counts.verifiedUniqueCodes,2);
 assert.equal(r.counts.unresolvedNames,1);
 assert.deepEqual(r.issues,[]);
 assert.equal(r.unresolved[0].path,'/markets/france.html');
});
test('wrong code or changed market name is blocked',()=>{
 const incorrect=[{...routes[0],country_code:'BE'},routes[1],routes[2]];
 const a=auditCountryCodeCrosswalk({routes:incorrect,directory,marketData});
 assert.ok(a.issues.some(x=>x.code==='code-contradicts-unique-source'));
 const changed=[{...routes[0],country_name:'Unknown'},routes[1],routes[2]];
 const b=auditCountryCodeCrosswalk({routes:changed,directory,marketData});
 assert.ok(b.issues.some(x=>x.code==='unmatched-directory-identity'));
});
test('missing easy match is a source-regression issue, not invented',()=>{
 const a=auditCountryCodeCrosswalk({routes:[{...routes[0],country_code:null},...routes.slice(1)],directory,marketData});
 assert.ok(a.issues.some(x=>x.code==='missing-exact-country-code'));
});
