/**
 * Read-only review preflight for fact-backed research.
 * A fact's catalogue status and source audit are NOT editorial authorization.
 * Never writes, renames, creates a published section or changes live stock.
 * The same checks work for any make/model, keyed solely by canonical IDs.
 */
const id=x=>typeof x==='number'&&Number.isSafeInteger(x)&&x>0||
 typeof x==='string'&&/^[1-9][0-9]*$/.test(x)&&Number.isSafeInteger(Number(x));
const str=x=>typeof x==='string'?x.trim():'';
const secureUrl=x=>{try{const u=new URL(x);return u.protocol==='https:'&&
 !u.username&&!u.password;}catch{return false;}};
const datePast=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 Date.parse(x)<=Date.now();
export function preflightModelFactPublication({
 modelId,facts=[],audits=[],publicationReviewReference='',editorialApproved=false
}={}){
 if(!id(modelId)||!Array.isArray(facts)||!Array.isArray(audits))
  throw Error('Canonical model ID and source arrays required');
 const model=Number(modelId);
 const byFact=new Map();
 for(const audit of audits){
  if(!audit||!id(audit.fact_id))throw Error('Invalid source verification audit');
  const key=Number(audit.fact_id);
  if(byFact.has(key))throw Error('Repeated source verification audit');
  byFact.set(key,audit);
 }
 const seen=new Set(),results=[];
 for(const fact of facts){
  if(!fact||!id(fact.id)||!id(fact.catalog_model_id))
   throw Error('Invalid source fact identity');
  const key=Number(fact.id);
  if(seen.has(key))throw Error('Repeated source fact');
  seen.add(key);
  const reasons=[];
  const audit=byFact.get(key);
  if(Number(fact.catalog_model_id)!==model)reasons.push('wrong_canonical_model');
  if(fact.verification_status!=='verified')reasons.push('fact_pending_review');
  if(!secureUrl(fact.source_url))reasons.push('unsafe_source_url');
  if(!audit)reasons.push('missing_independent_audit');
  else{
   if(str(audit.source_url)!==str(fact.source_url))reasons.push('audit_url_mismatch');
   if(!secureUrl(audit.source_url))reasons.push('unsafe_audit_url');
   if(!str(audit.verification_basis))reasons.push('missing_audit_basis');
   if(!datePast(audit.checked_at))reasons.push('invalid_audit_date');
  }
  if(!editorialApproved||!str(publicationReviewReference))
   reasons.push('editorial_signoff_required');
  results.push(Object.freeze({factId:key,modelId:Number(fact.catalog_model_id),
   allowed:reasons.length===0,reasons:Object.freeze(reasons)}));
 }
 for(const factId of byFact.keys()){
  if(!seen.has(factId))
   throw Error('Orphan source verification audit');
 }
 results.sort((a,b)=>a.factId-b.factId);
 return Object.freeze({
  modelId:model,factCount:results.length,
  eligibleFacts:results.filter(x=>x.allowed).length,
  blockedFacts:results.filter(x=>!x.allowed).length,
  readyForPublication:results.length>0&&results.every(x=>x.allowed),
  review: Object.freeze(results)
 });
}
