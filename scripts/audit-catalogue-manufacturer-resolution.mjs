/**
 * Check private AnyBike motorcycle manufacturer identities at catalogue scale.
 * Exact names or backend-verified aliases only. No fuzzy auto-correction.
 * Mugen and any future unverified make remain a counted review item.
 */
const norm=s=>typeof s==='string'?s.normalize('NFKD').trim().toLowerCase().replace(/\s+/g,' '):'';
export function auditCatalogueManufacturerResolution({
 manufacturers=[],models=[],manufacturerAliases=[]
}={}) {
 if(!Array.isArray(manufacturers)||!Array.isArray(models)||!Array.isArray(manufacturerAliases))
  throw new TypeError('Trusted catalogue arrays required');
 const issues=[],canonical=new Map(),ambiguous=new Set(),ids=new Set();
 for(const m of manufacturers){
  const key=norm(m?.display_name);
  if(!key||!Number.isSafeInteger(m?.id)||m.id<1) {issues.push({code:'invalid-canonical-manufacturer'});continue;}
  if(ids.has(m.id))issues.push({code:'duplicate-canonical-manufacturer-id',id:m.id});
  ids.add(m.id);
  if(canonical.has(key))ambiguous.add(key);
  else canonical.set(key,{id:m.id,display_name:m.display_name});
 }
 for(const key of ambiguous)canonical.delete(key);
 const resolved=new Map(canonical),aliasCount=new Map(),badAliases=new Set();
 for(const a of manufacturerAliases){
  const key=norm(a?.source_manufacturer_name),id=a?.canonical_manufacturer_id;
  if(!key || a?.resolution_status!=='verified_alias'||!a.verified_at||!ids.has(id)){
    issues.push({code:'invalid-or-unreviewed-alias',alias:a?.source_manufacturer_name});continue;
  }
  if(aliasCount.has(key)||canonical.has(key))badAliases.add(key);
  else aliasCount.set(key,{id});
 }
 for(const key of badAliases){aliasCount.delete(key);issues.push({code:'ambiguous-manufacturer-alias',alias:key});}
 for(const [key,target] of aliasCount)resolved.set(key,{id:target.id,alias:true});
 const details=new Map(),counts={totalModels:models.length,exact:0,verifiedAlias:0,reviewRequired:0,invalid:0};
 for(const m of models){
  if(!Number.isSafeInteger(m?.id)||m.id<1||!norm(m?.manufacturer)){
   counts.invalid++;continue;
  }
  const key=norm(m.manufacturer);
  const target=resolved.get(key);
  if(!target){
   counts.reviewRequired++;
   const prior=details.get(m.manufacturer)||{manufacturer:m.manufacturer,models:0,reason:ambiguous.has(key)?'duplicate-canonical-name':'unmapped-or-unreviewed'};
   prior.models++;details.set(m.manufacturer,prior);
   continue;
  }
  if(target.alias)counts.verifiedAlias++;
  else counts.exact++;
 }
 const needsReview=[...details.values()].sort((a,b)=>b.models-a.models||a.manufacturer.localeCompare(b.manufacturer));
 return {counts:{...counts,canonicalManufacturers:manufacturers.length,verifiedAliases:aliasCount.size,issues:issues.length},issues,needsReview,
  note:'No catalogue rows changed; unresolved brand names do not generate public guide pages or links.'};
}
