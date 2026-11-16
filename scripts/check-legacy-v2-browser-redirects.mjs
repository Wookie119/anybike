// Verify all reviewed legacy BMW/Harley model aliases converge in an actual browser.
// Static sites can perform safe client-side navigation even without Apache redirects.
import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.ANYBIKE_PUBLIC_ORIGIN||'https://www.anybike.co.uk';
const old=JSON.parse(await readFile('data/approved-dedicated-model-routes.json','utf8')).models;
const manifest=JSON.parse(await readFile('data/universal-v2-model-routes.json','utf8')).models;
const normalize=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
if(old.length!==45)throw Error('Expected 45 reviewed legacy routes');
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const results=[];
let cursor=0;
async function worker(){
 const context=await browser.newContext();
 try{
  while(cursor<old.length){
   const item=old[cursor++],exact=manifest.filter(x=>normalize(x.make)===normalize(item.make)&&normalize(x.model)===normalize(item.model));
   if(exact.length!==1){results.push({from:item.url,pass:false,issues:['AMBIGUOUS_CANONICAL_IDENTITY']});continue;}
   const expected=exact[0].url, page=await context.newPage(),issues=[];
   try{
    await page.goto(origin+item.url,{waitUntil:'domcontentloaded',timeout:35000});
    try{await page.waitForURL(u=>u.pathname===expected,{timeout:15000});}
    catch{issues.push('NOT_REDIRECTED_TO_PERMANENT_V2');}
    const target=new URL(page.url()).pathname;
    if(target!==expected)issues.push('WRONG_DESTINATION:'+target);
    results.push({from:item.url,to:expected,landed:target,pass:issues.length===0,issues});
   }catch(e){results.push({from:item.url,to:expected,pass:false,issues:['BROWSER_FAILED:'+String(e.message||e).slice(0,120)]});}
   finally{await page.close().catch(()=>{});}
  }
 }finally{await context.close();}
}
try{await Promise.all(Array.from({length:6},worker));}finally{await browser.close();}
results.sort((a,b)=>a.from.localeCompare(b.from));
const failures=results.filter(x=>!x.pass);
await mkdir('artifacts/universal-v2-browser-audit',{recursive:true});
await writeFile('artifacts/universal-v2-browser-audit/legacy-redirects.json',JSON.stringify({checked:results.length,passed:results.length-failures.length,failed:failures.length,failures,results},null,2));
console.log('Browser legacy V2 model convergence:',results.length-failures.length,'/',results.length,'passed');
for(const f of failures.slice(0,20))console.error(f.from,f.issues.join(','));
if(failures.length)process.exitCode=1;
