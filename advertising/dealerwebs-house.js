// Mega advertising system: render centrally assigned, enabled dealer feed slots.
// All creative, URLs, position and visibility come from Supabase. No embedded advertisers.
(()=>{
'use strict';
if(location.pathname!=='/dealer-connect-stock.html')return;
const secure=v=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:null}catch{return null}};
function css(){
 if(document.getElementById('abMegaDealerStyles'))return;
 const style=document.createElement('style');style.id='abMegaDealerStyles';
 style.textContent='.ab-mega-dealer-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;max-width:1020px;width:100%;margin:20px auto 26px}.ab-mega-dealer-card{text-align:center;min-width:0}.ab-mega-dealer-card a{display:block;aspect-ratio:1/1;width:100%;overflow:hidden;border:0!important;outline:0!important;box-shadow:none!important;border-radius:14px!important;background:#101010;isolation:isolate;clip-path:inset(0 round 14px)}.ab-mega-dealer-card img{width:100%;height:100%;object-fit:fill;display:block;border:0!important;outline:0!important;box-shadow:none!important;border-radius:0!important}.ab-mega-dealer-card small{display:block;color:#aaa;font:11px/1.5 Arial,sans-serif;padding-top:5px}@media(max-width:750px){.ab-mega-dealer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.ab-mega-dealer-grid{grid-template-columns:1fr;max-width:340px}}';
 document.head.append(style);
}
async function start(){
 const form=document.getElementById('connectionForm');
 if(!form||document.getElementById('abMegaDealerContainer'))return;
 try{
  const url='https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/advertising_square_house_placements?select=slot_code,campaign_id,company_name,artwork_url,destination_url,image_alt,position_key&slot_code=like.AB-DEALER-FEED-%25&order=slot_code.asc';
  const response=await fetch(url,{headers:{apikey:'sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK'},cache:'no-store'});
  if(!response.ok)return;
  const rows=await response.json();
  if(!Array.isArray(rows))return;
  const entries=rows.filter(x=>/^AB-DEALER-FEED-S[0-9]+$/.test(x.slot_code||'')&&x.campaign_id&&secure(x.artwork_url)&&secure(x.destination_url));
  if(!entries.length)return;
  css();
  const wrapper=document.createElement('div');wrapper.id='abMegaDealerContainer';
  const groups=new Map();
  for(const ad of entries){
   const position=['before_feed_request','after_feed_request','after_stock_upload'].includes(ad.position_key)?ad.position_key:'after_feed_request';
   if(!groups.has(position))groups.set(position,[]);
   groups.get(position).push(ad);
  }
  for(const [position,ads] of groups){
   const grid=document.createElement('section');grid.className='ab-mega-dealer-grid';grid.setAttribute('aria-label','Advertisements');
   for(const ad of ads){
    const card=document.createElement('article');card.className='ab-mega-dealer-card';
    card.dataset.adSlotCode=ad.slot_code;card.dataset.adCampaignId=ad.campaign_id;
    const anchor=document.createElement('a');anchor.href=secure(ad.destination_url);
    anchor.target='_blank';anchor.rel='noopener noreferrer sponsored';
    anchor.setAttribute('aria-label','Visit '+ad.company_name);
    const image=document.createElement('img');image.src=secure(ad.artwork_url);image.alt=ad.image_alt||ad.company_name;
    image.loading='lazy';image.decoding='async';
    // DealerWebs creative includes large baked-in black margins; scale just its image within the existing square.
    if(ad.slot_code==='AB-DEALER-FEED-S01'){image.style.objectFit='contain';image.style.transform='scale(2.05)';}
    // Preserve the entire supplied artwork for every campaign; never crop or zoom a creative.
    image.addEventListener('error',()=>{card.remove();if(!grid.children.length)grid.remove()},{once:true});
    anchor.append(image);
    const disclosure=document.createElement('small');disclosure.textContent='Advertisement';
    card.append(anchor,disclosure);grid.append(card);
   }
   if(position==='before_feed_request')form.insertAdjacentElement('beforebegin',grid);
   else if(position==='after_stock_upload'){
    const upload=document.querySelector('.upload-panel');
    if(upload)upload.insertAdjacentElement('afterend',grid);else form.insertAdjacentElement('afterend',grid);
   }else form.insertAdjacentElement('afterend',grid);
  }
  wrapper.hidden=true;document.body.append(wrapper);
 }catch(_){/* fail closed: no empty ad frames */}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();