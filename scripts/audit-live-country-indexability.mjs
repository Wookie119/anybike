/**
 * Live HTTP indexability smoke audit for sitemap-listed international markets.
 *
 * Safe GET requests only; no credentials, no writes, no login. Host-side
 * behaviour is assessed from a normal HTTP client, not Google Search Console.
 * The report explicitly distinguishes network failures from page failures.
 *
 * node scripts/audit-live-country-indexability.mjs
 * --strict: exit nonzero if any failed checks
 */
import fs from 'node:fs';

const BASE='https://www.anybike.co.uk';
const requestTimeoutMs=9000;
const concurrency=5;
function attr(tag,name) {
 return tag.match(new RegExp('\\b'+name+'\\s*=\\s*["\\x27]([^"\\x27]*)["\\x27]','i'))?.[1]||'';
}
export function inspectCountryHttpResponse({url,status,finalUrl,headers={},html=''}) {
 const issues=[];
 if(status!==200)issues.push('http-status-'+status);
 if(finalUrl!==url)issues.push('unexpected-redirect');
 const xr=String(headers['x-robots-tag']||'');
 if(/\b(?:noindex|none|nofollow)\b/i.test(xr))issues.push('x-robots-tag-block');
 const meta=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
 const metaRobots=meta.filter(t=>['robots','googlebot'].includes(attr(t,'name').toLowerCase()))
   .map(t=>attr(t,'content')).join(',');
 if(/\b(?:noindex|none|nofollow)\b/i.test(metaRobots))issues.push('meta-robots-block');
 const canon=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0])
   .filter(t=>attr(t,'rel').toLowerCase().split(/\s+/).includes('canonical'));
 const actual=canon.length===1?attr(canon[0],'href'):'';
 if(actual!==url)issues.push('canonical-mismatch');
 if(!/<h1\b/i.test(html))issues.push('missing-h1');
 return {url,status,finalUrl,issues,checked:true};
}
async function check(url,request) {
 try {
  const response=await request(url,{
   method:'GET',redirect:'follow',signal:AbortSignal.timeout(requestTimeoutMs),
   headers:{'User-Agent':'AnyBike-Public-Indexability-Audit/1.0'}
  });
  const html=(await response.text()).slice(0,1800000);
  return inspectCountryHttpResponse({url,status:response.status,finalUrl:response.url,
   headers:{'x-robots-tag':response.headers.get('x-robots-tag')||''},html});
 }catch(err){
  return {url,checked:false,issues:['network-unavailable'],error:String(err?.message||err).slice(0,200)};
 }
}
export async function auditLiveCountryIndexability({urls,request=fetch,parallel=concurrency}={}) {
 if(!Array.isArray(urls)||!urls.every(x=>typeof x==='string' &&
   /^https:\/\/www\.anybike\.co\.uk\/markets\/[a-z0-9-]+\.html$/.test(x)) ||
   new Set(urls).size!==urls.length)throw new Error('Must provide distinct canonical market URLs');
 const results=Array(urls.length);
 let cursor=0;
 async function worker(){
  while(cursor<urls.length){
   const i=cursor++;
   results[i]=await check(urls[i],request);
  }
 }
 await Promise.all(Array.from({length:Math.min(Math.max(1,parallel),urls.length)},worker));
 return {
  scope:'Normal HTTP checks only; not Googlebot or confirmed Google indexing',
  totals:{listed:urls.length,passed:results.filter(r=>r.checked && !r.issues.length).length,
   flagged:results.filter(r=>r.checked && r.issues.length).length,
   networkUnavailable:results.filter(r=>!r.checked).length},
  results
 };
}
if(process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
 const xml=fs.readFileSync('sitemap.xml','utf8');
 const urls=[...xml.matchAll(/<loc>\s*(https:\/\/www\.anybike\.co\.uk\/markets\/[a-z0-9-]+\.html)\s*<\/loc>/gi)].map(m=>m[1]);
 const report=await auditLiveCountryIndexability({urls});
 fs.mkdirSync('reports',{recursive:true});
 fs.writeFileSync('reports/live-country-indexability.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({scope:report.scope,totals:report.totals},null,2));
 if(process.argv.includes('--strict') && (report.totals.flagged || report.totals.networkUnavailable))process.exitCode=1;
}
