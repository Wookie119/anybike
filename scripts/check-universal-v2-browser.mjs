#!/usr/bin/env node
// Master-only browser smoke test: mocked RPC and enquiries; never touches live data.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(process.cwd());
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+sep))throw Error('Forbidden');
  res.writeHead(200,{'content-type':types[extname(file)]||'text/plain'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const inventory={
 BMW:[{make:'BMW',model:'R 1300 GS',model_id:77,category:'Adventure'},{make:'BMW',model:'R 1250 GS',model_id:68,category:'Adventure'}],
 Suzuki:[{make:'Suzuki',model:'RM250',model_id:202,category:'Motocross'}],
 'Harley-Davidson':[{make:'Harley-Davidson',model:'Fat Boy',model_id:301,category:'Cruiser'}]};
const photo={make:'BMW',model:'R 1300 GS',title:'Verified hero',image_url:'https://photos.example.invalid/hero.jpg',
 attribution:'Licensed photographer',licence:'CC BY-SA 4.0',source_page_url:'https://example.org/source',
 licence_url:'https://creativecommons.org/licenses/by-sa/4.0/'};
await mkdir('artifacts/universal-v2-browser',{recursive:true});
const tests=[['BMW','R 1300 GS',1280],['BMW','R 1300 GS',390],['Suzuki','RM250',1280],
 ['Suzuki','RM250',390],['Harley-Davidson','Fat Boy',1280]];
let passed=0;
try{
 for(const [make,model,width] of tests){
  const context=await browser.newContext({viewport:{width,height:850}});
  // One positive and one negative publication test: client-side projection
  // must display reviewed sections and suppress draft sections on the SAME V2.
  if(make==='Suzuki'){
   const approved=width===1280;
   const publication=(n,status)=>({
    source_section_id:700+n,entity_type:'model',entity_id:202,
    entity_name:'RM250',manufacturer_id:99,section_number:n,
    section_key:'section_'+String(n).padStart(2,'0'),
    section_title:'Approved research section '+n,
    content:{paragraphs:['Approved factory history smoke-test record '+n+'.']},
    editorial_status:status,publication_eligible:true,
    published_at:'2026-01-01T00:00:00Z',
    publication_review_reference:'MOCK-REVIEW-NOT-REAL'
   });
   const rows=approved?Array.from({length:20},(_,i)=>publication(i+1,'published')):
    [publication(1,'draft')];
   await context.addInitScript(({rows})=>{
    window.supabase={createClient:()=>({
     rpc:async(name,args)=>{
      const response=await fetch('https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/'+name,{
       method:'POST',headers:{'Content-Type':'application/json',apikey:'mock-test-only'},
       body:JSON.stringify(args||{})
      });
      return {data:response.ok?await response.json():null,error:response.ok?null:Error('Mock RPC failed')};
     },
     auth:{getSession:async()=>({data:{session:null}})},
     from:table=>{
      const builder={
       select:()=>builder,eq:()=>builder,order:()=>builder,
       limit:async()=>({data:table==='motorcycle_universal_published_sections_v1'?rows:[],error:null}),
       maybeSingle:async()=>({data:null,error:null})
      };
      return builder;
     }
    })};
   },{rows});
  }
  try{
   const submissions=[];
   await context.route('https://cdn.jsdelivr.net/**',route=>route.abort());
   await context.route('https://photos.example.invalid/**',route=>route.abort());
   await context.route('https://tuehtnezhdnkqbbhttgp.supabase.co/**',async route=>{
    const pathname=new URL(route.request().url()).pathname;
    let payload={};try{payload=route.request().postDataJSON()||{}}catch{}
    const target=payload.p_make||make;
    let body=null,status=200;
    if(pathname.endsWith('/public_anybike_manufacturer_catalogue_names_v1'))body=inventory[target]||[];
    else if(pathname.endsWith('/public_anybike_manufacturer_model_routes_v1'))body=target==='BMW'?
     [{make:'BMW',model:'R 1300 GS',url:'/bmw-r1300gs.html'}]:[];
    else if(pathname.endsWith('/public_anybike_country_navigation_v1'))body=[
     {label:'Japan',url:'/markets/japan.html',region:'Asia'}];
    else if(pathname.endsWith('/public_anybike_model_hero_v1'))body=make==='BMW'?photo:null;
    else if(pathname.endsWith('/public_anybike_verified_model_gallery_v1'))body=make==='BMW'?
     [photo,{...photo,image_url:'https://photos.example.invalid/engine.jpg'}]:[];
    else if(pathname.endsWith('/public_anybike_verified_model_facts_v1'))body=[];
    else if(pathname.endsWith('/international-public-stock')){
     if(make==='Suzuki'&&width===390){
      body={items:[
       {item_id:41,catalog_model_id:202,catalogue_identity_status:'verified',
        publication_eligible:true,make:'Suzuki',model:'RM250',year:1999,price:2500},
       {item_id:42,catalog_model_id:203,catalogue_identity_status:'verified',
        publication_eligible:true,make:'Suzuki',model:'RM125',year:2000,price:2500},
       {item_id:43,catalog_model_id:202,catalogue_identity_status:'pending',
        publication_eligible:true,make:'Suzuki',model:'RM250',year:1998}
      ]};
     }else{status=403;body={error:'Restricted'};}
    }
    else if(pathname.endsWith('/international-guest-enquiry')){submissions.push(payload);body={ok:true,reference:'MOCK-ONLY'};}
    else {status=404;body={error:'Unknown mock endpoint'};}
    await route.fulfill({status,contentType:'application/json',headers:{
     'access-control-allow-origin':'*','access-control-allow-headers':'*',
     'access-control-allow-methods':'GET,POST,OPTIONS'},body:JSON.stringify(body)});
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(origin+'/motorcycle-v2-master.html?make='+encodeURIComponent(make)+
    '&model='+encodeURIComponent(model),{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__anybikeV2EditorialReady===true,null,{timeout:30000});
   const permitted=make==='Suzuki'&&width===390;
   await page.waitForFunction(expected=>
    document.querySelector('#internationalModelStock')?.dataset.stockFeedState===expected,
    permitted?'checked':'restricted',{timeout:15000});
   assert.equal(await page.locator('#heading').innerText(),make+' '+model);
   assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'index,follow');
   if(permitted){
    assert.equal(await page.locator('#internationalModelCards > a').count(),1,
     'Only one authorised exact-model stock item must remain');
    assert.match(await page.locator('#internationalModelCards > a').first().getAttribute('href'),/id=41$/);
    assert.doesNotMatch(await page.locator('#internationalModelCards').innerText(),/RM125/);
   }else assert.match(await page.locator('#internationalModelCards').innerText(),/access is restricted/i);
   assert.equal(await page.locator('#internationalGuestRequestForm').isVisible(),true);
   const order=await page.locator('main > *').evaluateAll(nodes=>nodes.map(n=>n.id||n.className));
   assert.equal(order.indexOf('internationalModelStock'),order.indexOf('hero')+1);
   await page.waitForFunction(()=>document.querySelector('#r1300CountryMarkets')?.hidden===false,null,{timeout:15000});
   assert.match(await page.locator('#r1300CountryMarkets').innerText(),/View all 1 international markets/);
   if(make==='BMW'){
    assert.equal(await page.locator('#databaseHeroPhoto').isVisible(),true);
    assert.equal(await page.locator('#v2ApprovedGallery article').count(),1);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),origin+'/bmw-r1300gs.html');
   }else assert.equal(await page.locator('#databaseHeroPhoto').isVisible(),false);
   if(make==='Suzuki'){
    const visible=page.locator('.anybike-v2-reviewed-universal-section');
    if(width===1280){
     assert.equal(await visible.count(),20,'All 20 approved research slots must render on the master');
     assert.match(await visible.first().innerText(),/Approved factory history smoke-test record 1/);
     assert.match(await visible.last().innerText(),/Approved factory history smoke-test record 20/);
    }else{
     assert.equal(await visible.count(),0,'Draft research must never become visible');
     assert.equal((await page.locator('#body').innerText()).includes('Approved factory history smoke-test record'),false);
    }
   }
   await page.locator('input[name=name]').fill('Browser Test');
   await page.locator('input[name=email]').fill('browser@example.invalid');
   await page.locator('input[name=country]').fill('United Kingdom');
   await page.locator('textarea[name=message]').fill('Please check this specific model.');
   await page.locator('#v2FormSubmit').click();
   await page.locator('#internationalGuestRequestStatus').getByText(/MOCK-ONLY/).waitFor();
   assert.equal(submissions.length,1);
   assert.equal(submissions[0].make,make);
   assert.equal(submissions[0].model,model);
   const metrics=await page.evaluate(()=>({
    viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
    hidden:document.querySelectorAll('main [hidden]').length
   }));
   assert(metrics.documentWidth<=metrics.viewport+3,
    'Horizontal overflow at '+width+'px: '+JSON.stringify(metrics));
   await page.screenshot({path:'artifacts/universal-v2-browser/'+make.replace(/[^a-z0-9]/gi,'-')+
    '-'+model.replace(/[^a-z0-9]/gi,'-')+'-'+width+'.png',fullPage:true});
   assert.deepEqual(errors,[]);
   console.log('PASS '+make+' '+model+' '+width+'px');passed++;
  }finally{await context.close();}
 }
 console.log('Universal V2 master browser scenarios passed: '+passed);
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
