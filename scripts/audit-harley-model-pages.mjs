// Run from repository root: node scripts/audit-harley-model-pages.mjs
// Static audit: no changes to site, authentication, Supabase or stock visibility.
import fs from 'node:fs';
import vm from 'node:vm';
import {URL} from 'node:url';
const names=['road-glide','street-glide','road-king','electra-glide','ultra-limited','fat-boy','breakout','low-rider-s','softail-standard','iron-883','sportster-s','pan-america-1250','heritage-classic','street-bob','nightster','cvo'];
const exists=file=>fs.existsSync(file);
const make='Harley-Davidson';
const failures=[];
const notes=[];
for(const slug of names){
 const file='harley-davidson-'+slug+'.html';
 const html=fs.readFileSync(file,'utf8');
 const warn=message=>failures.push(file+': '+message);
 if(!/<h1>Harley-Davidson /.test(html))warn('Missing model heading');
 if(!html.includes('max-width:1440px'))warn('Missing BMW model layout width');
 if(!html.includes('AnyBike Global'))warn('Missing AnyBike Global');
 if(!html.includes('Interested in this Harley-Davidson'))warn('Missing buyer enquiry');
 if(!html.includes('Own a Harley-Davidson'))warn('Missing UK owner-selling');
 if(!html.includes('Compare related Harley-Davidson models'))warn('Missing related model section');
 if(!html.includes('harley-davidson-motorcycles.html'))warn('Missing brand page navigation');
 if(!html.includes('documented')&&!html.includes('generation'))warn('Missing historical/generation evidence');
 if(html.includes('/available-stock.html'))warn('Hidden available stock linked publicly');
 const expected=slug==='cvo'?'CVO':slug.split('-').map(s=>s==='s'?'S':s==='883'?'883':s==='1250'?'1250':s[0].toUpperCase()+s.slice(1)).join(' ');
 const sourceHref='/bulk-buying-request.html?make=Harley-Davidson&amp;model='+encodeURIComponent(expected);
 const sellerHref='/uk-motorcycle-selling.html?make=Harley-Davidson&amp;model='+encodeURIComponent(expected);
 if(!html.includes(sourceHref))warn('Incorrect sourcing model prefill: '+expected);
 if(!html.includes(sellerHref))warn('Incorrect selling model prefill: '+expected);
 const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const href of hrefs){
  if(href.startsWith('#')){if(!ids.has(href.slice(1)))warn('Missing local anchor '+href);continue}
  if(!href.startsWith('/'))continue;
  const dest=new URL(href,'https://www.anybike.co.uk');
  if(!/\.html$/.test(dest.pathname))continue;
  const target=dest.pathname.slice(1);
  if(!exists(target))warn('Missing linked file: '+target);
  if(target==='harley-davidson-motorcycles.html'&&dest.hash){
   const brandHtml=fs.readFileSync(target,'utf8');
   if(!brandHtml.includes('id="'+dest.hash.slice(1)+'"'))warn('Missing brand page anchor '+dest.hash);
  }
 }
 for(const [index,script] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean).entries()){
  if(script.trim().startsWith('{'))continue; // JSON-LD is data, not JavaScript
  try{new vm.Script(script,{filename:file+':script'+index})}catch(e){warn('JavaScript syntax: '+e.message)}
 }
 const photoCount=[...html.matchAll(/<img\b/g)].length;
 if(!photoCount)notes.push(file+': no model photo, requires rights-checked image');
 if(!html.includes('id="roadGlideGenerationControls"'))notes.push(file+': generation content remains static pending version-specific research and UX review');
}
if(notes.length){console.log('RESEARCH / DESIGN FOLLOW-UP:');notes.forEach(n=>console.log('- '+n))}
if(failures.length){console.error('FAILURES ('+failures.length+'):');failures.forEach(e=>console.error('- '+e));process.exitCode=1}
else console.log('PASS: 16 Harley-Davidson model guides have model-specific sourcing, UK selling, AnyBike Global and valid local references.');
