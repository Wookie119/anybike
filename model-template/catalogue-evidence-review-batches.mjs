/**
 * Read-only catalogue evidence review planner.
 *
 * Source "verified" is NOT publication approval. It is only treated as
 * audit-complete when the fact's verification audit includes a defensible
 * verification basis, HTTPS source URL, and checked_at timestamp. Unreviewed
 * chronology and generations never become approved model history here.
 * Does not write, merge, publish, infer model names or attach stock.
 */
const posId=value=>(typeof value==='number'&&Number.isSafeInteger(value)&&value>0)||
 (typeof value==='string'&&/^[1-9][0-9]*$/.test(value)&&
  Number.isSafeInteger(Number(value)));
const text=value=>typeof value==='string'?value.trim():'';
const https=value=>/^https:\/\/[^\s/@]+(?:\/[^\s]*)?$/i.test(text(value));
const validDate=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&
 Date.parse(value)<=Date.now();

export function planCatalogueEvidenceReview({
 models=[],facts=[],factAudits=[],generations=[],timeline=[],batchSize=100
}={}){
 if(![models,facts,factAudits,generations,timeline].every(Array.isArray))
  throw Error('Evidence planner requires arrays');
 if(!Number.isSafeInteger(batchSize)||batchSize<1||batchSize>500)
  throw Error('Batch size must be from 1 to 500');
 const byId=new Map();
 for(const m of models){
  if(!m||!posId(m.id)||!text(m.manufacturer)||!text(m.model))
   throw Error('Invalid canonical model');
  const id=Number(m.id);
  if(byId.has(id))throw Error('Repeated canonical model ID');
  byId.set(id,m);
 }
 const audited=new Map();
 for(const a of factAudits){
  if(!a||!posId(a.fact_id))throw Error('Invalid fact audit reference');
  const id=Number(a.fact_id);
  if(audited.has(id))throw Error('Duplicate verification audit for fact');
  audited.set(id,a);
 }
 const work={verified_with_audit:[],verified_needs_audit:[],
  fact_pending_review:[],generations_pending_review:[],timeline_pending_review:[]};
 const seen=new Set();
 function add(type,r,idKey){
  if(!r||!posId(r.id)||!posId(r[idKey])||
     !byId.has(Number(r[idKey])))throw Error('Evidence references an unknown canonical model');
  const key=type+'/'+r.id;
  if(seen.has(key))throw Error('Duplicate evidence record');
  seen.add(key);
  const model=byId.get(Number(r[idKey]));
  const audit=type==='fact'?audited.get(Number(r.id)):null;
  const auditComplete=!!audit&&text(audit.verification_basis)&&
   https(audit.source_url)&&validDate(audit.checked_at)&&
   https(r.source_url)&&text(audit.source_url)===text(r.source_url);
  let queue;
  if(type==='fact'){
   queue=r.verification_status==='verified'&&https(r.source_url)?
    auditComplete?'verified_with_audit':'verified_needs_audit':
    'fact_pending_review';
  }else if(type==='generation')queue='generations_pending_review';
  else queue='timeline_pending_review';
  const entry=Object.freeze({
   kind:type,evidence_id:Number(r.id),
   model_id:Number(r[idKey]),manufacturer:model.manufacturer,model:model.model,
   source_status:text(r.verification_status),
   source_url:https(r.source_url)?r.source_url:null,
   audited_source:auditComplete,editorial_publication_approved:false
  });
  work[queue].push(entry);
 }
 for(const item of facts)add('fact',item,'catalog_model_id');
 for(const item of generations)add('generation',item,'catalog_model_id');
 for(const item of timeline)add('timeline',item,'catalog_model_id');
 const batches={},counts={};
 for(const [key,entries] of Object.entries(work)){
  entries.sort((a,b)=>a.model_id-b.model_id||a.evidence_id-b.evidence_id);
  counts[key]=entries.length;
  batches[key]=[];
  for(let i=0;i<entries.length;i+=batchSize)
   batches[key].push(Object.freeze(entries.slice(i,i+batchSize)));
  Object.freeze(entries);Object.freeze(batches[key]);
 }
 return Object.freeze({counts:Object.freeze(counts),
  batches:Object.freeze(batches),modelCount:byId.size,
  evidenceCount:seen.size,publicationApproved:false});
}
