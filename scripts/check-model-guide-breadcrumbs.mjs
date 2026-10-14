// Run from repository root: node scripts/check-model-guide-breadcrumbs.mjs
// Protect all published BMW and Harley model guides from reintroduced visual breadcrumb trails.
import fs from 'node:fs';
const bmw=['r32','r18','r90s','hp4','ce02','ce04','r80gs','f900r','c400x','s1000r','r1250r','f900gs','rninet','c400gt','g650gs','f850gs','f900xr','r1250gs','r1250rt','k1600gt','r1200rt','m1000rr','r1200gs','s1000xr','s1000rr','r1300gs','k1600gtl'];
const harley=['road-glide','street-glide','road-king','electra-glide','ultra-limited','fat-boy','breakout','low-rider-s','softail-standard','heritage-classic','street-bob','iron-883','sportster-s','nightster','pan-america-1250','pan-america-1250-st','cvo','hydra-glide-revival','v-rod','xr1000'];
const paths=[...bmw.map(x=>'bmw-'+x+'.html'),...harley.map(x=>'harley-davidson-'+x+'.html'),'harley-davidson-motorcycles.html'];
let failures=[];
for(const path of paths){
 if(!fs.existsSync(path)){failures.push(path+': guide missing');continue}
 const html=fs.readFileSync(path,'utf8');
 if(/<(?:nav|div|p|section)\b[^>]*class\s*=\s*["'][^"']*\b(?:crumb|breadcrumb|breadcrumbs)\b[^"']*["'][^>]*>/i.test(html))failures.push(path+': visible breadcrumb container reintroduced');
 if(/\b(?:aria-label|itemtype)\s*=\s*["'][^"']*(?:breadcrumb|BreadcrumbList)[^"']*["']/i.test(html))failures.push(path+': breadcrumb metadata or nav reintroduced');
 if(path!=='harley-davidson-motorcycles.html'){
  if(!html.includes('/bulk-buying-request.html'))failures.push(path+': sourcing route missing');
  if(!html.includes('/uk-motorcycle-selling.html'))failures.push(path+': UK selling route missing');
 }
}
if(failures.length){failures.forEach(x=>console.error('FAIL '+x));process.exitCode=1}
else console.log('PASS: 47 BMW/Harley model guides and Harley brand page contain no visible breadcrumb markup; sourcing and UK selling routes retained.');
