/**
 * Read-only, manufacturer-wide import planning.
 *
 * This module NEVER writes to Supabase or implies that imported research is
 * reviewed or published. It preserves every source model ID, even when labels
 * normalize alike. Alias proposals and manufacturer mismatches are blockers,
 * not instructions to merge or silently reparent records.
 */
const positiveId=x=>(typeof x==='number'&&Number.isSafeInteger(x)&&x>0)||
 (typeof x==='string'&&/^[1-9][0-9]*$/.test(x)&&
  Number.isSafeInteger(Number(x)));
export const normalizedCatalogueLabel=value=>
 typeof value==='string'?value.toLowerCase().replace(/[^a-z0-9]/g,''):'';
export const isPromotionalModelLabel=value=>
 typeof value==='string'&&/(?:\b(?:apr|representative|finance|financing|deposit|monthly payment|pcp)\b|\d+(?:\.\d+)?\s*%)/i.test(value);

export function planCatalogueIntake({manufacturers=[],models=[],aliases=[],batchSize=100}={}){
 if(!Array.isArray(manufacturers)||!Array.isArray(models)||!Array.isArray(aliases))
  throw Error('All-manufacturer intake requires arrays');
 if(!Number.isSafeInteger(batchSize)||batchSize<1||batchSize>500)
  throw Error('Batch size must be from 1 to 500');
 const registry=new Map();
 const flags=[];
 for(const m of manufacturers){
  if(!m||!positiveId(m.id)||typeof m.display_name!=='string'||
     !m.display_name.trim())throw Error('Invalid manufacturer registry');
  if(registry.has(m.display_name))throw Error('Duplicate manufacturer registry label');
  registry.set(m.display_name,m);
 }
 const seenIds=new Set(),keys=new Map(),items=[];
 const flaggedAliasIds=new Set();
 for(const alias of aliases){
  if(!alias||!positiveId(alias.alias_model_id)||
     !positiveId(alias.canonical_model_id))throw Error('Invalid alias review item');
  if(alias.review_status!=='approved')flaggedAliasIds.add(Number(alias.alias_model_id));
 }
 for(const model of models){
  if(!model||!positiveId(model.id)||typeof model.manufacturer!=='string'||
     !model.manufacturer.trim()||typeof model.model!=='string'||
     !model.model.trim())throw Error('Invalid catalogue model');
  const id=Number(model.id);
  if(seenIds.has(id))throw Error('Duplicate canonical catalogue ID');
  seenIds.add(id);
  const key=normalizedCatalogueLabel(model.manufacturer)+'/'+
    normalizedCatalogueLabel(model.model);
  if(!keys.has(key))keys.set(key,[]);
  keys.get(key).push(id);
  const issues=[];
  if(!registry.has(model.manufacturer))issues.push('manufacturer_registry_mismatch');
  if(isPromotionalModelLabel(model.model))issues.push('promotional_model_label');
  if(flaggedAliasIds.has(id))issues.push('pending_alias_review');
  const item={id,manufacturer:model.manufacturer,
    model:model.model,issues,eligibleForStaging:issues.length===0};
  items.push(item);
  if(issues.length)flags.push({id,manufacturer:model.manufacturer,
    model:model.model,issues});
 }
 for(const [key,ids] of keys){
  if(ids.length<=1)continue;
  for(const id of ids){
   const item=items.find(x=>x.id===id);
   if(!item.issues.includes('normalized_name_collision')){
    item.issues.push('normalized_name_collision');
    item.eligibleForStaging=false;
    flags.push({id,manufacturer:item.manufacturer,model:item.model,
      issues:['normalized_name_collision'],conflicts:ids.filter(x=>x!==id)});
   }
  }
 }
 // IDs, not names, determine batch membership; never assume collisions are
 // duplicates or that a model with no flag is editorially publication-ready.
 items.sort((a,b)=>a.id-b.id);
 for(const item of items){Object.freeze(item.issues);Object.freeze(item);}
 const safe=items.filter(x=>x.eligibleForStaging);
 const batches=[];
 for(let i=0;i<safe.length;i+=batchSize)
  batches.push(Object.freeze(safe.slice(i,i+batchSize).map(x=>x.id)));
 return Object.freeze({
  modelCount:items.length,manufacturerCount:registry.size,
  eligibleForStagingCount:safe.length,
  reviewRequiredCount:items.length-safe.length,
  reviewItems:flags,batches,
  // Explicitly *not* an editorial approval decision.
  publicationApproved:false
 });
}
