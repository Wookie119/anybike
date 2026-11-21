// One renderer for approved advertising placements. No advert means no DOM or gap.
const endpoint='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/public-advertising-v1';
const send=async(body,keepalive=false)=>{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive,cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Advertising unavailable');return r.json()};
const node=(tag,v)=>{const el=document.createElement(tag);if(v)el.textContent=v;return el};
const https=v=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:null}catch{return null}};
let generation=0,observer=null;
// AnyBike-owned Move Motorcycles house advert: one per UK-facing customer page.
// Uses the previously approved red artwork until the five-size blue/gold artwork
// is uploaded and approved. It does not depend on login or edit individual models.
const MOVE_SITE='https://www.movemotorcycles.co.uk/';
// Uploaded, user-approved five-size blue/gold house artworks. The old approved
// red adverts remain in /assets unchanged. One central renderer chooses formats.
const MOVE_WIDE="https://tuehtnezhdnkqbbhttgp.supabase.co/storage/v1/object/public/advertising-creatives/campaigns/95c5d74b-1048-44fc-b22a-37683c4380e8/ee2fd6aa-8ba2-47ad-aad8-ce4c78360cbc-move-motorcycles-large-landscape.webp";
const MOVE_MOBILE="https://tuehtnezhdnkqbbhttgp.supabase.co/storage/v1/object/public/advertising-creatives/campaigns/95c5d74b-1048-44fc-b22a-37683c4380e8/1abcc788-066d-410a-a662-ecf0b4c63566-move-motorcycles-large-portrait.webp";
const MOVE_SLIM="https://tuehtnezhdnkqbbhttgp.supabase.co/storage/v1/object/public/advertising-creatives/campaigns/95c5d74b-1048-44fc-b22a-37683c4380e8/4879fae8-f9bc-44c1-8404-59923273e6df-move-motorcycles-slim-landscape.webp";
const MOVE_COMPACT="https://tuehtnezhdnkqbbhttgp.supabase.co/storage/v1/object/public/advertising-creatives/campaigns/95c5d74b-1048-44fc-b22a-37683c4380e8/5adcb2e3-2328-4952-9ac0-bdc3f0ded849-move-motorcycles-compact-mobile.webp";
const MOVE_STOCK="https://tuehtnezhdnkqbbhttgp.supabase.co/storage/v1/object/public/advertising-creatives/campaigns/95c5d74b-1048-44fc-b22a-37683c4380e8/0002606a-3a94-4d6c-adbd-370714fbea3d-move-motorcycles-stock-card.webp";
const moveHouseMarker='anybike-move-universal-house-ad';
let moveHouseReady=null;
const existingMoveAdvert=()=>[...document.querySelectorAll('a[href*="movemotorcycles.co.uk"]')]
 .some(a=>!a.closest('#'+moveHouseMarker)&&!!a.querySelector('img,picture')&&a.getClientRects().length>0);
