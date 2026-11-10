// Batch guard for every published dedicated BMW and Harley-Davidson model route.
// Model guides must inherit the single international stock renderer without
// inventing or substituting another model's live inventory.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const files=fs.readdirSync('.').filter(file=>
 /^(bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(file) &&
 !/(?:motorcycles|backup|preview|development|approved|-v2)\b/.test(file));
let covered=0,dedicated=0,shared=0;
for(const file of files){
 const html=fs.readFileSync(file,'utf8');
 assert(html.includes('/public-header.js'),file+' missing shared public model renderer');
 assert(html.includes('https://www.anybike.co.uk/'+file),
   file+' missing correct exact-page canonical URL');
 assert(html.includes('name="robots" content="index,follow"'),
   file+' missing approved indexability metadata');
 assert(/enquir/i.test(html),file+' missing customer enquiry pathway');
 assert(!html.includes('data-anybike-universal-stage="true"'),
   file+' activated unapproved research stage over existing design');
 const hasDedicated=html.includes('id="internationalModelStock"')||html.includes('id="r1250LiveStock"');
 const hasStandard=html.includes('id="generationPanel"')&&html.includes('id="nextAction"');
 const harley=file.startsWith('harley-davidson-');
 assert(hasDedicated||hasStandard||harley,file+' has no compatible model stock layout');
 if(hasDedicated)dedicated++; else shared++;
 covered++;
}
assert(covered>=40,'Unexpected dedicated-model route count; model pages may be omitted');
const renderer=fs.readFileSync('public-header.js','utf8');
assert(renderer.includes("if(hero)hero.after(section)"),'Model stock must appear immediately below model hero');
assert(renderer.includes('section.append(title,note,stockGrid,liveBrowse,stockLink);'),'Exact-model stock and live-stock buttons must have one sale panel');
assert(renderer.includes("else if(make==='BMW'&&main.querySelector('#generationPanel')){research.remove();}"),'BMW pages must not repeat documented model development');
assert(renderer.includes('else section.after(research);'),'Other manufacturer research must remain independent of stock');
assert(renderer.includes("else if(make==='BMW'&&main.querySelector('#body')){main.querySelector('#body').after(enquiry);}"),'BMW enquiry must follow the documented research');
assert(renderer.includes('else research.after(enquiry);'),'Other manufacturers keep research before enquiry');
assert(renderer.includes('stockLink.textContent=matches.length?'),'Empty-stock sourcing link must replace misleading sale button');
assert(renderer.includes('const candidates=(Array.isArray(data.items)?data.items:[]).filter(exactModel)'), 'Exact model stock filter missing');
assert(renderer.includes('const exactIds=new Set(candidates.map(x=>Number(x.catalog_model_id)))'),'Canonical ID uniqueness guard missing');
assert(renderer.includes('return safe(x.model)===requested;'), 'Exact-model identity acceptance missing');
assert(!renderer.includes("exact.length ? exact : brandStock"),'Wrong-model stock fallback found');
assert(renderer.includes("if(!res.ok)throw Error('Research unavailable')"),'Model research must load independently');
console.log('PASS: '+covered+' dedicated BMW/Harley model routes ('+dedicated+' approved galleries; '+shared+' shared-renderer routes); exact-model inventory above research.');
