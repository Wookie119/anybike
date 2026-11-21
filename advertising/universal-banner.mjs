// One renderer for approved advertising placements. No advert means no DOM or gap.
const endpoint='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/public-advertising-v1';
const send=async(body,keepalive=false)=>{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive,cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Advertising unavailable');return r.json()};
const node=(tag,v)=>{const el=document.createElement(tag);if(v)el.textContent=v;return el};
const https=v=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:null}catch{return null}};
let generation=0,observer=null;
export async function renderAdvertising(context){const n=++generation;observer?.disconnect();document.getElementById('anybike-ad-below-hero')?.remove();if(!context||context.country!=='GB')return;const isModel=Number.isSafeInteger(context.modelId);if(!isModel&&!context.pagePath)return;try{const {ad}=await send(isModel?{action:'select',model_id:context.modelId,country:context.country}:{action:'select_page',page_path:context.pagePath,country:context.country});if(n!==generation||!ad)return;const anchor=document.querySelector('main .hero')||(!isModel?document.querySelector('main .hero-section,main section:first-of-type'):null);const href=https(ad.destination_url);const desktop=https(ad.desktop_image_url),mobile=https(ad.mobile_image_url);if(!anchor||!href||!desktop||!mobile)return;
const box=node('aside');box.id='anybike-ad-below-hero';box.className='anybike-advertising-banner';box.setAttribute('aria-label','Advertisement: '+ad.partner_name);box.style.cssText='margin:12px 0;display:block';
const link=node('a');link.href=href;link.target='_blank';link.rel='noopener sponsored';link.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:14px;background:#040c34;color:#fff;border:1px solid #686868;border-radius:7px;padding:10px 14px;text-decoration:none;overflow:hidden;min-width:0';
const copy=node('div');copy.style.cssText='flex:1;min-width:0';const label=node('span','Advertisement · '+ad.partner_name);label.style.cssText='display:block;font:600 11px Arial;color:#d8cba7;margin-bottom:3px';const title=node('strong',ad.headline);title.style.cssText='display:block;font:700 clamp(14px,2vw,19px) Arial;line-height:1.2';const subtitle=node('div',ad.subheading);subtitle.style.cssText='font:13px Arial;line-height:1.35;margin:4px 0;color:#f1f1f1';const cta=node('span',ad.cta_text||'Find out more');cta.style.cssText='display:inline-block;background:#a08c59;color:#040c34;font:700 12px Arial;padding:6px 9px;border-radius:3px;margin-top:3px';copy.append(label,title,subtitle,cta);const picture=node('picture');picture.style.cssText='flex:0 1 35%;max-width:250px;min-width:0';const source=node('source');source.media='(max-width:650px)';source.srcset=mobile;const img=node('img');img.src=desktop;img.alt=typeof ad.alt_text==='string'?ad.alt_text:'';img.loading='lazy';img.style.cssText='display:block;width:100%;height:auto;max-height:95px;object-fit:contain';picture.append(source,img);link.append(copy,picture);
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
