import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {groupLiveStock,liveStockLink,cleanStockModelName} from './live-stock-navigation.mjs';
const bikes=[
 {item_id:1,make:'BMW',model:'R 1300 GS TE',price:23400},
 {item_id:2,make:'BMW',model:'R 1300 GS TE',price:22500},
 {item_id:3,make:'BMW',model:'R 1250 GS',price:18000},
 {item_id:4,make:'Ducati',model:'Multistrada V4',price:21000},
 {item_id:5,make:'Honda',model:'Africa Twin',price:14000},
 {item_id:6,make:'Honda',model:'CBR 1000 RR',price:16000}
];
test('manufacturers and models appear only when present in live published feed',()=>{
 const groups=groupLiveStock(bikes);
 assert.deepEqual(groups.map(x=>x.make),['BMW','Ducati','Honda']);
 assert.deepEqual(groups.find(x=>x.make==='BMW').models.map(x=>x.model),['R 1250 GS','R 1300 GS TE']);
 assert.deepEqual(groups.find(x=>x.make==='Ducati').models.map(x=>x.model),['Multistrada V4']);
 assert.deepEqual(groups.find(x=>x.make==='Honda').models.map(x=>x.model),['Africa Twin','CBR 1000 RR']);
 assert.ok(!groups.some(x=>x.make==='Triumph'||x.make==='Yamaha'));
 assert.equal(groups.find(x=>x.make==='BMW').count,3);
 assert.equal(groups.find(x=>x.make==='BMW').models.find(x=>x.model==='R 1300 GS TE').count,2);
});
test('removing the final motorcycle automatically removes its make and model',()=>{
 const noDucati=groupLiveStock(bikes.filter(x=>x.make!=='Ducati'));
 assert.deepEqual(noDucati.map(x=>x.make),['BMW','Honda']);
 const noGS=groupLiveStock(bikes.filter(x=>x.model!=='R 1250 GS'));
 assert.ok(!noGS.find(x=>x.make==='BMW').models.some(x=>x.model==='R 1250 GS'));
 assert.deepEqual(groupLiveStock([]),[]);
 assert.deepEqual(groupLiveStock(null),[]);
});
test('links open live Available Stock with make, exact model and all VAT statuses',()=>{
 const ducati=groupLiveStock(bikes).find(x=>x.make==='Ducati');
 assert.equal(ducati.url,'/available-stock.html?make=Ducati&vat=all');
 const url=new URL(ducati.models[0].url,'https://www.anybike.co.uk');
 assert.equal(url.pathname,'/available-stock.html');
 assert.equal(url.searchParams.get('make'),'Ducati');
 assert.equal(url.searchParams.get('model'),'Multistrada V4');
 assert.equal(url.searchParams.get('vat'),'all');
 assert.equal(new URL(liveStockLink('Harley-Davidson','Fat Boy 114'),'https://anybike.co.uk').searchParams.get('model'),'Fat Boy 114');
});
test('only buyer-safe published row identities can create buttons, with canonical deduplication',()=>{
 const invalid=[{make:'KTM',model:'1290 Adventure',item_id:null},{make:'Suzuki',model:'GSX-R1000',item_id:''},{make:'Honda',model:'',item_id:19}];
 assert.deepEqual(groupLiveStock(invalid),[]);
 const result=groupLiveStock([{make:'BMW',model:' R 1300  GS TE ',item_id:5},{make:'bmw',model:'R 1300 GS TE',item_id:5}]);
 assert.equal(result.length,1);
 assert.equal(result[0].count,1);
 assert.equal(result[0].models.length,1);
 assert.equal(cleanStockModelName('R 1300 GS TE 7.2% APR representative finance offer'),'R 1300 GS TE');
});
test('universal, BMW approved galleries and shared model guide use the same live navigation',()=>{
 const preview=fs.readFileSync('motorcycle-model-universal-development.html','utf8');
 const r1300=fs.readFileSync('bmw-r1300gs.html','utf8');
 const r1250=fs.readFileSync('bmw-r1250gs.html','utf8');
 const shared=fs.readFileSync('public-header.js','utf8');
 const listing=fs.readFileSync('available-stock.html','utf8');
 for(const [name,source] of [['R1300',r1300],['R1250',r1250],['V2',preview]]){
  assert.match(source,/id="internationalLiveBrowse"[^>]*hidden/,name+' must hide links until stock fetch succeeds');
  assert.match(source,/renderLiveStockBrowse\(/,name+' must render live links from stock response');
 }
 assert.match(shared,/renderLiveStockBrowse\(liveBrowse,data\.items/);
 assert.match(listing,/const requestedModel=requestedParams\.get\('model'\)/);
 assert.match(listing,/modelFilter\.value=requestedModel/);
 const css=fs.readFileSync('public-header.css','utf8');
 assert.match(css,/ANYBIKE LIVE MAKE\/MODEL STOCK NAVIGATION/);
 assert.match(css,/--anybike-approved-accent|#ed1c24/);
 const module=fs.readFileSync('model-template/live-stock-navigation.mjs','utf8');
 assert.match(module,/anybike-international-vq-link/);
});
