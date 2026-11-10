// One public Supabase projection for manufacturers AND models.
// Never read the private editorial store from a public browser or assume
// preview_visible means approved publication.
import {canonicalPageEntity} from './universal-page-section-contract.mjs';

export const UNIVERSAL_PUBLIC_SECTIONS='motorcycle_universal_published_sections_v1';
export async function loadUniversalPublishedPage(client,{type,id}={}){
 if(!client||typeof client.from!=='function')throw Error('Supabase public client required');
 const requested={type,id,name:'pending',manufacturer_id:type==='manufacturer'?id:1};
 canonicalPageEntity(requested); // validates type, numeric canonical ID
 const {data,error}=await client.from(UNIVERSAL_PUBLIC_SECTIONS)
  .select('entity_type,entity_id,entity_name,manufacturer_id,section_number,section_key,section_title,content,editorial_status,publication_eligible,published_at')
  .eq('entity_type',type)
  .eq('entity_id',Number(id))
  .eq('publication_eligible',true)
  .order('section_number',{ascending:true})
  .limit(20);
 if(error)throw Error('Published catalogue unavailable');
 if(!Array.isArray(data)||data.length===0)return null; // never substitute drafts
 // Finance promotions, APR adverts and offers imported as model names are
 // not canonical motorcycles. A row entering the public projection must not
 // turn those into indexable research pages.
 const prohibitedModelName=/(?:\b(?:apr|representative|finance|financing|deposit|monthly payment|pcp)\b|\d+(?:\.\d+)?\s*%)/i;
 if(type==='model'&&data.some(row=>prohibitedModelName.test(String(row.entity_name||''))))
  throw Error('Non-motorcycle promotional catalogue identity blocked');
 const first=data[0];
 const identity=canonicalPageEntity({type:first.entity_type,id:first.entity_id,
  name:first.entity_name,manufacturer_id:first.manufacturer_id});
 if(identity.type!==type||identity.id!==Number(id))throw Error('Public page identity mismatch');
 // Never render duplicate or out-of-contract sections from the public projection.
 // Missing sections remain unpublished; do not fill them from previews or drafts.
 const seenNumbers=new Set(),seenKeys=new Set();
 const sections=data.map(row=>{
  const n=Number(row.section_number);
  if(!Number.isInteger(n)||n<1||n>20||
     typeof row.section_key!=='string'||!row.section_key.trim()||
     seenNumbers.has(n)||seenKeys.has(row.section_key))
   throw Error('Invalid or duplicate universal section identity');
  seenNumbers.add(n);seenKeys.add(row.section_key);
  if(row.entity_type!==identity.type||Number(row.entity_id)!==identity.id||
     row.entity_name!==identity.name||Number(row.manufacturer_id)!==identity.manufacturer_id)
   throw Error('Mixed manufacturer/model publication records');
  if(row.editorial_status!=='published'||row.publication_eligible!==true||
     !row.published_at)throw Error('Unpublished content returned');
  return {...row,entity_type:identity.type,entity_id:identity.id};
 });
 return Object.freeze({entity:identity,sections,stock:[]});
}
