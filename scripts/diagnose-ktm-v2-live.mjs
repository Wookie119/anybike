// Read-only live browser diagnosis for the shared V2 research renderer.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[],responses=[];
page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')errors.push(msg.text().slice(0,700));});
page.on('pageerror',err=>errors.push('PAGEERROR '+err.message));
page.on('response',res=>{if(/universal-page-|approved-v2-universal-preview|motorcycle_universal_published_sections_v1/.test(res.url()))responses.push({url:res.url(),status:res.status()});});
const url='https://www.anybike.co.uk/models/ktm/1390-super-duke-r.html?v2debug=1';
let navigationError=null;
try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});await page.waitForTimeout(15000);}
catch(e){navigationError=String(e.message||e);}
const dom=await page.evaluate(()=>({
 title:document.title,heading:document.querySelector('h1')?.textContent,
 modelIdentity:document.getElementById('anybikeV2RouteIdentity')?.textContent,
 publishedSlots:document.getElementById('body')?.dataset.anybikeV2PopulatedSlots,
 researchText:document.querySelector('[data-anybike-verified-model-facts]')?.innerText?.slice(0,2500),
 publicationNodes:[...document.querySelectorAll('.anybike-v2-reviewed-universal-section')].map(e=>({key:e.dataset.sectionKey,text:e.innerText.slice(0,400)})),
 diagnostic:document.querySelector('[data-anybike-research-diagnostic]')?.textContent,
 scripts:[...document.querySelectorAll('script[src]')].map(x=>x.src).filter(x=>x.includes('v2'))
})).catch(e=>({error:String(e)}));
mkdirSync('artifacts/ktm-v2-diagnostic',{recursive:true});
writeFileSync('artifacts/ktm-v2-diagnostic/report.json',JSON.stringify({url,checkedAt:new Date().toISOString(),navigationError,dom,errors,responses},null,2));
await page.screenshot({path:'artifacts/ktm-v2-diagnostic/screenshot.png',fullPage:true}).catch(()=>{});
await browser.close();
console.log(JSON.stringify({navigationError,dom,errors,responses},null,2));
if(navigationError||!dom.publicationNodes?.length)process.exitCode=1;
