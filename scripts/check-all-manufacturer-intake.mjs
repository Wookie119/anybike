import assert from 'node:assert/strict';
import {planCatalogueIntake,normalizedCatalogueLabel,isPromotionalModelLabel}
 from '../model-template/catalogue-intake-contract.mjs';

const manufacturers=[
 {id:15,display_name:'BMW'},
 {id:28,display_name:'Harley-Davidson'},
 {id:10,display_name:'Aprilia'},
 {id:50,display_name:'Kawasaki'},
 {id:40,display_name:'Vmoto'},
 {id:41,display_name:'Indian Motorcycle'}
];
const models=[
 {id:77,manufacturer:'BMW',model:'R 1300 GS'},
 {id:68,manufacturer:'BMW',model:'R 1250 GS'},
 {id:25,manufacturer:'BMW',model:'CE 02 AM 7.9% APR Representative'},
 {id:1,manufacturer:'Aprilia',model:'RS 660'},
 {id:2,manufacturer:'Aprilia',model:'RS660'},
 {id:204,manufacturer:'Kawasaki',model:'Z900 RS'},
 {id:508,manufacturer:'Kawasaki',model:'Z900RS'},
 {id:262,manufacturer:'VMoto',model:'CPx Explorer'},
 {id:485,manufacturer:'Indian Motorcycle',model:'Scout'},
 {id:191,manufacturer:'Indian',model:'SCOUT'},
 {id:120,manufacturer:'Harley-Davidson',model:'Fat Boy'},
 {id:999,manufacturer:'Mugen',model:'Shinden'}
];
const aliases=[
 {alias_model_id:2,canonical_model_id:1,review_status:'pending_review'},
 {alias_model_id:191,canonical_model_id:485,review_status:'pending_review'},
 {alias_model_id:25,canonical_model_id:24,review_status:'pending_review'},
 {alias_model_id:508,canonical_model_id:204,review_status:'pending_review'}
];
assert.equal(normalizedCatalogueLabel('R 1300 GS'),'r1300gs');
assert.equal(normalizedCatalogueLabel('R1300GS'),'r1300gs');
assert(isPromotionalModelLabel('CE 02 AM 7.9% APR Representative'));
assert(!isPromotionalModelLabel('R 1300 GS'));
const report=planCatalogueIntake({manufacturers,models,aliases,batchSize:2});
assert.equal(report.modelCount,12);
assert.equal(report.eligibleForStagingCount,4);
assert.equal(report.reviewRequiredCount,8);
assert.deepEqual(report.batches,[[68,77],[120,485]]);
assert.equal(report.publicationApproved,false,'Source intake is NOT publication approval');
for(const id of [1,2,25,191,204,262,508,999])
 assert(report.reviewItems.some(x=>x.id===id),'Missing identity review '+id);
assert(report.reviewItems.some(x=>x.id===262&&
 x.issues.includes('manufacturer_registry_mismatch')));
assert(report.reviewItems.some(x=>x.id===25&&
 x.issues.includes('promotional_model_label')));
assert(report.reviewItems.some(x=>x.id===204&&
 x.issues.includes('normalized_name_collision')));
assert(!report.batches.flat().includes(262),'Case mismatch silently reparented VMoto');
assert(!report.batches.flat().includes(191),'Indian alias silently approved');
const shuffled=planCatalogueIntake({
 manufacturers:[...manufacturers].reverse(),
 models:[...models].reverse(),
 aliases:[...aliases].reverse(),batchSize:2
});
assert.deepEqual(shuffled.batches,report.batches,'Batch order depends on source order');
assert.throws(()=>planCatalogueIntake({
 manufacturers,models:[...models,models[0]],aliases
}),/Duplicate canonical catalogue ID/);
assert.throws(()=>planCatalogueIntake({manufacturers,models,aliases,batchSize:0}),
 /Batch size/);
assert.throws(()=>planCatalogueIntake({manufacturers,models:[{
 id:10,manufacturer:'BMW',model:''
}],aliases}),/Invalid catalogue model/);
console.log('PASS: all-manufacturer intake separates safe ID batches from alias, finance and duplicate-name review; never publishes');
