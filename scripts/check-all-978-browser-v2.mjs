// Browser-level evidence for all permanent AnyBike V2 model URLs.
// Unlike HTML-only checks this waits for the shared Supabase-backed renderer.
import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.ANYBIKE_PUBLIC_ORIGIN||'https://www.anybike.co.uk';
const manifest=JSON.parse(await readFile('data/universal-v2-model-routes.json','utf8'));
if(manifest.count!==978||manifest.models.length!==978)throw Error('978-route manifest mismatch');
const sample=process.env.ANYBIKE_V2_BROWSER_SAMPLE==='1';
const selected=sample?[...new Map(manifest.models.map(x=>[x.make,x])).values()]:manifest.models;
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
let next=0;
const results=Array(selected.length);
async function worker(){
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 try{
  while(next<selected.length){
   const index=next++,entry=selected[index],page=await context.newPage();
   const issues=[],errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,200)));
   try{
    const response=await page.goto(origin+entry.url,{waitUntil:'domcontentloaded',timeout:35000});
    if(!response||response.status()!==200)issues.push('HTTP_'+(response?.status()||'NO_RESPONSE'));
    try{await page.waitForFunction(()=>window.__anybikeV2EditorialReady===true,{timeout:25000});}
    catch{issues.push('RENDERER_NOT_READY');}
    const state=await page.evaluate(()=>{
     const route=document.getElementById('anybikeV2RouteIdentity');
     let identity=null;
     try{identity=JSON.parse(route?.textContent||'null')}catch{}
     const error=document.getElementById('previewStatusError');
     return {
      identity,
      heading:document.getElementById('heading')?.textContent?.trim()||'',
      error: error&&!error.hidden?error.textContent.trim().slice(0,250):null,
      researchPanel:!!document.querySelector('[data-anybike-verified-model-facts]'),
      researchCount:document.querySelectorAll('[data-anybike-research-category] article,.anybike-v2-reviewed-universal-section').length,
      rendererReady:window.__anybikeV2EditorialReady===true
     };
    });
    if(state.identity?.model_id!==entry.model_id||state.identity?.make!==entry.make||state.identity?.model!==entry.model)issues.push('ROUTE_IDENTITY_MISMATCH');
    if(state.heading.toLowerCase()!==(entry.make+' '+entry.model).toLowerCase())issues.push('HEADING_MISMATCH');
    if(state.error)issues.push('PUBLIC_ERROR:'+state.error);
    if(!state.researchPanel)issues.push('RESEARCH_PANEL_MISSING');
    results[index]={...entry,pass:!issues.length,issues,actualUrl:page.url(),actualHeading:state.heading,actualIdentity:state.identity,rendererReady:state.rendererReady,researchCount:state.researchCount,errors};
   }catch(e){results[index]={...entry,pass:false,issues:['BROWSER_FAILED:'+String(e.message||e).slice(0,200)],errors};}
   finally{await page.close().catch(()=>{});}
   if((index+1)%50===0)console.log('Browser audit processed',index+1,'/',selected.length);
  }
 }finally{await context.close();}
}
try{await Promise.all(Array.from({length:6},worker));}
finally{await browser.close();}
const failures=results.filter(x=>!x.pass);
const report={checked:results.length,passed:results.length-failures.length,failed:failures.length,mode:sample?'one-per-manufacturer':'all-978',checked_at:new Date().toISOString(),failures,results};
await mkdir('artifacts/universal-v2-browser-audit',{recursive:true});
await writeFile('artifacts/universal-v2-browser-audit/report.json',JSON.stringify(report,null,2));
console.log('Universal V2 browser audit:',report.passed,'/',report.checked,'passed; failures:',report.failed);
if(report.failed)process.exitCode=1;
