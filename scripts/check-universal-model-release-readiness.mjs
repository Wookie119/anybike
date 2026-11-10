import assert from 'node:assert/strict';
import {modelReleaseReadiness} from '../model-template/universal-model-release-readiness.mjs';

const model={id:77,manufacturer:'BMW',model:'R 1300 GS'};
const photo={approval_status:'approved',manufacturer:'BMW',model:'R 1300 GS',
 image_url:'https://example.org/approved-gs.jpg',
 source_page_url:'https://example.org/photographer',
 licence_url:'https://example.org/licence',
 licence:'Documented model-photo rights',attribution:'Factory photographer'};
const modelSection=(n,content={summary:'Reviewed documentary research'})=>({
 model_id:77,section_number:n,content,
 editorial_status:'published',publication_eligible:true,
 publication_review_reference:'REVIEW-REFERENCE-2026'
});
const approved=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',
 sections:[modelSection(1),modelSection(3)],
 approvedPhotographs:[photo],
 stockContractVerified:true,visualParityVerified:true,
 editorialSignoffReference:'FORMAL-EDITORIAL-RELEASE',
 factReview:[{factId:15,modelId:77,allowed:true,reasons:[]}]
});
assert.equal(approved.issueCodes.length,0);
assert.equal(approved.requiresReview,false);
assert.equal(approved.publicationAuthorized,false,
 'Pure analyzer must NEVER grant actual public release entitlement');
assert.equal(approved.stagedSectionCount,2,
 'Do not fabricate twenty research sections');
assert.equal(approved.verifiedPhotoAssets,1);
const unreviewed=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',
 sections:[modelSection(1,{summary:'Imported copy',
  source_verification_status:'pending_review'}),
  {...modelSection(3),editorial_status:'draft',publication_eligible:false}],
 approvedPhotographs:[{...photo,model:'R 1250 GS'}],
 pendingHistory:2,
 factReview:[{factId:15,modelId:77,allowed:false,reasons:['missing_independent_audit']}]
});
for(const code of [
 'editorial_sections_unapproved','nested_or_empty_content_unreviewed',
 'source_fact_audit_review','historical_evidence_review',
 'approved_exact_model_hero_missing',
 'uk_international_stock_access_unverified',
 'approved_page_visual_parity_unverified','formal_editorial_signoff_missing'
])assert(unreviewed.issueCodes.includes(code),'Missing safety gate: '+code);
assert.equal(unreviewed.verifiedPhotoAssets,0,'Borrowed GS photograph was accepted');
const flagged=modelReleaseReadiness({model,manufacturerRegistryName:'BMW',
 pendingAlias:true,collision:true});
assert(flagged.issueCodes.includes('model_alias_review'));
assert(flagged.issueCodes.includes('canonical_name_collision_review'));
assert.throws(()=>modelReleaseReadiness({
 model,sections:[modelSection(1),modelSection(1)]
}),/Duplicate model section/);
assert.throws(()=>modelReleaseReadiness({
 model,sections:[{...modelSection(1),model_id:68}]
}),/Cross-model or invalid section/);
assert.throws(()=>modelReleaseReadiness({model,factReview:[{
 factId:10,modelId:68,allowed:true,reasons:[]}]
}),/Wrong-model fact/);
assert.throws(()=>modelReleaseReadiness({model,factReview:[
 {factId:10,modelId:77,allowed:false,reasons:['audit']},
 {factId:10,modelId:77,allowed:true,reasons:[]}
]}),/Duplicate source fact/);
const finance=modelReleaseReadiness({model:{
 id:88,manufacturer:'BMW',model:'CE 02 7.9% APR Representative'
},manufacturerRegistryName:'BMW'});
assert(finance.issueCodes.includes('promotional_model_name'),
 'Finance promotion must not become customer research');
console.log('PASS: one all-brand release readiness tool preserves exact models, editorial approval, photo rights and buyer stock safety');
