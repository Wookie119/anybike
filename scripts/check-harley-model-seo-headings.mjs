// Run from repository root: node scripts/check-harley-model-seo-headings.mjs
// Required before publishing Harley model-guide changes. Fails on missing, duplicate, generic or mismatched metadata.
import fs from 'node:fs';
const models=[['road-glide','Road Glide'],['street-glide','Street Glide'],['road-king','Road King'],['electra-glide','Electra Glide'],['ultra-limited','Ultra Limited'],['fat-boy','Fat Boy'],['breakout','Breakout'],['low-rider-s','Low Rider S'],['softail-standard','Softail Standard'],['heritage-classic','Heritage Classic'],['street-bob','Street Bob'],['iron-883','Iron 883'],['sportster-s','Sportster S'],['nightster','Nightster'],['pan-america-1250','Pan America 1250'],['pan-america-1250-st','Pan America 1250 ST'],['cvo','CVO'],['hydra-glide-revival','Hydra-Glide Revival'],['v-rod','V-Rod'],['xr1000','XR1000']];
const errors=[];const seenTitles=new Set(),seenDescriptions=new Set();
const attr=(head,key,value)=>[...head.matchAll(/<meta\b[^>]*>/gi)].filter(m=>new RegExp('\\b'+key+'="'+value+'"').test(m[0])).map(m=>m[0].match(/content="([^"]*)"/)?.[1]||'');
for(const [id,name] of models){
 const path='harley-davidson-'+id+'.html',html=fs.readFileSync(path,'utf8');
 const head=html.split('</head>')[0],title=[...head.matchAll(/<title>([\s\S]*?)<\/title>/g)].map(m=>m[1]);
 const h1=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>m[1].replace(/<[^>]*>/g,'').trim());
 const h2=[...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(m=>m[1].replace(/<[^>]*>/g,'').trim());
 const req=(ok,msg)=>{if(!ok)errors.push(path+': '+msg)};
 const brand='Harley-Davidson '+name,url='https://www.anybike.co.uk/'+path;
 const description=attr(head,'name','description'),ogTitle=attr(head,'property','og:title'),ogDesc=attr(head,'property','og:description'),ogUrl=attr(head,'property','og:url'),twTitle=attr(head,'name','twitter:title'),twDesc=attr(head,'name','twitter:description');
 const canonical=[...head.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/gi)].map(m=>m[0]);
 req(title.length===1&&title[0].includes(brand),'missing, duplicated or wrong model title');
 req(description.length===1&&description[0].includes(brand),'missing, duplicated or wrong model description');
 req(!seenTitles.has(title[0]),'duplicate SEO title across model guides');seenTitles.add(title[0]);
 req(!seenDescriptions.has(description[0]),'duplicate SEO description');seenDescriptions.add(description[0]);
 req(canonical.length===1&&canonical[0].includes('href="'+url+'"'),'missing, duplicated or wrong canonical URL');
 req(ogTitle.length===1&&ogTitle[0].includes(brand),'missing or wrong Open Graph title');
 req(ogDesc.length===1&&ogDesc[0].includes(brand),'missing or wrong Open Graph description');
 req(ogUrl.length===1&&ogUrl[0]===url,'missing or wrong Open Graph URL');
 req(attr(head,'name','twitter:card').length===1,'Twitter/X card tag missing or duplicate');
 req(twTitle.length===1&&twTitle[0].includes(brand),'Twitter/X title missing or wrong');
 req(twDesc.length===1&&twDesc[0].includes(brand),'Twitter/X description missing or wrong');
 req(h1.length===1&&h1[0]===brand,'must have exactly one matching H1');
 req(h2.length>=4&&h2.every(Boolean),'missing or empty H2 headings');
 req(html.includes('application/ld+json'),'structured data missing');
 req(html.includes('/uk-motorcycle-selling.html?make=Harley-Davidson'),'UK selling route missing');
 req(html.includes('/bulk-buying-request.html?make=Harley-Davidson'),'international sourcing route missing');
}
if(errors.length){errors.forEach(e=>console.error('FAIL '+e));process.exitCode=1}
else console.log('PASS: all 20 Harley models have matching unique metadata, H1/H2 hierarchy, social tags, canonical URLs and customer routes.');
