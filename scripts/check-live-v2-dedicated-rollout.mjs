#!/usr/bin/env node
// Read-only live validation of the 44 migrated BMW/Harley model routes.
// Never submits forms, reads private stock endpoints, or changes publication.
// Source equality is not a substitute for role-specific Playwright checks.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const routes=JSON.parse(readFileSync('data/approved-dedicated-model-routes.json','utf8')).models;
const master=readFileSync('motorcycle-v2-master.html','utf8');
const reference='/bmw-r1300gs.html';
const expectedVersion=master.match(/src="(\/model-template\/approved-v2-universal-preview\.mjs\?v=[^"]+)"/)?.[1];
assert(expectedVersion,'Current approved master renderer version missing');
const tags=html=>[...html.matchAll(/<section\b([^>]*)>/g)].map(m=>m[1]);
const expectedSections=JSON.stringify(tags(master));
const migrated=routes.filter(r=>r.url!==reference);
assert.equal(migrated.length,44,'Expected 44 migrated dedicated model pages');
const errors=[],results=[];
const base='https://www.anybike.co.uk';
async function check(route){
 const path=route.url;
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(base+path,{method:'GET',redirect:'follow',
   signal:controller.signal,headers:{'Cache-Control':'no-cache',Accept:'text/html'}});
  if(!response.ok)throw Error('HTTP '+response.status);
  const html=await response.text();
  if(!html.includes('href="'+base+path+'"'))throw Error('Wrong or missing exact canonical');
  if(!html.includes('id="heading">'+route.make+' '+route.model+'</h1>'))
   throw Error('Wrong static model identity');
  if(!html.includes('src="'+expectedVersion+'"'))
   throw Error('Old shared V2 renderer version');
  if(JSON.stringify(tags(html))!==expectedSections)
   throw Error('Live sections differ from approved stock-first master');
  if(!(html.indexOf('id="internationalModelStock"')<
        html.indexOf('id="generationPanel"')))
   throw Error('Exact model stock is not ahead of research');
  results.push(path);
 }catch(error){errors.push(path+': '+error.message);}
 finally{clearTimeout(timeout);}
}
for(let start=0;start<migrated.length;start+=6){
 await Promise.all(migrated.slice(start,start+6).map(check));
}
const referenceController=new AbortController();
const referenceTimer=setTimeout(()=>referenceController.abort(),12000);
try{
 const response=await fetch(base+reference,{signal:referenceController.signal,
  headers:{'Cache-Control':'no-cache',Accept:'text/html'}});
 if(!response.ok)throw Error('HTTP '+response.status);
 const html=await response.text();
 if(!html.includes('id="ukR1300ModelGallery"')||
    html.includes('src="'+expectedVersion+'"'))
  throw Error('Protected original R 1300 GS reference was modified');
 results.push(reference+' (original protected)');
}catch(error){errors.push(reference+': '+error.message)}
finally{clearTimeout(referenceTimer)}
console.log('LIVE DEDICATED V2:',results.length,'passed of',routes.length);
for(const item of errors)console.error('LIVE V2 FAIL:',item);
if(errors.length)process.exitCode=1;
