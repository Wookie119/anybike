/* AnyBike Advertising Control Centre.
 * Presentation-only tabs: all existing Supabase controls, campaign approvals,
 * publication gates and admin scripts stay unchanged.
 */
(()=>{
 'use strict';
 const content=document.getElementById('adcontent');
 if(!content||document.getElementById('ab-workspace-tabs'))return;
 const areas=[
  {id:'overview',title:'Overview',description:'At a glance: launch readiness and live advertising health. Start with a task below.'},
  {id:'advertisers',title:'Advertisers & artwork',description:'Open an advertiser file, review artwork in five sizes or maintain approved partner details.'},
  {id:'campaigns',title:'Campaigns & quotations',description:'Create a quotation, manage existing campaigns, check their status and preview artwork before publishing.'},
  {id:'placements',title:'Where adverts appear',description:'Find a website page, configure its advertising position and review named spaces.'},
  {id:'results',title:'Results & money',description:'Review advertising income, commission and reporting. Campaign impressions and clicks are in Campaigns.'},
  {id:'advanced',title:'Advanced setup',description:'Detailed template reach, model-page assignments and the full website placement inventory.'}
 ];
 const tabs=document.createElement('nav');tabs.id='ab-workspace-tabs';tabs.className='ab-workspace-tabs';
 tabs.setAttribute('aria-label','Advertising work areas');
 const intro=document.createElement('div');intro.className='ab-workspace-intro';
 const heading=document.createElement('h2');const description=document.createElement('p');
 const quick=document.createElement('div');quick.className='ab-workspace-quick';
 intro.append(heading,description,quick);
 const buttons=new Map();
 let active='overview';
 let advancedView='reach';
 const known={
  advertisingReadiness:'overview',advertisingMegaHealthSection:'overview',
  pairedHousePreviewSection:'overview',
  'client-artwork-library':'advertisers',
  quotearea:'campaigns',editor:'campaigns',
  namedAdvertisingSpaces:'placements',
 };
 function category(section){
  if(known[section.id])return known[section.id];
  const name=(section.querySelector(':scope > h2')?.textContent||
   section.querySelector(':scope > .bar > h2')?.textContent||
   section.getAttribute('aria-label')||'').toLowerCase();
  if(/advertis(ing|er) partner|artwork files|artwork gallery|bulk artwork|software advert/.test(name))return 'advertisers';
  if(/quotation|campaign performance|campaign editor|campaign/.test(name))return 'campaigns';
  if(/commission|revenue|income|billing|payment/.test(name))return 'results';
  if(/wider website advertising coverage/.test(name))return 'placements';
  if(/model page advertising coverage|template advertising reach|live catalogue/.test(name))return 'advanced';
  if(/named advertising spaces|managed advert spaces|house adverts|live advertising controls|existing adverts|dealer stock connection|placement/.test(name))return 'placements';
  if(/inventory health|launch readiness|layout preview/.test(name))return 'overview';
  return 'advanced';
 }
 function advancedSection(section){
  const name=(section.querySelector(':scope > h2')?.textContent||'').toLowerCase();
  if(name.includes('model page advertising coverage'))return 'models';
  if(name.includes('wider website advertising coverage'))return 'pages';
  return 'reach';
 }
 function classify(){
  // Admin quotation tool prepends its section after this navigation is built.
  // Keep permanent navigation first, followed by the contextual introduction.
  if(content.firstElementChild!==tabs)content.insertBefore(tabs,content.firstChild);
  if(tabs.nextElementSibling!==intro)tabs.after(intro);
  for(const section of content.querySelectorAll(':scope > section')){
   if(!section.dataset.abWorkspaceArea)section.dataset.abWorkspaceArea=category(section);
   const visible=section.dataset.abWorkspaceArea===active &&
    (active!=='advanced'||advancedSection(section)===advancedView);
   section.classList.toggle('ab-workspace-hidden',!visible);
  }
 }
 function show(id,updateHash=true){
  const current=areas.find(a=>a.id===id)||areas[0];active=current.id;
  for(const [key,button] of buttons)button.setAttribute('aria-selected',key===active?'true':'false');
  heading.textContent=current.title;description.textContent=current.description;quick.replaceChildren();
  if(active==='placements'){
   const jump=document.createElement('button');jump.type='button';
   jump.textContent='Find a website page';
   jump.addEventListener('click',()=>{
    const query=document.getElementById('pagequery');
    if(!query)return;
    query.closest('section')?.scrollIntoView({behavior:'smooth',block:'start'});
    query.focus({preventScroll:true});
   });
   quick.append(jump);
  }
  if(active==='overview'){
   for(const [target,label] of [['advertisers','Open advertiser files'],['campaigns','Manage campaigns'],['placements','Choose advert positions'],['results','See results']]){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.addEventListener('click',()=>show(target));quick.append(button);
   }
  }
  if(active==='advanced'){
   const choices=[['reach','Template reach'],['models','Model pages · 979']];
   for(const [target,label] of choices){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.setAttribute('aria-pressed',advancedView===target?'true':'false');
    button.style.borderColor=advancedView===target?'#ed1c24':'#696969';
    button.addEventListener('click',()=>{advancedView=target;show('advanced',false)});
    quick.append(button);
   }
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
 show(areas.some(a=>a.id===initial)?initial:'overview',false);
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
section.innerHTML='<h2>Place adverts for a customer</h2><p style="color:#bbb">Choose an advertiser, choose their advert, then select locations. <strong>Save draft</strong> does not publish anything.</p><div class="ab-cp-top"><label>Advertising customer<select id="abCpOwner"><option value="">Choose customer</option></select></label><label>Advert / campaign<select id="abCpCampaign" disabled><option value="">Choose advert</option></select></label><label>Find pages<input id="abCpSearch" type="search" placeholder="Search website page"></label></div><div id="abCpPreview" hidden></div><p id="abCpStatus" role="status" style="color:#ccc"></p><div class="ab-cp-pages" id="abCpPages"></div><div class="bar" style="margin-top:12px"><button id="abCpSave" class="primary" type="button" disabled>Save selected locations as draft</button><span id="abCpCount"></span></div>';
const style=document.createElement('style');style.textContent='.ab-cp-top{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0}.ab-cp-top label{display:grid;gap:6px}.ab-cp-top select,.ab-cp-top input{width:100%}.ab-cp-pages{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;max-height:420px;overflow:auto}.ab-cp-page{display:flex!important;flex-direction:row!important;align-items:start!important;gap:9px!important;padding:11px;background:#141414;border:1px solid #444;border-radius:8px;overflow-wrap:anywhere}.ab-cp-page small{display:block;color:#aaa;margin-top:4px}.ab-cp-page input{flex-shrink:0;margin:3px 0}#abCpPreview{padding:10px;border:1px solid #444;border-radius:9px;margin:10px 0}#abCpPreview[hidden]{display:none}#abCpPreview img{display:block;max-width:330px;width:100%;height:auto;border-radius:8px;margin-top:8px}@media(max-width:800px){.ab-cp-top{grid-template-columns:1fr}}';document.head.append(style);
const anchor=document.getElementById('namedAdvertisingSpaces');anchor?root.insertBefore(section,anchor):root.append(section);
const $=id=>document.getElementById(id),owner=$('abCpOwner'),campaign=$('abCpCampaign'),search=$('abCpSearch'),pagesEl=$('abCpPages'),status=$('abCpStatus'),preview=$('abCpPreview'),save=$('abCpSave'),count=$('abCpCount');
let db,partners=[],ads=[],pages=[],plans=[],selected=new Set(),current=null;
const eligible=p=>Boolean(p.slot_code&&!p.excluded&&p.page_category!=='model'&&!/^\/(?:admin-|customer-|my-|dealer-|shipper-|seller-)/.test(p.page_path));
function draw(){
pagesEl.replaceChildren();count.textContent=selected.size+' selected';save.disabled=!current||selected.size===0;
if(!current)return;
const match=search.value.trim().toLowerCase(),filtered=pages.filter(p=>eligible(p)&&(!match||(p.page_path+' '+p.slot_code).toLowerCase().includes(match)));
for(const p of filtered.slice(0,120)){
const label=document.createElement('label');label.className='ab-cp-page';
const cb=document.createElement('input');cb.type='checkbox';cb.checked=selected.has(p.page_path);cb.onchange=()=>{cb.checked?selected.add(p.page_path):selected.delete(p.page_path);count.textContent=selected.size+' selected';save.disabled=selected.size===0};
const span=document.createElement('span');const strong=document.createElement('strong');strong.textContent=p.page_path;const small=document.createElement('small');small.textContent=p.slot_code+' · '+(p.placement_enabled?'Enabled position':'Not enabled');span.append(strong,small);label.append(cb,span);pagesEl.append(label);
}
status.textContent=filtered.length+' suitable inventoried positions'+(filtered.length>120?' · displaying first 120, narrow your search':'')+'. Saved draft locations are ticked.';
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
owner.onchange=()=>{campaign.replaceChildren(new Option('Choose advert',''));for(const ad of ads.filter(a=>a.partner_id===owner.value))campaign.append(new Option(ad.name+' · '+ad.status,ad.id));campaign.disabled=!owner.value;campaign.value='';current=null;selected.clear();showCampaign()};
campaign.onchange=showCampaign;search.oninput=draw;
save.onclick=async()=>{
if(!current||!selected.size)return;
const entries=pages.filter(p=>selected.has(p.page_path)&&eligible(p)).map(p=>({campaign_id:current.id,page_path:p.page_path,slot_code:p.slot_code,plan_status:'draft',updated_at:new Date().toISOString()}));
if(!entries.length||!confirm('Save '+entries.length+' draft locations for '+current.name+'? Nothing will go live.'))return;
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
const requests=await Promise.all([db.from('commercial_partners').select('id,name').order('name'),db.from('advertising_campaigns').select('id,name,partner_id,status,slim_image_url,desktop_image_url,alt_text').order('name'),db.from('advertising_page_inventory').select('page_path,page_category,slot_code,placement_enabled,excluded').order('page_path'),db.from('advertising_customer_page_plans').select('campaign_id,page_path,slot_code,plan_status')]);
const failed=requests.find(x=>x.error);if(failed)throw failed.error;
[partners,ads,pages,plans]=requests.map(x=>x.data||[]);
for(const p of partners)if(ads.some(a=>a.partner_id===p.id))owner.append(new Option(p.name,p.id));
status.textContent='Choose an advertising customer. No new advert will be published.';
}catch(e){status.textContent='Planner unavailable: '+(e.message||e)}
})();
})();
