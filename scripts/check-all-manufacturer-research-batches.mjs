import assert from 'node:assert/strict';
import {planResearchWorkBatches}
 from '../model-template/catalogue-research-batches.mjs';

const manufacturers=[{id:15,display_name:'BMW'},
 {id:28,display_name:'Harley-Davidson'},
 {id:41,display_name:'Yamaha'},
 {id:12,display_name:'Ducati'}];
const models=[
 {id:77,manufacturer:'BMW',model:'R 1300 GS',overview:'Documented draft'},
 {id:68,manufacturer:'BMW',model:'R 1250 GS'},
 {id:25,manufacturer:'BMW',model:'CE 02 AM 7.9% APR Representative'},
 {id:191,manufacturer:'Indian',model:'SCOUT'},
 {id:101,manufacturer:'Yamaha',model:'MT-07',overview:'Existing candidate text'},
 {id:200,manufacturer:'Ducati',model:'Panigale V4'},
 {id:300,manufacturer:'Harley-Davidson',model:'Fat Boy'},
 {id:301,manufacturer:'Harley-Davidson',model:'Road King',specifications:{engine:'candidate'}}
];
const aliases=[{alias_model_id:25,canonical_model_id:24,review_status:'pending_review'}];
const stagedSections=[
 {model_id:77,section_number:1},
 {model_id:77,section_number:5},
 {model_id:68,section_number:1}
];
const editorialSources=[
 {model_id:77,verification_status:'pending_review'},
 {model_id:77,verification_status:'verified'},
 {model_id:101,verification_status:'pending_review'},
 {model_id:200,verification_status:'pending_review'}
];
const report=planResearchWorkBatches({
 manufacturers,models,aliases,stagedSections,editorialSources,batchSize:2
});
assert.deepEqual(report.counts,{
 identity_review:2,existing_draft_review:2,
 source_verification:3,research_required:1
});
assert.deepEqual(report.batches.identity_review.flat().map(x=>x.model_id),
 [25,191]);
assert.deepEqual(report.batches.existing_draft_review.flat().map(x=>x.model_id),
 [68,77]);
assert.deepEqual(report.batches.source_verification.flat().map(x=>x.model_id),
 [101,200,301]);
assert.deepEqual(report.batches.research_required.flat().map(x=>x.model_id),
 [300]);
assert.equal(report.batches.existing_draft_review.flat().find(x=>x.model_id===77)
 .pending_source_records,1);
assert.equal(report.batches.existing_draft_review.flat().find(x=>x.model_id===77)
 .verified_source_records,1);
assert(report.batches.source_verification.flat().find(x=>x.model_id===200)
 .source_records===1,'Pending evidence must inform research priority');
assert(report.batches.source_verification.flat().find(x=>x.model_id===301)
 .catalogue_specification_candidate);
assert(!Object.values(report.batches).flat(2).some(x=>x.publication_eligible),
 'Intake must not mark drafts publication eligible');
const reverse=planResearchWorkBatches({
 manufacturers:[...manufacturers].reverse(),models:[...models].reverse(),
 aliases,stagedSections:[...stagedSections].reverse(),
 editorialSources:[...editorialSources].reverse(),batchSize:2
});
for(const key of Object.keys(report.batches))
 assert.deepEqual(reverse.batches[key].flat().map(x=>x.model_id),
  report.batches[key].flat().map(x=>x.model_id),
  'Work queue changed after source input reordered');
assert.throws(()=>planResearchWorkBatches({
 manufacturers,models,aliases,stagedSections:[
 ...stagedSections,{model_id:77,section_number:1}]
}),/Duplicate staged research slot/);
assert.throws(()=>planResearchWorkBatches({
 manufacturers,models,aliases,editorialSources:[
 {model_id:999999,verification_status:'verified'}]
}),/Invalid source index record/);
console.log('PASS: all-model research prioritization, pending/verified source distinction, deterministic batches and no publication');
