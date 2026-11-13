// AnyBike verified factory research on the EXISTING approved Harley-Davidson
// model pages. Reuse the one verified-facts renderer and the approved database
// route registry; do not infer model identity from filenames, replace page
// designs, or interfere with stock, hero photos or historical content.
import {installVerifiedModelFacts} from './public-verified-model-facts.mjs';
import {resolveApprovedV2Identity} from './approved-v2-route-identity.mjs';
const ENDPOINT='https://tuehtnezhdnkqbbhttgp.supabase.co';
const PUBLIC_KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
export function exactApprovedHarleyRoute(rows,pathname){
 const route=resolveApprovedV2Identity(pathname,rows);
 return route?.make==='Harley-Davidson'?route:null;
}
function publicRpcClient(fetchFn){
 return {async rpc(name,params){
  if(!['public_anybike_manufacturer_model_routes_v1','public_anybike_verified_model_facts_v1'].includes(name))return {data:null,error:{message:'Unknown RPC'}};
  const response=await fetchFn(ENDPOINT+'/rest/v1/rpc/'+name,{
   method:'POST',
   headers:{'Content-Type':'application/json','apikey':PUBLIC_KEY},
   body:JSON.stringify(params)
  });
  if(!response.ok)return {data:null,error:{message:'Public model research unavailable'}};
  return {data:await response.json(),error:null};
 }};
}
export async function installApprovedHarleyResearch({doc,pathname,client,fetchFn}={}){
 const page=doc||(typeof document!=='undefined'?document:null);
 const path=pathname||(typeof location!=='undefined'?location.pathname:'');
 const main=page?.querySelector?.('main');
 if(!main||!/^\/harley-davidson-[a-z0-9-]+\.html$/.test(path)||
    page.querySelector?.('[data-anybike-harley-research-slot]'))return 0;
 const db=client||publicRpcClient(fetchFn||fetch);
 try{
  const {data:routes,error:routeError}=await db.rpc('public_anybike_manufacturer_model_routes_v1',{p_make:'Harley-Davidson'});
  if(routeError)return 0;
  const route=exactApprovedHarleyRoute(routes,path);
  if(!route)return 0;
  const {data:facts,error:factError}=await db.rpc('public_anybike_verified_model_facts_v1',{p_make:'Harley-Davidson',p_model:route.model});
  if(factError||!Array.isArray(facts)||facts.length===0)return 0;
  // Mount only a new sourced-facts section, without moving or deleting
  // existing manufacturer guide cards or enquiry/stock components.
  const slot=page.createElement('div');
  slot.dataset.anybikeHarleyResearchSlot='1';
  slot.style.cssText='min-width:0;width:100%;margin:24px 0';
  // Some approved guides wrap the related links/credits in layout sections.
  // insertBefore requires a DIRECT child of main; ascend through the wrapper
  // rather than dropping a valid factory research section on nested layouts.
  let before=main.querySelector?.('nav.end-action.harley-related-pill-nav')||
   main.querySelector?.('details.image-attribution')||null;
  while(before&&before.parentNode!==main)before=before.parentNode;
  main.insertBefore(slot,before);
  const rendered=await installVerifiedModelFacts({
   body:slot,make:'Harley-Davidson',model:route.model,
   client:{rpc:async(name,args)=>name==='public_anybike_verified_model_facts_v1'
    ?{data:facts,error:null}:{data:null,error:{message:'Unexpected RPC'}}}
  });
  if(rendered<=0){slot.remove();return 0;}
  const panel=slot.querySelector?.('[data-anybike-verified-model-facts]');
  if(panel){
   panel.style.borderTopColor='#ff6600';
   panel.style.margin='0';
  }
  return rendered;
 }catch(error){
  console.warn('Optional Harley-Davidson factory research unavailable; original model page preserved',error);
  return 0;
 }
}
if(typeof document!=='undefined'&&typeof location!=='undefined'&&
 /^\/harley-davidson-[a-z0-9-]+\.html$/.test(location.pathname)){
 const start=()=>void installApprovedHarleyResearch();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
}
