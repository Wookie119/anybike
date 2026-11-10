/**
 * All-manufacturer research work queues based on canonical model IDs.
 * RESEARCH PLANNING ONLY: never imports source content, writes database rows,
 * promotes reviews, enables stock or publishes pages. Source verification is
 * separate from identity matching and is never inferred from a URL alone.
 */
import {planCatalogueIntake} from './catalogue-intake-contract.mjs';

const validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&
 (typeof x==='number'||typeof x==='string'&&/^[1-9][0-9]*$/.test(x));

export function planResearchWorkBatches({
 manufacturers=[],models=[],aliases=[],stagedSections=[],
 editorialSources=[],batchSize=100
}={}){
 if(!Array.isArray(stagedSections)||!Array.isArray(editorialSources))
  throw Error('Research staging and source indexes must be arrays');
 const identity=planCatalogueIntake({manufacturers,models,aliases,batchSize});
 const modelById=new Map(models.map(m=>[Number(m.id),m]));
 const staging=new Map();
 for(const s of stagedSections){
  if(!s||!validId(s.model_id)||!modelById.has(Number(s.model_id))||
     !Number.isInteger(Number(s.section_number))||
     Number(s.section_number)<1||Number(s.section_number)>20)
   throw Error('Invalid staged section identity');
  const id=Number(s.model_id),key=Number(s.section_number);
  if(!staging.has(id))staging.set(id,new Set());
  if(staging.get(id).has(key))throw Error('Duplicate staged research slot');
  staging.get(id).add(key);
 }
 const sources=new Map();
 for(const item of editorialSources){
  if(!item||!validId(item.model_id)||!modelById.has(Number(item.model_id))||
     typeof item.verification_status!=='string')
   throw Error('Invalid source index record');
  const id=Number(item.model_id);
  if(!sources.has(id))sources.set(id,{verified:0,pending:0});
  const status=item.verification_status.toLowerCase();
  if(status==='verified'||status==='approved')sources.get(id).verified++;
  else sources.get(id).pending++;
 }
 const blocked=new Set(identity.reviewItems.map(x=>x.id));
 const workstreams={identity_review:[],existing_draft_review:[],
  source_verification:[],research_required:[]};
 for(const model of models){
  const id=Number(model.id),count=staging.get(id)?.size||0;
  const source=sources.get(id)||{verified:0,pending:0};
  // A source URL by itself is never proof of editorial approval, and an
  // overview text blob is not a published fact.
  const hasOverview=typeof model.overview==='string'&&
    model.overview.trim().length>0;
  const hasSpecs=model.specifications!=null&&typeof model.specifications==='object'&&
    !Array.isArray(model.specifications)&&Object.keys(model.specifications).length>0;
  const stream=blocked.has(id)?'identity_review':
    count>0?'existing_draft_review':
    hasOverview||hasSpecs||source.verified+source.pending>0?
      'source_verification':'research_required';
  workstreams[stream].push(Object.freeze({
   model_id:id,manufacturer:model.manufacturer,model:model.model,
   existing_staged_sections:count,source_records:source.verified+source.pending,
   verified_source_records:source.verified,pending_source_records:source.pending,
   catalogue_overview_candidate:hasOverview,
   catalogue_specification_candidate:hasSpecs,
   publication_eligible:false
  }));
 }
 const batches={};
 for(const stream of Object.keys(workstreams)){
  const entries=workstreams[stream].sort((a,b)=>a.model_id-b.model_id);
  batches[stream]=[];
  for(let n=0;n<entries.length;n+=batchSize)
   batches[stream].push(Object.freeze(entries.slice(n,n+batchSize)));
  Object.freeze(workstreams[stream]);
  Object.freeze(batches[stream]);
 }
 return Object.freeze({
  totalModels:models.length,manufacturerRegistryCount:manufacturers.length,
  counts:Object.freeze(Object.fromEntries(Object.entries(workstreams)
   .map(([k,v])=>[k,v.length]))),
  batches:Object.freeze(batches),
  publicationApproved:false,
  identityReport:identity
 });
}
