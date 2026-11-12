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
 {make:'BMW',model:'R 1250 GS'}
];
const browser=await chromium.launch({headless:true});
let failures=0;
mkdirSync('artifacts/live-model-smoke',{recursive:true});
try{
 for(const item of cases){
  const page=await browser.newPage({viewport:{width:1366,height:900}});
  const url=new URL('/motorcycle-model-guide.html',origin);
  url.searchParams.set('make',item.make);url.searchParams.set('model',item.model);
  try{
   const response=await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:35000});
   if(!response?.ok())throw new Error('HTTP '+response?.status());
   await page.locator('[data-anybike-research-category]').first().waitFor({state:'attached',timeout:25000});
   const result=await page.evaluate(()=>{
    const groups=[...document.querySelectorAll('[data-anybike-research-category]')]
     .filter(x=>x.dataset.anybikeResearchFactIds);
    const foreign=groups.filter(x=>x.dataset.anybikeResearchIdentity!==
     JSON.stringify([new URLSearchParams(location.search).get('make')?.trim().toLowerCase(),
      new URLSearchParams(location.search).get('model')?.trim().toLowerCase()]));
    return {groups:groups.length,foreign:foreign.length,
     categories:[...new Set(groups.map(x=>x.dataset.anybikeResearchCategory))],
     title:document.title};
   });
   if(!result.groups)throw new Error('No sourced model research rendered');
   if(result.foreign)throw new Error('Research from another motorcycle rendered');
   console.log('PASS live model research:',item.make,item.model,JSON.stringify(result));
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
