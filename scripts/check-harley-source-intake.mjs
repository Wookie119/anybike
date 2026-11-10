// Read-only all-Harley source-intake parity. Does NOT publish, import or
// change any page. Exact catalogue IDs are a verified 2026-11-10 snapshot.
// The three family/unmatched guides are protected from automatic reassignment.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {extractModelSectionCandidates} from './extract-model-section-candidates.mjs';

const exact=[
 ['road-glide',143,'Road Glide'],['street-glide',157,'Street Glide'],
 ['road-king',144,'Road King'],['electra-glide',125,'Electra Glide'],
 ['ultra-limited',437,'Ultra Limited'],['fat-boy',127,'Fat Boy'],
 ['breakout',115,'Breakout'],['low-rider-s',430,'Low Rider S'],
 ['softail-standard',149,'Softail Standard'],['iron-883',429,'Iron 883'],
 ['sportster-s',153,'Sportster S'],['pan-america-1250',431,'Pan America 1250'],
 ['heritage-classic',868,'Heritage Classic'],['street-bob',156,'Street Bob'],
 ['nightster',140,'Nightster'],['v-rod',856,'V-Rod'],
 ['pan-america-1250-st',142,'Pan America 1250 ST'],
 ['cvo-pan-america',119,'CVO Pan America']
];
const requiresReview=['cvo','hydra-glide-revival','xr1000'];
assert.equal(exact.length,18);
assert.equal(new Set(exact.map(x=>x[1])).size,18,'Model ID reused');
assert.equal(new Set(exact.map(x=>x[0])).size,18,'Source route reused');
assert.equal(requiresReview.length,3);
assert(!requiresReview.some(s=>exact.some(x=>x[0]===s)),
 'A range/family or unmapped model was silently imported');
const sourceText=x=>String(x||'').replace(/<[^>]+>/g,' ')
 .replace(/&amp;/g,'&').replace(/&nbsp;/g,' ')
 .replace(/&rsquo;|&#8217;/g,'’').replace(/&#39;/g,"'")
 .replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const categories=new Map();
let sections=0;
for(const [slug,id,name] of exact){
 const file='harley-davidson-'+slug+'.html';
 const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const heading=sourceText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
 const intro=sourceText(html.match(/<p[^>]*class="[^"]*\b(?:lead|intro)\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1]);
 assert.equal(heading,'Harley-Davidson '+name,file+' changed exact model heading');
 assert(intro.length>=35&&intro.length<=1400,file+' has no safe intro');
 const bytes=Buffer.from(html,'utf8');
 const sha=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 const extracted=extractModelSectionCandidates({
  html,modelId:id,sourcePublicPath:'/'+file,sourceSha:sha
 });
 assert(extracted.eligible,file+' source canonical or indexing invalid');
 const slots=new Set();
 for(const candidate of extracted.candidates){
  const slot={
   chronology:3,generations:6,technical_specifications:12,buying_guidance:16
  }[candidate.category_key];
  assert(Number.isInteger(slot),'Unsupported source category '+candidate.category_key);
  assert(!slots.has(slot),'Duplicate research slot for '+file);
  assert(candidate.review_state==='source_captured',
   'Source capture cannot become editorial approval');
  assert(candidate.source_git_blob_sha===sha,'Source revision mismatch');
  slots.add(slot);
  categories.set(candidate.category_key,(categories.get(candidate.category_key)||0)+1);
 }
 assert(slots.has(16),file+' lost model-specific buying guidance');
 sections+=extracted.candidates.length;
}
for(const slug of requiresReview){
 const html=readFileSync(
  new URL('../harley-davidson-'+slug+'.html',import.meta.url),'utf8');
 assert(html.includes('<h1>Harley-Davidson '),
  'Review-only Harley source removed: '+slug);
}
assert.equal(sections,40,'Previously staged source shapes changed: review before re-import');
assert.deepEqual(Object.fromEntries([...categories].sort()),{
 buying_guidance:18,chronology:16,generations:1,technical_specifications:5
});
console.log('PASS: 18 exact Harley guides, 40 review-only research excerpts and 3 excluded ambiguous guides');
