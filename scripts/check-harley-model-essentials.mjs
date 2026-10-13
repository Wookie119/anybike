// From repository root: node scripts/check-harley-model-essentials.mjs
// Prevent accidental loss of essential BMW-model-template sections on Harley-Davidson guides.
import {readFileSync} from 'node:fs';
const ids=['road-glide','street-glide','road-king','electra-glide','ultra-limited','fat-boy','breakout','low-rider-s','softail-standard','iron-883','sportster-s','pan-america-1250','heritage-classic','street-bob','nightster','cvo','hydra-glide-revival','v-rod','xr1000','pan-america-1250-st'];
const required=['Interested in this Harley-Davidson','Own a Harley-Davidson','/uk-motorcycle-selling.html?make=Harley-Davidson','/bulk-buying-request.html?make=Harley-Davidson','AnyBike Global','/harley-davidson-motorcycles.html'];
// The manufacturer catalogue is the canonical visible list. Ensure the audit inventory cannot fall behind.
const catalogue=readFileSync('harley-davidson-motorcycles.html','utf8');
const published=[...catalogue.matchAll(/"url":"\\/harley-davidson-([^"]+)\\.html"/g)].map(x=>x[1]);
if(new Set(published).size!==ids.length||ids.some(id=>!published.includes(id))){
 console.error('FAIL: model-audit inventory differs from Harley manufacturer catalogue');process.exitCode=1;
}
let issues=[];
for(const id of ids){
 const file='harley-davidson-'+id+'.html',html=readFileSync(file,'utf8');
 for(const fragment of required)if(!html.toLowerCase().includes(fragment.toLowerCase()))issues.push(file+': missing '+fragment);
 if(html.includes('/sell-your-motorcycle.html'))issues.push(file+': wrong UK selling entry route');
 if(html.includes('/available-stock.html'))issues.push(file+': hidden stock leaked');
 if(!/(history|historic|generation|documented|origins)/i.test(html))issues.push(file+': missing historical or model context');
}
if(issues.length){issues.forEach(m=>console.error('FAIL',m));process.exitCode=1}
else console.log('PASS: All 20 Harley model guides retain sourcing, UK selling, AnyBike Global, model research and navigation.');
