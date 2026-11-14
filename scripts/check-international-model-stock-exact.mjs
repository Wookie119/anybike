// Run from repository root: node scripts/check-international-model-stock-exact.mjs
// Batch regression: a model page may show ONLY its own sale stock above research.
// This deliberately exercises the matching code embedded in public-header.js.
// Never substitute R 1300 RT, R 1250 RS or another model on an R 1250 GS page.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const shared=fs.readFileSync('public-header.js','utf8');
const start=shared.indexOf('  const requested=safe(model);',shared.indexOf('/* International model stock and guest enquiries: model guides only.'));
const end=shared.indexOf('  function saleCard(x){',start);
assert(start>=0&&end>start,'Central exact-model stock matcher missing');
const snippet=shared.slice(start,end);
const normalise=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const matcher=new Function('make','model','safe',snippet+';return exactModel;');
const match=(published,make,model,safe)=>published.filter(matcher(make,model,safe));

const fixtures=[
 ['BMW','R 1300 GS TE'],['BMW','R 1300 GS'],['BMW','R 1300 GS Adventure'],
 ['BMW','R 1300 RT'],['BMW','R 1250 RS SE'],['BMW','R 1250 GS Adventure'],
 ['BMW','K 1600 GT SE'],['BMW','S 1000 RR'],['BMW','S 1000 R'],
 ['BMW','F 900 GS'],['BMW','F 900 GS Adventure'],
 ['Harley-Davidson','Fat Boy 114'],['Harley-Davidson','Road King']
].map(([make,model],i)=>({make,model,item_id:i+1,image_url:'/approved.jpg',price:1000,catalog_model_id:i+1,catalogue_identity_status:'verified',publication_eligible:true}));
const cases=[
 ['BMW','R 1250 GS',[]],
 ['BMW','R 1300 GS',['R 1300 GS']],
 ['BMW','R 1300 RT',['R 1300 RT']],
 ['BMW','R 1250 RS',[]],
 ['BMW','K 1600 GT',[]],
 ['BMW','S 1000 RR',['S 1000 RR']],
 ['BMW','S 1000 R',['S 1000 R']],
 ['BMW','F 900 GS',['F 900 GS']],
 ['Harley-Davidson','Fat Boy',[]],
 ['Harley-Davidson','Road King',['Road King']]
];
for(const [make,model,wanted] of cases){
 const actual=match(fixtures,make,model,normalise).map(x=>x.model);
 assert.deepEqual(actual,wanted,'Cross-model stock leak or missing approved stock: '+make+' '+model);
}
assert(!shared.includes('alternativeBMW'),'Other-model BMW gallery substitution returned');
assert(!shared.includes('r1250StockFallback'),'R 1250 model-specific bypass returned');
assert(shared.includes('const dedicatedStock='),'Shared model gallery must respect approved dedicated galleries');
assert(shared.includes('if(hero)hero.after(section)'),'Stock must follow model introduction and precede research');
assert(shared.includes('content.append(strong,p)'),'Model-specific research must follow stock in its own cards');

// Guard every stock-gallery implementation, including the older optional loader.
const legacyModelStock=fs.readFileSync('public-international-model-stock.js','utf8');
assert(legacyModelStock.includes('const selected = exact.slice(0, 6);'),'Optional model stock must never show unrelated models');
assert(!legacyModelStock.includes('exact.length ? exact : brandStock'),'Cross-model fallback returned to optional stock');
assert(legacyModelStock.includes('const exactIds = new Set(candidates.map(x => Number(x.catalog_model_id)))'),'Optional loader must enforce unique canonical model ID');
assert(legacyModelStock.includes('norm(x.model) === key'),'Optional loader must use exact model identity');

const protectedR1300=fs.readFileSync('bmw-r1300gs.html','utf8');
assert(protectedR1300.includes('id="internationalModelCards"'),'R 1300 GS real listing cards missing');
assert(protectedR1300.includes('id="r1300gsModelHistory"'),'Approved R 1300 GS research cards missing');
const r1250=fs.readFileSync('bmw-r1250gs.html','utf8');
const v2=fs.readFileSync('model-template/approved-v2-universal-preview.mjs','utf8');
const historyBridge=fs.readFileSync('model-template/approved-v2-dedicated-preservation.mjs','utf8');
const r1250Archive=JSON.parse(fs.readFileSync('data/bmw-r1250gs-v2-preservation.json','utf8'));
assert(r1250.includes('approved-v2-universal-preview.mjs'),'R1250 must use the actual universal V2 renderer');
assert(r1250.indexOf('id="internationalModelStock"')<r1250.indexOf('id="generationPanel"'),'Stock must precede researched generations');
assert(v2.includes('stockForCanonicalModel(data.items,pageIdentity,6)'),'Only verified exact catalogue model identity may produce stock');
assert(v2.includes("res.status===401||res.status===403"),'Stock access policy must remain enforced');
assert(v2.includes("feedState='restricted'"),'Restricted stock state must not show unauthorised motorcycles');
assert(v2.includes('pendingStock.dataset.stockFeedState'), 'Temporary outages must not leave permanent loading');
assert(v2.includes('international-guest-enquiry'),'R1250 must retain non-login enquiries');
assert(historyBridge.includes('model_year_cards=cards'),'Archived year notes must hydrate shared V2 model-year cards');
assert.deepEqual(r1250Archive.model_year_gallery.years,[2019,2020,2021,2022,2023],'All R1250 year cards retained');
assert(r1250Archive.model_year_gallery.model_year_cards.length===5,'Five archived timeline entries missing');
assert(r1250Archive.approved_existing_hero.licence_url.startsWith('https://creativecommons.org/licenses/'),'Original model photograph licence lost');
assert(v2.includes('preservedExistingPhoto'),'Previously published image credit fallback removed');

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
const legacyHeader='public-header.js?v=20261107modelstockexact1';
const currentV2Header='public-header.js?v=20261113-v2-early-dom2';
for(const file of models){
 const html=fs.readFileSync(file,'utf8');
 const migrated=html.includes('/model-template/approved-v2-universal-preview.mjs');
 const accepted=migrated?html.includes(currentV2Header):html.includes(legacyHeader);
 assert(accepted,'Model guide does not load its correct shared public header: '+file);
 if(migrated){
  assert(html.includes('id="internationalModelStock"'),
   'Migrated model must preserve stock-first universal section: '+file);
  assert(html.indexOf('id="internationalModelStock"')<html.indexOf('id="generationPanel"'),
   'Migrated model stock must precede research: '+file);
 }
 assert(html.includes('<h1')||file==='motorcycle-variant.html','Model heading missing: '+file);
}
const protectedLegacyV2=fs.readFileSync('bmw-r1300gs-v2.html','utf8');
assert(protectedLegacyV2.includes('bmw-r1300gs.html'),'Protected V2 canonical missing');
const harley=fs.readFileSync('harley-davidson-motorcycles.html','utf8');
assert(harley.includes('<h1'),'Protected Harley manufacturer page missing');
console.log('PASS: '+models.length+' guide routes; '+cases.length+' matching cases; no unrelated model listings; approved R 1300 GS and R 1250 GS research/stock hooks remain.');
