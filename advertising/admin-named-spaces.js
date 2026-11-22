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
  const {data,error}=await db.from('advertising_named_spaces').select('slot_code,display_name,page_template,page_path,anchor_key,format,grid_span,market_scope,status,maximum_per_page,frequency_every,notes,pricing_tier,guide_monthly_gbp,inherits_template').order('slot_code');
  if(error)throw error;
  const summary=await db.rpc('admin_advertising_template_inventory_summary_v1');
  const counts=new Map((summary.error?[]:summary.data||[]).map(x=>[x.slot_code,x]));
  for(const s of data||[]){
   const tr=document.createElement('tr');
   cell(tr,s.slot_code);cell(tr,s.display_name);cell(tr,s.page_template);
   const applicability=counts.get(s.slot_code);
   const inherited=applicability?.inheritance_enabled===true;
   const coverage=inherited?'Template inheritance · '+(applicability.matching_entities??'—')+' matching records':'Single / proposed position';
   cell(tr,coverage);
   cell(tr,s.format);cell(tr,s.market_scope);cell(tr,s.status);
   const pricing=document.createElement('td');pricing.style.cssText='min-width:255px';
   const tier=document.createElement('select');tier.setAttribute('aria-label','Pricing tier for '+s.slot_code);
   for(const name of ['standard','premium','exclusive']){const op=document.createElement('option');op.value=name;op.textContent=name[0].toUpperCase()+name.slice(1);tier.append(op)}
   tier.value=s.pricing_tier||'standard';
   const price=document.createElement('input');price.type='number';price.min='0';price.step='0.01';price.placeholder='£/month — not set';
   price.value=s.guide_monthly_gbp==null?'':String(s.guide_monthly_gbp);
   price.setAttribute('aria-label','Internal monthly guide rate for '+s.slot_code);
   price.style.cssText='width:118px;margin:0 5px';
   const save=document.createElement('button');save.type='button';save.textContent='Save';
   save.addEventListener('click',async()=>{
    save.disabled=true;
    const raw=price.value.trim();
    const amount=raw===''?null:Number(raw);
    if(amount!==null&&(!Number.isFinite(amount)||amount<0)){save.disabled=false;status.textContent='Enter a valid non-negative amount or leave guide price blank.';return}
    const {data,error}=await db.from('advertising_named_spaces').update({
     pricing_tier:tier.value,guide_monthly_gbp:amount,updated_at:new Date().toISOString()
    }).eq('slot_code',s.slot_code).select('slot_code').maybeSingle();
    status.textContent=error||!data?'Not saved: '+(error?.message||'No authorised row updated'):
     'Saved '+s.slot_code+' · '+tier.value+' · '+(amount===null?'unpriced':'£'+amount.toFixed(2)+'/month')+' (internal guide only).';
    save.disabled=false;
   });
   pricing.append(tier,price,save);tr.append(pricing);
   cell(tr,s.frequency_every?'Every '+s.frequency_every+' items':'One position');
   const td=cell(tr,'');
   const path=safePath(s.page_path);
   if(path){const a=document.createElement('a');a.href=path;a.target='_blank';a.rel='noopener';a.textContent='View page';td.append(a)}
   else td.textContent='Template';
   const detail=document.createElement('tr'),info=document.createElement('td');
   info.colSpan=10;info.style.cssText='font-size:12px;color:#bbb;padding:2px 8px 12px';
   info.textContent='Anchor: '+s.anchor_key+' · '+s.notes;
   detail.append(info);rows.append(tr,detail);
  }
  status.textContent=(data||[]).length+' template/individual definitions · '+[...counts.values()].filter(x=>x.inheritance_enabled).length+' inherited template rules. Matching records are inventory estimates, NOT verified live adverts.';
 }catch(e){status.textContent='Unable to load named spaces: '+(e.message||e)}
}
$('refreshNamedSpaces')?.addEventListener('click',load);
load();

