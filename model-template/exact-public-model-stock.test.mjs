import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isExactPublicMotorcycle,matchingPublishedMotorcycles} from './exact-public-model-stock.mjs';
const bike=(make,model,id=1)=>({make,model,item_id:id,image_url:'https://example.test/motorcycle.jpg',price:18450});
const published=[
 bike('BMW','R 1300 GS',1),bike('BMW','R 1300 GS TE',2),bike('BMW','R 1300 GS Triple Black',3),
 bike('BMW','R 1300 GS Adventure',4),bike('BMW','R 1300 RT',5),bike('BMW','R 1250 GS',6),
 bike('BMW','R 1250 GS TE',7),bike('BMW','R 1250 GS Adventure',8),bike('BMW','S 1000 RR',9),
 bike('Harley-Davidson','Fat Boy 114',10),bike('Harley-Davidson','Road King',11)
];
test('R 1300 GS cards match only R 1300 GS including permitted trims',()=>{
 assert.deepEqual(matchingPublishedMotorcycles(published,{make:'BMW',model:'R 1300 GS'}).map(x=>x.item_id),[1,2,3]);
});
test('R 1250 GS cards cannot show Adventure, RT, RR or the R 1300 GS',()=>{
 assert.deepEqual(matchingPublishedMotorcycles(published,{make:'BMW',model:'R 1250 GS'}).map(x=>x.item_id),[6,7]);
});
test('manufacturer and model identity is mandatory and vehicle detail is published-ready',()=>{
 assert.equal(isExactPublicMotorcycle(bike('Harley-Davidson','Fat Boy 114'),{make:'Harley-Davidson',model:'Fat Boy'}),true);
 assert.equal(isExactPublicMotorcycle(bike('BMW','R 1300 GS Adventure'),{make:'BMW',model:'R 1300 GS'}),false);
 assert.equal(isExactPublicMotorcycle({...bike('BMW','R 1300 GS'),image_url:'/private.jpg'},{make:'BMW',model:'R 1300 GS'}),false);
 assert.equal(isExactPublicMotorcycle({...bike('BMW','R 1300 GS'),price:0},{make:'BMW',model:'R 1300 GS'}),false);
 assert.equal(isExactPublicMotorcycle({...bike('BMW','R 1300 GS'),item_id:null},{make:'BMW',model:'R 1300 GS'}),false);
 assert.deepEqual(matchingPublishedMotorcycles(null,{make:'BMW',model:'R 1300 GS'}),[]);
});
test('research layout is identical across the six UK/international and guest/dealer/private combinations',()=>{
 const preview=fs.readFileSync('motorcycle-model-universal-development.html','utf8');
 const start=preview.indexOf('/* UK R1300 GS: clone the database-rendered cards');
 const finish=preview.indexOf('</script>',start);
 const gallery=preview.slice(start,finish);
 assert.ok(start>0&&finish>start);
 assert.doesNotMatch(gallery,/internationalVisible|dealer\s*\?|stock\.hidden/);
 assert.match(gallery,/uk\.hidden=false/);
 assert.match(gallery,/source\.hidden=false/);
 const stockCode=preview.slice(preview.indexOf('const rows=matchingPublishedMotorcycles'),preview.indexOf('console\.warn("International model stock unavailable'));
 assert.match(stockCode,/matchingPublishedMotorcycles\(data\.items,identity\)/);
 assert.doesNotMatch(preview,/internationalGuestRequest"\)\.hidden=true/);
 assert.match(preview,/<meta name="robots" content="noindex,follow"/);
 assert.match(preview,/normalizeMotorcycleV2\(publishedEditorial\)/);
 for(const country of ['UK','international']){
  for(const account of ['guest','dealer','private']){
   const result=matchingPublishedMotorcycles(published,{make:'BMW',model:'R 1300 GS'});
   assert.deepEqual(result.map(x=>x.item_id),[1,2,3],country+' '+account+' should never select unrelated bikes');
  }
 }
});
