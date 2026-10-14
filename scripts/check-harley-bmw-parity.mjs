// Harley model-guide completeness guard. Run: node scripts/check-harley-bmw-parity.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const models=['road-glide','street-glide','road-king','electra-glide','ultra-limited','fat-boy','breakout','low-rider-s','softail-standard','heritage-classic','street-bob','iron-883','sportster-s','nightster','pan-america-1250','pan-america-1250-st','cvo','hydra-glide-revival','v-rod','xr1000'];
const errors=[];
for(const id of models){
 const file='harley-davidson-'+id+'.html',html=fs.readFileSync(file,'utf8');
 const check=(condition,message)=>{if(!condition)errors.push(file+': '+message)};
 check(html.includes('<h1'),'Missing model heading');
 check(html.includes('<table'),'Missing generation or variant comparison table');
 check(html.includes('Compare key generations and buying considerations')||id==='road-glide','Missing generation comparison section');
 check(html.includes('UK owners: Sell My '),'Missing UK owner CTA');
 check(html.includes('/uk-motorcycle-selling.html?make=Harley-Davidson'),'Missing UK selling link');
 check(html.includes('/bulk-buying-request.html?make=Harley-Davidson'),'Missing trade sourcing link');
 check(html.includes('Continue exploring Harley-Davidson'),'Missing related model navigation');
 check(html.includes('/harley-davidson-motorcycles.html'),'Missing manufacturer return link');
 check(!/<nav[^>]*class=["'][^"']*\bcrumb\b/i.test(html),'Breadcrumb reintroduced');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 check(new Set(ids).size===ids.length,'Duplicate HTML id');
 for(const href of html.matchAll(/href="(\/harley-davidson-[^"#?]+\.html)(?:[?#][^"]*)?"/g)){
  check(fs.existsSync(href[1].slice(1)),'Broken local model link: '+href[1]);
 }
}
if(errors.length){errors.forEach(e=>console.error('FAIL '+e));process.exitCode=1}
else console.log('PASS: 20 Harley model guides retain comparison, seller/buyer routes, related navigation, unique IDs and local target files.');
