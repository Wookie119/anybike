// Shared market navigation for ALL manufacturer and motorcycle model pages.
// Public, read-only paths only. Does not imply stock availability or editorial approval.
const safeText=v=>typeof v==='string'?v.trim():'';
const arr=v=>Array.isArray(v)?v:[];
const text=(tag,value)=>{
 const el=document.createElement(tag);el.textContent=String(value??'');return el;
};
export function groupDatabaseCountryRoutes(items){
 const byRegion=new Map(),seen=new Set();
 for(const item of arr(items)){
  const url=safeText(item?.url),label=safeText(item?.label),region=safeText(item?.region);
  if(!/^\/markets\/[a-z0-9-]+\.html$/.test(url)||!label||!region||seen.has(url))continue;
  seen.add(url);
  if(!byRegion.has(region))byRegion.set(region,[]);
  byRegion.get(region).push({label,url});
 }
 return [...byRegion].sort((a,b)=>a[0].localeCompare(b[0],'en'))
  .map(([region,entries])=>({region,entries:entries.sort((a,b)=>a.label.localeCompare(b.label,'en'))}));
}
export function addDatabaseCountryNavigation(body,items){
 if(!body||!Array.isArray(items)||!items.length)return false;
 if(body.querySelector('[data-anybike-db-section="country_markets"]'))return false;
 const groups=groupDatabaseCountryRoutes(items);
 if(!groups.length)return false;
 const el=document.createElement('section');
 el.className='card anybike-db-research-card anybike-shared-country-markets';
 el.dataset.anybikeDbSection='country_markets';
 el.append(text('h2','Countries and markets'));
 el.append(text('p','Browse the existing AnyBike international market guides by region. Motorcycle availability and export arrangements are confirmed separately.'));
 const all=document.createElement('a');
 all.href='/international-markets.html';
 all.textContent='Explore all international markets →';
 el.append(all);
 for(const {region,entries} of groups){
  const details=document.createElement('details');
  details.className='anybike-db-heritage';
  details.append(text('summary',region+' ('+entries.length+')'));
  const nav=document.createElement('nav');
  nav.className='anybike-db-model-links';
  nav.setAttribute('aria-label',region+' motorcycle markets');
  details.append(nav);
  details.addEventListener('toggle',()=>{
   if(details.open&&!nav.childElementCount){
    for(const entry of entries){
     const a=document.createElement('a');a.href=entry.url;a.textContent=entry.label;
     a.style.cssText='display:inline-flex;align-items:center;padding:9px 13px;border:1px solid #813438;border-radius:999px;background:#242424;color:#fff;text-decoration:none';
     nav.append(a);
    }
   }
  });
  el.append(details);
 }
 body.append(el);
 // The legacy model-guide loader can finish after the country RPC and replace
 // all research children. Reattach the SAME card rather than duplicating it.
 if(typeof MutationObserver!=='undefined'){
  const observer=new MutationObserver(()=>{
   if(!el.isConnected&&body.isConnected&&
      !body.querySelector('[data-anybike-db-section="country_markets"]')){
    body.append(el);
   }
  });
  observer.observe(body,{childList:true});
 }
 return true;
}

const COUNTRY_ENDPOINT='https://tuehtnezhdnkqbbhttgp.supabase.co';
const COUNTRY_PUBLIC_KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
/** Add country routes to the existing approved page, never replace its children. */
export async function installPublicCountryNavigation({root=document.querySelector('main'),client}={}){
 if(!root||root.querySelector('[data-anybike-db-section="country_markets"]'))return false;
 const db=client||window.supabase?.createClient?.(COUNTRY_ENDPOINT,COUNTRY_PUBLIC_KEY);
 if(!db)return false;
 try{
  const {data,error}=await db.rpc('public_anybike_country_navigation_v1');
  if(error||!Array.isArray(data)||!data.length)return false;
  if(root.querySelector('[data-anybike-db-section="country_markets"]'))return false;
  const mounted=addDatabaseCountryNavigation(root,data);
  if(!mounted)return false;
  const panel=root.querySelector('[data-anybike-db-section="country_markets"]');
  if(panel){
   panel.style.cssText='grid-column:1 / -1;margin:22px 0;padding:22px;border:1px solid #555;border-left:3px solid #ed1c24;border-radius:12px;background:#252525;color:#fff';
   for(const nav of panel.querySelectorAll('.anybike-db-model-links')){
    nav.style.cssText='display:flex;flex-wrap:wrap;gap:9px;padding:14px 0';
   }
   for(const details of panel.querySelectorAll('details')){
    details.style.cssText='border-top:1px solid #444;padding:10px 0';
   }
  }
  return true;
 }catch(error){
  console.warn('Public country navigation unavailable; retaining approved page',error);
  return false;
 }
}

if(typeof document!=='undefined'&&typeof location!=='undefined'&&
 /^\/(?:bmw|harley-davidson)-motorcycles\.html$/.test(location.pathname)){
 const start=()=>void installPublicCountryNavigation();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
}
