/* AnyBike Advertising Control Centre.
 * Presentation-only tabs: all existing Supabase controls, campaign approvals,
 * publication gates and admin scripts stay unchanged.
 */
(()=>{
 'use strict';
 const content=document.getElementById('adcontent');
 if(!content||document.getElementById('ab-workspace-tabs'))return;
 const areas=[
  {id:'advertisers',title:'Advertisers & artwork',description:'Choose a customer, manage artwork and place their adverts.'},
  {id:'placements',title:'Place adverts',description:'Find any website page, arrange its adverts and copy the layout to other pages.'},
  {id:'campaigns',title:'Campaigns & quotations',description:'Manage campaigns and advertising quotations.'},
  {id:'results',title:'Results & money',description:'Review advert performance, clicks, commission and income.'}
 ];
 const tabs=document.createElement('nav');tabs.id='ab-workspace-tabs';tabs.className='ab-workspace-tabs';
 tabs.setAttribute('aria-label','Advertising work areas');
 const intro=document.createElement('div');intro.className='ab-workspace-intro';
 const heading=document.createElement('h2');const description=document.createElement('p');
 const quick=document.createElement('div');quick.className='ab-workspace-quick';
 intro.append(heading,description,quick);
 const buttons=new Map();
 let active='advertisers';
 // Retired UI only: keep old HTML hooks for the legacy background code,
 // but do not present outdated editing tools to administrators.
 const retiredIds=new Set([
  'advertisingReadiness','advertisingMegaHealthSection',
  'pairedHousePreviewSection','namedAdvertisingSpaces'
 ]);
 function category(section){
  if(retiredIds.has(section.id))return 'retired';
  if(section.id==='client-artwork-library'||section.id==='abCustomerPlanner')return 'advertisers';
  if(section.id==='abSlotAdvertManager'||section.id==='abAdvertPageFinder')return 'placements';
  if(section.id==='editor'||section.id==='quotearea')return 'campaigns';
  const name=(section.querySelector(':scope > h2')?.textContent||
    section.querySelector(':scope > .bar > h2')?.textContent||
    section.getAttribute('aria-label')||'').toLowerCase();
  if(/advertising partners|advertiser artwork|artwork files/.test(name))return 'advertisers';
  if(/campaign performance|campaign editor|quotation|campaign/.test(name))return 'campaigns';
  if(/commission|revenue|income|billing|payment/.test(name))return 'results';
  // Hide technical panels retained for compatibility with existing scripts.
  return 'retired';
 }
 function classify(){
  // Admin quotation tool prepends its section after this navigation is built.
  // Keep permanent navigation first, followed by the contextual introduction.
  if(content.firstElementChild!==tabs)content.insertBefore(tabs,content.firstChild);
  if(tabs.nextElementSibling!==intro)tabs.after(intro);
  for(const section of content.querySelectorAll(':scope > section')){
   if(!section.dataset.abWorkspaceArea)section.dataset.abWorkspaceArea=category(section);
   const visible=section.dataset.abWorkspaceArea===active;
   section.classList.toggle('ab-workspace-hidden',!visible);
  }
 }
 function show(id,updateHash=true){
  const current=areas.find(a=>a.id===id)||areas[0];active=current.id;
  for(const [key,button] of buttons)button.setAttribute('aria-selected',key===active?'true':'false');
  heading.textContent=current.title;description.textContent=current.description;quick.replaceChildren();
  if(active==='placements'){
   const find=document.createElement('button');find.type='button';
   find.textContent='Find a page';
   find.onclick=()=>{const input=document.getElementById('abAdvertPageSearch');input?.closest('section')?.scrollIntoView({behavior:'smooth',block:'start'});input?.focus({preventScroll:true})};
   quick.append(find);
  }
  classify();
  if(updateHash){
   try{history.replaceState(history.state,'','#ads-'+active)}catch{}
  }
 }
 for(const area of areas){
  const button=document.createElement('button');button.type='button';button.textContent=area.title;
  button.setAttribute('aria-selected','false');button.addEventListener('click',()=>show(area.id));
  buttons.set(area.id,button);tabs.append(button);
 }
 content.prepend(intro);content.prepend(tabs);
 const initial=(location.hash||'').replace(/^#ads-/,'');
 show(areas.some(a=>a.id===initial)?initial:'advertisers',false);
 // Quote and artwork sections are inserted later by their existing modules.
 const observer=new MutationObserver(records=>{
  if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&n.tagName==='SECTION'&&n.parentElement===content)))classify();
 });
 observer.observe(content,{childList:true});
 window.addEventListener('hashchange',()=>{
  const value=(location.hash||'').replace(/^#ads-/,'');
  if(areas.some(a=>a.id===value))show(value,false);
 });
})();


