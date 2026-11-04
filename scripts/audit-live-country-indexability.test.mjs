import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectCountryHttpResponse,auditLiveCountryIndexability} from './audit-live-country-indexability.mjs';
const kenya='https://www.anybike.co.uk/markets/kenya.html';
const belgium='https://www.anybike.co.uk/markets/belgium.html';
function html(url) {
 return '<html><head><meta name="robots" content="index,follow"><link rel="canonical" href="'+url+'"></head><body><h1>Market</h1></body></html>';
}
test('live indexable response has correct self-canonical and no robots blocks',()=>{
 const result=inspectCountryHttpResponse({url:kenya,status:200,finalUrl:kenya,headers:{},html:html(kenya)});
 assert.deepEqual(result.issues,[]);
});
test('HTTP-level robots blocks, redirects and non-self canonical fail',()=>{
 const r=inspectCountryHttpResponse({url:kenya,status:301,finalUrl:belgium,
   headers:{'x-robots-tag':'noindex,follow'},html:html(belgium)});
 assert.ok(r.issues.includes('x-robots-tag-block'));
 assert.ok(r.issues.includes('unexpected-redirect'));
 assert.ok(r.issues.includes('canonical-mismatch'));
 assert.ok(r.issues.includes('http-status-301'));
});
test('live meta robots restriction is detected',()=>{
 const r=inspectCountryHttpResponse({url:kenya,status:200,finalUrl:kenya,
  html:html(kenya).replace('index,follow','noindex,nofollow')});
 assert.ok(r.issues.includes('meta-robots-block'));
});
test('network errors are separately counted, not treated as indexed',async()=>{
 const request=async url=>{
  if(url===belgium)throw new Error('Network unavailable');
  return {status:200,url,headers:{get:()=>null},text:async()=>html(url)};
 };
 const result=await auditLiveCountryIndexability({urls:[kenya,belgium],request,parallel:2});
 assert.deepEqual(result.totals,{listed:2,passed:1,flagged:0,networkUnavailable:1});
 assert.equal(result.results[1].checked,false);
});
test('noncanonical or duplicate target URLs are rejected',async()=>{
 await assert.rejects(()=>auditLiveCountryIndexability({urls:[kenya,kenya]}),/distinct/);
 await assert.rejects(()=>auditLiveCountryIndexability({urls:['https://other.example/markets/kenya.html']}),/distinct/);
});
