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
