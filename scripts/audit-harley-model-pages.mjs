// Run from repository root: node scripts/audit-harley-model-pages.mjs
// Static audit: no changes to site, authentication, Supabase or stock visibility.
import fs from 'node:fs';
import vm from 'node:vm';
import {URL} from 'node:url';
const models=[
 ['road-glide','Road Glide'],['street-glide','Street Glide'],['road-king','Road King'],
 ['electra-glide','Electra Glide'],['ultra-limited','Ultra Limited'],['fat-boy','Fat Boy'],
 ['breakout','Breakout'],['low-rider-s','Low Rider S'],['softail-standard','Softail Standard'],
 ['iron-883','Iron 883'],['sportster-s','Sportster S'],['pan-america-1250','Pan America 1250'],
 ['heritage-classic','Heritage Classic'],['street-bob','Street Bob'],['nightster','Nightster'],
 ['cvo','CVO'],['hydra-glide-revival','Hydra-Glide Revival'],['v-rod','V-Rod'],
 ['xr1000','XR1000'],['pan-america-1250-st','Pan America 1250 ST'],['cvo-pan-america','CVO Pan America']
];
const exists=file=>fs.existsSync(file);
const make='Harley-Davidson';
const failures=[];
const notes=[];
for(const [slug,expected] of models){
 const file='harley-davidson-'+slug+'.html';
 const html=fs.readFileSync(file,'utf8');
 const warn=message=>failures.push(file+': '+message);
 if(!/<h1>Harley-Davidson /.test(html))warn('Missing model heading');
 if(!/max-width:\s*1440px/.test(html))warn('Missing model layout width');
 if(!html.includes('AnyBike Global'))warn('Missing AnyBike Global');
 if(!/href="\/bulk-buying-request\.html\?make=Harley-Davidson&amp;model=/.test(html))warn('Missing buyer enquiry');
 if(!(/Own a Harley-Davidson|UK owners: Sell My Harley-Davidson|UK based owners|UK motorcycle owners/i).test(html))warn('Missing UK owner-selling');
 if(!/Compare related Harley-Davidson (models|motorcycles)|Continue exploring Harley-Davidson/.test(html))warn('Missing related-model navigation');
 if(!html.includes('harley-davidson-motorcycles.html'))warn('Missing brand page navigation');
 if(!/(history|historic|generation|documented|origins)/i.test(html))warn('Missing historical/generation context');
 if(html.includes('/available-stock.html'))warn('Hidden available stock linked publicly');

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
 
}
if(notes.length){console.log('RESEARCH / DESIGN FOLLOW-UP:');notes.forEach(n=>console.log('- '+n))}
if(failures.length){console.error('FAILURES ('+failures.length+'):');failures.forEach(e=>console.error('- '+e));process.exitCode=1}
else console.log('PASS: 21 Harley-Davidson model guides have model-specific sourcing, UK selling, AnyBike Global and valid local references.');
