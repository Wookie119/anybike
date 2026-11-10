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

export async function loadAndRenderUniversalStage({
 client,root,type,id,permittedStock=[],manufacturerName=''
}={}){
 if(!root||root.dataset?.anybikeUniversalRoot!=='true'||
    root.dataset?.anybikeUniversalStage!=='true')
  throw Error('Dedicated opt-in universal stage root required');
 if(!Array.isArray(permittedStock))
  throw Error('Permitted stock must be an array');
 // Loading validates canonical identity, all section IDs, approved status,
 // 20-slot limits and content before any DOM mutation can occur.
 const published=await loadUniversalPublishedPage(client,{type,id});
 if(!published)return null;
 const entity=published.entity.type==='model'&&
     typeof manufacturerName==='string'&&manufacturerName.trim()
  ?{...published.entity,manufacturer_name:manufacturerName.trim()}
  :published.entity;
 return renderUniversalPage(root,{
  entity,sections:published.sections,
  stock:entity.type==='model'?permittedStock:[]
 });
}