/* Customer-first draft placement planner. Never changes public delivery. */
(()=>{
'use strict';
const root=document.getElementById('adcontent');if(!root||document.getElementById('abCustomerPlanner'))return;
const section=document.createElement('section');section.id='abCustomerPlanner';section.dataset.abWorkspaceArea='advertisers';
section.innerHTML='<h2>Place adverts for a customer</h2><p style="color:#bbb">Choose an advertiser, choose their advert, then select locations. <strong>Save draft</strong> does not publish anything.</p><div class="ab-cp-top"><label>Advertising customer<select id="abCpOwner"><option value="">Choose customer</option></select></label><label>Advert / campaign<select id="abCpCampaign" disabled><option value="">Choose advert</option></select></label><label>Find pages<input id="abCpSearch" type="search" placeholder="Search website page"></label></div><div id="abCpPreview" hidden></div><p id="abCpStatus" role="status" style="color:#ccc"></p><div class="ab-cp-pages" id="abCpPages"></div><div class="bar" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button id="abCpSelect50" type="button" disabled>Select 50 matching pages</button><button id="abCpSave" class="primary" type="button" disabled>Save selected locations as draft</button><span id="abCpCount"></span></div><div class="bar" style="margin-top:12px;gap:8px;flex-wrap:wrap;border-top:1px solid #444;padding-top:12px"><button id="abCpEndAll" type="button" disabled style="border:1px solid #ad3636;background:#361919;color:#fff">End all adverts for this customer</button><span id="abCpEndSummary" style="color:#aaa;font-size:12px">Choose a customer to manage all their campaigns.</span></div>';
const style=document.createElement('style');style.textContent='.ab-cp-top{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0}.ab-cp-top label{display:grid;gap:6px}.ab-cp-top select,.ab-cp-top input{width:100%}.ab-cp-pages{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;max-height:420px;overflow:auto}.ab-cp-page{display:flex!important;flex-direction:row!important;align-items:start!important;gap:9px!important;padding:11px;background:#141414;border:1px solid #444;border-radius:8px;overflow-wrap:anywhere}.ab-cp-page small{display:block;color:#aaa;margin-top:4px}.ab-cp-page input{flex-shrink:0;margin:3px 0}#abCpPreview{padding:10px;border:1px solid #444;border-radius:9px;margin:10px 0}#abCpPreview[hidden]{display:none}#abCpPreview img{display:block;max-width:330px;width:100%;height:auto;border-radius:8px;margin-top:8px}@media(max-width:800px){.ab-cp-top{grid-template-columns:1fr}}';document.head.append(style);
const anchor=document.getElementById('namedAdvertisingSpaces');anchor?root.insertBefore(section,anchor):root.append(section);
const $=id=>document.getElementById(id),owner=$('abCpOwner'),campaign=$('abCpCampaign'),search=$('abCpSearch'),pagesEl=$('abCpPages'),status=$('abCpStatus'),preview=$('abCpPreview'),save=$('abCpSave'),count=$('abCpCount'),select50=$('abCpSelect50'),endAll=$('abCpEndAll'),endSummary=$('abCpEndSummary');
let db,partners=[],ads=[],pages=[],plans=[],selected=new Set(),current=null,recentlySeen=new Set();
const eligible=p=>Boolean(p.slot_code&&!p.excluded&&p.page_category!=='model'&&!/^\/(?:admin-|customer-|my-|dealer-|shipper-|seller-)/.test(p.page_path));
function draw(){
pagesEl.replaceChildren();
const plannedCount=[...selected].filter(path=>!pages.some(p=>p.page_path===path&&p.placement_enabled&&current?.status==='active'&&recentlySeen.has(current.id+'|'+path))).length;
count.textContent=plannedCount+' new/draft location'+(plannedCount===1?'':'s')+' selected';save.disabled=!current||plannedCount===0||plannedCount>50;select50.disabled=!current;
if(!current)return;
const match=search.value.trim().toLowerCase(),filtered=pages.filter(p=>eligible(p)&&(!match||(p.page_path+' '+p.slot_code).toLowerCase().includes(match)));
for(const p of filtered.slice(0,120)){
const label=document.createElement('label');label.className='ab-cp-page';
const live=p.placement_enabled&&current.status==='active'&&recentlySeen.has(current.id+'|'+p.page_path);
const draft=plans.some(plan=>plan.campaign_id===current.id&&plan.page_path===p.page_path);
const cb=document.createElement('input');cb.type='checkbox';cb.checked=live||selected.has(p.page_path);cb.disabled=live;
cb.title=live?'Already shown recently on this page — cannot create a duplicate draft':'Select this page for draft planning';
cb.onchange=()=>{if(cb.checked&&selected.size>=50&&!selected.has(p.page_path)){cb.checked=false;status.textContent='50 pages selected. Save this batch, then choose another 50.';return}cb.checked?selected.add(p.page_path):selected.delete(p.page_path);
const n=[...selected].filter(path=>!pages.some(p=>p.page_path===path&&p.placement_enabled&&current.status==='active'&&recentlySeen.has(current.id+'|'+path))).length;
count.textContent=n+' new/draft location'+(n===1?'':'s')+' selected';save.disabled=n===0||n>50};
const span=document.createElement('span');const strong=document.createElement('strong');strong.textContent=p.page_path;const small=document.createElement('small');small.textContent=p.slot_code+' · '+(live?'RECENTLY DISPLAYED — enabled, recorded in last 7 days':draft?'SAVED DRAFT — not published':p.placement_enabled?'Available — enabled position':'Available — position currently disabled');span.append(strong,small);
const actions=document.createElement('span');actions.style.cssText='display:flex;gap:9px;flex-wrap:wrap;margin-top:7px';
const view=document.createElement('a');view.href=p.page_path;view.target='_blank';view.rel='noopener noreferrer';view.textContent='View website page';view.style.fontSize='12px';actions.append(view);
if(draft&&!live){
 const remove=document.createElement('button');remove.type='button';remove.textContent='Remove draft';
 remove.style.cssText='font-size:12px;padding:3px 8px;background:#222;border:1px solid #777';
 remove.onclick=async ev=>{
  ev.preventDefault();if(!confirm('Remove draft placement for '+current.name+' on '+p.page_path+'? No live advertising will change.'))return;
  remove.disabled=true;
  try{
   const result=await db.from('advertising_customer_page_plans').delete().eq('campaign_id',current.id).eq('page_path',p.page_path).select('page_path');
   if(result.error)throw result.error;if(!result.data?.length)throw Error('Draft not found or already removed');
   plans=plans.filter(plan=>!(plan.campaign_id===current.id&&plan.page_path===p.page_path));
   selected.delete(p.page_path);draw();status.textContent='Draft removed for '+p.page_path+'. Website adverts unchanged.';
  }catch(e){status.textContent='Could not remove draft: '+(e.message||e);remove.disabled=false}
 };
 actions.append(remove);
}
span.append(actions);label.append(cb,span);pagesEl.append(label);
}
status.textContent=filtered.length+' suitable inventoried positions'+(filtered.length>120?' · displaying first 120, narrow your search':'')+'. Live positions are locked against duplicate drafting; draft selections remain editable.';
}
function showCampaign(){
current=ads.find(a=>a.id===campaign.value)||null;
selected=new Set(plans.filter(p=>p.campaign_id===campaign.value).map(p=>p.page_path));
preview.replaceChildren();preview.hidden=!current;
if(current){
const title=document.createElement('strong');title.textContent=current.name+' · '+current.status;preview.append(title);
const url=current.slim_image_url||current.desktop_image_url;
if(url&&/^https:\/\//.test(url)){const image=document.createElement('img');image.src=url;image.alt=current.alt_text||current.name;image.loading='lazy';preview.append(image);}
}draw();
}
owner.onchange=()=>{const activeCount=ads.filter(a=>a.partner_id===owner.value&&a.status==='active').length;endAll.disabled=!activeCount;endSummary.textContent=owner.value?activeCount+' active campaign'+(activeCount===1?'':'s')+' for this customer':'Choose a customer';campaign.replaceChildren(new Option('Choose advert',''));for(const ad of ads.filter(a=>a.partner_id===owner.value))campaign.append(new Option(ad.name+' · '+ad.status,ad.id));campaign.disabled=!owner.value;campaign.value='';current=null;selected.clear();showCampaign()};
campaign.onchange=showCampaign;search.oninput=draw;
select50.onclick=()=>{
 if(!current)return;
 const term=search.value.trim().toLowerCase(),candidates=pages.filter(p=>eligible(p)&&(!term||(p.page_path+' '+p.slot_code).toLowerCase().includes(term))&&!(p.placement_enabled&&current.status==='active'&&recentlySeen.has(current.id+'|'+p.page_path)));
 const before=selected.size;
 for(const p of candidates){if(selected.size>=50)break;selected.add(p.page_path)}
 draw();status.textContent='Selected '+Math.max(0,selected.size-before)+' more page(s). '+selected.size+' in this batch (maximum 50). Save once for all selected pages.';
};
endAll.onclick=async()=>{
 if(!db||!owner.value)return;
 const ownerId=owner.value,partner=partners.find(p=>p.id===ownerId);
 const active=ads.filter(a=>a.partner_id===ownerId&&a.status==='active');
 if(!active.length){status.textContent='This customer has no active adverts to end.';return}
 endAll.disabled=true;endSummary.textContent='Checking this customer’s placements…';
 try{
  const ids=active.map(a=>a.id);
  const [liveLayouts,draftLayouts,livePlans]=await Promise.all([
   db.from('advertising_slot_published_layouts').select('slot_code,page_path,campaign_ids'),
   db.from('advertising_slot_layout_drafts').select('slot_code,page_path,campaign_ids'),
   db.from('advertising_customer_page_plans').select('campaign_id,page_path').in('campaign_id',ids)
  ]);
  const failure=[liveLayouts,draftLayouts,livePlans].find(r=>r.error);if(failure)throw failure.error;
  const inOwner=rows=>(rows||[]).filter(p=>(p.campaign_ids||[]).some(id=>ids.includes(id)));
  const published=inOwner(liveLayouts.data),drafts=inOwner(draftLayouts.data);
  const name=partner?.name||'this customer';
  const message='End ALL '+active.length+' active campaign(s) for '+name+' across AnyBike?\n\n'+
   published.length+' published multi-advert layout(s) currently contain these campaigns; '+drafts.length+' saved layout(s) and '+(livePlans.data?.length||0)+' customer page plan(s) will be retained as records.\n\n'+
   'Their adverts will stop being eligible for public delivery, but other customers stay active. This cannot be undone without reactivating campaigns.';
  if(!confirm(message)){endSummary.textContent='No adverts changed.';return}
  const result=await db.from('advertising_campaigns').update({status:'inactive'}).eq('partner_id',ownerId).in('id',ids).eq('status','active').select('id,status');
  if(result.error)throw result.error;
  const changed=new Set((result.data||[]).filter(x=>x.status==='inactive').map(x=>x.id));
  if(changed.size!==ids.length)throw Error('Only '+changed.size+' of '+ids.length+' campaigns were confirmed stopped. Check current campaign statuses.');
  for(const a of ads)if(changed.has(a.id))a.status='inactive';
  const refresh=await db.from('advertising_campaigns').select('id,status').eq('partner_id',ownerId);
  if(refresh.error||refresh.data?.some(a=>a.status==='active'))throw refresh.error||Error('An active campaign still exists for this customer.');
  owner.onchange();endSummary.textContent='All '+changed.size+' active campaign(s) ended for '+name+'. Existing layout drafts have been retained.';
  status.textContent=name+' adverts ended across AnyBike. Other advertisers are unchanged. Public pages will reflect this on refresh.';
 }catch(e){status.textContent='Could not confirm all campaigns ended: '+(e.message||e);endSummary.textContent='Check campaign status before retrying.'}
 finally{endAll.disabled=!ads.some(a=>a.partner_id===owner.value&&a.status==='active')}
};
window.addEventListener('anybike:advertiser-placement',event=>{
 const partnerId=event.detail?.partnerId;
 if(!partnerId||!partners.some(p=>p.id===partnerId)){status.textContent='Advertiser file not yet available in the planner.';return}
 owner.value=partnerId;owner.onchange();
 const available=ads.filter(a=>a.partner_id===partnerId);
 const preferred=available.find(a=>a.status==='active')||available[0];
 if(preferred){campaign.value=preferred.id;showCampaign()}
 section.scrollIntoView({block:'start',behavior:'smooth'});
});

save.onclick=async()=>{
if(!current||!selected.size)return;
const entries=pages.filter(p=>selected.has(p.page_path)&&eligible(p)&&!(p.placement_enabled&&current.status==='active'&&recentlySeen.has(current.id+'|'+p.page_path))).map(p=>({campaign_id:current.id,page_path:p.page_path,slot_code:p.slot_code,plan_status:'draft',updated_at:new Date().toISOString()}));
if(!entries.length)return;if(entries.length>50){status.textContent='Save up to 50 pages in one batch.';return}if(!confirm('Save '+entries.length+' locations for '+current.name+' in one batch? These are drafts; nothing goes live.'))return;
save.disabled=true;
try{
const saved=await db.from('advertising_customer_page_plans').upsert(entries,{onConflict:'campaign_id,page_path'}).select('page_path');
if(saved.error)throw saved.error;if(saved.data.length!==entries.length)throw Error('Not all locations could be verified');
const loaded=await db.from('advertising_customer_page_plans').select('campaign_id,page_path,slot_code,plan_status');if(loaded.error)throw loaded.error;
plans=loaded.data||[];status.textContent='Saved '+entries.length+' draft locations. Live advertising unchanged.';
}catch(e){status.textContent='Save failed: '+(e.message||e)}finally{save.disabled=false;}
};
(async()=>{
try{
status.textContent='Loading advertiser records from Supabase…';
if(typeof getAdminSupabaseClient!=='function')throw Error('Admin database connection unavailable');
db=getAdminSupabaseClient();const permission=await db.rpc('anybike_is_admin');if(permission.error||permission.data!==true)throw Error('Admin permission required');
const requests=await Promise.all([db.from('commercial_partners').select('id,name').order('name'),db.from('advertising_campaigns').select('id,name,partner_id,status,slim_image_url,desktop_image_url,alt_text').order('name'),db.from('advertising_page_inventory').select('page_path,page_category,slot_code,placement_enabled,excluded').order('page_path'),db.from('advertising_customer_page_plans').select('campaign_id,page_path,slot_code,plan_status'),db.from('advertising_events').select('campaign_id,page_path').eq('event_type','impression').gte('occurred_at',new Date(Date.now()-7*86400000).toISOString()).order('occurred_at',{ascending:false}).limit(5000)]);
const failed=requests.find(x=>x.error);if(failed)throw failed.error;
[partners,ads,pages,plans]=requests.slice(0,4).map(x=>x.data||[]);
recentlySeen=new Set((requests[4].data||[]).filter(e=>e.campaign_id&&e.page_path).map(e=>e.campaign_id+'|'+e.page_path));
for(const p of partners)if(ads.some(a=>a.partner_id===p.id))owner.append(new Option(p.name,p.id));
status.textContent='Choose an advertising customer. No new advert will be published.';
}catch(e){status.textContent='Planner unavailable: '+(e.message||e)}
})();
})();
