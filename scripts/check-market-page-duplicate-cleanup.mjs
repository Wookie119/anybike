/**
 * Verify shared country-page cleanup against the actual script function.
 * Keep real model cards, one generic request option and the first complete
 * FAQ answer. Re-running must be idempotent across all market pages.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const source=readFileSync(new URL('../market-page-standardisation.js',import.meta.url),'utf8');
new Script(source,{filename:'market-page-standardisation.js'});
const begin=source.indexOf('function dedupeMarketEditorialCards(){');
const finish=source.indexOf('\nfunction run(){',begin);
assert(begin>=0&&finish>begin,'Shared market cleanup missing');
const cleanup=new Script(source.slice(begin,finish)+'\ndedupeMarketEditorialCards();');
function model(title,href){
 return {removed:false,querySelector(key){return key==='h3'?{textContent:title}:null;},
 getAttribute(key){return key==='href'?href:null;},remove(){this.removed=true;}};
}
function details(title,answer){
 return {removed:false,answer,
 querySelector(key){return key==='summary'?{textContent:title}:null;},
 remove(){this.removed=true;}};
}
const cards=[
 model('BMW R 1300 GS','/bmw-r1300gs.html'),
 model(' Another    Make or Model ','/buy-motorcycles.html'),
 model('BMW R 1250 GS','/bmw-r1250gs.html'),
 model('Another Make or Model','/harley-davidson-pan-america-1250.html'),
 model('BMW   R 1300 GS','/bmw-r1300gs.html'),
 model('Honda Africa Twin','/motorcycle-brand.html?make=Honda'),
 model('Another Make or Model','/buy-motorcycles.html'),
 model('Yamaha NIKEN','/motorcycle-brand.html?make=Yamaha')
];
const faqs=[
 details('Can I buy a motorcycle in the United Kingdom for Japan?','Complete first answer'),
 details('Can I arrange an inspection?','First inspection answer'),
 details('  Can I   buy a motorcycle in the United Kingdom for Japan?  ','Duplicated question'),
 details('Can I use my own shipping company?','Shipping answer'),
 details('Can I arrange an inspection?','Repeated inspection')
];
const grid={querySelectorAll(sel){assert.equal(sel,'a.model-card');return cards.filter(x=>!x.removed);}};
const faq={querySelectorAll(sel){assert.equal(sel,'details');return faqs.filter(x=>!x.removed);}};
const document={querySelectorAll(sel){
 if(sel==='.model-grid')return[grid];
 if(sel==='.faq')return[faq];
 throw Error('Unexpected document query '+sel);
}};
for(let i=0;i<2;i++){
 cleanup.runInNewContext({document},{timeout:1000});
 assert.equal(cards.filter(x=>!x.removed).length,5,'Unexpected live model card count');
 assert.equal(cards.filter(x=>!x.removed&&
  /another\s+make\s+or\s+model/i.test(x.querySelector('h3').textContent)).length,1,
  'Generic sourcing placeholders not deduplicated');
 assert.equal(faqs.filter(x=>!x.removed).length,3,'Duplicate market FAQ remained');
}
for(const title of ['BMW R 1300 GS','BMW R 1250 GS','Honda Africa Twin','Yamaha NIKEN'])
 assert(cards.some(x=>!x.removed&&x.querySelector('h3').textContent===title),
 'Real model card removed: '+title);
assert(!faqs[0].removed&&faqs[0].answer==='Complete first answer',
 'Original FAQ answer must survive');
console.log('PASS: country pages retain real model cards while deduplicating placeholders and FAQ questions');
