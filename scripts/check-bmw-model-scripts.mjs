// Run from repository root: node scripts/check-bmw-model-scripts.mjs
// Checks the inline JavaScript in every BMW model guide without executing network requests.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const models=['s1000rr','r1300gs','m1000rr','r1250gs','s1000xr','r1250rt','k1600gt','f900gs','f900r','k1600gtl','f900xr','r18','ce04','rninet','f850gs','s1000r','r1250r','c400gt','ce02','r1200gs','c400x','g650gs','hp4','r1200rt','r32','r80gs','r90s'];
let failures=0;
for(const model of models){
 const file='bmw-'+model+'.html',html=readFileSync(file,'utf8');
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
 try{
  if(!scripts.length)throw new Error('Missing inline model renderer');
  for(const [index,script] of scripts.entries())new vm.Script(script,{filename:file+':inline'+index});
  if(html.includes("'.html+'"))throw new Error('Malformed related-model URL string');
  if(!html.includes('/data/motorcycle-model-guides.json'))throw new Error('Missing model guide data source');
  console.log('OK',file);
 }catch(error){failures++;console.error('FAIL',file,error.message)}
}
if(failures)process.exitCode=1;
else console.log('All 27 BMW model guide scripts passed syntax and data-source checks.');
