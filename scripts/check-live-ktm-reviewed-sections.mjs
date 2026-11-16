import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
// Read-only live browser proof for reviewed KTM publication. No form submits.
const base=process.env.ANYBIKE_PUBLIC_ORIGIN||'https://www.anybike.co.uk';
const bikes=[
 {url:'/models/ktm/390-duke.html',id:524,model:'390 Duke',required:['2013','399 cc','820 mm']},
 {url:'/models/ktm/125-duke.html',id:926,model:'125 Duke',required:['2011','125 cc','800 mm']}
];
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const report={checked_at:new Date().toISOString(),checked:bikes.length,passed:0,failed:0,results:[]};
try {
 for(const bike of bikes){
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const entry={url:bike.url,model_id:bike.id,pass:false,issues:[]};
  try{
   const response=await page.goto(base+bike.url,{waitUntil:'domcontentloaded',timeout:35000});
   if(!response||response.status()!==200)entry.issues.push('HTTP_'+(response?.status()||'NONE'));
   await page.waitForFunction(()=>window.__anybikeV2EditorialReady===true,{timeout:25000});
   try{
    await page.waitForFunction(()=>document.querySelectorAll('.anybike-v2-reviewed-universal-section').length>=3,{timeout:25000});
   }catch{entry.issues.push('PUBLISHED_SECTIONS_NOT_RENDERED')}
   const state=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('.anybike-v2-reviewed-universal-section')];
    return {heading:document.getElementById('heading')?.textContent?.trim(),
     sections:nodes.map(x=>({key:x.dataset.sectionKey,text:x.textContent?.trim().slice(0,750)})),
     bodyText:document.getElementById('body')?.textContent||'',
     error:(()=>{const e=document.getElementById('previewStatusError');return e&&!e.hidden?e.textContent:null})()
    };
   });
   if(state.heading!=='KTM '+bike.model)entry.issues.push('WRONG_MODEL_HEADING');
   const keys=state.sections.map(x=>x.key).sort();
   if(JSON.stringify(keys)!==JSON.stringify(['section_01','section_07','section_12']))
    entry.issues.push('EXPECTED_THREE_CANONICAL_SECTIONS:'+JSON.stringify(keys));
   for(const term of bike.required)if(!state.bodyText.includes(term))entry.issues.push('MISSING_VERIFIED_FACT:'+term);
   if(state.bodyText.includes('TEST - Test - test'))entry.issues.push('PRIVATE_TEST_LEAK');
   if(state.error)entry.issues.push('VISIBLE_PUBLIC_ERROR:'+state.error.slice(0,150));
   entry.sections=state.sections;
  }catch(e){entry.issues.push('BROWSER_ERROR:'+String(e.message||e).slice(0,220))}
  finally{await page.close()}
  entry.pass=entry.issues.length===0;
  report.results.push(entry);
  if(entry.pass)report.passed++;else report.failed++;
 }
}finally{await browser.close()}
await mkdir('artifacts/ktm-source-verified-research',{recursive:true});
await writeFile('artifacts/ktm-source-verified-research/report.json',JSON.stringify(report,null,2));
console.log('Verified KTM research live browser:',report.passed,'/',report.checked,'passed');
for(const row of report.results)console.log(row.url,row.pass?'PASS':row.issues.join(' | '));
assert.equal(report.failed,0,'Source-verified KTM research must render in the public universal V2 template');
