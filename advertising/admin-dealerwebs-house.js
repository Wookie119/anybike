// One company only: DealerWebs complimentary software advert on UK dealer stock connection page.
(()=>{
 'use strict';
 const root=document.getElementById('namedAdvertisingSpaces');if(!root)return;
 const section=document.createElement('section');
 const title=document.createElement('h2');title.textContent='DealerWebs · UK stock-feed advertising';
 const description=document.createElement('p');description.style.cssText='font-size:13px;color:#bbb';
 description.textContent='The only software supplier currently authorised for a public complimentary advert. Control its square placement on Connect Dealership Stock without editing the page. Other software suppliers remain unpublished drafts.';
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const box=document.createElement('div');box.className='bar';
 const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:8px';
 const input=document.createElement('input');input.type='checkbox';input.disabled=true;
 label.append(input,document.createTextNode('Display DealerWebs square advert'));
 const view=document.createElement('a');view.href='/dealer-connect-stock.html';view.target='_blank';view.rel='noopener';view.textContent='View page';
 box.append(label,view);section.append(title,description,box,status);root.insertAdjacentElement('afterend',section);
 (async()=>{
  try{
   const db=getAdminSupabaseClient();
   const auth=await db.rpc('anybike_is_admin');if(auth.error||auth.data!==true)throw Error('Admin permission required');
   const {data,error}=await db.from('advertising_square_house_placements').select('slot_code,campaign_id,company_name,enabled').eq('slot_code','AB-DEALER-FEED-S01').single();
   if(error)throw error;
   if(data.company_name!=='DealerWebs')throw Error('Unexpected advertising company');
   input.checked=data.enabled;input.disabled=false;status.textContent='DealerWebs advert is '+(data.enabled?'enabled':'disabled')+'. All other software suppliers remain unpublished.';
   input.onchange=async()=>{
    const wanted=input.checked;input.disabled=true;
    const result=await db.from('advertising_square_house_placements').update({enabled:wanted,updated_at:new Date().toISOString()}).eq('slot_code','AB-DEALER-FEED-S01').eq('campaign_id',data.campaign_id).select('slot_code').maybeSingle();
    if(result.error||!result.data){
     input.checked=!wanted;status.textContent='Change not saved: '+(result.error?.message||'No matching permission or record');
    }else status.textContent='DealerWebs '+(wanted?'enabled':'disabled')+'. Refresh the dealership stock connection page to verify.';
    input.disabled=false;
   };
  }catch(error){status.textContent='Unable to load DealerWebs control: '+(error?.message||error)}
 })();
})();
