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
})();