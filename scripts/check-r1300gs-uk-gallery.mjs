// Run: node scripts/check-r1300gs-uk-gallery.mjs
// Regression checks for the approved UK R 1300 GS model layout.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('bmw-r1300gs.html','utf8');
const gallery=html.indexOf('id="ukR1300ModelGallery"');
const seller=html.indexOf('UK owners: Sell My BMW R 1300 GS');
const stock=html.indexOf('id="internationalModelStock"');
const source=html.indexOf('id="nextAction"');
assert(gallery>=0 && gallery<seller,'UK model-year gallery must appear immediately before UK seller action');
assert(seller<stock && stock<source,'International stock and sourcing must remain after UK seller action');
assert(html.includes('id="ukR1300ModelGallery" class="end-action"') && html.includes('hidden aria-label="BMW R 1300 GS model-year gallery"'),'UK gallery visibility guard missing');
assert(html.includes("const original=document.getElementById('r1300gsModelHistory')"),'Approved model-history gallery source missing');
assert(html.includes("const copy=original.cloneNode(true)"),'UK model history copy missing');
assert(html.includes("copy.id='ukR1300HistoryCards'"),'UK gallery copy requires unique ID');
assert(html.includes('new MutationObserver(update).observe(stock'),'Gallery visibility observer missing');
assert(html.includes('source.hidden=!internationalVisible'),'International buyer action visibility guard missing');
assert(html.includes('id="internationalModelCards"'),'International stock gallery missing');
assert(html.includes('id="internationalGuestRequestForm"'),'International guest enquiry missing');
assert(html.includes('/uk-motorcycle-selling.html?make=BMW&amp;model=R%201300%20GS'),'UK selling route missing');
console.log('PASS: R 1300 GS UK gallery placement and existing buyer/seller visibility hooks preserved.');