// Template reach explorer: commercial planning only, never a renderer or publication action.
function installTemplateReachExplorer(){
 if($('templateReachExplorer'))return;
 const section=document.createElement('section');section.id='templateReachExplorer';
 const header=document.createElement('h2');header.textContent='Template advertising reach · live catalogue';
 const desc=document.createElement('p');desc.style.cssText='font-size:13px;color:#bbb';
 desc.textContent='One template position inherits possible coverage as pages are added. Filter by manufacturer, model or country to plan a quotation. These are potential page matches, not guaranteed impressions or live advert positions.';
 const controls=document.createElement('div');controls.className='bar';
 const makeSelect=(labelText)=>{
  const label=document.createElement('label');label.textContent=labelText;
  label.style.cssText='display:grid;gap:4px;font-size:13px;min-width:165px;flex:1';
  const select=document.createElement('select');label.append(select);controls.append(label);return select;
 };
 const family=makeSelect('Template position'),manufacturer=makeSelect('Manufacturer'),model=makeSelect('Model'),country=makeSelect('Country page');
 const update=document.createElement('button');update.type='button';update.textContent='Refresh reach';controls.append(update);
 const result=document.createElement('p');result.id='templateReachResult';result.setAttribute('role','status');
 result.style.cssText='font-size:13px;color:#ddd;margin:10px 0';
 const sample=document.createElement('div');sample.id='templateReachExamples';sample.style.cssText='font-size:12px;color:#bbb';
 section.append(header,desc,controls,result,sample);
 const root=$('namedAdvertisingSpaces');root.insertAdjacentElement('afterend',section);
 const option=(select,value,label)=>{const el=document.createElement('option');el.value=value;el.textContent=label;select.append(el)};
 let spaces=[],models=[],markets=[],failed=false;
 const populate=(select,values,prompt)=>{
  const previous=select.value;select.replaceChildren();option(select,'',prompt);
  values.forEach(item=>option(select,item,item));
  if([...select.options].some(x=>x.value===previous))select.value=previous;
 };
 const unique=(values)=>[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const recalc=()=>{
  if(failed)return;
  const slot=spaces.find(x=>x.slot_code===family.value);
  if(!slot){result.textContent='Choose one inherited template position.';sample.textContent='';return}
  const isCountry=slot.page_template==='country';
  manufacturer.disabled=model.disabled=isCountry;country.disabled=!isCountry;
  let matching=[];
  if(isCountry){
   matching=markets.filter(x=>!country.value||x.page_path===country.value);
  }else if(slot.page_template==='manufacturer'){
   const allBrands=unique(models.map(x=>x.manufacturer));
   matching=allBrands.filter(x=>!manufacturer.value||x===manufacturer.value).map(x=>({label:x}));
  }else{
   matching=models.filter(x=>(!manufacturer.value||x.manufacturer===manufacturer.value)&&(!model.value||x.model===model.value));
  }
  const count=matching.length;
  result.textContent=slot.slot_code+' · '+count+' matching '+(isCountry?'country pages':slot.page_template==='manufacturer'?'manufacturers':'model records')+
   ' · '+slot.status.toUpperCase()+' · potential template reach only; no adverts published or impressions implied.';
  const names=matching.slice(0,8).map(x=>x.label||(isCountry?x.page_path:x.manufacturer+' '+x.model));
  sample.textContent=count?'Examples: '+names.join(' · ')+(count>8?' · …':''):'No matches found.';
 };
 const modelsForBrand=()=>{
  const available=unique(models.filter(x=>!manufacturer.value||x.manufacturer===manufacturer.value).map(x=>x.model));
  populate(model,available,'All models');recalc();
 };
 family.onchange=()=>{manufacturer.value='';model.value='';country.value='';modelsForBrand()};
 manufacturer.onchange=modelsForBrand;model.onchange=recalc;country.onchange=recalc;
 const load=async()=>{
  result.textContent='Loading catalogue and country pages…';
  try{
   const db=getAdminSupabaseClient();
   const auth=await db.rpc('anybike_is_admin');
   if(auth.error||auth.data!==true)throw Error('Administrator permission required');
   const [slotData,marketData]=await Promise.all([
    db.from('advertising_named_spaces').select('slot_code,display_name,page_template,status,inherits_template').eq('inherits_template',true).order('slot_code'),
    db.from('advertising_page_inventory').select('page_path').eq('page_category','country').order('page_path')
   ]);
   if(slotData.error||marketData.error)throw(slotData.error||marketData.error);
   const all=[];for(let offset=0;offset<2500;offset+=500){
    const page=await db.from('motorcycle_catalog_models').select('manufacturer,model').order('id').range(offset,offset+499);
    if(page.error)throw page.error;
    all.push(...(page.data||[]));if((page.data||[]).length<500)break;
   }
   spaces=slotData.data||[];models=all;markets=marketData.data||[];
   family.replaceChildren();option(family,'','Choose template position');
   for(const space of spaces)option(family,space.slot_code,space.display_name+' · '+space.status);
   populate(manufacturer,unique(models.map(x=>x.manufacturer)),'All manufacturers');
   populate(model,unique(models.map(x=>x.model)),'All models');
   populate(country,markets.map(x=>x.page_path),'All countries');
   failed=false;recalc();
  }catch(e){failed=true;result.textContent='Template reach unavailable: '+(e?.message||e)}
 };
 update.addEventListener('click',load);
 load();
}
installTemplateReachExplorer();

function addLegacyInventoryPanel(){
 if($('anybikeExistingHouseAdverts'))return;
 const section=document.createElement('section');
 section.id='anybikeExistingHouseAdverts';
 const h=document.createElement('h2');h.textContent='Existing adverts · AnyBike-owned placements';
 const desc=document.createElement('p');
 desc.style.cssText='font-size:13px;color:#bbb';
 desc.textContent='Source-verified adverts already embedded on AnyBike. These are mapped to the AnyBike house campaign. The visibility checkbox enables or hides an existing red advert on that page after refresh. Campaign status is separate; artwork and links are unchanged.';
 const state=document.createElement('p');state.id='existingHouseAdvertsState';state.setAttribute('role','status');
 const wrap=document.createElement('div');wrap.className='scroll';
 const table=document.createElement('table');
 const head=document.createElement('thead'),headrow=document.createElement('tr');
 for(const name of ['Page','Advert','Owner','Campaign status','Visibility','Integration','View']){const th=document.createElement('th');th.textContent=name;headrow.append(th)}
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
  const flags=await db.from('advertising_house_visibility').select('page_path,enabled');
  if(flags.error)throw flags.error;
  const flagMap=new Map((flags.data||[]).map(x=>[x.page_path,x.enabled]));
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
   const toggleCell=document.createElement('td');
   const toggle=document.createElement('input');toggle.type='checkbox';
   toggle.checked=flagMap.get(entry.page_path)===true;
   toggle.setAttribute('aria-label','Display house advert on '+entry.page_path);
   toggle.title='Show or hide this existing advert without changing its artwork';
   toggle.addEventListener('change',async()=>{
    const desired=toggle.checked;toggle.disabled=true;
    const {data,error}=await db.from('advertising_house_visibility')
      .update({enabled:desired,updated_at:new Date().toISOString()})
      .eq('page_path',entry.page_path).select('page_path').maybeSingle();
    if(error||!data){
      toggle.checked=!desired;
      status.textContent='Could not update '+entry.page_path+': '+(error?.message||'No permission or record');
    }else{
      status.textContent=(desired?'Enabled':'Disabled')+' existing house advert for '+entry.page_path+'. Refresh that page to verify.';
    }
    toggle.disabled=false;
   });
   toggleCell.append(toggle);tr.append(toggleCell);
   cell(tr,'AnyBike house visibility managed');
   const td=cell(tr,'');
   const path=safePath(entry.page_path);
   if(path){const a=document.createElement('a');a.href=path;a.target='_blank';a.rel='noopener';a.textContent='View page';td.append(a)}
   rows.append(tr);
  }
  status.textContent=(result.data||[]).length+' existing house advert positions registered. Visibility can be changed per page; artwork, links and dimensions stay unchanged.';
 }catch(e){status.textContent='Existing advert inventory unavailable: '+(e.message||e)}
}
loadExistingHouseAdverts();

})();