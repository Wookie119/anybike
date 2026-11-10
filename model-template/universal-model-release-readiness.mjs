/**
 * One all-manufacturer model release-readiness summary.
 * Read-only editorial QA tool. An "eligible candidate" is NOT publication
 * authorization: server-side visibility, buyer access, source approvals,
 * licensed assets, visual QA, and formal editorial sign-off remain separate.
 * This is deliberately brand-agnostic and never fills missing 20-slot cards.
 */
const validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&
 (typeof x==='number'||typeof x==='string'&&/^[1-9][0-9]*$/.test(x));
const str=x=>typeof x==='string'?x.trim():'';
const reviewStatuses=new Set(['verified','approved','published']);
const hashIdentity=x=>str(x).toLowerCase().replace(/[^a-z0-9]/g,'');

export function modelReleaseReadiness({
 model,sections=[],factReview=[],pendingHistory=0,approvedPhotographs=[],
 manufacturerRegistryName='',pendingAlias=false,collision=false,
 stockContractVerified=false,visualParityVerified=false,
 editorialSignoffReference=''
}={}){
 if(!model||!validId(model.id)||!str(model.manufacturer)||!str(model.model)||
  !Array.isArray(sections)||!Array.isArray(factReview)||
  !Array.isArray(approvedPhotographs)||!Number.isSafeInteger(pendingHistory)||
  pendingHistory<0)throw Error('Invalid model release-readiness inputs');
 const modelId=Number(model.id),issues=[];
 if(!str(manufacturerRegistryName)||str(manufacturerRegistryName)!==str(model.manufacturer))
  issues.push('registry_identity_review');
 if(pendingAlias)issues.push('model_alias_review');
 if(collision)issues.push('canonical_name_collision_review');
 if(/\b(?:apr|representative|finance|financing|pcp|deposit)\b|\d+(?:\.\d+)?\s*%/i.test(model.model))
  issues.push('promotional_model_name');
 if(sections.length===0)issues.push('no_reviewed_research_sections');
 if(sections.length>20)issues.push('more_than_20_sections');
 const seen=new Set();
 let editorialDrafts=0,unreviewedData=0;
 for(const section of sections){
  if(!section||!Number.isInteger(Number(section.section_number))||
    Number(section.section_number)<1||Number(section.section_number)>20||
    !validId(section.model_id)||Number(section.model_id)!==modelId)
   throw Error('Cross-model or invalid section in release queue');
  const n=Number(section.section_number);
  if(seen.has(n))throw Error('Duplicate model section number');
  seen.add(n);
  if(section.editorial_status!=='published'||section.publication_eligible!==true||
     !str(section.publication_review_reference))editorialDrafts++;
  if(section.content===null||section.content===undefined||
     (typeof section.content==='object'&&Object.keys(section.content).length===0))
   unreviewedData++;
  if(section.content&&typeof section.content==='object'&&!Array.isArray(section.content)){
   const nested=section.content;
   if(nested.editorial_status&&!reviewStatuses.has(nested.editorial_status))
     unreviewedData++;
   if(nested.source_verification_status&&
      !reviewStatuses.has(nested.source_verification_status))
     unreviewedData++;
   if(nested.photography&&Object.keys(nested).length===1)
     unreviewedData++;
   if(nested.source_blocks&&Object.keys(nested).every(k=>
     ['source_blocks','source_file','source_blob_sha'].includes(k)))
     unreviewedData++;
  }
 }
 if(editorialDrafts)issues.push('editorial_sections_unapproved');
 if(unreviewedData)issues.push('nested_or_empty_content_unreviewed');
 const facts= new Map();
 for(const fact of factReview){
  if(!fact||!validId(fact.factId)||!validId(fact.modelId)||
   Number(fact.modelId)!==modelId)throw Error('Wrong-model fact-review entry');
  if(facts.has(Number(fact.factId)))throw Error('Duplicate source fact review');
  facts.set(Number(fact.factId),fact);
 }
 const factsBlocked=[...facts.values()].filter(f=>f.allowed!==true||f.reasons?.length);
 if(factsBlocked.length)issues.push('source_fact_audit_review');
 if(pendingHistory>0)issues.push('historical_evidence_review');
 let approvedPhotos=0;
 for(const photo of approvedPhotographs){
  if(!photo||typeof photo!=='object')throw Error('Invalid photo metadata');
  // Exact model is a rights barrier; never borrow other generations' photos.
  if(photo.approval_status==='approved'&&
     hashIdentity(photo.manufacturer)===hashIdentity(model.manufacturer)&&
     hashIdentity(photo.model)===hashIdentity(model.model)&&
     ['image_url','source_page_url','licence_url'].every(k=>
       str(photo[k]).startsWith('https://'))&&
     str(photo.licence)&&str(photo.attribution))approvedPhotos++;
 }
 if(!approvedPhotos)issues.push('approved_exact_model_hero_missing');
 if(!stockContractVerified)issues.push('uk_international_stock_access_unverified');
 if(!visualParityVerified)issues.push('approved_page_visual_parity_unverified');
 if(!str(editorialSignoffReference))issues.push('formal_editorial_signoff_missing');
 const unique=[...new Set(issues)];
 return Object.freeze({
  canonicalModelId:modelId,manufacturer:model.manufacturer,model:model.model,
  stagedSectionCount:sections.length,unapprovedSectionCount:editorialDrafts,
  evidenceFactsReviewed:facts.size,evidenceFactsBlocked:factsBlocked.length,
  verifiedPhotoAssets:approvedPhotos,unreviewedHistory:pendingHistory,
  issueCodes:Object.freeze(unique),
  requiresReview:unique.length>0,
  // This analyzer does not grant publication entitlements, even if a test
  // supplies approvals for every field: only the real server release does.
  publicationAuthorized:false
 });
}
