import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
// Read-only live browser proof for reviewed KTM publication. No form submits.
const base=process.env.ANYBIKE_PUBLIC_ORIGIN||'https://www.anybike.co.uk';
const bikes=[
 {
  "make": "KTM",
  "model": "390 Duke",
  "id": 524,
  "url": "/models/ktm/390-duke.html",
  "slots": [
   "section_01",
   "section_07",
   "section_12"
  ],
  "required": [
   "2013",
   "399 cc",
   "820 mm"
  ]
 },
 {
  "make": "KTM",
  "model": "125 Duke",
  "id": 926,
  "url": "/models/ktm/125-duke.html",
  "slots": [
   "section_01",
   "section_07",
   "section_12"
  ],
  "required": [
   "2011",
   "125 cc",
   "800 mm"
  ]
 },
 {
  "make": "KTM",
  "model": "200 Duke",
  "id": 917,
  "url": "/models/ktm/200-duke.html",
  "slots": [
   "section_01",
   "section_07"
  ],
  "required": [
   "2012"
  ]
 },
 {
  "make": "KTM",
  "model": "690 Duke",
  "id": 887,
  "url": "/models/ktm/690-duke.html",
  "slots": [
   "section_01",
   "section_07"
  ],
  "required": [
   "2008"
  ]
 },
 {
  "make": "KTM",
  "model": "790 Duke",
  "id": 527,
  "url": "/models/ktm/790-duke.html",
  "slots": [
   "section_01",
   "section_07"
  ],
  "required": [
   "2016",
   "2018",
   "prototype"
  ]
 },
 {
  "make": "KTM",
  "model": "990 Duke",
  "id": 210,
  "url": "/models/ktm/990-duke.html",
  "slots": [
   "section_01",
   "section_07",
   "section_12"
  ],
  "required": [
   "2024",
   "USB-C",
   "optional"
  ]
 },
 {
  "make": "Honda",
  "model": "CB1100",
  "id": 837,
  "url": "/models/honda/cb1100.html",
  "slots": [
   "section_01",
   "section_07",
   "section_12"
  ],
  "required": [
   "2010",
   "1,140 cc",
   "2021"
  ]
 },
 {
  "make": "Honda",
  "model": "CB1300",
  "id": 798,
  "url": "/models/honda/cb1300.html",
  "slots": [
   "section_01",
   "section_07",
   "section_12"
  ],
  "required": [
   "1997",
   "1998",
   "2003"
  ]
 },
 {
  "make": "Honda",
  "model": "CB400 Super Four",
  "id": 854,
  "url": "/models/honda/cb400-super-four.html",
  "slots": [
   "section_01",
   "section_07",
   "section_12"
  ],
  "required": [
   "1992",
   "1999",
   "2022"
  ]
 },
 {
  "make": "Honda",
  "model": "CB500F",
  "id": 444,
  "url": "/models/honda/cb500f.html",
  "slots": [
   "section_01",
   "section_07",
   "section_12"
  ],
  "required": [
   "2012",
   "2013",
   "CB400F"
  ]
 }
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
   await page.evaluate(count=>{window.__expectedSectionCount=count},bike.slots.length);
   try{
    await page.waitForFunction(()=>document.querySelectorAll('.anybike-v2-reviewed-universal-section').length>=window.__expectedSectionCount,{timeout:25000});
   }catch{entry.issues.push('PUBLISHED_SECTIONS_NOT_RENDERED')}
   const state=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('.anybike-v2-reviewed-universal-section')];
    return {heading:document.getElementById('heading')?.textContent?.trim(),
     sections:nodes.map(x=>({key:x.dataset.sectionKey,text:x.textContent?.trim().slice(0,750)})),
     bodyText:document.getElementById('body')?.textContent||'',
     error:(()=>{const e=document.getElementById('previewStatusError');return e&&!e.hidden?e.textContent:null})()
    };
   });
   if(state.heading!==bike.make+' '+bike.model)entry.issues.push('WRONG_MODEL_HEADING');
   const keys=state.sections.map(x=>x.key).sort();
   if(JSON.stringify(keys)!==JSON.stringify(bike.slots))
    entry.issues.push('WRONG_CANONICAL_SECTIONS:'+JSON.stringify(keys));
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
console.log('Reviewed KTM/Honda research live browser:',report.passed,'/',report.checked,'passed');
for(const row of report.results)console.log(row.url,row.pass?'PASS':row.issues.join(' | '));
assert.equal(report.failed,0,'Source-verified KTM and Honda research must render in the public universal V2 template');
