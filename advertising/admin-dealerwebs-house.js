// One operator view for actual house-ad switches, not proposed inventory.
// DealerWebs is the only published software supplier. The six others remain drafts.
(()=>{
 'use strict';
 const root=document.getElementById('namedAdvertisingSpaces');if(!root)return;
 const section=document.createElement('section');section.id='anybikeLiveAdvertisingControls';
 const heading=document.createElement('h2');heading.textContent='Live advertising controls · house adverts';
 const intro=document.createElement('p');intro.style.cssText='font-size:13px;color:#bbb';
 intro.textContent='Current database switches for existing red AnyBike house adverts and the one permitted DealerWebs software placement. Planned template spaces are not included in these totals.';
 const bar=document.createElement('div');bar.className='bar';
 const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Refresh live controls';
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.style.cssText='font-size:13px;color:#ddd';
 const metrics=document.createElement('div');metrics.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin:12px 0';
 const metric=(title,value)=>{
  const tile=document.createElement('div');tile.style.cssText='padding:11px;background:#121212;border:1px solid #484848;border-radius:7px';
  const label=document.createElement('div');label.style.cssText='font-size:12px;color:#bbb';label.textContent=title;
  const number=document.createElement('strong');number.style.cssText='display:block;font-size:23px;margin-top:5px';number.textContent=value;
  tile.append(label,number);metrics.append(tile);return number;
 };
 const redCount=metric('Red house-ad switches enabled','—');
 const softwareCount=metric('Software placements enabled','—');
 const plannedCount=metric('Positions still planned','—');
 const liveBox=document.createElement('div');liveBox.style.cssText='border:1px solid #555;border-radius:8px;padding:12px;margin-top:12px';
 const liveHeader=document.createElement('h3');liveHeader.textContent='DealerWebs · UK dealer stock connection';
 const preview=document.createElement('img');preview.alt='DealerWebs advert creative preview';preview.loading='lazy';
 preview.style.cssText='display:none;width:180px;max-width:100%;height:auto;aspect-ratio:1/1;object-fit:contain;background:#101010;border:1px solid #555;border-radius:8px';
 const actions=document.createElement('div');actions.className='bar';
 const toggleLabel=document.createElement('label');toggleLabel.style.cssText='display:flex;align-items:center;gap:8px';
 const toggle=document.createElement('input');toggle.type='checkbox';toggle.disabled=true;
 toggleLabel.append(toggle,document.createTextNode('Show DealerWebs advert'));
 const link=document.createElement('a');link.href='/dealer-connect-stock.html';link.target='_blank';link.rel='noopener';link.textContent='View actual placement';
 actions.append(toggleLabel,link);
 const note=document.createElement('p');note.style.cssText='font-size:12px;color:#bbb;margin:7px 0 0';
 note.textContent='Changes take effect when the page is loaded again. The database switch does not prove a browser has displayed the advert.';
 liveBox.append(liveHeader,actions,preview,note);
 bar.append(refresh);
 section.append(heading,intro,bar,metrics,liveBox,status);
 root.insertAdjacentElement('afterend',section);
 let db,record;
 const load=async()=>{
  refresh.disabled=true;toggle.disabled=true;status.textContent='Reading the live advertising switches…';
  try{
   db=getAdminSupabaseClient();
   const auth=await db.rpc('anybike_is_admin');
   if(auth.error||auth.data!==true)throw Error('Admin permission required');
   const results=await Promise.all([
    db.from('advertising_house_visibility').select('page_path,enabled').order('page_path'),
    db.from('advertising_square_house_placements').select('slot_code,campaign_id,company_name,artwork_url,enabled').eq('slot_code','AB-DEALER-FEED-S01').single(),
    db.from('advertising_named_spaces').select('slot_code,status')
   ]);
   const error=results.find(r=>r.error)?.error;if(error)throw error;
   const [red,software,spaces]=results.map(x=>x.data);
   if(software.company_name!=='DealerWebs')throw Error('Software company does not match DealerWebs-only policy');
   record=software;
   redCount.textContent=String(red.filter(x=>x.enabled===true).length)+' / '+red.length;
   softwareCount.textContent=software.enabled?'1':'0';
   plannedCount.textContent=String(spaces.filter(x=>x.status==='planned').length);
   toggle.checked=!!software.enabled;toggle.disabled=false;
   const imageUrl=software.artwork_url;
   if(typeof imageUrl==='string'&&/^https:\/\//.test(imageUrl)){preview.src=imageUrl;preview.style.display='block'}
   else{preview.removeAttribute('src');preview.style.display='none'}
   status.textContent='Switches loaded. Software supplier: DealerWebs only. No other software campaign has been published here.';
  }catch(e){status.textContent='Unable to read live controls: '+(e?.message||e)}
  finally{refresh.disabled=false}
 };
 toggle.onchange=async()=>{
  if(!record)return;
  const requested=toggle.checked;toggle.disabled=true;
  try{
   const {data,error}=await db.from('advertising_square_house_placements')
    .update({enabled:requested,updated_at:new Date().toISOString()})
    .eq('slot_code','AB-DEALER-FEED-S01').eq('campaign_id',record.campaign_id)
    .eq('company_name','DealerWebs').select('enabled').single();
   if(error||!data)throw(error||Error('No matching placement'));
   toggle.checked=!!data.enabled;record.enabled=!!data.enabled;
   softwareCount.textContent=data.enabled?'1':'0';
   status.textContent='DealerWebs '+(data.enabled?'enabled':'disabled')+' in the database. Reload the public page to confirm display.';
  }catch(e){toggle.checked=!requested;status.textContent='Change not saved: '+(e?.message||e)}
  finally{toggle.disabled=false}
 };
 refresh.addEventListener('click',load);
 load();
})();
