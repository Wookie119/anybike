// Live browser smoke check: confirms Supabase-approved model research actually
// renders on the public generic guide, rather than merely existing in SQL.
// Intended for a scheduled GitHub Action after 123-reg publication.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

const origin=process.env.ANYBIKE_PUBLIC_ORIGIN||'https://www.anybike.co.uk';
const cases=[
 {make:'Suzuki',model:'RM250'},
 {make:'Yamaha',model:'YZ250'},
 {make:'BMW',model:'R 1250 GS'},
 {make:'Honda',model:'CB500X',expectGallery:true},
 {make:'Kawasaki',model:'Ninja 650',expectGallery:true},
 {make:'Honda',model:'CB500X',expectGallery:true,mobile:true},
 {make:'Triumph',model:'STREET TRIPLE 765 RS',expectGallery:true},
 {make:'Triumph',model:'TIGER 900 GT PRO',expectGallery:true}
];
const browser=await chromium.launch({headless:true});
let failures=0;
mkdirSync('artifacts/live-model-smoke',{recursive:true});
try{
 for(const item of cases){
  const page=await browser.newPage({
   viewport:item.mobile?{width:390,height:844}:{width:1366,height:900},
   isMobile:!!item.mobile,hasTouch:!!item.mobile
  });
  const url=new URL('/motorcycle-model-guide.html',origin);
  url.searchParams.set('make',item.make);url.searchParams.set('model',item.model);
  try{
   const response=await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:35000});
   if(!response?.ok())throw new Error('HTTP '+response?.status());
   await page.locator('[data-anybike-research-category]').first().waitFor({state:'attached',timeout:25000});
   const publicResponse=await page.request.post(
    'https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_verified_model_facts_v1',
    {headers:{apikey:'sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK'},
     data:{p_make:item.make,p_model:item.model}});
   if(!publicResponse.ok())throw new Error('Public research RPC HTTP '+publicResponse.status());
   const approved=await publicResponse.json();
   if(!Array.isArray(approved)||!approved.length)
    throw new Error('No approved public facts for expected smoke-test motorcycle');
   const result=await page.evaluate(()=>{
    const groups=[...document.querySelectorAll('[data-anybike-research-category]')]
     .filter(x=>x.dataset.anybikeResearchFactIds);
    const foreign=groups.filter(x=>x.dataset.anybikeResearchIdentity!==
     JSON.stringify([new URLSearchParams(location.search).get('make')?.trim().toLowerCase(),
      new URLSearchParams(location.search).get('model')?.trim().toLowerCase()]));
    const unsafeSources=[...document.querySelectorAll(
      '[data-anybike-research-category] a[target="_blank"]')]
     .filter(a=>a.rel.split(/\s+/).indexOf('noopener')<0||
      a.rel.split(/\s+/).indexOf('noreferrer')<0||
      !a.href.startsWith('https://'));
    const viewport=document.documentElement.clientWidth;
    const overflowingResearch=groups.filter(g=>
     g.getBoundingClientRect().right>viewport+3||
     g.getBoundingClientRect().left< -3);
    return {groups:groups.length,foreign:foreign.length,
     renderedFacts:groups.reduce((n,g)=>n+g.querySelectorAll('article').length,0),
     categories:[...new Set(groups.map(x=>x.dataset.anybikeResearchCategory))].sort(),
     unsafeSources:unsafeSources.length,overflowingResearch:overflowingResearch.length,
     title:document.title};
   });
   if(!result.groups)throw new Error('No sourced model research rendered');
   if(result.foreign)throw new Error('Research from another motorcycle rendered');
   if(result.unsafeSources)throw new Error('Research source links are insecure or unlabelled');
   if(result.overflowingResearch)throw new Error('Research panels overflow the visible viewport');
   const expectedCategories=[...new Set(approved.map(x=>x.category))].sort();
   if(JSON.stringify(result.categories)!==JSON.stringify(expectedCategories))
    throw new Error('Rendered research categories differ from approved Supabase categories: '+
     JSON.stringify({expectedCategories,actual:result.categories}));
   if(result.renderedFacts!==approved.length)
    throw new Error('Rendered article count differs from approved public facts: '+
     result.renderedFacts+' versus '+approved.length);
   if(item.expectGallery){
    const gallery=page.locator('[data-anybike-model-research-gallery]');
    await gallery.waitFor({state:'attached',timeout:25000});
    const images=await gallery.locator('img').count();
    if(!images)throw new Error('Approved photo gallery rendered without images');
    const approvedGalleryResponse=await page.request.post(
     'https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_verified_model_gallery_v1',
     {headers:{apikey:'sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK'},
      data:{p_make:item.make,p_model:item.model}});
    if(!approvedGalleryResponse.ok())throw new Error('Gallery RPC HTTP '+approvedGalleryResponse.status());
    const approvedPhotos=await approvedGalleryResponse.json();
    if(!Array.isArray(approvedPhotos)||images!==approvedPhotos.length)
     throw new Error('Rendered photo count does not match approved gallery RPC: '+
      images+' versus '+approvedPhotos?.length);
    const imageChecks=await gallery.locator('img').evaluateAll(nodes=>nodes.map(img=>({
     url:img.currentSrc||img.src,loaded:img.complete&&img.naturalWidth>0,
     alt:img.alt
    })));
    if(imageChecks.some(x=>!x.loaded||!x.alt))
     throw new Error('Gallery has unloaded or unlabelled approved photographs: '+
      JSON.stringify(imageChecks));
    const galleryIdentity=await gallery.getAttribute('data-anybike-gallery-identity');
    if(galleryIdentity!==JSON.stringify([item.make.toLowerCase(),item.model.toLowerCase()]))
     throw new Error('Photo gallery belongs to another motorcycle');
    result.approvedGalleryImages=images;
   }
   // Keep a desktop visual record for the next design review. The automated
   // assertions above remain the source of truth for published fact coverage.
   await page.screenshot({
    path:resolve('artifacts/live-model-smoke',
     'passed-'+(item.mobile?'mobile-':'desktop-')+item.make.replace(/[^a-z0-9]/gi,'-')+'-'+
     item.model.replace(/[^a-z0-9]/gi,'-')+'.png'),
    fullPage:true
   });
   console.log('PASS live model research:',item.make,item.model,
    item.mobile?'mobile':'desktop',JSON.stringify(result));
  }catch(error){
   failures++;
   console.error('FAIL live model research:',item.make,item.model,error.message);
   await page.screenshot({
    path:resolve('artifacts/live-model-smoke',item.make.replace(/[^a-z0-9]/gi,'-')+'-'+item.model.replace(/[^a-z0-9]/gi,'-')+'.png'),
    fullPage:true
   }).catch(()=>{});
  }finally{await page.close();}
 }
}finally{await browser.close();}
if(failures)process.exitCode=1;
