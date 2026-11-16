import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base='https://www.anybike.co.uk', models=[
 {path:'/models/ktm/390-duke.html',make:'KTM',model:'390 Duke'},
 {path:'/models/ktm/125-duke.html',make:'KTM',model:'125 Duke'},
 {path:'/models/honda/cb1100.html',make:'Honda',model:'CB1100'},
 {path:'/models/bmw/r-1300-gs.html',make:'BMW',model:'R 1300 GS'}
];
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const results=[];
try{
 for(const model of models){
  const page=await browser.newPage({viewport:{width:390,height:820}});
  const result={...model,pass:false,issues:[]};
  try{
   const response=await page.goto(base+model.path,{waitUntil:'domcontentloaded',timeout:35000});
   if(!response||response.status()!==200)result.issues.push('HTTP_'+response?.status());
   await page.waitForFunction(()=>window.__anybikeV2EditorialReady===true,{timeout:30000});
   const state=await page.evaluate(async()=>{
    const figure=document.getElementById('databaseHeroPhoto');
    const image=figure?.querySelector('img');
    if(image&&!image.complete)await new Promise(ok=>{image.addEventListener('load',ok,{once:true});image.addEventListener('error',ok,{once:true});setTimeout(ok,12000)});
    return {hidden:figure?.hidden,kind:figure?.dataset.anybikeHeroType||'exact-model-photo',
     alt:image?.alt,src:image?.currentSrc||image?.src,loaded:!!image?.naturalWidth};
   });
   result.image=state;
   if(state.hidden||!state.loaded)result.issues.push('HERO_NOT_VISIBLE_OR_NOT_LOADED');
   if(state.kind==='manufacturer-logo'&&state.alt!==model.make+' manufacturer logo')result.issues.push('WRONG_MANUFACTURER_LOGO');
   if(state.kind!=='manufacturer-logo'&&!state.alt?.toLowerCase().includes(model.model.toLowerCase()))result.issues.push('MODEL_PHOTO_IDENTITY_MISSING');
  }catch(e){result.issues.push('BROWSER_ERROR_'+String(e.message||e).slice(0,160))}
  result.pass=result.issues.length===0;results.push(result);await page.close();
 }
}finally{await browser.close()}
await mkdir('artifacts/hero-regression',{recursive:true});
await writeFile('artifacts/hero-regression/report.json',JSON.stringify(results,null,2));
for(const x of results)console.log(x.model,x.pass?'PASS':x.issues.join(','));
assert(results.every(x=>x.pass),'Every checked model must show an accurate-model photograph or a manufacturer logo');
