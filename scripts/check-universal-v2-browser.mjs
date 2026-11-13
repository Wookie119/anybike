#!/usr/bin/env node
// Master-only browser smoke test: mocked RPC and enquiries; never touches live data.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
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
const tests=[['BMW','R 1300 GS',1280],['BMW','R 1300 GS',390],['Suzuki','RM250',1280],
 ['Suzuki','RM250',390],['Harley-Davidson','Fat Boy',1280]];
let passed=0;
try{
 for(const [make,model,width] of tests){
  const context=await browser.newContext({viewport:{width,height:850}});
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
    else if(pathname.endsWith('/international-public-stock')){status=403;body={error:'Restricted'};}
    else if(pathname.endsWith('/international-guest-enquiry')){submissions.push(payload);body={ok:true,reference:'MOCK-ONLY'};}
    else {status=404;body={error:'Unknown mock endpoint'};}
    await route.fulfill({status,contentType:'application/json',headers:{
     'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify(body)});
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(origin+'/motorcycle-v2-master.html?make='+encodeURIComponent(make)+
    '&model='+encodeURIComponent(model),{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__anybikeV2EditorialReady===true,{timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#internationalModelStock')?.dataset.stockFeedState==='restricted',
    {timeout:15000});
   assert.equal(await page.locator('#heading').innerText(),make+' '+model);
   assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'index,follow');
   assert.match(await page.locator('#internationalModelCards').innerText(),/access is restricted/i);
   assert.equal(await page.locator('#internationalGuestRequestForm').isVisible(),true);
   const order=await page.locator('main > *').evaluateAll(nodes=>nodes.map(n=>n.id||n.className));
   assert.equal(order.indexOf('internationalModelStock'),order.indexOf('hero')+1);
   await page.waitForFunction(()=>document.querySelector('#r1300CountryMarkets')?.hidden===false,{timeout:15000});
   assert.match(await page.locator('#r1300CountryMarkets').innerText(),/View all 1 international markets/);
   if(make==='BMW'){
    assert.equal(await page.locator('#databaseHeroPhoto').isVisible(),true);
    assert.equal(await page.locator('#v2ApprovedGallery article').count(),1);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),origin+'/bmw-r1300gs.html');
   }else assert.equal(await page.locator('#databaseHeroPhoto').isVisible(),false);
   await page.locator('input[name=name]').fill('Browser Test');
   await page.locator('input[name=email]').fill('browser@example.invalid');
   await page.locator('input[name=country]').fill('United Kingdom');
   await page.locator('textarea[name=message]').fill('Please check this specific model.');
   await page.locator('#v2FormSubmit').click();
   await page.locator('#internationalGuestRequestStatus').getByText(/MOCK-ONLY/).waitFor();
   assert.equal(submissions.length,1);
   assert.equal(submissions[0].make,make);
   assert.equal(submissions[0].model,model);
   assert.deepEqual(errors,[]);
   console.log('PASS '+make+' '+model+' '+width+'px');passed++;
  }finally{await context.close();}
 }
 console.log('Universal V2 master browser scenarios passed: '+passed);
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
