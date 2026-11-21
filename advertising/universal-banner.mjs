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
const legacyMoveAnchors=()=>[...document.querySelectorAll('a[href*="movemotorcycles.co.uk"]')].filter(a=>!!a.querySelector('img,picture')&&!a.closest('#'+moveHouseMarker));
const existingMoveAdvert=()=>legacyMoveAnchors().some(a=>a.getClientRects().length>0);
const isPublicUkCustomerPage=()=>{
 const path=location.pathname.toLowerCase();
 // UK dealer/private customer workspaces are approved advertising surfaces;
 // account status never controls whether an eligible UK advert can be shown.
 if(['/customer-dashboard.html','/my-selling.html','/my-dealership.html','/my-purchases.html'].includes(path))return true;
 if(/^\/(?:admin(?:-|\/)|markets\/|international-)/.test(path))return false;
 // Account, transactional and private workflow pages are not public advert inventory.
 if(/^\/(?:customer-|my-|dealer-manage-|dealer-connect-|shipper-|seller-|private-dashboard|dashboard|underwrite|proforma|purchase-order|final-invoice|verify-account|confirm-email|authorised-stock-test|international-stock-preview)/.test(path))return false;
 if(/\/(?:login|logout|register|forgot-password|reset-password|privacy-policy|cookie-policy|terms-and-conditions)\.html$/.test(path))return false;
 return true;
};
// One disclosure standard for every centrally managed advert and legacy slot.
// Advertiser identity comes from the approved campaign, never hardcoded per page.
function advertDisclosure(ad){
 const name=String(ad?.partner_name||'Advertiser').trim()||'Advertiser';
 return 'Advertisement · '+name;
}
function styleAdvertDisclosure(note){
 note.style.cssText='display:block;clear:both;font:11px/1.35 Arial,sans-serif;color:#aaa;padding:4px 2px 0;margin:0;background:transparent;border:0;white-space:normal;position:static';
}
function buildMoveHouseCard(ad,companion=false){
 const stock=ad.placement_key==='stock_grid';
 const destination=https(ad.destination_url);
 const desktop=https(stock?ad.stock_card_image_url:(ad.creative_format==='large_landscape'?ad.desktop_image_url:(ad.slim_image_url||ad.desktop_image_url)));
 const mobile=https(stock?ad.stock_card_image_url:(ad.compact_image_url||ad.mobile_image_url));
 if(!destination||!desktop||!mobile)return null;
 const card=node(stock?'article':'aside');
 // The shared legacy-ad CSS checks the advert container as well as the link.
 // This marker is assigned only after the campaign has passed the planner gate.
 card.dataset.anybikeAdAuthorized='1';
 if(companion)card.dataset.anybikeCompanion='true';else card.id=moveHouseMarker;
 card.dataset.adPlacementKey=ad.placement_key;
 card.dataset.adCampaignId=ad.id;
 card.dataset.adSlotCode=templateAdSlotCode(ad)+(companion?'-B':'-A');
 card.setAttribute('aria-label','Advertisement: '+String(ad.partner_name||'Move Motorcycles'));
 card.className=stock?'card anybike-move-stock-ad':'anybike-move-house-banner';
 card.style.cssText=stock
  ?'background:transparent!important;border:0!important;box-shadow:none!important;border-radius:0;overflow:visible;display:flex;flex-direction:column;min-width:0;height:100%;box-sizing:border-box;align-self:stretch;position:relative'
  :'margin:12px 0 18px;width:100%;max-width:none;border-radius:12px;overflow:visible;min-width:0;box-sizing:border-box';
 const link=node('a');link.href=destination;link.target='_blank';link.rel='noopener sponsored';
 // This link exists only after the advertising service has selected an approved
 // campaign; let the shared legacy-ad visibility guard display it.
 link.dataset.anybikeAdAuthorized='1';
 link.setAttribute('aria-label',String(ad.partner_name||'Advertiser')+' — view website');
 link.style.cssText='display:block;width:100%;overflow:hidden;border-radius:12px;background:#101010;text-decoration:none'+(stock?';position:relative;aspect-ratio:auto;height:auto;flex:1 1 auto;min-height:0;border:1px solid #555;box-sizing:border-box;background:#101010':'');
 const picture=node('picture');picture.style.cssText='display:block;width:100%;overflow:hidden;border-radius:12px'+(stock?';position:absolute;inset:0;width:100%;height:100%;background:transparent!important;pointer-events:none':'');
 const source=node('source');source.media='(max-width:650px)';source.srcset=mobile;
 const img=node('img');img.src=desktop;img.alt=typeof ad.alt_text==='string'?ad.alt_text:'';
 img.loading='lazy';img.decoding='async';img.style.cssText=stock
  ?'display:block;position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto;object-fit:fill;object-position:center;border-radius:12px'
  :'display:block;width:100%;height:auto;max-width:100%;aspect-ratio:auto;object-fit:contain;border-radius:12px';
 if(stock){
  // The entire approved stock creative must fill the measured image slot.
  // Some page styles force the <img> to retain its intrinsic 4:3 shape,
  // leaving bands even when object-fit:fill is set. Once it has loaded,
  // paint the SAME artwork directly onto the exact-size link surface.
  // background-size:100% 100% preserves every word and logo (no crop).
  const fillFromLoadedImage=()=>{
   const src=https(img.currentSrc||img.src);
   if(!src)return;
   picture.style.setProperty('background','transparent','important');
   link.style.setProperty('background-image','url('+JSON.stringify(src)+')','important');
   link.style.setProperty('background-size','100% 100%','important');
   link.style.setProperty('background-position','center','important');
   link.style.setProperty('background-repeat','no-repeat','important');
   img.style.setProperty('opacity','0','important');
  };
  img.addEventListener('load',fillFromLoadedImage);
  if(img.complete&&img.naturalWidth>0)fillFromLoadedImage();
 }
 picture.append(source,img);link.append(picture);card.append(link);
 const disclosure=node('small',advertDisclosure(ad));
 disclosure.dataset.anybikeAdDisclosure='1';
 styleAdvertDisclosure(disclosure);
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
 // Validate the actual displayed image, including the selected mobile <source>.
 // Incorrect artwork is never stretched or allowed to remain in the slot.
 img.addEventListener('load',()=>{
  const compact=typeof matchMedia==='function'&&matchMedia('(max-width:650px)').matches;
  const format=stock?'stock_card':
   compact&&ad.compact_image_url?'compact_mobile':ad.creative_format||'slim_landscape';
  const ratio=formatRatio[format];
  if(ratio&&img.naturalHeight&&Math.abs(img.naturalWidth/img.naturalHeight/ratio-1)>.035){
   console.warn('Advert artwork failed its slot proportion check',ad.slot_code,format);
   card.remove();
  }
 },{once:true});
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
 card.style.maxWidth='1200px';
 card.style.width='min(100%, 1200px)';
 card.style.margin='16px auto 20px';
}
function isManufacturerPage(main){
 const path=location.pathname.toLowerCase();
 return !!main&&(path==='/motorcycle-brand.html'||path==='/bmw-motorcycles.html'||path==='/harley-davidson-motorcycles.html'||!!main.querySelector(':scope > .manufacturer-hero'));
}
function positionManufacturerMoveAdvert(main,card){
 // Manufacturer adverts follow the complete model directory and supporting
 // sections. Never interrupt the manufacturer introduction or brand cards.
 main.append(card);
 card.style.width='min(100%, 1200px)';
 card.style.maxWidth='1200px';
 card.style.margin='18px auto 20px';
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
  card.style.cssText='width:100%;max-width:1200px;margin:0;min-width:0;box-sizing:border-box;overflow:visible;border-radius:12px';
  return;
 }
 main.append(card);
 card.style.width='min(100%, 1200px)';
 card.style.maxWidth='1200px';
 card.style.margin='20px auto 24px';
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
 card.style.cssText='margin:0;width:100%;max-width:1200px;min-width:0;box-sizing:border-box;border-radius:12px;overflow:visible';
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
 card.style.cssText='margin:0;width:100%;max-width:1200px;min-width:0;box-sizing:border-box;border-radius:12px;overflow:visible';
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
 card.style.cssText='margin:0;width:100%;max-width:1200px;min-width:0;box-sizing:border-box;border-radius:12px;overflow:visible';
}
// The display contract is reusable for every advertiser. Validate the
// actual browser-selected artwork before insertion; never crop a bad creative.
const formatRatio={stock_card:4/3,slim_landscape:3,large_landscape:16/9,compact_mobile:1};
const templateAdSlotCode=ad=>{
 const base=String(ad?.slot_code||'AB-UK-UNASSIGNED');
 // One universal V2 template creates a stable addressable advertising slot
 // for every published model, without maintaining individual model-page files.
 if(/^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/i.test(location.pathname)){
  try{const id=Number(JSON.parse(document.getElementById('anybikeV2RouteIdentity')?.textContent||'null')?.model_id);
   if(Number.isSafeInteger(id)&&id>0)return base+'-M'+id;
  }catch{}
 }
 return base;
};
function ensurePairStyles(){
 if(document.getElementById('anybike-ad-pair-styles'))return;
 const style=node('style');style.id='anybike-ad-pair-styles';
 style.textContent='.anybike-ad-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;width:100%;min-width:0;align-items:start}.anybike-ad-pair>*,.anybike-ad-pair>.anybike-move-house-banner{width:100%;min-width:0;margin:0!important}@media(max-width:700px){.anybike-ad-pair{grid-template-columns:minmax(0,1fr)}}';
 document.head.append(style);
}
function managedAdCreative(ad){
 const stock=ad?.placement_key==='stock_grid';
 return {desktop:https(stock?ad.stock_card_image_url:ad.creative_format==='large_landscape'?ad.desktop_image_url:(ad.slim_image_url||ad.desktop_image_url)),mobile:https(stock?ad.stock_card_image_url:(ad.compact_image_url||ad.mobile_image_url))};
}
function attachLegacyTracking(link,ad){
 if(link.dataset.anybikeAdTracked===ad.token)return;
 link.dataset.anybikeAdTracked=ad.token||'';
 let seen=false,clicked=false;
 const emit=type=>{const payload={action:'event',event_type:type,token:ad.token};send(payload,true).catch(()=>{});};
 const impression=()=>{if(seen)return;seen=true;emit('impression')};
 const click=()=>{if(clicked)return;clicked=true;impression();emit('click')};
 link.addEventListener('click',click);link.addEventListener('auxclick',e=>{if(e.button===1)click()});
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{
  if(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.5)){impression();observer.disconnect()}
 },{threshold:.5});observer.observe(link)}else impression();
}
function adoptLegacyMove(ad){
 const anchors=legacyMoveAnchors();if(!anchors.length)return false;
 const urls=managedAdCreative(ad),destination=https(ad.destination_url);
 if(!urls.desktop||!urls.mobile||!destination)return false;
 anchors.forEach((link,index)=>{
  link.href=destination;link.rel='noopener sponsored';link.target='_blank';
  link.dataset.anybikeAdAuthorized='1';
  const outer=link.closest('section#moveMotorcyclesAdvert,aside.move-dealer-promo,aside[aria-label*="Move Motorcycles"],section[aria-label*="Move Motorcycles"]');
  if(outer){
   outer.dataset.anybikeAdAuthorized='1';
   // Existing house placements also follow the approved contained banner size.
   // No individual homepage/dealer page styling or artwork edits.
   outer.style.setProperty('width','min(1200px, calc(100% - 28px))','important');
   outer.style.setProperty('max-width','1200px','important');
   outer.style.setProperty('margin-left','auto','important');
   outer.style.setProperty('margin-right','auto','important');
   outer.style.setProperty('box-sizing','border-box','important');
  }
  link.dataset.adSlotCode=templateAdSlotCode(ad)+(anchors.length>1?'-'+String(index+1).padStart(2,'0'):'');
  link.dataset.adCampaignId=ad.id;
  link.style.cssText='display:block;width:100%;max-width:1200px;height:auto;min-width:0;margin-left:auto;margin-right:auto;border-radius:12px;overflow:hidden;background:#101010;text-decoration:none';
  const picture=link.querySelector('picture');
  if(picture){picture.style.cssText='display:block;width:100%;height:auto;min-width:0;overflow:hidden;border-radius:12px';
   // Older dashboard CSS forced fixed mobile picture ratios. The approved
   // artwork now owns the aspect ratio on every device, without cropping.
   picture.style.setProperty('aspect-ratio','auto','important');
   picture.style.setProperty('height','auto','important');
   for(const source of picture.querySelectorAll('source'))source.srcset=urls.mobile;
  }
  const image=link.querySelector('img');
  if(image){image.src=urls.desktop;image.alt=typeof ad.alt_text==='string'?ad.alt_text:'';
   image.style.cssText='display:block;width:100%;height:auto;max-width:100%;object-fit:contain;border-radius:12px';
   image.style.setProperty('aspect-ratio','auto','important');
   image.style.setProperty('height','auto','important');
   image.style.setProperty('object-fit','contain','important');}
  let note=link.nextElementSibling;
  if(!note||!note.matches('[data-anybike-ad-disclosure]')){
   const oldNote=[...link.parentElement.children].find(x=>x!==link&&
    !x.querySelector('a,img,picture')&&/^Advertisement\s*[·:-]/i.test((x.textContent||'').trim()));
   if(oldNote){note=oldNote;note.dataset.anybikeAdDisclosure='1';}
  }
  if(!note||!note.matches('[data-anybike-ad-disclosure]')){
   note=node('small');note.dataset.anybikeAdDisclosure='1';link.after(note);
  }
  note.textContent=advertDisclosure(ad);
  styleAdvertDisclosure(note);
  attachLegacyTracking(link,ad);
  if(ad.paired_layout&&ad.companion&&!link.closest('.anybike-ad-pair')){
   const secondary=buildMoveHouseCard({...ad.companion,placement_key:ad.placement_key,
    creative_format:ad.creative_format,slot_code:templateAdSlotCode(ad)},true);
   if(secondary){
    ensurePairStyles();
    const pair=node('div');pair.className='anybike-ad-pair';pair.dataset.adSlotCode=templateAdSlotCode(ad);
    const primary=node('div');primary.style.cssText='width:100%;min-width:0';
    link.before(pair);primary.append(link,note);pair.append(primary,secondary);
   }
  }
 });
 return true;
}
async function validateAdvertArtwork(ad){
 // The Planner owns activation and uploaded-creative aspect-ratio validation.
 // Never withhold an eligible advert while loading a second copy of its image:
 // image loading and final validation happen on the displayed image itself.
 const source=managedAdCreative(ad);
 return !!(source.desktop&&source.mobile&&https(ad.destination_url));
}
async function verifiedCompanion(ad){
 if(!ad.companion)return ad;
 const candidate={...ad.companion,placement_key:ad.placement_key,creative_format:ad.creative_format};
 if(!await validateAdvertArtwork(candidate)){
  console.warn('Companion artwork not ready for approved slot',ad.slot_code);
  return {...ad,companion:null};
 }
 return ad;
}
// Synchronise the advert with a real motorcycle card, including Firefox zoom.
// Keep the approved image intact while its background fills any spare space.
function syncStockCardHeight(grid){
 const ad=grid.querySelector('.anybike-move-stock-ad');
 const bike=grid.querySelector(':scope > article.card:not(.anybike-move-stock-ad)');
 if(!ad||!bike)return;
 const link=ad.querySelector(':scope > a');
 const note=ad.querySelector(':scope > small');
 if(!link||!note)return;
 const height=Math.ceil(bike.getBoundingClientRect().height);
 if(height<100)return;
 // The clickable creative is EXACTLY as tall as the adjacent complete bike
 // card. The disclosure stays outside the creative in the grid row gap.
 ad.style.setProperty('height',height+'px','important');
 ad.style.setProperty('min-height',height+'px','important');
 ad.style.setProperty('align-self','start','important');
 link.style.setProperty('height',height+'px','important');
 link.style.setProperty('min-height',height+'px','important');
 link.style.setProperty('flex','0 0 auto','important');
 note.style.setProperty('position','absolute','important');
 note.style.setProperty('top','100%','important');
 note.style.setProperty('left','0','important');
 note.style.setProperty('right','0','important');
 note.style.setProperty('padding-top','2px','important');
 // Leave enough room for the central advertising disclosure on the next row.
 grid.style.setProperty('row-gap','24px');
}
function scheduleStockCardHeight(grid){
 if(grid.__anybikeStockSizePending)return;
 grid.__anybikeStockSizePending=true;
 requestAnimationFrame(()=>{grid.__anybikeStockSizePending=false;syncStockCardHeight(grid)});
}
function watchStockCardSize(grid){
 const bike=grid.querySelector(':scope > article.card:not(.anybike-move-stock-ad)');
 if(!bike)return;
 if(grid.__anybikeStockMeasuredBike===bike)return;
 grid.__anybikeStockMeasuredBike=bike;
 grid.__anybikeStockSizeObserver?.disconnect();
 if(typeof ResizeObserver==='function'){
  grid.__anybikeStockSizeObserver=new ResizeObserver(()=>scheduleStockCardHeight(grid));
  grid.__anybikeStockSizeObserver.observe(bike);
 }
 if(!grid.__anybikeStockWindowResize){
  grid.__anybikeStockWindowResize=true;
  window.addEventListener('resize',()=>scheduleStockCardHeight(grid),{passive:true});
 }
 scheduleStockCardHeight(grid);
}
function setupStockAdvertRedraw(ad){
 if(ad.placement_key!=='stock_grid')return;
 const grid=document.getElementById('stockGrid');if(!grid||grid.__anybikeStockAdvertObserver)return;
 const watch=new MutationObserver(()=>{
  if(!document.getElementById(moveHouseMarker))installMoveHouse(ad);
  watchStockCardSize(grid);
  scheduleStockCardHeight(grid);
 });
 watch.observe(grid,{childList:true});
 grid.__anybikeStockAdvertObserver=watch;
 watchStockCardSize(grid);
}
// Exact page/template slot contract. A missing or mismatched anchor means NO
// advert; never guess or insert into a random section of a model template.
function placementMatchesTemplate(ad){
 const path=location.pathname.toLowerCase(),key=ad?.placement_key;
 const main=document.querySelector('main');
 if(!main)return false;
 if(key==='stock_grid')return path==='/available-stock.html'&&!!document.getElementById('stockGrid');
 if(key==='existing_house')return legacyMoveAnchors().length>0;
 if(key==='before_sources')return !!main.querySelector('#databaseHeroPhoto')&&
  !!main.querySelector('#nextAction')&&!!main.querySelector('#modelSources');
 if(key==='about_wrap')return path==='/about-us.html';
 if(key==='export_wrap')return path==='/export-services.html';
 if(key==='freight_wrap')return path==='/freight-forwarders.html';
 if(key==='sell_wrap')return path==='/sell-your-motorcycle.html';
 if(key==='main_end')return path!='/available-stock.html'&&!main.querySelector('#databaseHeroPhoto');
 return false;
}
function pairedManagedCard(ad){
 const primary=buildMoveHouseCard(ad);if(!primary)return null;
 if(!ad.paired_layout||!ad.companion||ad.placement_key==='stock_grid')return primary;
 const secondary=buildMoveHouseCard({...ad.companion,placement_key:ad.placement_key,
  creative_format:ad.creative_format,slot_code:templateAdSlotCode(ad)},true);
 if(!secondary)return primary;
 ensurePairStyles();
 const pair=node('div');pair.className='anybike-ad-pair';pair.dataset.adSlotCode=templateAdSlotCode(ad);
 pair.append(primary,secondary);
 return pair;
}
function installMoveHouse(ad){
 if(!isPublicUkCustomerPage()||!ad)return false;
 // Adopt the exact position of existing approved Move artwork in dealer,
 // private, home and editorial pages instead of moving it to another section.
 if(ad.placement_key==='existing_house'&&legacyMoveAnchors().length)return adoptLegacyMove(ad);
 if(!placementMatchesTemplate(ad))return false;
 if(document.getElementById(moveHouseMarker))return true;
 const stock=ad.placement_key==='stock_grid';
 if(stock){
  const grid=document.getElementById('stockGrid');
  if(!grid)return false;
  const children=[...grid.querySelectorAll(':scope > article.card:not(.anybike-move-stock-ad)')];
  if(!children.length)return false;
  const card=buildMoveHouseCard(ad);if(!card)return false;
  children[Math.min(children.length,6)-1].after(card);
  watchStockCardSize(grid);
  scheduleStockCardHeight(grid);
  return true;
 }
 const main=document.querySelector('main');if(!main)return false;
 const card=pairedManagedCard(ad);if(!card)return false;
 // A single central size contract applies to every large page/template slot.
 // Never allow full-bleed sections to stretch a 3:1 advert across the screen.
 card.style.setProperty('width','min(100%, 1200px)');
 card.style.setProperty('max-width','1200px');
 card.style.setProperty('margin-left','auto');
 card.style.setProperty('margin-right','auto');
 card.style.setProperty('min-width','0');
 card.style.setProperty('box-sizing','border-box');
 switch(ad.placement_key){
  case 'before_sources':positionModelMoveAdvert(main,card);break;
  case 'about_wrap':positionEditorialMoveAdvert(main,card);break;
  case 'export_wrap':positionExportMoveAdvert(main,card);break;
  case 'freight_wrap':positionFreightMoveAdvert(main,card);break;
  case 'sell_wrap':positionSellMotorcycleMoveAdvert(main,card);break;
  case 'main_end':positionManufacturerMoveAdvert(main,card);break;
  default:return false; // Never guess a position for an unconfigured page.
 }
 // Final central layout contract runs AFTER page-family positioning, because
 // legacy positioning functions may replace cssText and reset earlier limits.
 // Preserve the approved 3:1/1:1 artwork without cropping or stretching.
 card.style.setProperty('max-width','1200px','important');
 card.style.setProperty('width','100%','important');
 card.style.setProperty('min-width','0','important');
 card.style.setProperty('margin-left','auto','important');
 card.style.setProperty('margin-right','auto','important');
 card.style.setProperty('box-sizing','border-box','important');
 return true;
}
// Legacy house adverts are subject to the SAME active-campaign and page-inventory
// controls as paid advertising. A stored draft creative is NEVER live inventory.
// This transitional bridge prevents unapproved static artwork from bypassing Admin.
export async function renderMoveHouseOnUkPage(options={}){
 if(!isPublicUkCustomerPage())return;
 // The advertising Edge Function verifies the visitor country itself.
 // An extra browser-side geo request can stall or incorrectly suppress ads.
 // The advertising service, not this browser bundle, decides whether
 // a campaign and its placement are actually eligible.
 let request;
 const route=document.getElementById('anybikeV2RouteIdentity');
 try{
  const identity=route?JSON.parse(route.textContent||'null'):null;
  const id=Number(identity?.model_id);
  request=Number.isSafeInteger(id)&&id>0?
   {action:'select',model_id:id,country:'GB'}:
   {action:'select_page',page_path:location.pathname==='/'?'/index.html':/^\/uk\/vmoto\.html$/i.test(location.pathname)?'/vmoto.html':location.pathname,country:'GB'};
 }catch{return;}
 try{
  const result=await send(request);
  if(!result?.ad||!await validateAdvertArtwork(result.ad))return;
  const ad=await verifiedCompanion(result.ad);
  setupStockAdvertRedraw(ad);
  installMoveHouse(ad);
 }catch(error){console.warn('Move advertising campaign could not be verified',error);}
}

