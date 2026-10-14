// Verify Harley guide essentials without touching the website or Supabase.
// Run: node scripts/check-harley-complete-gallery.mjs
import {readFileSync,existsSync} from 'node:fs';
const brand=readFileSync('harley-davidson-motorcycles.html','utf8');
const match=brand.match(/const curatedHarley=(\[[^\n]+\]);/);
if(!match) throw new Error('Missing Harley manufacturer model catalogue');
const cards=JSON.parse(match[1]).flatMap(group=>group.entries||[]);
const problems=[],warnings=[],seenPhotos=new Map(),seenUrls=new Set();
if(cards.length!==20) problems.push('Expected 20 catalogue models; found '+cards.length);
for(const card of cards){
 const route=(card.url||'').replace(/^\//,'');
 if(seenUrls.has(route))problems.push('Duplicate model card URL: '+route);
 seenUrls.add(route);
 if(!/^harley-davidson-[a-z0-9-]+\.html$/.test(route)||!existsSync(route)){problems.push('Missing or invalid model page: '+route);continue}
 const html=readFileSync(route,'utf8');
 for(const [label,pattern] of [
  ['canonical',new RegExp('<link rel="canonical" href="https://www\\.anybike\\.co\\.uk/'+route.replaceAll('.','\\.')+'">')],
  ['source request',/\/bulk-buying-request\.html\?make=Harley-Davidson/],
  ['UK selling',/\/uk-motorcycle-selling\.html\?make=Harley-Davidson/]
 ])if(!pattern.test(html))problems.push(route+': missing '+label);
 for(const [,anchor] of html.matchAll(/href="#([^"]+)"/g))if(!html.includes('id="'+anchor+'"'))problems.push(route+': broken fragment #'+anchor);
 const images=[...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g)];
 if(!images.length) warnings.push(card.name+': no identified model photograph');
 for(const [,src,tag] of images){
   if(!/\balt="[^"]+"/.test(tag))problems.push(route+': photo without alt');
   const normalized=src.split('?')[0];
   if(seenPhotos.has(normalized))problems.push('Photo reused between '+seenPhotos.get(normalized)+' and '+card.name);
   seenPhotos.set(normalized,card.name);
 }
 if(card.photo&&images.length===0)problems.push(card.name+': catalogue promises a photo missing from model guide');
 if(!card.photo&&images.length>0)warnings.push(card.name+': photo in model guide but absent from manufacturer card');
}
console.log('Harley catalogue models:',cards.length);
console.log('Distinct model-guide photograph sources:',seenPhotos.size);
for(const w of warnings)console.log('REVIEW:',w);
if(problems.length){for(const p of problems)console.error('FAIL:',p);process.exitCode=1}
else console.log('PASS: catalogue routes, anchors, selling/sourcing links, image uniqueness and basic photo labels checked. Visual model identity and image licensing still require separate review.');
