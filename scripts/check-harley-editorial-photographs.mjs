// Run from repository root: node scripts/check-harley-editorial-photographs.mjs
// Do not use unrelated motorcycle photographs as historical or modification evidence.
import {readFileSync} from 'node:fs';
const manufacturer=readFileSync('harley-davidson-motorcycles.html','utf8');
const global=readFileSync('anybike-global.html','utf8');
const errors=[];
const disallowed={
 '1957 · Sportster begins':true,
 '2017 · Milwaukee-Eight Touring':true,
 'Superchargers and turbochargers':true
};
for(const [title] of Object.entries(disallowed)){
 const heading='<h3>'+title+'</h3>';
 const at=manufacturer.indexOf(heading);
 if(at<0){errors.push('Missing historical section '+title);continue}
 if(manufacturer.slice(at+heading.length,at+heading.length+65).includes('harley-editorial-photo'))errors.push('Unverified illustrated photograph immediately after '+title);
}
// Two formerly unillustrated articles now have model-specific Commons sources.
for(const [heading,source] of [
 ['V-Rod: Revolution engine and Porsche collaboration','Harley-Davidson%20V-Rod.jpg'],
 ['XR1000: race engineering for the road','1984%20Harley-Davidson%20XR-1000%20Sportsters%20Front.jpg']
]){
 const at=manufacturer.indexOf('<h3>'+heading+'</h3>');
 const article=manufacturer.slice(at,manufacturer.indexOf('</div>',at));
 if(at<0||!article.includes(source)||!article.includes('Photo and licence details'))errors.push('Missing identified historic editorial photograph: '+heading);
}
const turbo=global.indexOf('<h3>Harley-Davidson superchargers and turbochargers</h3>');
if(turbo<0)errors.push('Global forced-induction story missing');
else {
 const open=global.lastIndexOf('<article',turbo),tag=global.slice(open,global.indexOf('>',open)+1);
 if(tag.includes('data-photo='))errors.push('Forced-induction story must not display an unmodified model as turbo/supercharger evidence');
}
for(const match of manufacturer.matchAll(/<figure class="harley-editorial-photo">([\s\S]*?)<\/figure>/g)){
 if(!match[1].includes('Photo and licence details'))errors.push('Uncredited editorial photograph');
}

// Every displayed editorial image must have a descriptive alt, visible attribution,
// a link back to its original file/licensing page, and a genuinely image-bearing URL.
// Identification and licence terms still require human review before adding new photos.
for(const [index,match] of [...manufacturer.matchAll(/<figure class="harley-editorial-photo">([\s\S]*?)<\/figure>/g)].entries()){
 const figure=match[1];
 const img=figure.match(/<img\b[^>]*>/i)?.[0]||'';
 const alt=img.match(/\balt="([^"]+)"/)?.[1]||'';
 const src=img.match(/\bsrc="([^"]+)"/)?.[1]||'';
 const caption=figure.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1]||'';
 if(!src.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/'))errors.push('Editorial photo '+(index+1)+' lacks traceable Commons source');
 if(alt.length<24)errors.push('Editorial photo '+(index+1)+' lacks descriptive alt text');
 if(!caption.includes('Photo and licence details')||!caption.includes('commons.wikimedia.org/wiki/File:'))errors.push('Editorial photo '+(index+1)+' lacks visible original-file/licence link');
 if(!/\brel="noopener noreferrer"/.test(caption))errors.push('Editorial photo '+(index+1)+' lacks safe external-link attributes');
 if(/sportster/i.test(src)&&/V-Rod|XR1000/i.test(alt))errors.push('Wrong family: Sportster imagery labelled V-Rod or XR1000');
 if(/Pan.America.1250.Special/i.test(src)&&/Pan America 1250 ST/i.test(alt))errors.push('Pan America Special image incorrectly labelled ST');
}
// Navigation to major deep-page chapters must remain usable, including custom
// builders and buyer information; every fragment must correspond to a real ID.
const nav=manufacturer.match(/<nav class="harley-quick-nav"[\s\S]*?<\/nav>/)?.[0]||'';
if(!nav)errors.push('Harley chapter navigation missing');
for(const id of ['models','harley-racing-custom-history','harley-battistinis','harley-ss-screamin-eagle','harley-history-timeline','harley-uk-buyer-reference','harley-stories','harley-sell']){
 if(!nav.includes('href="#'+id+'"'))errors.push('Harley chapter link missing: '+id);
}
for(const anchor of nav.matchAll(/href="#([^"]+)"/g)){
 if(!manufacturer.includes('id="'+anchor[1]+'"'))errors.push('Harley chapter link has no target: '+anchor[1]);
}
if(manufacturer.includes('/available-stock.html'))errors.push('Hidden Available Stock leaked from Harley manufacturer page');