// All campaigns use the SAME placement engine. Do not add per-page fallback
// insertion after a hero: that was responsible for inconsistent locations.
export async function renderAdvertising(context){
 if(!context||context.country!=='GB'||document.getElementById(moveHouseMarker))return;
 const n=++generation;
 const isModel=Number.isSafeInteger(context.modelId)&&context.modelId>0;
 if(!isModel&&!context.pagePath)return;
 try{
  const {ad}=await send(isModel?
   {action:'select',model_id:context.modelId,country:context.country}:
   {action:'select_page',page_path:context.pagePath,country:context.country});
  if(n!==generation||!ad)return;
  if(!await validateAdvertArtwork(ad))return;
  const ready=await verifiedCompanion(ad);
  setupStockAdvertRedraw(ready);
  installMoveHouse(ready);
 }catch(error){console.warn('Managed advertising unavailable',error);}
}

// The shared header calls this only on known public non-model routes. No layout is changed when no campaign is eligible.
export async function renderPublicPageAdvertising(){try{const path=location.pathname;if(!/^\/markets\/[a-z0-9-]+\.html$/i.test(path)&&!['/bmw-motorcycles.html','/harley-davidson-motorcycles.html'].includes(path))return;if(!document.querySelector('main .hero,main .hero-section,main section:first-of-type'))return;const r=await fetch('https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/visitor-market-country',{cache:'no-store'});if(!r.ok)return;const g=await r.json();if(g.country_code==='GB')await renderAdvertising({pagePath:path,country:'GB'})}catch{/* never impede public content */}}
