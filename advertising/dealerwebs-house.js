// UK-only, centrally controlled DealerWebs house advert on Dealer Stock Connection.
// Does not publish any other software supplier or alter existing adverts.
(()=>{
 'use strict';
 if(location.pathname!=='/dealer-connect-stock.html')return;
 const start=async()=>{
  const form=document.getElementById('connectionForm');
  if(!form||document.getElementById('anybikeDealerFeedPartnerAd'))return;
  try{
   const url='https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/advertising_square_house_placements?select=slot_code,campaign_id,company_name,artwork_url,destination_url,image_alt,position_key&slot_code=eq.AB-DEALER-FEED-S01';
   const response=await fetch(url,{headers:{apikey:'sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK'},cache:'no-store'});
   if(!response.ok)return;
   const rows=await response.json();
   if(!Array.isArray(rows)||rows.length!==1)return;
   const ad=rows[0];
   const valid=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:null}catch{return null}};
   const imageUrl=valid(ad.artwork_url),target=valid(ad.destination_url);
   if(!imageUrl||!target||ad.slot_code!=='AB-DEALER-FEED-S01'||ad.company_name!=='DealerWebs')return;
   const section=document.createElement('section');
   section.id='anybikeDealerFeedPartnerAd';
   section.dataset.adSlotCode=ad.slot_code;
   section.dataset.adCampaignId=ad.campaign_id;
   section.setAttribute('aria-label','Advertisement · DealerWebs');
   section.style.cssText='margin:22px auto;max-width:340px;width:100%;box-sizing:border-box;text-align:center';
   const link=document.createElement('a');link.href=target;link.target='_blank';link.rel='noopener noreferrer sponsored';
   link.style.cssText='display:block;width:100%;border:1px solid #444;border-radius:12px;overflow:hidden;background:#101010;text-decoration:none';
   const image=document.createElement('img');image.src=imageUrl;
   image.alt=ad.image_alt||'DealerWebs motorcycle dealer software';
   image.loading='lazy';image.decoding='async';
   image.style.cssText='width:100%;height:auto;aspect-ratio:1/1;object-fit:contain;display:block;border:0';
   image.addEventListener('error',()=>section.remove(),{once:true});
   link.append(image);
   const disclosure=document.createElement('small');
   disclosure.textContent='Advertisement';disclosure.style.cssText='display:block;color:#aaa;font:11px/1.5 Arial,sans-serif;padding-top:5px';
   section.append(link,disclosure);
   // These are verified real anchors in the existing dealer-connect page.
   // Use one position only; never clone the advert into several sections.
   const positions={
    before_feed_request:()=>form.insertAdjacentElement('beforebegin',section),
    after_feed_request:()=>form.insertAdjacentElement('afterend',section),
    after_stock_upload:()=>{
     const upload=document.querySelector('.upload-panel');
     if(!upload)throw Error('Stock upload position is unavailable');
     upload.insertAdjacentElement('afterend',section);
    }
   };
   const placement=positions[ad.position_key]||positions.after_feed_request;
   placement();
  }catch(_){ /* No blank advert or layout gap on network failure. */ }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
