// Exact-model Available Stock for the shared public motorcycle guide.
// Only the existing buyer-safe stock endpoint decides which inventory is public.
// Never promote dealer imagery to research photography or show unpublished stock.
import {matchingPublishedMotorcycles} from './exact-public-model-stock.mjs';

const endpoint='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/international-public-stock';
const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const el=(tag,text='',className='')=>{
 const result=document.createElement(tag);
 result.textContent=text;
 if(className)result.className=className;
 return result;
};
export function renderExactModelStock(section,items,identity){
 if(!section||!identity?.make||!identity?.model)return 0;
 const cards=section.querySelector('[data-exact-model-stock-cards]');
 const status=section.querySelector('[data-exact-model-stock-status]');
 if(!cards||!status)return 0;
 cards.replaceChildren();
 const candidates=matchingPublishedMotorcycles(items,identity,{limit:24});
 // The protected endpoint already controls publication and country access.
 // Never join multiple canonical IDs into one model gallery even when text
 // names happen to match (especially reintroduced or derivative models).
 const canonicalIds=new Set(candidates.map(item=>item.catalog_model_id)
  .filter(id=>id!==null&&id!==undefined&&id!=='').map(String));
 const matches=canonicalIds.size>1?[]:candidates.slice(0,6);
 section.hidden=false;
 if(!matches.length){
  status.textContent='No published stock has been confirmed for this exact model. Ask AnyBike to search UK suppliers.';
  return 0;
 }
 status.textContent=matches.length+' currently published motorcycle'+(matches.length===1?'':'s')+' matching this model.';
 for(const bike of matches){
  const link=el('a','','anybike-exact-stock-item');
  link.href='/international-vq-motorcycle.html?id='+encodeURIComponent(bike.item_id);
  // Intentional: no supplier photo is rendered on a research page until the
  // editorial photo-cleaning and international usage approval process exists.
  const title=el('strong',identity.make+' '+bike.model+(bike.year?' · '+bike.year:''));
  const price=el('span',Number(bike.price).toLocaleString('en-GB',{style:'currency',currency:'GBP'}));
  const action=el('span','View published motorcycle →');
  link.append(title,price,action);
  cards.append(link);
 }
 return matches.length;
}
export async function loadExactModelStock(){
 const section=document.getElementById('sharedExactModelStock');
 if(!section)return;
 const params=new URLSearchParams(location.search);
 const make=(params.get('make')||'').trim();
 const model=(params.get('model')||'').trim();
 if(!make||!model)return;
 // Do not publish an unapproved model identity merely because a URL was typed.
 const heading=document.getElementById('heading');
 const expected=norm(make+' '+model);
 const allowed=()=>heading&&norm(heading.textContent)===expected;
 // The legacy catalogue renderer and this module load independently.
 // Wait for its validated identity to appear, but never wait indefinitely.
 for(let i=0;i<30&&!allowed();i++)await new Promise(resolve=>setTimeout(resolve,100));
 if(!allowed())return;
 try{
  // Match the existing buyer-safe BMW request: a signed-in session may have
  // stock entitlements that a guest does not. No client-side access bypass.
  let token=null;
  try{
   const auth=globalThis.supabase?.createClient?.(
    'https://tuehtnezhdnkqbbhttgp.supabase.co',
    'sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK');
   token=(await auth?.auth.getSession())?.data?.session?.access_token||null;
  }catch(error){console.warn('Optional stock session unavailable',error);}
  const response=await fetch(endpoint,{
   cache:'no-store',
   headers:token?{'Authorization':'Bearer '+token}:{}
  });
  if(!response.ok)throw Error('Public stock endpoint returned '+response.status);
  const data=await response.json();
  if(!Array.isArray(data?.items))throw Error('Invalid public stock result');
  if(!allowed())return;
  renderExactModelStock(section,data.items,{make,model});
 }catch(error){
  // Network or entitlement failure is not proof that no stock exists.
  console.warn('Exact model stock unavailable',error);
 }
}
if(typeof document!=='undefined')loadExactModelStock();
