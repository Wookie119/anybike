// Verify every legacy BMW/Harley model URL redirects to its exact universal V2 destination.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const base=process.env.ANYBIKE_PUBLIC_ORIGIN||'https://www.anybike.co.uk';
const approved=JSON.parse(await readFile('data/approved-dedicated-model-routes.json','utf8')).models;
const models=JSON.parse(await readFile('data/universal-v2-model-routes.json','utf8')).models;
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const results=[];
assert.equal(approved.length,45);
for(const row of approved){
 const matches=models.filter(x=>normalize(x.make)===normalize(row.make)&&normalize(x.model)===normalize(row.model));
 assert.equal(matches.length,1,'Exact published identity must be unambiguous: '+row.url);
 const expected=matches[0].url,issues=[];
 try{
  const response=await fetch(base+row.url,{redirect:'manual',signal:AbortSignal.timeout(20000)});
  const location=response.headers.get('location');
  const target=location?new URL(location,base).pathname:null;
  if(![301,302,307,308].includes(response.status))issues.push('NO_HTTP_REDIRECT_'+response.status);
  if(target!==expected)issues.push('WRONG_DESTINATION_'+(target||'NONE'));
  if(!issues.length){
   const targetResponse=await fetch(base+expected,{signal:AbortSignal.timeout(20000)});
   if(targetResponse.status!==200)issues.push('TARGET_HTTP_'+targetResponse.status);
  }
  results.push({from:row.url,to:expected,status:response.status,actualDestination:target,pass:issues.length===0,issues});
 }catch(e){results.push({from:row.url,to:expected,pass:false,issues:['REQUEST_FAILED_'+String(e.message||e).slice(0,100)]});}
}
const failures=results.filter(x=>!x.pass);
await mkdir('artifacts/universal-v2-live-audit',{recursive:true});
await writeFile('artifacts/universal-v2-live-audit/legacy-redirects.json',JSON.stringify({checked:results.length,passed:results.length-failures.length,failed:failures.length,results},null,2));
console.log('Live legacy V2 redirects:',results.length-failures.length,'/',results.length,'passed');
for(const item of failures.slice(0,15))console.error(item.from,item.issues.join(','));
if(failures.length)process.exitCode=1;
