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
  .select('source_section_id,entity_type,entity_id,entity_name,manufacturer_id,section_number,section_key,section_title,content,editorial_status,publication_eligible,published_at,publication_review_reference')
  .eq('entity_type',type)
  .eq('entity_id',Number(id))
  .eq('publication_eligible',true)
  .order('section_number',{ascending:true})
  .limit(21); // Fetch one beyond the contract so overflow cannot be hidden.
 if(error)throw Error('Published catalogue unavailable');
 if(!Array.isArray(data))throw Error('Invalid published catalogue response');
 if(data.length>20)throw Error('Universal publication exceeds 20 sections');
 if(data.length===0)return null; // never substitute drafts
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
  const expectedKey='section_'+String(n).padStart(2,'0');
  if(!Number.isInteger(n)||n<1||n>20||
     row.section_key!==expectedKey||
     seenNumbers.has(n)||seenKeys.has(row.section_key))
   throw Error('Invalid or duplicate universal section identity');
  seenNumbers.add(n);seenKeys.add(row.section_key);
  if(row.entity_type!==identity.type||Number(row.entity_id)!==identity.id||
     row.entity_name!==identity.name||Number(row.manufacturer_id)!==identity.manufacturer_id)
   throw Error('Mixed manufacturer/model publication records');
  if(row.editorial_status!=='published'||row.publication_eligible!==true||
     !row.published_at)throw Error('Unpublished content returned');
  const publicationTime=Date.parse(row.published_at);
  if(!Number.isFinite(publicationTime)||publicationTime>Date.now())
   throw Error('Publication date is invalid or not yet reached');
  if(!Number.isSafeInteger(Number(row.source_section_id))||
     Number(row.source_section_id)<=0||
     typeof row.publication_review_reference!=='string'||
     !row.publication_review_reference.trim())
   throw Error('Missing reviewed publication provenance');
  if(typeof row.section_title!=='string'||!row.section_title.trim()||
     row.content===null||row.content===undefined||
     (typeof row.content==='string'&&!row.content.trim())||
     (Array.isArray(row.content)&&row.content.length===0)||
     (typeof row.content==='object'&&!Array.isArray(row.content)&&Object.keys(row.content).length===0))
   throw Error('Empty published research section blocked');
  // An approved outer row may never launder an unreviewed top-level
  // documentary source capture into a public research card. Nested pending
  // engineering in an otherwise reviewed section remains separately filtered
  // by the renderer; do not blanket-suppress such approved summaries.
  if(row.content&&typeof row.content==='object'&&!Array.isArray(row.content)){
   const rootStatus=['source_verification_status','editorial_status',
    'content_status','verification_status','review_state'];
   const approvedStates=new Set(['verified','approved','published']);
   for(const key of rootStatus){
    const state=row.content[key];
    if(state!==undefined&&state!==null&&
       (typeof state!=='string'||!approvedStates.has(state.trim().toLowerCase())))
     throw Error('Unreviewed top-level research content blocked');
   }
   if(row.content.publication_eligible===false)
    throw Error('Explicitly denied research content blocked');
   if(row.content.published_at!==undefined&&row.content.published_at!==null){
    const releaseTime=Date.parse(row.content.published_at);
    if(!Number.isFinite(releaseTime)||releaseTime>Date.now())
     throw Error('Nested research release date not reached');
   }
  }
  // Imported HTML source pointers are migration metadata, not reviewed
  // customer-facing research. In particular, a source_blocks-only section
  // must not become a blank public card just because JSON is non-empty.
  if(row.content&&typeof row.content==='object'&&!Array.isArray(row.content)&&
     Object.keys(row.content).every(key=>key==='source_blocks'||
       key==='source_file'||key==='source_blob_sha')&&
     Array.isArray(row.content.source_blocks))
   throw Error('Unreviewed source-only research section blocked');
  // Pending technical evidence cannot be the sole customer-facing payload.
  if(row.content&&typeof row.content==='object'&&!Array.isArray(row.content)&&
     Object.keys(row.content).length===1&&
     row.content.engineering&&typeof row.content.engineering==='object'&&
     !['verified','approved','published'].includes(
       String(row.content.engineering.verification_status||'').toLowerCase()))
   throw Error('Unverified engineering-only section blocked');
  return {...row,entity_type:identity.type,entity_id:identity.id};
 });
 return Object.freeze({entity:identity,sections,stock:[]});
}
