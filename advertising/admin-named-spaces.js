// Named advertising inventory: planning and quoting, NOT automatic publication.
// Uses the existing authenticated admin client and RLS-protected Supabase table.
(()=>{'use strict';
const $=id=>document.getElementById(id);
const root=$('namedAdvertisingSpaces');
if(!root)return;
const safePath=p=>typeof p==='string'&&/^\/[a-z0-9\/-]+\.html$/i.test(p)?p:null;
const cell=(tr,value)=>{const td=document.createElement('td');td.textContent=String(value??'—');tr.append(td);return td};
async function load(){
 const status=$('namedSpacesStatus'),rows=$('namedSpacesRows');
 status.textContent='Loading named advertising spaces…';rows.replaceChildren();
 try{
  const db=getAdminSupabaseClient();
  const check=await db.rpc('anybike_is_admin');
  if(check.error||check.data!==true)throw Error('Admin permission required');
  const {data,error}=await db.from('advertising_named_spaces').select('slot_code,display_name,page_template,page_path,anchor_key,format,grid_span,market_scope,status,maximum_per_page,frequency_every,notes').order('slot_code');
  if(error)throw error;
  for(const s of data||[]){
   const tr=document.createElement('tr');
   cell(tr,s.slot_code);cell(tr,s.display_name);cell(tr,s.page_template);
   cell(tr,s.format);cell(tr,s.market_scope);cell(tr,s.status);
   cell(tr,s.frequency_every?'Every '+s.frequency_every+' items':'One position');
   const td=cell(tr,'');
   const path=safePath(s.page_path);
   if(path){const a=document.createElement('a');a.href=path;a.target='_blank';a.rel='noopener';a.textContent='View page';td.append(a)}
   else td.textContent='Template';
   const detail=document.createElement('tr'),info=document.createElement('td');
   info.colSpan=8;info.style.cssText='font-size:12px;color:#bbb;padding:2px 8px 12px';
   info.textContent='Anchor: '+s.anchor_key+' · '+s.notes;
   detail.append(info);rows.append(tr,detail);
  }
  status.textContent=(data||[]).length+' named positions registered · planning inventory only; not automatically live or offered for sale.';
 }catch(e){status.textContent='Unable to load named spaces: '+(e.message||e)}
}
$('refreshNamedSpaces')?.addEventListener('click',load);
load();

function addLegacyInventoryPanel(){
 if($('anybikeExistingHouseAdverts'))return;
 const section=document.createElement('section');
 section.id='anybikeExistingHouseAdverts';
 const h=document.createElement('h2');h.textContent='Existing adverts · AnyBike-owned placements';
 const desc=document.createElement('p');
 desc.style.cssText='font-size:13px;color:#bbb';
 desc.textContent='Source-verified adverts already embedded on AnyBike. These are mapped to the AnyBike house campaign. Legacy embeds still use their original artwork and links: campaign status changes do not yet switch those embeds on or off.';
 const state=document.createElement('p');state.id='existingHouseAdvertsState';state.setAttribute('role','status');
 const wrap=document.createElement('div');wrap.className='scroll';
 const table=document.createElement('table');
 const head=document.createElement('thead'),headrow=document.createElement('tr');
 for(const name of ['Page','Advert','Owner','Campaign status','Integration','View']){const th=document.createElement('th');th.textContent=name;headrow.append(th)}
 head.append(headrow);
 const body=document.createElement('tbody');body.id='existingHouseAdvertsRows';
 table.append(head,body);wrap.append(table);section.append(h,desc,state,wrap);
 root.insertAdjacentElement('afterend',section);
}
async function loadExistingHouseAdverts(){
 addLegacyInventoryPanel();
 const status=$('existingHouseAdvertsState'),rows=$('existingHouseAdvertsRows');
 rows.replaceChildren();status.textContent='Checking existing advert mappings…';
 try{
  const db=getAdminSupabaseClient();
  const check=await db.rpc('anybike_is_admin');
  if(check.error||check.data!==true)throw Error('Admin permission required');
  const result=await db.from('advertising_existing_placements').select('page_path,placement_name,asset_path,integration_state,campaign_id').order('page_path');
  if(result.error)throw result.error;
  const ids=[...new Set((result.data||[]).map(r=>r.campaign_id))];
  let campaigns=[];
  if(ids.length){const q=await db.from('advertising_campaigns').select('id,name,partner_id,status').in('id',ids);if(q.error)throw q.error;campaigns=q.data||[]}
  const ownerIds=[...new Set(campaigns.map(c=>c.partner_id).filter(Boolean))];
  let owners=[];
  if(ownerIds.length){const q=await db.from('commercial_partners').select('id,name').in('id',ownerIds);if(q.error)throw q.error;owners=q.data||[]}
  for(const entry of result.data||[]){
   const campaign=campaigns.find(c=>c.id===entry.campaign_id),owner=owners.find(p=>p.id===campaign?.partner_id);
   const tr=document.createElement('tr');
   cell(tr,entry.page_path);cell(tr,entry.placement_name);
   cell(tr,owner?.name||'Unassigned');cell(tr,campaign?.status||'Unknown');
   cell(tr,entry.integration_state==='managed'?'Managed':'Existing embed · not remotely switchable');
   const td=cell(tr,'');
   const path=safePath(entry.page_path);
   if(path){const a=document.createElement('a');a.href=path;a.target='_blank';a.rel='noopener';a.textContent='View page';td.append(a)}
   rows.append(tr);
  }
  status.textContent=(result.data||[]).length+' existing placements mapped to campaign records. No live advert appearance has been changed.';
 }catch(e){status.textContent='Existing advert inventory unavailable: '+(e.message||e)}
}
loadExistingHouseAdverts();

})();