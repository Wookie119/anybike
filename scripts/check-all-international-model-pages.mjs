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
assert(renderer.includes('else section.after(research);'),'Development and ownership must have its own border, after sale stock');
assert(renderer.includes('}else research.after(enquiry);'),'Enquiry must follow model history, not interrupt the stock-to-gallery sequence');
assert(renderer.includes('stockLink.textContent=matches.length?'),'Empty-stock sourcing link must replace misleading sale button');
assert(renderer.includes('const matches=(Array.isArray(data.items)?data.items:[]).filter(exactModel).slice(0,6)'), 'Exact model stock filter missing');
assert(renderer.includes("if(!stock.startsWith(requested))return false"), 'Different model exclusion missing');
assert(!renderer.includes("exact.length ? exact : brandStock"),'Wrong-model stock fallback found');
assert(renderer.includes("if(!res.ok)throw Error('Research unavailable')"),'Model research must load independently');
console.log('PASS: '+covered+' dedicated BMW/Harley model routes ('+dedicated+' approved galleries; '+shared+' shared-renderer routes); exact-model inventory above research.');
