#!/usr/bin/env node
// Read-only live public master verification. Never signs in, submits forms, or writes data.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const base='https://www.anybike.co.uk';
const cases=[
 ['BMW','R 1300 GS',1280],
 ['BMW','R 1300 GS',390],
 ['BMW','R 1300 GS',320],
 ['Suzuki','RM250',1280],
 ['Suzuki','RM250',390],
 ['Harley-Davidson','Fat Boy',1280],
 ['Honda','CB650R',1280,'motorcycle-model-guide.html'],
 ['Yamaha','MT-09',390,'motorcycle-model-guide.html']
];
await mkdir('artifacts/universal-v2-live-browser',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [make,model,width,routeName='motorcycle-v2-master.html'] of cases){
  const context=await browser.newContext({viewport:{width,height:850}});
  let page;
  try{
   page=await context.newPage();
   const issues=[];
   page.on('pageerror',error=>issues.push('PAGE_ERROR '+String(error)));
   page.on('console',message=>{if(['error','warning'].includes(message.type()))issues.push(message.type()+' '+message.text());});
   page.on('requestfailed',request=>{if(request.url().includes('model-template')||request.url().includes('supabase.co'))issues.push('REQUEST_FAILED '+request.url()+' '+request.failure()?.errorText);});
   const url=base+'/'+routeName+'?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(model);
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
   assert.equal(response?.status(),200,'Public V2 model route is not HTTP 200: '+url);
   await page.waitForFunction(()=>window.__anybikeV2EditorialReady===true,null,{timeout:35000});
   try{
    await page.waitForFunction(()=>window.__anybikeV2NavigationReady===true,null,{timeout:15000});
   }catch(error){
    const diagnostic=await page.evaluate(()=>({
     identity:window.__anybikeV2ModelIdentity||null,
     editorialReady:window.__anybikeV2EditorialReady||false,
     navigationReady:window.__anybikeV2NavigationReady||false,
     navScript:[...document.scripts].map(x=>x.src).filter(x=>x.includes('approved-v2-dynamic-navigation')),
     countrySource:document.getElementById('r1300CountryMarkets')?.dataset.anybikeV2Source||'',
     countryHidden:document.getElementById('r1300CountryMarkets')?.hidden,
     related:document.getElementById('approvedV2ModelQuickLinks')?.textContent?.slice(0,100)||'',
     countryLinks:document.querySelectorAll('#r1300CountryMarkets a').length
    }));
    await page.screenshot({path:'artifacts/universal-v2-live-browser/'+make.replace(/[^a-z0-9]/gi,'-')+
     '-'+model.replace(/[^a-z0-9]/gi,'-')+'-'+width+'-'+routeName+'-NAVIGATION-DIAGNOSTIC.png',fullPage:true});
    throw Error('Live V2 navigation did not finish: '+JSON.stringify({diagnostic,issues}));
   }
   await page.waitForFunction(()=>['checked','restricted','unavailable'].includes(
    document.getElementById('internationalModelStock')?.dataset.stockFeedState),null,{timeout:25000});
   assert.equal(await page.locator('#heading').innerText(),make+' '+model);
   assert.equal(await page.locator('#internationalModelStock').isVisible(),true);
   assert.equal(await page.locator('#internationalGuestRequestForm').isVisible(),true);
   const mainOrder=await page.locator('main > *').evaluateAll(nodes=>nodes.map(node=>node.id||node.className));
   assert.equal(mainOrder.indexOf('internationalModelStock'),mainOrder.indexOf('hero')+1,
    'Approved exact-model stock must follow the hero');
   const specs=page.locator('#v2DocumentedSpecifications');
   if(await specs.count()){
    const position=mainOrder.indexOf('v2DocumentedSpecifications');
    assert(position>mainOrder.indexOf('internationalModelStock')&&
     position<mainOrder.indexOf('generationPanel'),
     'Published factory specifications should precede model years');
   }
   assert.equal(await page.locator('#r1300gsModelHistory').evaluate(node=>node.parentElement?.tagName),
    'MAIN','Development and ownership must not remain nested inside stock');
   assert.equal(await page.locator('#r1300gsModelHistory').evaluate(node=>node.previousElementSibling?.id),
    'r1300V2VerifiedExtras','Development must follow model-year timeline');
   if(routeName==='motorcycle-model-guide.html'){
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),url,
     'Generic model route should retain its exact-model canonical URL');
   }
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
    '-'+model.replace(/[^a-z0-9]/gi,'-')+'-'+width+'-'+routeName+'.png',fullPage:true});
   // A visual smoke test may observe benign denied public stock, but any
   // uncaught page exception means the master has not passed browser QA.
   const runtimeErrors=issues.filter(issue=>issue.startsWith('PAGE_ERROR '));
   assert.deepEqual(runtimeErrors,[],'Live V2 JavaScript runtime errors: '+JSON.stringify(runtimeErrors));
   console.log('PASS LIVE '+make+' '+model+' '+width+'px '+routeName+' '+JSON.stringify(metrics));
  }catch(error){
   // Preserve a screenshot for failures after navigation, not only passes.
   // The live test is read-only; this diagnostic never submits enquiries.
   if(page)await page.screenshot({
    path:'artifacts/universal-v2-live-browser/'+make.replace(/[^a-z0-9]/gi,'-')+
     '-'+model.replace(/[^a-z0-9]/gi,'-')+'-'+width+'-'+routeName+'-FAILED.png',
    fullPage:true
   }).catch(()=>{});
   throw error;
  }finally{await context.close();}
 }
}finally{await browser.close();}
