// Run from repository root: node scripts/check-harley-editorial-photographs.mjs
// Do not use unrelated motorcycle photographs as historical or modification evidence.
import {readFileSync} from 'node:fs';
const manufacturer=readFileSync('harley-davidson-motorcycles.html','utf8');
const global=readFileSync('anybike-global.html','utf8');
const errors=[];
const disallowed={
 'V-Rod: Revolution engine and Porsche collaboration':true,
 'XR1000: race engineering for the road':true,
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
for(const [index,match] of [...manufacturer.matchAll(/<figure class="harley-editorial-photo">([\\s\\S]*?)<\\/figure>/g)].entries()){
 const figure=match[1];
 const img=figure.match(/<img\\b[^>]*>/i)?.[0]||'';
 const alt=img.match(/\\balt="([^"]+)"/)?.[1]||'';
 const src=img.match(/\\bsrc="([^"]+)"/)?.[1]||'';
 const caption=figure.match(/<figcaption>([\\s\\S]*?)<\\/figcaption>/)?.[1]||'';
 if(!src.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/'))errors.push('Editorial photo '+(index+1)+' lacks traceable Commons source');
 if(alt.length<24)errors.push('Editorial photo '+(index+1)+' lacks descriptive alt text');
 if(!caption.includes('Photo and licence details')||!caption.includes('commons.wikimedia.org/wiki/File:'))errors.push('Editorial photo '+(index+1)+' lacks visible original-file/licence link');
 if(!/\\brel="noopener noreferrer"/.test(caption))errors.push('Editorial photo '+(index+1)+' lacks safe external-link attributes');
 if(/sportster/i.test(src)&&/V-Rod|XR1000/i.test(alt))errors.push('Wrong family: Sportster imagery labelled V-Rod or XR1000');
 if(/Pan.America.1250.Special/i.test(src)&&/Pan America 1250 ST/i.test(alt))errors.push('Pan America Special image incorrectly labelled ST');
}
// Navigation to major deep-page chapters must remain usable, including custom
// builders and buyer information; every fragment must correspond to a real ID.
const nav=manufacturer.match(/<nav class="harley-quick-nav"[\\s\\S]*?<\\/nav>/)?.[0]||'';
if(!nav)errors.push('Harley chapter navigation missing');
for(const id of ['models','harley-racing-custom-history','harley-battistinis','harley-ss-screamin-eagle','harley-history-timeline','harley-uk-buyer-reference','harley-stories','harley-sell']){
 if(!nav.includes('href="#'+id+'"'))errors.push('Harley chapter link missing: '+id);
}
for(const anchor of nav.matchAll(/href="#([^"]+)"/g)){
 if(!manufacturer.includes('id="'+anchor[1]+'"'))errors.push('Harley chapter link has no target: '+anchor[1]);
}
if(manufacturer.includes('/available-stock.html'))errors.push('Hidden Available Stock leaked from Harley manufacturer page');

if(errors.length){errors.forEach(e=>console.error('FAIL '+e));process.exitCode=1}
else console.log('PASS: Harley editorial image mismatch guard is satisfied.');
