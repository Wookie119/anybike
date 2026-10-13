// From repo root: node scripts/check-harley-global-editorial.mjs
// Editorial guardrails for Harley-Davidson upgrade guides; no network or stock access.
import fs from 'node:fs';
import vm from 'node:vm';
const pages=[
 'global/harley-tyre-buying-guide.html',
 'global/harley-suspension-handling-guide.html',
 'global/harley-superchargers-turbochargers.html'
];
const errors=[];
const global=fs.readFileSync('anybike-global.html','utf8');
const manufacturer=fs.readFileSync('harley-davidson-motorcycles.html','utf8');
for(const file of pages){
 const html=fs.readFileSync(file,'utf8');
 const check=(condition,message)=>{if(!condition)errors.push(file+': '+message)};
 check(html.includes('Independent editorial information'),'Independent editorial disclosure absent');
 check(html.includes('AnyBike does not supply, fit, test, approve or certify'),'No explicit no-approval wording');
 check(html.includes('insurance'),'Insurance impact absent');
 check(html.includes('legal')||html.includes('roadworthiness'),'Legality and roadworthiness missing');
 check(html.includes('qualified')||html.includes('competent'),'No independent qualified specialist guidance');
 check(html.includes('Original sources and further reading'),'Original source links absent');
 check(global.includes('href="/'+file+'"'),'Missing Global story card');
 check(manufacturer.includes('href="/'+file+'"'),'Missing Harley manufacturer navigation');
 check(!html.includes('data-product-price')&&!html.includes('/available-stock.html'),'Possible stock or sales content');
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
   if(m[1].trim())try{new vm.Script(m[1],{filename:file})}catch(e){errors.push(file+': '+e.message)}
 }
}
const root='harley-ownership-guides',stories='harley-upgrade-guides';
if(!manufacturer.includes('id="'+root+'"'))errors.push('Harley ownership section missing');
if(!global.includes('id="'+stories+'"'))errors.push('Global story section missing');
if(errors.length){errors.forEach(e=>console.error('FAIL '+e));process.exitCode=1}
else console.log('PASS: All three Harley Global guides include editorial safeguards and both navigation routes.');
