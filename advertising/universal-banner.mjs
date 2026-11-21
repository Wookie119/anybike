// One renderer for approved advertising placements. No advert means no DOM or gap.
const endpoint='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/public-advertising-v1';
const send=async(body,keepalive=false)=>{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive,cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Advertising unavailable');return r.json()};
const node=(tag,v)=>{const el=document.createElement(tag);if(v)el.textContent=v;return el};
const https=v=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:null}catch{return null}};
let generation=0,observer=null;
// AnyBike-owned Move Motorcycles house advert: one per UK-facing customer page.
// Uses the approved five-size blue/gold Move artwork without changing model files.
// This UK house placement does not depend on customer login.
const moveHouseMarker='anybike-move-universal-house-ad';
let moveHouseReady=null;
const existingMoveAdvert=()=>[...document.querySelectorAll('a[href*="movemotorcycles.co.uk"]')]
 .some(a=>!a.closest('#'+moveHouseMarker)&&!!a.querySelector('img,picture')&&a.getClientRects().length>0);
const isPublicUkCustomerPage=()=>{
 const path=location.pathname.toLowerCase();
 if(/^\/(?:admin(?:-|\/)|markets\/|international-)/.test(path))return false;
 // Account, transactional and private workflow pages are not public advert inventory.
 if(/^\/(?:customer-|my-|dealer-manage-|dealer-connect-|shipper-|seller-|private-dashboard|dashboard|underwrite|proforma|purchase-order|final-invoice|verify-account|confirm-email|authorised-stock-test|international-stock-preview)/.test(path))return false;
 if(/\/(?:login|logout|register|forgot-password|reset-password|privacy-policy|cookie-policy|terms-and-conditions)\.html$/.test(path))return false;
 return true;
};
function buildMoveHouseCard(ad){
 const stock=ad.placement_key==='stock_grid';
 const destination=https(ad.destination_url);
 const desktop=https(stock?ad.stock_card_image_url:(ad.slim_image_url||ad.desktop_image_url));
 const mobile=https(stock?ad.stock_card_image_url:(ad.compact_image_url||ad.mobile_image_url));
 if(!destination||!desktop||!mobile)return null;
 const card=node(stock?'article':'aside');
 card.id=moveHouseMarker;
 card.setAttribute('aria-label','Advertisement: '+String(ad.partner_name||'Move Motorcycles'));
 card.className=stock?'card anybike-move-stock-ad':'anybike-move-house-banner';
 card.style.cssText=stock
  ?'background:transparent!important;border:0!important;box-shadow:none!important;border-radius:0;overflow:visible;display:flex;flex-direction:column;min-width:0;height:100%;box-sizing:border-box;align-self:stretch;position:relative'
  :'margin:12px 0 18px;width:100%;max-width:none;border-radius:12px;overflow:visible;min-width:0;box-sizing:border-box';
 const link=node('a');link.href=destination;link.target='_blank';link.rel='noopener sponsored';
 link.setAttribute('aria-label',String(ad.partner_name||'Advertiser')+' — view website');
 link.style.cssText='display:block;width:100%;overflow:hidden;border-radius:12px;background:#101010;text-decoration:none'+(stock?';position:absolute;inset:0;width:100%;height:100%;border:1px solid #555;box-sizing:border-box;display:block;background:#111':'');
 const picture=node('picture');picture.style.cssText='display:block;width:100%;overflow:hidden;border-radius:12px'+(stock?';position:absolute;inset:0;width:100%;height:100%;display:block;background:#111':'');
 const source=node('source');source.media='(max-width:650px)';source.srcset=mobile;
 const img=node('img');img.src=desktop;img.alt=typeof ad.alt_text==='string'?ad.alt_text:'';
 img.loading='lazy';img.decoding='async';img.style.cssText=stock
  ?'display:block;position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto;object-fit:cover;object-position:center;border-radius:12px'
  :'display:block;width:100%;height:auto;object-fit:contain;border-radius:12px';
 picture.append(source,img);link.append(picture);card.append(link);
 const disclosure=node('small',ad.disclosure||'Advertisement · '+String(ad.partner_name||'Advertiser'));
 disclosure.style.cssText='display:block;font:11px Arial;color:#aaa;padding:6px 2px 0;background:transparent;border:0'+(stock?';position:absolute;top:100%;left:0;right:0;line-height:12px;padding-top:3px;white-space:nowrap':'');
 card.append(disclosure);
 let seen=false,clicked=false;
 const track=type=>{
  const body={action:'event',event_type:type,token:ad.token};
  if(type==='click'&&typeof navigator.sendBeacon==='function'){
   try{if(navigator.sendBeacon(endpoint,new Blob([JSON.stringify(body)],{type:'text/plain;charset=UTF-8'})))return}catch{}
  }
  send(body,true).catch(()=>{});
 };
 const impression=()=>{if(seen)return;seen=true;track('impression')};
 const click=()=>{if(clicked)return;clicked=true;impression();track('click')};
 link.addEventListener('click',click);
 link.addEventListener('auxclick',event=>{if(event.button===1)click()});
 if('IntersectionObserver'in window){
  const visible=new IntersectionObserver(entries=>{
   if(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.5)){impression();visible.disconnect();}
  },{threshold:.5});
  visible.observe(card);
 }else impression();
 img.addEventListener('error',()=>card.remove(),{once:true});
 return card;
}
function isUniversalModelPage(main){
 return !!(main&&main.querySelector('#databaseHeroPhoto')&&main.querySelector('#nextAction'));
}
function positionModelMoveAdvert(main,card){
 // One optional placement near the end of the approved V2 model master:
 // after research/enquiry and before source references, never inside the hero.
 const sources=main.querySelector(':scope > #modelSources');
 if(sources)main.insertBefore(card,sources);else main.append(card);
 card.style.maxWidth='none';
 card.style.width='100%';
 card.style.margin='16px 0 20px';
}
function isManufacturerPage(main){
 const path=location.pathname.toLowerCase();
 return !!main&&(path==='/motorcycle-brand.html'||path==='/bmw-motorcycles.html'||path==='/harley-davidson-motorcycles.html'||!!main.querySelector(':scope > .manufacturer-hero'));
}
function positionManufacturerMoveAdvert(main,card){
 // Manufacturer adverts follow the complete model directory and supporting
 // sections. Never interrupt the manufacturer introduction or brand cards.
 main.append(card);
 card.style.width='100%';
 card.style.maxWidth='none';
 card.style.margin='18px 0 20px';
}
function isEditorialInfoPage(){
 return ['/anybike-connect.html','/about-us.html'].includes(location.pathname.toLowerCase());
}
function positionEditorialMoveAdvert(main,card){
 // Editorial ads belong after the content. About Us has full-bleed sections,
 // so its advert must use the existing responsive .wrap, not the viewport.
 if(location.pathname.toLowerCase()==='/about-us.html'){
  let wrap=document.getElementById('anybike-move-about-wrap');
  if(!wrap){
   wrap=node('div');
   wrap.id='anybike-move-about-wrap';
   wrap.className='wrap';
   wrap.style.cssText='box-sizing:border-box;min-width:0;margin:20px auto 24px';
   main.append(wrap);
  }
  wrap.append(card);
  card.style.cssText='width:100%;max-width:none;margin:0;min-width:0;box-sizing:border-box;overflow:visible;border-radius:12px';
  return;
 }
 main.append(card);
 card.style.width='100%';
 card.style.maxWidth='none';
 card.style.margin='20px 0 24px';
}
function isExportServicesPage(){
 return location.pathname.toLowerCase()==='/export-services.html';
}
function positionExportMoveAdvert(main,card){
 // Export service customers should see the full editorial and enquiry route
 // first. Contain the banner in the same centered width as the page sections.
 let container=document.getElementById('anybike-move-export-wrap');
 if(!container){
  container=node('div');
  container.id='anybike-move-export-wrap';
  container.style.cssText='max-width:1200px;margin:22px auto 28px;padding:0 24px;box-sizing:content-box;min-width:0';
  main.append(container);
 }
 container.append(card);
 card.style.cssText='margin:0;width:100%;max-width:none;min-width:0;box-sizing:border-box;border-radius:12px;overflow:visible';
}
function isFreightForwardersPage(){
 return location.pathname.toLowerCase()==='/freight-forwarders.html';
}
function positionFreightMoveAdvert(main,card){
 // Keep the directory and shipping explanations uninterrupted. Its advert
 // belongs after the final SEO information, in the same responsive content
 // width rather than the viewport-wide freight hero.
 let container=document.getElementById('anybike-move-freight-wrap');
 if(!container){
  container=node('div');
  container.id='anybike-move-freight-wrap';
  container.style.cssText='width:calc(100% - 48px);max-width:1200px;margin:24px auto 28px;box-sizing:border-box;min-width:0';
  main.append(container);
 }
 container.append(card);
 card.style.cssText='margin:0;width:100%;max-width:none;min-width:0;box-sizing:border-box;border-radius:12px;overflow:visible';
}
function isSellMotorcyclePage(){
 return location.pathname.toLowerCase()==='/sell-your-motorcycle.html';
}
function positionSellMotorcycleMoveAdvert(main,card){
 // Preserve the valuation form and existing sections. Place the single
 // sponsored banner after the complete page, inside its 1500px .wrap width.
 let container=document.getElementById('anybike-move-sell-wrap');
 if(!container){
  container=node('div');
  container.id='anybike-move-sell-wrap';
  container.style.cssText='width:100%;max-width:1500px;margin:22px auto 28px;padding:0 22px;box-sizing:border-box;min-width:0';
  main.append(container);
 }
 container.append(card);
 card.style.cssText='margin:0;width:100%;max-width:none;min-width:0;box-sizing:border-box;border-radius:12px;overflow:visible';
}
function installMoveHouse(ad){
 if(!isPublicUkCustomerPage()||existingMoveAdvert())return false;
 if(document.getElementById(moveHouseMarker))return true;
 const stock=ad.placement_key==='stock_grid';
 if(stock){
  const grid=document.getElementById('stockGrid');
  if(!grid)return false;
  const children=[...grid.querySelectorAll(':scope > article.card:not(.anybike-move-stock-ad)')];
  if(!children.length)return false;
  const card=buildMoveHouseCard(ad);if(!card)return false;
  children[Math.min(children.length,6)-1].after(card);
  return true;
 }
 const main=document.querySelector('main');if(!main)return false;
 const card=buildMoveHouseCard(ad);if(!card)return false;
 switch(ad.placement_key){
  case 'before_sources':positionModelMoveAdvert(main,card);break;
  case 'about_wrap':positionEditorialMoveAdvert(main,card);break;
  case 'export_wrap':positionExportMoveAdvert(main,card);break;
  case 'freight_wrap':positionFreightMoveAdvert(main,card);break;
  case 'sell_wrap':positionSellMotorcycleMoveAdvert(main,card);break;
  case 'main_end':positionManufacturerMoveAdvert(main,card);break;
  default:return false; // Never guess a position for an unconfigured page.
 }
 return true;
}
// Legacy house adverts are subject to the SAME active-campaign and page-inventory
// controls as paid advertising. A stored draft creative is NEVER live inventory.
// This transitional bridge prevents unapproved static artwork from bypassing Admin.
const APPROVED_MOVE_CAMPAIGN_ID='95c5d74b-1048-44fc-b22a-37683c4380e8';
export async function renderMoveHouseOnUkPage(options={}){
 if(!isPublicUkCustomerPage()||existingMoveAdvert())return;
 if(moveHouseReady===null){
  moveHouseReady=(async()=>{
   try{
    const res=await fetch('https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/visitor-market-country',{cache:'no-store',signal:AbortSignal.timeout(4500)});
    if(!res.ok)return false;
    const data=await res.json();
    return data?.country_code==='GB';
   }catch{return false;}
  })();
 }
 if(!await moveHouseReady)return;
 // The advertising service, not this browser bundle, decides whether
 // a campaign and its placement are actually eligible.
 let request;
 const route=document.getElementById('anybikeV2RouteIdentity');
 try{
  const identity=route?JSON.parse(route.textContent||'null'):null;
  const id=Number(identity?.model_id);
  request=Number.isSafeInteger(id)&&id>0?
   {action:'select',model_id:id,country:'GB'}:
   {action:'select_page',page_path:location.pathname==='/'?'/index.html':location.pathname,country:'GB'};
 }catch{return;}
 try{
  const result=await send(request);
  if(result?.ad?.id!==APPROVED_MOVE_CAMPAIGN_ID)return;
  if(installMoveHouse(result.ad))return;
  if(location.pathname.toLowerCase()==='/available-stock.html'){
   const grid=document.getElementById('stockGrid');if(!grid)return;
   const watch=new MutationObserver(()=>{
    if(document.getElementById(moveHouseMarker)){watch.disconnect();return;}
    if(installMoveHouse(result.ad))watch.disconnect();
   });
   watch.observe(grid,{childList:true});
  }
 }catch(error){console.warn('Move advertising campaign could not be verified',error);}
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
