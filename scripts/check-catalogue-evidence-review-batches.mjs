import assert from 'node:assert/strict';
import {planCatalogueEvidenceReview}
 from '../model-template/catalogue-evidence-review-batches.mjs';

const models=[
 {id:77,manufacturer:'BMW',model:'R 1300 GS'},
 {id:1043,manufacturer:'Honda',model:'Dream CB750 Four'},
 {id:1054,manufacturer:'Suzuki',model:'RM250'}
];
const facts=[
 {id:1,catalog_model_id:77,verification_status:'verified',
  source_url:'https://www.press.bmwgroup.com/source'},
 {id:2,catalog_model_id:1043,verification_status:'verified',
  source_url:'https://global.honda/en/heritage'},
 {id:3,catalog_model_id:1054,verification_status:'pending_review',
  source_url:'https://suzuki.example.com/model'},
 {id:4,catalog_model_id:77,verification_status:'verified',
  source_url:'javascript:alert(1)'}
];
const factAudits=[
 {fact_id:1,verification_basis:'Manufacturer technical document',
  checked_at:'2026-10-22T00:00:00Z',
  source_url:'https://www.press.bmwgroup.com/source'},
 {fact_id:2,verification_basis:'Reviewed manufacturer document',
  checked_at:'2099-01-01T00:00:00Z',
  source_url:'https://global.honda/en/heritage'}
];
const generations=[
 {id:11,catalog_model_id:1043,verification_status:'pending_review',
  source_url:'https://global.honda/en'},
 {id:12,catalog_model_id:77,verification_status:'verified',
  source_url:'https://www.press.bmwgroup.com'}
];
const timeline=[
 {id:21,catalog_model_id:1054,verification_status:'pending_review',
  source_url:'https://example.org/source'}
];
const base={models,facts,factAudits,generations,timeline,batchSize:2};
const result=planCatalogueEvidenceReview(base);
assert.deepEqual(result.counts,{
 verified_with_audit:1,verified_needs_audit:1,fact_pending_review:2,
 generations_pending_review:2,timeline_pending_review:1
});
assert.equal(result.evidenceCount,7);
assert.equal(result.publicationApproved,false);
assert.equal(result.batches.verified_with_audit[0][0].model_id,77);
assert(!Object.values(result.batches).flat(2)
 .some(x=>x.editorial_publication_approved),
 'Source verification must never authorize editorial publication');
assert.deepEqual(Object.values(result.batches).flat(2)
 .map(x=>x.evidence_id).sort((a,b)=>a-b),[1,2,3,4,11,12,21]);
const swapped=planCatalogueEvidenceReview({
 models:[...models].reverse(),facts:[...facts].reverse(),
 factAudits:[...factAudits].reverse(),
 generations:[...generations].reverse(),
 timeline:[...timeline].reverse(),batchSize:2
});
for(const key of Object.keys(result.batches))
 assert.deepEqual(swapped.batches[key],result.batches[key],
  'Review queue depends on source row order: '+key);
assert.throws(()=>planCatalogueEvidenceReview({
 ...base,facts:[...facts,facts[0]]
}),/Duplicate evidence record/);
assert.throws(()=>planCatalogueEvidenceReview({
 ...base,factAudits:[...factAudits,factAudits[0]]
}),/Duplicate verification audit/);
assert.throws(()=>planCatalogueEvidenceReview({
 ...base,facts:[...facts,{id:99,catalog_model_id:999999,
 verification_status:'verified',source_url:'https://example.org'}]
}),/unknown canonical model/);
assert.throws(()=>planCatalogueEvidenceReview({
 ...base,factAudits:[...factAudits,{fact_id:999999,
 source_url:'https://example.org/unrelated',
 verification_basis:'Unrelated document',checked_at:'2026-11-10T00:00:00Z'}]
}),/Orphan verification audit/);
assert.throws(()=>planCatalogueEvidenceReview({...base,batchSize:0}),
 /Batch size/);
console.log('PASS: all-brand verified facts, evidence audit, unsafe URLs and unreviewed generations remain separated from publication');
