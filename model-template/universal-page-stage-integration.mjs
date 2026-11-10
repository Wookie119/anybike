/**
 * Stage-only public catalogue integration for the ONE universal renderer.
 * No page bootstrap and no changes to approved BMW/Harley HTML.
 *
 * Public research must come exclusively from the approved published projection.
 * Stock must be supplied by an already buyer-authorized public endpoint; this
 * module never reads protected stock, drafts, private editorial or image tables.
 * Without approved published sections, leave the stage root untouched.
 */
import {loadUniversalPublishedPage} from './universal-page-data.mjs';
import {renderUniversalPage} from './universal-page-renderer.mjs';

// One request sequence per stage root prevents an older model response from
// replacing a newer selection when network replies arrive out of order.
const latestStageRequest=new WeakMap();

export async function loadAndRenderUniversalStage({
 client,root,type,id,permittedStock=[],manufacturerName='',approvedHeroPhoto=null
}={}){
 if(!root||root.dataset?.anybikeUniversalRoot!=='true'||
    root.dataset?.anybikeUniversalStage!=='true')
  throw Error('Dedicated opt-in universal stage root required');
 if(!Array.isArray(permittedStock))
  throw Error('Permitted stock must be an array');
 if(type==='model'&&permittedStock.length>0&&
    (typeof manufacturerName!=='string'||!manufacturerName.trim()))
  throw Error('Trusted manufacturer name required for model stock validation');
 // Capture the caller's already-authorized feed at request start. A live
 // refresh must not mutate this request's contents while public research loads.
 const stockSnapshot=permittedStock.map(item=>
  item&&typeof item==='object'&&!Array.isArray(item)?{...item}:item);
 // Advance the root's request generation before awaiting the public feed.
 // A later selection is authoritative even if its response is empty or denied.
 const request=(latestStageRequest.get(root)||0)+1;
 latestStageRequest.set(root,request);
 // An opt-in stage can be reused for a different model OR a different
 // signed-in buyer/stock entitlement for the same model. Clear the previous
 // authorised snapshot at request start: stale inventory must never remain
 // visible while the next authorised result loads, denies or returns empty.
 // The approved public BMW/Harley DOM is outside this stage root.
 if(root.dataset.anybikeRenderedEntity){
  root.replaceChildren();
  delete root.dataset.anybikeRenderedEntity;
 }
 // Loading validates canonical identity, all section IDs, approved status,
 // 20-slot limits and content before any DOM mutation can occur.
 let published;
 try{
  published=await loadUniversalPublishedPage(client,{type,id});
 }catch(error){
  // A failure from a superseded selection is not the current page's
  // failure. The newest request still owns the root and its error state.
  if(latestStageRequest.get(root)!==request)return null;
  throw error;
 }
 if(latestStageRequest.get(root)!==request)return null;
 if(!published)return null;
 const entity=published.entity.type==='model'&&
     typeof manufacturerName==='string'&&manufacturerName.trim()
  ?{...published.entity,manufacturer_name:manufacturerName.trim()}
  :published.entity;
 return renderUniversalPage(root,{
  entity,sections:published.sections,
  stock:entity.type==='model'?stockSnapshot:[],
  heroPhoto:entity.type==='model'?approvedHeroPhoto:null
 });
}
