import assert from 'node:assert/strict';
import {preflightModelFactPublication}
 from '../model-template/catalogue-evidence-publication-preflight.mjs';
const facts=[
 {id:4,catalog_model_id:77,verification_status:'verified',
  source_url:'https://www.press.bmwgroup.com/global/article/verified'},
 {id:5,catalog_model_id:77,verification_status:'verified',
  source_url:'https://www.press.bmwgroup.com/global/article/missing-audit'},
 {id:6,catalog_model_id:77,verification_status:'verified',
  source_url:'https://www.press.bmwgroup.com/global/article/changed'},
 {id:9,catalog_model_id:68,verification_status:'verified',
  source_url:'https://www.press.bmwgroup.com/global/article/different-model'},
 {id:10,catalog_model_id:77,verification_status:'pending_review',
  source_url:'https://www.press.bmwgroup.com/global/article/pending'}
];
const audits=[
 {fact_id:4,source_url:facts[0].source_url,
  verification_basis:'factory document reviewed',
  checked_at:'2026-11-09T15:00:00Z'},
 {fact_id:6,source_url:'https://www.press.bmwgroup.com/global/article/different',
  verification_basis:'previous factory document',
  checked_at:'2026-11-09T15:00:00Z'},
 {fact_id:9,source_url:facts[3].source_url,
  verification_basis:'factory document reviewed',
  checked_at:'2026-11-09T15:00:00Z'}
];
const blocked=preflightModelFactPublication({modelId:77,facts,audits});
assert.equal(blocked.factCount,5);
assert.equal(blocked.eligibleFacts,0,'Missing editorial signoff cannot release facts');
assert.equal(blocked.readyForPublication,false);
assert(blocked.review.every(x=>x.reasons.includes('editorial_signoff_required')));
const reviewed=preflightModelFactPublication({modelId:77,facts,audits,
 publicationReviewReference:'EDITORIAL-REVIEW-2026-11-10',
 editorialApproved:true});
assert.equal(reviewed.eligibleFacts,1);
assert.equal(reviewed.blockedFacts,4);
assert.deepEqual(reviewed.review.find(x=>x.factId===5).reasons,
 ['missing_independent_audit']);
assert.deepEqual(reviewed.review.find(x=>x.factId===6).reasons,
 ['audit_url_mismatch']);
assert(reviewed.review.find(x=>x.factId===9).reasons.includes('wrong_canonical_model'));
assert(reviewed.review.find(x=>x.factId===10).reasons.includes('fact_pending_review'));
assert.equal(reviewed.readyForPublication,false);
const exact=preflightModelFactPublication({modelId:77,facts:[facts[0]],
 audits:[audits[0]],editorialApproved:true,
 publicationReviewReference:'APPROVED-REVIEW-REF'});
assert(exact.readyForPublication,'Only fully signed-off correct-model fact should pass');
assert.equal(exact.blockedFacts,0);
const future=preflightModelFactPublication({modelId:77,facts:[facts[0]],
 audits:[{...audits[0],checked_at:'2099-01-01T00:00:00Z'}],
 editorialApproved:true,publicationReviewReference:'APPROVED-REVIEW-REF'});
assert(future.review[0].reasons.includes('invalid_audit_date'));
const badUrl=preflightModelFactPublication({modelId:77,facts:[
 {...facts[0],source_url:'https://user:pass@unsafe.example.org/source'}],
 audits:[audits[0]],editorialApproved:true,
 publicationReviewReference:'APPROVED-REVIEW-REF'});
assert(badUrl.review[0].reasons.includes('unsafe_source_url'));
assert.throws(()=>preflightModelFactPublication({modelId:77,
 facts:[facts[0],facts[0]]}),/Repeated source fact/);
assert.throws(()=>preflightModelFactPublication({modelId:77,
 facts:[facts[0]],audits:[audits[0],audits[0]]}),
 /Repeated source verification audit/);
assert.equal(preflightModelFactPublication({modelId:77,facts:[]})
 .readyForPublication,false,'No research is not an approved release');
console.log('PASS: exact model, source audit, editorial approval and time gate; wrong model or missing audit cannot publish');
