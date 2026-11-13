#!/usr/bin/env node
// Read-only live public master verification. Never signs in, submits forms, or writes data.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const base='https://www.anybike.co.uk/motorcycle-v2-master.html';
const cases=[
 ['BMW','R 1300 GS',1280],
 ['Suzuki','RM250',1280],
 ['Suzuki','RM250',390],
 ['Harley-Davidson','Fat Boy',1280]
];
await mkdir('artifacts/universal-v2-live-browser',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [make,model,width] of cases){
  const context=await browser.newContext({viewport:{width,height:850}});
  try{
   const page=await context.newPage();
   const url=base+'?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(model);
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
   assert.equal(response?.status(),200,'Public master is not HTTP 200: '+url);
   await page.waitForFunction(()=>window.__anybikeV2EditorialReady===true,null,{timeout:35000});
   await page.waitForFunction(()=>window.__anybikeV2NavigationReady===true,null,{timeout:25000});
   await page.waitForFunction(()=>['checked','restricted','unavailable'].includes(
    document.getElementById('internationalModelStock')?.dataset.stockFeedState),null,{timeout:25000});
   assert.equal(await page.locator('#heading').innerText(),make+' '+model);
   assert.equal(await page.locator('#internationalModelStock').isVisible(),true);
   assert.equal(await page.locator('#internationalGuestRequestForm').isVisible(),true);
   assert.equal(await page.locator('#r1300CountryMarkets').isVisible(),true,
    'Verified 217-country section failed to load');
   assert.match(await page.locator('#r1300CountryMarkets').innerText(),/View all 217 international markets/);
   assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'index,follow');
   assert.equal(await page.locator('#previewStatusError').isVisible(),false,'Master displayed fatal loading error');
   const metrics=await page.evaluate(()=>({
    width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    publishedSections:document.querySelectorAll('.anybike-v2-reviewed-universal-section').length,
    verifiedGroups:document.querySelectorAll('[data-anybike-research-category]').length,
    stock:document.getElementById('internationalModelStock')?.dataset.stockFeedState
   }));
   assert(metrics.scrollWidth<=metrics.width+3,'Live master horizontal overflow: '+JSON.stringify(metrics));
   await page.screenshot({path:'artifacts/universal-v2-live-browser/'+make.replace(/[^a-z0-9]/gi,'-')+
    '-'+model.replace(/[^a-z0-9]/gi,'-')+'-'+width+'.png',fullPage:true});
   console.log('PASS LIVE '+make+' '+model+' '+width+'px '+JSON.stringify(metrics));
  }finally{await context.close();}
 }
}finally{await browser.close();}
