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
 published_at:'2026-11-09T12:00:00Z',
 publication_review_reference:'REVIEW-REFERENCE-2026'
});
const approved=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
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
 model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
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
const credentialedPhoto=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
 sections:[modelSection(1)],stockContractVerified:true,visualParityVerified:true,
 editorialSignoffReference:'HYPOTHETICAL-APPROVAL',
 approvedPhotographs:[{...photo,image_url:'https://user:pass@example.org/suspicious.jpg'}]
});
assert.equal(credentialedPhoto.verifiedPhotoAssets,0,
 'Credential-bearing photo URL must never qualify as rights-approved');
assert(credentialedPhoto.issueCodes.includes('approved_exact_model_hero_missing'));

const pendingManufacturer=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'review',
 sections:[modelSection(7)],approvedPhotographs:[photo],
 stockContractVerified:true,visualParityVerified:true,
 editorialSignoffReference:'QA-ONLY'
});
assert(pendingManufacturer.issueCodes.includes('manufacturer_registry_approval_missing'),
 'A manufacturer registry still under review must not qualify for universal publication');
assert.equal(pendingManufacturer.publicationAuthorized,false);
const unprovidedManufacturer=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',sections:[modelSection(7)]
});
assert(unprovidedManufacturer.issueCodes.includes('manufacturer_registry_approval_missing'),
 'Omitting the manufacturer review outcome must fail closed');
const sourceOnly=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
 sections:[modelSection(7,{verified_catalogue_facts:[{
  fact_id:49,label:'RM250 archived model year',source_url:'https://example.org/source',
  source_verification_status:'verified'
 }]})],
 approvedPhotographs:[photo],stockContractVerified:true,visualParityVerified:true,
 editorialSignoffReference:'QA-ONLY'
});
assert(sourceOnly.issueCodes.includes('nested_or_empty_content_unreviewed'),
 'Sourced fact-only section must still require explicit fact-level editorial approval');
const reviewedFactOnly=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
 sections:[modelSection(7,{verified_catalogue_facts:[{
  fact_id:49,label:'Documented source year',
  source_url:'https://example.org/source',
  source_verification_status:'verified',
  editorial_status:'approved',publication_eligible:true
 }]})],
 approvedPhotographs:[photo],stockContractVerified:true,visualParityVerified:true,
 editorialSignoffReference:'QA-ONLY'
});
assert(!reviewedFactOnly.issueCodes.includes('nested_or_empty_content_unreviewed'),
 'Explicitly reviewed and sourced fact-only content should pass the content-shape gate');
const flagged=modelReleaseReadiness({model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
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
const futureSection=modelReleaseReadiness({model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
 sections:[{...modelSection(1),published_at:'2099-01-01T00:00:00Z'}],
 approvedPhotographs:[photo],stockContractVerified:true,visualParityVerified:true,
 editorialSignoffReference:'HYPOTHETICAL-APPROVAL'});
assert(futureSection.issueCodes.includes('section_publication_date_unverified'),
 'Future-dated section must not pass readiness review');
const undatedSection=modelReleaseReadiness({model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
 sections:[{...modelSection(1),published_at:null}],
 approvedPhotographs:[photo],stockContractVerified:true,visualParityVerified:true,
 editorialSignoffReference:'HYPOTHETICAL-APPROVAL'});
assert(undatedSection.issueCodes.includes('section_publication_date_unverified'),
 'Undated section cannot pass even when status is published');
const deniedNested=modelReleaseReadiness({model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
 sections:[modelSection(1,{summary:'Do not release',publication_eligible:false})],
 approvedPhotographs:[photo],stockContractVerified:true,visualParityVerified:true,
 editorialSignoffReference:'HYPOTHETICAL-APPROVAL'});
assert(deniedNested.issueCodes.includes('nested_or_empty_content_unreviewed'),
 'Explicitly denied nested research cannot pass readiness');
const scheduledNested=modelReleaseReadiness({model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
 sections:[modelSection(1,{summary:'Not yet public',published_at:'2099-01-01T00:00:00Z'})],
 approvedPhotographs:[photo],stockContractVerified:true,visualParityVerified:true,
 editorialSignoffReference:'HYPOTHETICAL-APPROVAL'});
assert(scheduledNested.issueCodes.includes('nested_or_empty_content_unreviewed'),
 'Future nested research cannot pass readiness');
for(const invalidContent of ['', 'Unreviewed prose', [], ['unreviewed'], 42, false]){
 const result=modelReleaseReadiness({
  model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
  sections:[modelSection(1,invalidContent)],approvedPhotographs:[photo],
  stockContractVerified:true,visualParityVerified:true,
  editorialSignoffReference:'QA-ONLY'
 });
 assert(result.issueCodes.includes('nested_or_empty_content_unreviewed'),
  'Unstructured or empty research must not pass release readiness');
}
const finance=modelReleaseReadiness({model:{
 id:88,manufacturer:'BMW',model:'CE 02 7.9% APR Representative'
},manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved'});
assert(finance.issueCodes.includes('promotional_model_name'),
 'Finance promotion must not become customer research');
console.log('PASS: one all-brand release readiness tool preserves exact models, editorial approval, photo rights and buyer stock safety');

// R 1300 GS editorial worklist must flag separately pending model-year
// photography inside otherwise approved history and colour sections.
const pendingModelYear=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
 sections:[
  modelSection(3,{timeline:[{period:'September 2023',
   description:'Reviewed BMW factory history'}],
   development:[{period:'2024 model year',
    description:'Documented generation, image not yet approved',
    content_status:'pending_editorial_review',
    image_status:'awaiting_approved_model_year_photo'}]}),
  modelSection(13,{colours:[{name:'Lightwhite',
   source:'https://www.press.bmwgroup.com/global/article/detail/T0437059EN/'}],
   editions:[{description:'Awaiting photo review',
    content_status:'pending_editorial_review'}]})
 ],
 approvedPhotographs:[photo],stockContractVerified:true,
 visualParityVerified:true,editorialSignoffReference:'TEST-ONLY'
});
assert(pendingModelYear.issueCodes.includes('nested_editorial_items_pending_review'),
 'Master release worklist hid pending model-year photography and editions');
assert.equal(pendingModelYear.publicationAuthorized,false,
 'Release analyzer must not authorize publication');
const approvedNested=modelReleaseReadiness({
 model,manufacturerRegistryName:'BMW',manufacturerRegistryStatus:'approved',
 sections:[modelSection(3,{timeline:[
  {description:'Approved independently reviewed timeline',
   content_status:'approved'}]})],
 approvedPhotographs:[photo],stockContractVerified:true,
 visualParityVerified:true,editorialSignoffReference:'TEST-ONLY'
});
assert(!approvedNested.issueCodes.includes('nested_editorial_items_pending_review'),
 'Approved nested content was incorrectly classified pending');
console.log('PASS: R 1300 GS nested model-year and edition review gate');
