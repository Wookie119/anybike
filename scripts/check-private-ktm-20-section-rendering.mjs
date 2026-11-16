import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';

// This is a PRIVATE LOCAL TEST, never an AnyBike public route or publication.
// The contents mirror the private KTM 390 Duke model 524 Supabase test fixture.
// The published-only loader sees only a synthetic projection provided in memory.
const root=resolve(process.cwd());
const slots=Array.from({length:20},(_,i)=>({
 section_number:i+1,section_key:'section_'+String(i+1).padStart(2,'0'),
 section_title:'TEST SECTION '+String(i+1).padStart(2,'0'),
 content:{paragraphs:['TEST - Test - test — slot '+String(i+1).padStart(2,'0')+' of 20 — NOT FACTUAL MOTORCYCLE RESEARCH']},
 editorial_status:'test_only'
}));
const pageHtml='<!doctype html><html><head><meta name="robots" content="noindex,nofollow"><meta charset="utf-8"><style>body{background:#181818;color:#fff;font-family:Arial;padding:20px}.card{border-top:2px solid #ed1c24;background:#292929;padding:16px;margin:12px 0}</style></head><body><h1>LOCAL TEST ONLY — KTM 390 Duke</h1><main id="root" data-anybike-universal-root="true"></main><script type="module" src="/__test_harness__.mjs"></script></body></html>';
const harness=[
 "import {loadUniversalPublishedPage} from '/model-template/universal-page-data.mjs';",
 "import {renderUniversalPage} from '/model-template/universal-page-renderer.mjs';",
 'const draft='+JSON.stringify(slots)+';',
 "const rows=draft.map((s,i)=>({source_section_id:12000+i,entity_type:'model',entity_id:524,entity_name:'390 Duke',manufacturer_id:33,section_number:s.section_number,section_key:s.section_key,section_title:s.section_title,content:s.content,editorial_status:'published',publication_eligible:true,published_at:'2026-11-15T00:00:00Z',publication_review_reference:'LOCAL-SYNTHETIC-TEST-NOT-APPROVAL'}));",
 "const client={from(name){if(name!=='motorcycle_universal_published_sections_v1')throw Error('Unexpected table');return {select(){return this},eq(){return this},order(){return this},limit(){return Promise.resolve({data:rows,error:null})}}}};",
 "try{const result=await loadUniversalPublishedPage(client,{type:'model',id:524});const view=renderUniversalPage(document.getElementById('root'),{entity:{type:'model',id:524,name:'390 Duke',manufacturer_id:33,manufacturer_name:'KTM'},sections:result.sections});window.__testResult={loaded:result.sections.length,rendered:view.sections.length,cards:[...document.querySelectorAll('.anybike-universal-research-card')].map(e=>({key:e.dataset.sectionKey,text:e.textContent}))}}catch(e){window.__testResult={error:String(e.message||e)}}"
].join('\n');
const types={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/__private_ktm_preview__'||path==='/__test_harness__.mjs'){
  res.writeHead(200,{'content-type':path.endsWith('.mjs')?'text/javascript':'text/html','cache-control':'no-store'});
  res.end(path.endsWith('.mjs')?harness:pageHtml);return;
 }
 try{const file=resolve(root,'.'+decodeURIComponent(path));if(!file.startsWith(root+sep))throw Error('Forbidden');
  res.writeHead(200,{'content-type':types[extname(file)]||'text/plain'});res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const report={model_id:524,private:true,not_published:true,viewports:[]};
try{
 for(const width of [1280,390]){
  const p=await browser.newPage({viewport:{width,height:820}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port+'/__private_ktm_preview__',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.__testResult!==undefined);
  const result=await p.evaluate(()=>window.__testResult);
  assert(!result.error,result.error);
  assert.equal(result.loaded,20);assert.equal(result.rendered,20);assert.equal(result.cards.length,20);
  for(let i=0;i<20;i++){const card=result.cards[i];assert.equal(card.key,'section_'+String(i+1).padStart(2,'0'));assert(card.text.includes('TEST - Test - test'));assert(card.text.includes('NOT FACTUAL MOTORCYCLE RESEARCH'))}
  assert.deepEqual(errors,[]);
  await mkdir('artifacts/private-ktm-v2',{recursive:true});
  await p.screenshot({path:'artifacts/private-ktm-v2/'+width+'.png',fullPage:true});
  report.viewports.push({width,loaded:result.loaded,rendered:result.rendered});
  await p.close();
 }
 const {auditUniversalPage}=await import('../model-template/universal-page-section-contract.mjs');
 const unpublished=slots.map(s=>({...s,entity_type:'model',entity_id:524,manufacturer_id:33,publication_eligible:false,published_at:null}));
 assert.equal(auditUniversalPage({type:'model',id:524,name:'390 Duke',manufacturer_id:33},unpublished).populated,0);
 await writeFile('artifacts/private-ktm-v2/report.json',JSON.stringify(report,null,2));
 console.log('PASS: 20/20 synthetic published projection renders on desktop and mobile; 0 private draft slots are publicly eligible');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
