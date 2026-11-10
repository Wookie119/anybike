import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../bmw-r1300gs.html',import.meta.url),'utf8');
const generic=readFileSync(new URL('../motorcycle-model-guide.html',import.meta.url),'utf8');
const shared=readFileSync(new URL('../model-template/public-verified-model-facts.mjs',import.meta.url),'utf8');
const required=[
 ['canonical original guide','https://www.anybike.co.uk/bmw-r1300gs.html'],
 ['approved hero photograph','class="recovered-hero-photo"'],
 ['R 1300 editorial design','id="r1300-editorial-refinement"'],
 ['exact-model international stock','id="internationalModelStock"'],
 ['original 2024–present model-year gallery','id="ukR1300ModelGallery"'],
 ['documented technical generations','id="generationPanel"'],
 ['original research cards','id="body"'],
 ['source enquiry','id="source"'],
 ['manufacturer action','id="manufacturer"'],
 ['licence credit','CC BY-SA 4.0'],
 ['source year history','r1300gsModelHistory']
];
for(const [reason,token] of required)assert(html.includes(token),'R 1300 GS lost '+reason);
const order=['class="hero"','id="internationalModelStock"','id="generationPanel"','id="ukR1300ModelGallery"','id="body"'];
let last=-1;
for(const token of order){
 const pos=html.indexOf(token);
 assert(pos>last,'R 1300 GS section order changed: '+token);
 last=pos;
}
assert(html.includes('name="robots" content="index,follow"'),'Approved BMW guide must remain indexable');
assert(!html.includes('/model-template/public-verified-model-facts.mjs'),
 'Generic fact-card module must not override R 1300 GS editorial design');
assert(!html.includes('motorcycle-model-guide.html?make=BMW&model=R%201300%20GS'),
 'Canonical approved guide must not become generic research route');
assert(shared.includes("location.pathname==='/motorcycle-model-guide.html'"),
 'Shared fact display must remain scoped to generic model guide');
assert(generic.includes('/model-template/public-verified-model-facts.mjs'),
 'Generic guide should still receive separately verified model facts');
console.log('PASS: BMW R 1300 GS approved hero, editorial cards, stock-first sequence, model gallery, photos and canonical protected from generic rollout');
