#!/usr/bin/env node
// Read-only proof of all 978 live permanent model routes. Writes a machine-readable failure report.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='https://www.anybike.co.uk';
const manifest=JSON.parse(await fs.readFile('data/universal-v2-model-routes.json','utf8'));
assert.equal(manifest.count,978);
assert.equal(manifest.models.length,978);
assert.equal(new Set(manifest.models.map(x=>x.url)).size,978);
const hash=s=>createHash('sha256').update(s).digest('hex');
const extract=(html,tag)=>html.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>[\\s\\S]*?<\\/'+tag+'>','i'))?.[0]||'';
const request=async path=>{
 let lastError;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const response=await fetch(base+path,{signal:AbortSignal.timeout(25000),headers:{'Accept':'text/html'}});
   const html=await response.text();
   if((response.status===429||response.status>=500)&&attempt<3)continue;
   return {status:response.status,html,contentType:response.headers.get('content-type')||''};
  }catch(error){lastError=error;}
 }
 throw lastError||Error('HTTP retries exhausted');
};
let master,masterError=null;
try{
 master=await request('/motorcycle-v2-master.html?make=BMW&model=R%201300%20GS');
 if(master.status!==200)throw Error('Master HTTP '+master.status);
 if(!extract(master.html,'main')||!extract(master.html,'style'))throw Error('Approved live master HTML is incomplete');
}catch(error){masterError=String(error.message||error);}
const main=masterError?'':extract(master.html,'main'),style=masterError?'':extract(master.html,'style');
const results=new Array(978);
let cursor=0;
async function worker(){
 while(cursor<978){
  const i=cursor++,entry=manifest.models[i],issues=[];
  try{
   const {status,html,contentType}=await request(entry.url);
   if(!/text\/html/i.test(contentType))issues.push('NOT_HTML');
   if(status!==200)issues.push('HTTP_'+status);
   if(!masterError){
    if(hash(extract(html,'main'))!==hash(main))issues.push('MAIN_DIFFERS');
    if(hash(extract(html,'style'))!==hash(style))issues.push('STYLE_DIFFERS');
   }
   if(!/approved-v2-universal-preview\.mjs\?v=/.test(html))issues.push('RENDERER_MISSING');
   if(!/approved-v2-dynamic-navigation\.mjs\?v=/.test(html))issues.push('NAVIGATION_MISSING');
   if(!/name="robots" content="index,follow"/.test(html))issues.push('SEO_ROBOTS_MISMATCH');
   const payload=html.match(/<script id="anybikeV2RouteIdentity" type="application\/json">([^<]+)<\/script>/)?.[1];
   if(!payload)issues.push('IDENTITY_MISSING');
   else{
    try{const id=JSON.parse(payload);if(id.make!==entry.make||id.model!==entry.model||id.model_id!==entry.model_id)issues.push('IDENTITY_MISMATCH');}
    catch{issues.push('IDENTITY_INVALID');}
   }
   const canonical=html.match(/<link id="modelCanonical" rel="canonical" href="([^"]+)"/)?.[1];
   if(canonical!==base+entry.url){
    const target=canonical?.replace(base,'');
    if(!(target&&manifest.models.some(x=>x.url===target)&&html.includes('location.replace(')))issues.push('CANONICAL_MISMATCH');
   }
  }catch(e){issues.push('REQUEST_FAILED '+String(e.message||e));}
  results[i]={...entry,pass:issues.length===0,issues};
 }
}
await Promise.all(Array.from({length:6},worker));
const failures=results.filter(x=>!x.pass);
const issue_counts={};
for(const row of failures)for(const issue of row.issues){const key=issue.startsWith('REQUEST_FAILED')?'REQUEST_FAILED':issue;issue_counts[key]=(issue_counts[key]||0)+1;}
const manufacturer_counts={};
for(const row of results){const item=manufacturer_counts[row.make]||(manufacturer_counts[row.make]={checked:0,passed:0,failed:0});item.checked++;item[row.pass?'passed':'failed']++;}
const report={checked:978,passed:978-failures.length,failed:failures.length,master_comparison_complete:!masterError,master_error:masterError,checked_at:new Date().toISOString(),master_main_sha256:masterError?null:hash(main),master_style_sha256:masterError?null:hash(style),issue_counts,manufacturer_counts,results,failures};
await fs.mkdir('artifacts/universal-v2-live-audit',{recursive:true});
await fs.writeFile('artifacts/universal-v2-live-audit/report.json',JSON.stringify(report,null,2)+'\n');
console.log('Live V2 audit:',report.passed,'/ 978 passed. Report: artifacts/universal-v2-live-audit/report.json');
if(failures.length||masterError)process.exitCode=1;