// Validate the complete model catalogue, not just hand-written editorial figures.
const dataset=manufacturer.match(/const curatedHarley=(\[[^\n]+\]);/);
if(!dataset)errors.push('Harley model catalogue data missing');
else {
 let families=[];
 try{families=JSON.parse(dataset[1])}catch(e){errors.push('Model catalogue JSON invalid: '+e.message)}
 const entries=families.flatMap(f=>f.entries||[]);
 if(entries.length!==21)errors.push('Expected 21 Harley model guides; found '+entries.length);
 const unique=new Set(entries.map(x=>x.url));
 if(unique.size!==entries.length)errors.push('Duplicate Harley model guide card URL');
 const mustRemainUnillustrated=[]; // Exact-model user-supplied images are approved, but must be identified as edited where applicable.
 // Do not fill historical or variant-specific gaps with a different motorcycle.
 const verifiedHistoricalSources=new Map([
  ['V-Rod','https://commons.wikimedia.org/wiki/File:Harley-Davidson_V-Rod.jpg'],
  ['XR1000','https://commons.wikimedia.org/wiki/File:1984_Harley-Davidson_XR-1000_Sportsters_Front.jpg'],
  ['Hydra-Glide Revival','https://commons.wikimedia.org/wiki/File:Harley-Davidson_Museum_May_2024_31_(2024_Hydra-Glide_Revival).jpg']
 ]);
 const verifiedVRodSource='https://commons.wikimedia.org/wiki/File:Harley-Davidson_V-Rod.jpg';
 for(const entry of entries){
   if(!entry.url?.startsWith('/harley-davidson-')||!entry.url.endsWith('.html'))errors.push('Invalid guide route: '+entry.name);
   if(entry.photo){
     const p=entry.photo;
     const commons=p.src?.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/');
     const local=p.src?.startsWith('/assets/');
     if(!commons&&!local)errors.push(entry.name+': image must be traceable to Commons or AnyBike assets');
     if(commons&&!p.source?.startsWith('https://commons.wikimedia.org/wiki/File:'))errors.push(entry.name+': Commons image attribution missing');
     if(local&&p.source!==p.src)errors.push(entry.name+': local image source attribution mismatch');
     if(!p.author||!p.license||!p.licenseUrl)errors.push(entry.name+': credit/licence metadata incomplete');
     if(commons&&!/^https:\/\/creativecommons\.org\//.test(p.licenseUrl))errors.push(entry.name+': Commons licence destination missing');
     if(commons&&!/^(CC BY|CC0|Public domain)/i.test(p.license))errors.push(entry.name+': Commons reuse rights require review');
     if(local&&!/AnyBike|illustrat|artwork|Photo supplied|edited/i.test([p.author,p.license].join(' ')))errors.push(entry.name+': local image must identify editorial origin or editing');
     if(mustRemainUnillustrated.includes(entry.name))errors.push(entry.name+': requires specific image identification and licence review first');
     if(verifiedHistoricalSources.has(entry.name)&&p.source!==verifiedHistoricalSources.get(entry.name))errors.push(entry.name+': approved image source changed; recheck identity and licence');
     if(entry.name==='Pan America 1250 ST'&&/Special/i.test(p.src))errors.push('Wrong Pan America version on ST card');
   }
 }
 console.log('Harley catalogue photo coverage: '+entries.filter(x=>x.photo).length+'/'+entries.length+' credited; '+entries.filter(x=>!x.photo).map(x=>x.name).join(', ')+' awaiting verified images.');
}

if(errors.length){errors.forEach(e=>console.error('FAIL '+e));process.exitCode=1}
else console.log('PASS: Harley editorial image mismatch guard is satisfied.');