const isPublicUkCustomerPage=()=>{
 const path=location.pathname.toLowerCase();
 if(/^\/(?:admin(?:-|\/)|markets\/|international-)/.test(path))return false;
 if(/\/(?:login|logout|register|forgot-password|reset-password|privacy-policy|cookie-policy|terms-and-conditions)\.html$/.test(path))return false;
 return true;
};
function buildMoveHouseCard(stock=false){
 const card=node(stock?'article':'aside');
 card.id=moveHouseMarker;
 card.setAttribute('aria-label','Advertisement: Move Motorcycles nationwide motorcycle transport');
 card.className=stock?'card anybike-move-stock-ad':'anybike-move-house-banner';
 card.style.cssText=stock
  ?'background:#111;border:1px solid #555;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-width:0'
  :'margin:12px auto;width:100%;max-width:1480px;border-radius:12px;overflow:hidden;min-width:0';
 const link=node('a');link.href=MOVE_SITE;link.target='_blank';link.rel='noopener sponsored';
 link.setAttribute('aria-label','Move Motorcycles - nationwide motorcycle collection and delivery');
 link.style.cssText='display:block;width:100%;overflow:hidden;border-radius:12px;background:#101010;text-decoration:none';
 const picture=node('picture');picture.style.cssText='display:block;width:100%;overflow:hidden;border-radius:12px';
 const source=node('source');source.media='(max-width:650px)';source.srcset=stock?MOVE_STOCK:MOVE_COMPACT;
 const img=node('img');img.src=stock?MOVE_STOCK:(location.pathname.toLowerCase().includes('model')||/^\/models\//.test(location.pathname.toLowerCase())?MOVE_SLIM:MOVE_WIDE);img.alt='Move Motorcycles - nationwide motorcycle collection and delivery';
 img.loading='lazy';img.decoding='async';img.style.cssText=stock
  ?'display:block;width:100%;aspect-ratio:4/3;object-fit:contain;border-radius:12px'
  :'display:block;width:100%;height:auto;max-height:250px;object-fit:contain;border-radius:12px';
 picture.append(source,img);link.append(picture);card.append(link);
 const disclosure=node('small','Advertisement · Move Motorcycles');
 disclosure.style.cssText='display:block;font:11px Arial;color:#aaa;padding:5px 8px';
 card.append(disclosure);
 return card;
}
function installMoveHouse(){
 if(!isPublicUkCustomerPage()||document.getElementById(moveHouseMarker)||existingMoveAdvert())return false;
 const stock=location.pathname.toLowerCase()==='/available-stock.html';
 if(stock){
  const grid=document.getElementById('stockGrid');
  if(!grid||!grid.querySelector('article.card:not(.anybike-move-stock-ad)'))return false;
  const children=[...grid.querySelectorAll(':scope > article.card:not(.anybike-move-stock-ad)')];
  children[Math.min(children.length,6)-1].after(buildMoveHouseCard(true));
  return true;
 }
 const main=document.querySelector('main');
 if(!main)return false;
 // Retain the approved template: add a single optional advert after its hero
 // (or first heading), rather than editing the bike's model content.
 // The advert belongs BETWEEN complete page sections, never inside a two-column
 // manufacturer, model or editorial panel. Prefer the full top-level hero.
 const anchor=main.querySelector(':scope > .manufacturer-hero,:scope > .hero,:scope > .hero-section,:scope > section.hero,:scope > h1,:scope > header')||
  main.querySelector(':scope > section,:scope > article,:scope > div')||main.firstElementChild;
 if(!anchor)return false;
 anchor.after(buildMoveHouseCard(false));
 // Some dealer dashboards insert their approved Move creative after async loading.
 // If one appears later, keep the existing approved advert rather than showing two.
 const dedupe=new MutationObserver(()=>{
  const own=document.getElementById(moveHouseMarker);
  if(!own){dedupe.disconnect();return;}
  if(existingMoveAdvert()){own.remove();dedupe.disconnect();}
 });
 dedupe.observe(document.body,{childList:true,subtree:true});
 return true;
}
export async function renderMoveHouseOnUkPage(options={}){
 if(!isPublicUkCustomerPage())return;
 if(moveHouseReady===null){
  moveHouseReady=(async()=>{
   try{
    const res=await fetch('https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/visitor-market-country',{cache:'no-store'});
    if(!res.ok)return false;
    const data=await res.json();
    return data?.country_code==='GB';
   }catch{return false;}
  })();
 }
 if(!await moveHouseReady)return;
 if(installMoveHouse())return;
 // Stock cards load asynchronously. Reinsert after filters/re-sorts, but
 // never add a second Move advert to the same page.
 if(location.pathname.toLowerCase()==='/available-stock.html'){
  const grid=document.getElementById('stockGrid');if(!grid)return;
  const observer=new MutationObserver(()=>{if(!document.getElementById(moveHouseMarker))installMoveHouse()});
  observer.observe(grid,{childList:true});
  installMoveHouse();
 }
}

export async function renderAdvertising(context){if(document.getElementById(moveHouseMarker)||existingMoveAdvert())return;const n=++generation;observer?.disconnect();document.getElementById('anybike-ad-below-hero')?.remove();if(!context||context.country!=='GB')return;const isModel=Number.isSafeInteger(context.modelId);if(!isModel&&!context.pagePath)return;try{const {ad}=await send(isModel?{action:'select',model_id:context.modelId,country:context.country}:{action:'select_page',page_path:context.pagePath,country:context.country});if(n!==generation||!ad)return;const anchor=document.querySelector('main .hero')||(!isModel?document.querySelector('main .hero-section,main section:first-of-type'):null);const href=https(ad.destination_url);const desktop=https(ad.desktop_image_url),mobile=https(ad.mobile_image_url);if(!anchor||!href||!desktop||!mobile)return;
const box=node('aside');box.id='anybike-ad-below-hero';box.className='anybike-advertising-banner';box.setAttribute('aria-label','Advertisement: '+ad.partner_name);box.style.cssText='margin:12px 0;display:block';
const link=node('a');link.href=href;link.target='_blank';link.rel='noopener sponsored';link.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:14px;background:#040c34;color:#fff;border:1px solid #686868;border-radius:12px;padding:10px 14px;text-decoration:none;overflow:hidden;min-width:0';
const copy=node('div');copy.style.cssText='flex:1;min-width:0';const label=node('span','Advertisement · '+ad.partner_name);label.style.cssText='display:block;font:600 11px Arial;color:#d8cba7;margin-bottom:3px';const title=node('strong',ad.headline);title.style.cssText='display:block;font:700 clamp(14px,2vw,19px) Arial;line-height:1.2';const subtitle=node('div',ad.subheading);subtitle.style.cssText='font:13px Arial;line-height:1.35;margin:4px 0;color:#f1f1f1';const cta=node('span',ad.cta_text||'Find out more');cta.style.cssText='display:inline-block;background:#a08c59;color:#040c34;font:700 12px Arial;padding:6px 9px;border-radius:3px;margin-top:3px';copy.append(label,title,subtitle,cta);const picture=node('picture');picture.style.cssText='flex:0 1 35%;max-width:250px;min-width:0;display:block;border-radius:10px;overflow:hidden';const source=node('source');source.media='(max-width:650px)';source.srcset=mobile;const img=node('img');img.src=desktop;img.alt=typeof ad.alt_text==='string'?ad.alt_text:'';img.loading='lazy';img.style.cssText='display:block;width:100%;height:auto;max-height:95px;object-fit:contain;border-radius:10px';picture.append(source,img);link.append(copy,picture);
// Model photos require explicit advertising-use rights; use approved campaign artwork until those rights are recorded.

box.append(link);if(ad.disclosure){const disclosure=node('small',ad.disclosure);disclosure.style.cssText='display:block;margin-top:4px;color:#aaa;font:11px Arial';box.append(disclosure)}img.addEventListener('error',()=>{box.remove();observer?.disconnect()},{once:true});anchor.after(box);
let seen=false,clicked=false;
const track=type=>{
 const body={action:'event',event_type:type,token:ad.token};
 // sendBeacon is designed for navigation-time delivery. Keep fetch as fallback.
 if(type==='click'&&typeof navigator.sendBeacon==='function'){
  try{if(navigator.sendBeacon(endpoint,new Blob([JSON.stringify(body)],{type:'text/plain;charset=UTF-8'})))return}catch{}
 }
 send(body,true).catch(()=>{});
};
const impression=()=>{if(seen)return;seen=true;track('impression')};
const recordClick=()=>{if(clicked)return;clicked=true;impression();track('click')};
link.addEventListener('click',recordClick);
link.addEventListener('auxclick',event=>{if(event.button===1)recordClick()});if('IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.5)){impression();observer.disconnect()}},{threshold:.5});observer.observe(box)}else{impression()}}catch{/* advertising must never interrupt model pages */}}

// The shared header calls this only on known public non-model routes. No layout is changed when no campaign is eligible.
export async function renderPublicPageAdvertising(){try{const path=location.pathname;if(!/^\/markets\/[a-z0-9-]+\.html$/i.test(path)&&!['/bmw-motorcycles.html','/harley-davidson-motorcycles.html'].includes(path))return;if(!document.querySelector('main .hero,main .hero-section,main section:first-of-type'))return;const r=await fetch('https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/visitor-market-country',{cache:'no-store'});if(!r.ok)return;const g=await r.json();if(g.country_code==='GB')await renderAdvertising({pagePath:path,country:'GB'})}catch{/* never impede public content */}}
