/**
 * Controlled export of canonical model identities into the static public
 * directory. Runtime site does not fetch protected Supabase catalogue rows.
 *
 * Source data must be fetched through an authorized server-side workflow.
 * No credentials, research paragraphs, stock records or dealer data appear
 * in this output. An explicitly reviewed ID allowlist authorizes public
 * labels ONLY (never editorial/factual publication).
 */
import {normalizedCatalogueLabel,isPromotionalModelLabel}
 from './catalogue-intake-contract.mjs';

const idOK=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&
 (typeof x==='number'||typeof x==='string'&&/^[1-9][0-9]*$/.test(x));
const key=(make,model)=>normalizedCatalogueLabel(make)+'/'+normalizedCatalogueLabel(model);
const categories=Object.freeze({
 'Motocross':'Off-road',Trials:'Off-road',Rally:'Adventure',
 Classic:'Classics'
});
export function createPublicModelDirectory({
 catalogue,models=[],manufacturers=[],aliases=[],approvedModelIds=[]
}={}){
 if(!catalogue||!Array.isArray(catalogue.models)||
    !Array.isArray(models)||!Array.isArray(manufacturers)||
    !Array.isArray(aliases)||!Array.isArray(approvedModelIds))
  throw Error('Invalid public model directory inputs');
 const registered=new Set();
 for(const m of manufacturers){
  if(!m||!m.display_name)throw Error('Invalid manufacturer registry');
  registered.add(m.display_name);
 }
 const current=new Map(),ids=new Set();
 for(const row of catalogue.models){
  if(!row||typeof row.make!=='string'||typeof row.model!=='string')
   throw Error('Invalid existing public directory');
  const k=key(row.make,row.model);
  if(!k||k==='/')throw Error('Empty public model identity');
  if(current.has(k))throw Error('Duplicate public make/model identity: '+k);
  current.set(k,row);
  if(row.catalogue_model_id!==undefined){
   if(!idOK(row.catalogue_model_id)||ids.has(Number(row.catalogue_model_id)))
    throw Error('Repeated or invalid public canonical model ID');
   ids.add(Number(row.catalogue_model_id));
  }
 }
 const byId=new Map(),collisions=new Map();
 for(const m of models){
  if(!m||!idOK(m.id)||typeof m.manufacturer!=='string'||
     typeof m.model!=='string'||!key(m.manufacturer,m.model))
   throw Error('Invalid canonical source model');
  const id=Number(m.id);
  if(byId.has(id))throw Error('Duplicate canonical source ID');
  byId.set(id,m);
  const k=key(m.manufacturer,m.model);
  collisions.set(k,(collisions.get(k)||0)+1);
 }
 const pendingAliases=new Set(aliases.filter(x=>x.review_status!=='approved')
  .map(x=>Number(x.alias_model_id)));
 const approved=new Set();
 for(const id of approvedModelIds){
  if(!idOK(id)||approved.has(Number(id)))
   throw Error('Invalid or duplicate public label approval ID');
  approved.add(Number(id));
 }
 const added=[],review=[];
 for(const id of [...approved].sort((a,b)=>a-b)){
  const m=byId.get(id),reasons=[];
  if(!m){review.push({id,reasons:['unknown_canonical_id']});continue;}
  const k=key(m.manufacturer,m.model),existing=current.get(k);
  if(!registered.has(m.manufacturer))reasons.push('manufacturer_registry_mismatch');
  if(['BMW','Harley-Davidson'].includes(m.manufacturer))
   reasons.push('dedicated_manufacturer_page');
  if(pendingAliases.has(id))reasons.push('pending_alias_review');
  if(collisions.get(k)!==1)reasons.push('normalized_model_collision');
  if(isPromotionalModelLabel(m.model))reasons.push('finance_or_promotional_label');
  if(existing?.catalogue_model_id!==undefined&&
     Number(existing.catalogue_model_id)!==id)
   reasons.push('public_canonical_id_mismatch');
  if(ids.has(id)&&(!existing||Number(existing.catalogue_model_id)!==id))
   reasons.push('canonical_id_reused_for_other_model');
  if(reasons.length){review.push({id,reasons});continue;}
  if(existing){
   // Preserve historic curated category, source notes and original casing;
   // a previously reviewed public label must never be overwritten.
   if(existing.catalogue_model_id!==undefined&&
      Number(existing.catalogue_model_id)!==id)throw Error('Public ID drift');
   continue;
  }
  const entry={make:m.manufacturer,model:m.model,
   category:categories[m.motorcycle_type]||'Other',
   production_years:null,verification:'pending',catalogue_model_id:id};
  current.set(k,entry);
  ids.add(id);
  added.push(entry);
 }
 if(review.length)throw Error('Public directory export blocked: '+
  JSON.stringify(review));
 const entries=[...current.values()].sort((a,b)=>
   a.make.localeCompare(b.make,'en')||
   a.model.localeCompare(b.model,'en',{numeric:true}));
 return Object.freeze({
  catalogue:{...catalogue,models:entries},
  added:Object.freeze(added),
  canonicalIds:Object.freeze([...approved].sort((a,b)=>a-b)),
  publicationApproved:false
 });
}
