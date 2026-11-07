// Run from repository root: node scripts/check-international-model-stock-exact.mjs
// Batch regression: a model page may show ONLY its own sale stock above research.
// This deliberately exercises the matching code embedded in public-header.js.
// Never substitute R 1300 RT, R 1250 RS or another model on an R 1250 GS page.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const shared=fs.readFileSync('public-header.js','utf8');
const start=shared.indexOf('const requested=safe(model);');
const end=shared.indexOf('   if(!matches.length)', start);
assert(start>=0&&end>start,'Central approved-model matcher missing');
const snippet=shared.slice(start,end);
const normalise=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const match=new Function('published','make','model','safe',snippet+'; return matches;');

const fixtures=[
 ['BMW','R 1300 GS TE'],['BMW','R 1300 GS'],['BMW','R 1300 GS Adventure'],
 ['BMW','R 1300 RT'],['BMW','R 1250 RS SE'],['BMW','R 1250 GS Adventure'],
 ['BMW','K 1600 GT SE'],['BMW','S 1000 RR'],['BMW','S 1000 R'],
 ['BMW','F 900 GS'],['BMW','F 900 GS Adventure'],
 ['Harley-Davidson','Fat Boy 114'],['Harley-Davidson','Road King']
].map(([make,model],i)=>({make,model,item_id:i+1,image_url:'/approved.jpg',price:1000}));
const cases=[
 ['BMW','R 1250 GS',[]],
 ['BMW','R 1300 GS',['R 1300 GS TE','R 1300 GS']],
 ['BMW','R 1300 RT',['R 1300 RT']],
 ['BMW','R 1250 RS',['R 1250 RS SE']],
 ['BMW','K 1600 GT',['K 1600 GT SE']],
 ['BMW','S 1000 RR',['S 1000 RR']],
 ['BMW','S 1000 R',['S 1000 R']],
 ['BMW','F 900 GS',['F 900 GS']],
 ['Harley-Davidson','Fat Boy',['Fat Boy 114']],
 ['Harley-Davidson','Road King',['Road King']]
];
for(const [make,model,wanted] of cases){
 const actual=match(fixtures,make,model,normalise).map(x=>x.model);
 assert.deepEqual(actual,wanted,'Cross-model stock leak or missing approved stock: '+make+' '+model);
}
assert(!shared.includes('alternativeBMW'),'Other-model BMW gallery substitution returned');
assert(!shared.includes('r1250StockFallback'),'R 1250 model-specific bypass returned');
assert(shared.includes('const dedicatedStock='),'Shared model gallery must respect approved dedicated galleries');
assert(shared.includes('hero.after(section)'),'Shared stock gallery must appear above model research');
assert(shared.includes('card.append(name,status)'),'Research must not use stock-photo logo placeholders');

// Guard every stock-gallery implementation, including the older optional loader.
const legacyModelStock=fs.readFileSync('public-international-model-stock.js','utf8');
assert(legacyModelStock.includes('const selected = exact.slice(0, 6);'),'Optional model stock must never show unrelated models');
assert(!legacyModelStock.includes('exact.length ? exact : brandStock'),'Cross-model fallback returned to optional stock');
assert(legacyModelStock.includes('approvedTrim.test(stockModel.slice(key.length))'),'Optional model trim guard missing');

const protectedR1300=fs.readFileSync('bmw-r1300gs.html','utf8');
assert(protectedR1300.includes('id="internationalModelCards"'),'R 1300 GS real listing cards missing');
assert(protectedR1300.includes('id="r1300gsModelHistory"'),'Approved R 1300 GS research cards missing');
const r1250=fs.readFileSync('bmw-r1250gs.html','utf8');
assert(r1250.includes('const matches=exact;'),'R 1250 GS exact-stock restriction lost');
assert(!r1250.includes('const matches=exact.length?exact:bmw'),'Wrong-BMW fallback returned');
assert(r1250.indexOf('id="r1250LiveStock"')<r1250.indexOf('id="ukR1250ModelGallery"'),'R 1250 stock must precede year cards');
assert(r1250.includes('id="r1250StockResearch"'),'R 1250 research must remain under sales section');
assert(r1250.includes('BMW_R_1250_GS_'),'Licensed R 1250 GS hero removed');

const models=[
 'bmw-r32.html','bmw-r18.html','bmw-hp4.html','bmw-r90s.html',
 'bmw-ce02.html','bmw-ce04.html','bmw-r80gs.html','bmw-f900r.html',
 'bmw-c400x.html','bmw-g650gs.html','bmw-f850gs.html','bmw-rninet.html',
 'bmw-c400gt.html','bmw-s1000r.html','bmw-r1250r.html','bmw-f900xr.html',
 'bmw-f900gs.html','bmw-k1600gt.html','bmw-r1250rt.html','bmw-s1000xr.html',
 'bmw-r1200rt.html','bmw-m1000rr.html','bmw-r1200gs.html','bmw-k1600gtl.html',
 'bmw-s1000rr.html','bmw-r1250gs.html',
 'motorcycle-model-guide.html','motorcycle-model.html','motorcycle-variant.html'
];
const version='public-header.js?v=20261107modelstockexact1';
for(const file of models){
 const html=fs.readFileSync(file,'utf8');
 assert(html.includes(version),'Model guide still using stale stock script: '+file);
 assert(html.includes('<h1')||file==='motorcycle-variant.html','Model heading missing: '+file);
}
const v2=fs.readFileSync('bmw-r1300gs-v2.html','utf8');
assert(v2.includes('bmw-r1300gs.html'),'Protected V2 canonical missing');
const harley=fs.readFileSync('harley-davidson-motorcycles.html','utf8');
assert(harley.includes('<h1'),'Protected Harley manufacturer page missing');
console.log('PASS: '+models.length+' guide routes; '+cases.length+' matching cases; no unrelated model listings; approved R 1300 GS and R 1250 GS research/stock hooks remain.');
