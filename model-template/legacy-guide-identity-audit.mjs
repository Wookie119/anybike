/**
 * Identity-only migration audit of legacy model guides.
 * Never guesses exact variants, updates canonical IDs or publishes content.
 * A family guide with no single exact make+model is a review item.
 */
import {normalizedCatalogueLabel,isPromotionalModelLabel}
 from './catalogue-intake-contract.mjs';

export function auditLegacyGuideIdentity(guides,models){
 if(!guides||typeof guides!=='object'||Array.isArray(guides)||
    !Array.isArray(models))throw Error('Guide map and catalogue rows required');
 const index=new Map();
 for(const model of models){
  if(!model||!Number.isSafeInteger(Number(model.id))||
     Number(model.id)<=0)throw Error('Invalid model identity');
  const make=normalizedCatalogueLabel(model.manufacturer);
  const name=normalizedCatalogueLabel(model.model);
  if(!make||!name)throw Error('Empty canonical model identity');
  const key=make+'/'+name;
  if(!index.has(key))index.set(key,[]);
  index.get(key).push(Number(model.id));
 }
 const report=[];
 for(const [sourceKey,guide] of Object.entries(guides)){
  if(!guide||typeof guide!=='object'||Array.isArray(guide)||
     typeof guide.make!=='string'||typeof guide.model!=='string')
   throw Error('Malformed legacy guide identity');
  const key=normalizedCatalogueLabel(guide.make)+'/'+
    normalizedCatalogueLabel(guide.model);
  const candidates=index.get(key)||[];
  const issue=isPromotionalModelLabel(guide.model)?
    'promotional_identity':
    candidates.length===1?'exact_id_match':
    candidates.length===0?'no_exact_catalogue_match':
      'ambiguous_multiple_catalogue_matches';
  report.push(Object.freeze({
   sourceKey,make:guide.make,model:guide.model,
   status:issue,
   catalogueModelId:issue==='exact_id_match'?candidates[0]:null,
   matchingCatalogueIds:Object.freeze([...candidates].sort((a,b)=>a-b)),
   publicationApproved:false
  }));
 }
 return Object.freeze(report.sort((a,b)=>a.sourceKey.localeCompare(b.sourceKey)));
}
