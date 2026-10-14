// Run from repo root: node scripts/check-manufacturer-dom-integrity.mjs
// Regression guard: deleting visible elements must never break manufacturer/model data rendering.
import fs from 'node:fs';
const pages=['motorcycle-brand.html','motorcycle-guide-preview.html','motorcycle-model-guide.html','motorcycle-manufacturers.html'];
const problems=[];
for(const path of pages){
 const html=fs.readFileSync(path,'utf8');
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const references=[...html.matchAll(/(?:document\.)?getElementById\s*\(\s*["']([^"']+)["']\s*\)/g)].map(m=>m[1]);
 for(const id of new Set(references))if(!ids.has(id))problems.push(path+': script references missing element #'+id);
 const aliasReferences=[...html.matchAll(/\bel\s*\(\s*["']([^"']+)["']\s*\)/g)].map(m=>m[1]);
 for(const id of new Set(aliasReferences))if(!ids.has(id))problems.push(path+': script helper references missing element #'+id);
 if(/<nav\b[^>]*class="[^"]*\bcrumb\b/i.test(html))problems.push(path+': unwanted breadcrumb returned');
}
const brand=fs.readFileSync('motorcycle-brand.html','utf8');
for(const make of ['KTM','Honda','Ducati','Yamaha','Kawasaki','Triumph','Suzuki','Aprilia','Royal Enfield']){
 if(!brand.includes('"'+make+'":{'))problems.push('motorcycle-brand.html: missing '+make+' model group definition');
}
for(const required of ['categoryCards','categoryNavigation','modelGroups','modelsTitle','requestLink','canonicalLink']){
 if(!brand.includes('id="'+required+'"'))problems.push('motorcycle-brand.html: missing model renderer target #'+required);
}
if(problems.length){for(const message of problems)console.error('FAIL '+message);process.exitCode=1}
else console.log('PASS: manufacturer and preview DOM references are valid, model-data groups and rendering targets present.');
