// Static safety check: all twenty Harley guide pages must have unique HTML IDs.
import fs from 'node:fs';
const ids=['road-glide','street-glide','road-king','electra-glide','ultra-limited','fat-boy','breakout','low-rider-s','softail-standard','heritage-classic','street-bob','iron-883','sportster-s','nightster','pan-america-1250','pan-america-1250-st','cvo','hydra-glide-revival','v-rod','xr1000'];
const errors=[];
for(const id of ids){
 const path='harley-davidson-'+id+'.html';
 const html=fs.readFileSync(path,'utf8');
 const seen=new Set();
 for(const match of html.matchAll(/\bid="([^"]+)"/g)){
  if(seen.has(match[1]))errors.push(path+' duplicate id: '+match[1]);
  seen.add(match[1]);
 }
 if(/<nav\b[^>]*class="[^"]*\bcrumb\b/i.test(html))errors.push(path+' breadcrumb reintroduced');
 if(!html.includes('UK owners: Sell My '))errors.push(path+' seller CTA heading lost');
}
if(errors.length){errors.forEach(x=>console.error('FAIL '+x));process.exitCode=1}
else console.log('PASS: 20 Harley guides have unique IDs, no breadcrumbs, and their UK seller heading.');
