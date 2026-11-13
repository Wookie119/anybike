/* AnyBike approved V2 navigation. Shared by the approved master and future model routes.
 * Public sources only: manufacturer model routes, published model directory,
 * published manufacturer directory, country navigation RPC, and live Global index.
 * No private catalogue tables, draft stories, inventory, or credentials with write access.
 */
const ENDPOINT='https://tuehtnezhdnkqbbhttgp.supabase.co';
const KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
// The page identifies the exact published motorcycle after the V2 editorial RPC
// succeeds. Do not guess a different model during future universal rollout.
const current=await new Promise(resolve=>{
 const identity=window.__anybikeV2ModelIdentity;
 if(identity?.make&&identity?.model){resolve(identity);return;}
 if(window.__anybikeV2EditorialReady){resolve(null);return;}
 const onIdentity=()=>resolve(window.__anybikeV2ModelIdentity||null);
 const onDone=()=>resolve(window.__anybikeV2ModelIdentity||null);
 window.addEventListener('anybike:v2-model-identity-ready',onIdentity,{once:true});
 window.addEventListener('anybike:v2-editorial-ready',onDone,{once:true});
});
const make=String(current?.make||'').trim();
// Wait until the canonical V2 editorial has finished rendering its fixed
// publication fields; the dynamic directory must be the last writer of pills.
await new Promise(resolve=>{
 if(window.__anybikeV2EditorialReady){resolve();return;}
 window.addEventListener('anybike:v2-editorial-ready',resolve,{once:true});
});
const normalize=s=>String(s||'').toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,' ').trim();
const validModelPath=s=>/^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(s);
const validCountryPath=s=>/^\/markets\/[a-z0-9-]+\.html$/.test(s);
const safeNav=(target,entries)=>{
 if(!target||!Array.isArray(entries)||!entries.length)return 0;
 const frag=document.createDocumentFragment(),seen=new Set();
 for(const item of entries){
  const url=String(item.url||''),label=String(item.label||'').trim();
  if(!url.startsWith('/')||url.startsWith('//')||!label||seen.has(url))continue;
  seen.add(url);
  const a=document.createElement('a');a.href=url;a.textContent=label;
  if(item.current)a.setAttribute('aria-current','page');
  frag.append(a);
 }
 if(seen.size)target.replaceChildren(frag);
 return seen.size;
};
const makePanel=(id,title,description,after)=>{
 let panel=document.getElementById(id);
 if(panel)return panel;
 panel=document.createElement('section');panel.id=id;
 panel.className='card bmw-explore anybike-v2-dynamic-links';
 panel.setAttribute('aria-label',title);
 const heading=document.createElement('h2');heading.textContent=title;
 const summary=document.createElement('p');summary.textContent=description;
 const nav=document.createElement('nav');nav.className='guide-links';
 nav.setAttribute('aria-label',title+' links');
 panel.append(heading,summary,nav);
 after?.after(panel);return panel;
};
async function fetchPublished(path){
 const response=await fetch(path,{cache:'no-cache'});
 if(!response.ok)throw new Error('Published directory unavailable '+path);
 return response.text();
}
async function modelNavigation(){
 const target=document.getElementById('databaseRelatedModels');
 if(!target||!make)return;
 const approved=new Map();
 // Published dedicated routes remain authoritative even if the browser
 // Supabase library is unavailable. This is the same public, read-only RPC.
 try{
  const db=window.supabase?.createClient?.(ENDPOINT,KEY);
  let routes=null;
  if(db){
   try{
    const {data,error}=await db.rpc('public_anybike_manufacturer_model_routes_v1',{p_make:make});
    if(error)throw error;
    if(Array.isArray(data))routes=data;
   }catch(error){console.warn('Supabase JS model routes unavailable',error);}
  }
  if(!routes){
   const response=await fetch(ENDPOINT+'/rest/v1/rpc/public_anybike_manufacturer_model_routes_v1',{
    method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},
    body:JSON.stringify({p_make:make}),cache:'no-store'
   });
   if(!response.ok)throw Error('Public model routes HTTP '+response.status);
   const data=await response.json();
   if(!Array.isArray(data))throw Error('Invalid model routes response');
   routes=data;
  }
  for(const row of routes){
   if(normalize(row.make)!==normalize(make)||!validModelPath(row.url)||!String(row.model||'').trim())continue;
   approved.set(normalize(row.model),{label:row.model,url:row.url});
  }
 }catch(error){console.warn('V2 public model routes unavailable',error);}
 // This existing public JSON catalogue is a directory of names, not a claim
 // that their engineering research is approved. Prefer a validated dedicated
 // route; otherwise use the existing exact-model generic route until rollout.
 let models=[];
 const categories=new Map();
 const collect=items=>{
  for(const row of (Array.isArray(items)?items:[])){
   if(normalize(row.make)!==normalize(make)||typeof row.model!=='string')continue;
   const name=row.model.trim();
   if(!name||/\b(?:apr|representative|finance offer|discount)\b/i.test(name))continue;
   models.push(name);
   const category=normalize(row.category||row.motorcycle_type);
   if(category)categories.set(normalize(name),category);
  }
 };
 try{
  const db=window.supabase?.createClient?.(ENDPOINT,KEY);
  if(db){
   const {data,error}=await db.rpc('public_anybike_manufacturer_catalogue_names_v1',{p_make:make});
   if(error)throw error;
   collect(data);
  }
 }catch(error){console.warn('Public manufacturer catalogue unavailable',error)}
 if(!models.length)try{
  const published=JSON.parse(await fetchPublished('/data/motorcycle-catalogue-master.json'));
  collect(published.models);
 }catch(error){console.warn('Static manufacturer catalogue unavailable',error)}
 const combined=new Map();
 for(const name of models)combined.set(normalize(name),{
  label:name,url:(location.pathname==='/motorcycle-v2-master.html'?
   '/motorcycle-v2-master.html':'/motorcycle-model-guide.html')+
   '?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(name)
 });
 // Approved dedicated model URLs remain primary destinations during rollout.
 // Never send a visitor from a published BMW/Harley URL to a parallel master
 // URL merely because they browsed the universal model directory.
 for(const [key,item] of approved)combined.set(key,item);
 // If public navigation is temporarily unavailable, preserve the existing
 // V2 pills rather than replace them with an empty list.
 const links=[...combined.values()].sort((a,b)=>a.label.localeCompare(b.label,'en-GB',{numeric:true}))
  .map(item=>{
   const here=normalize(item.label)===normalize(current.model);
   return {...item,current:here,url:here?location.pathname+location.search:item.url};
  });
 // Compact stock-style model navigation for the approved V2 reading flow.
 // The complete manufacturer directory stays further down the same page.
 // Related models are chosen from the same published links, never hardcoded
 // into an individual model page.
 if(links.length){
  const hero=document.querySelector('main > .hero, main #universalV2Preview > .hero');
  const stock=document.getElementById('internationalModelStock');
  const placement=stock||hero;
  if(placement){
   let panel=document.getElementById('approvedV2ModelQuickLinks');
   if(!panel){
    panel=document.createElement('section');
    panel.id='approvedV2ModelQuickLinks';
    panel.className='card bmw-explore anybike-v2-model-quicklinks';
    panel.setAttribute('aria-label','Explore '+make+' motorcycle models');
    const heading=document.createElement('h2');
    heading.textContent='Explore other '+make+' models';
    const description=document.createElement('p');
    description.textContent='Explore the '+make+' range, including models not currently in stock.';
    const near=document.createElement('nav');
    near.className='guide-links';
    near.setAttribute('aria-label','Related '+make+' motorcycle model guides');
    near.dataset.v2QuickRelated='1';
    const details=document.createElement('details');
    details.className='anybike-v2-all-models';
    const summary=document.createElement('summary');
    summary.textContent='View all '+make+' models';
    details.append(summary);
    const all=document.createElement('nav');
    all.className='guide-links';
    all.dataset.v2QuickAll='1';
    all.setAttribute('aria-label','All '+make+' model guides');
    details.append(all);
    panel.append(heading,description,near,details);
   }
   // Shared naming heuristics are a fallback until the catalogue provides
   // curated related_models for all 979 model rows. No make-specific rules.
   const family=name=>{
    const raw=String(name||'').trim();
    const match=raw.match(/^([a-z]{1,6})(?:-[a-z])?(?=\s*[- ]?\d)/i);
    return match?match[1].toLowerCase():'';
   };
   const selectedFamily=family(current.model);
   const selectedCategory=categories.get(normalize(current.model))||'';
   const tokenSet=name=>new Set(normalize(name).split(' ').filter(x=>x.length>1));
   const currentTokens=tokenSet(current.model);
   const capacity=name=>{
    const m=String(name||'').match(/\d{2,4}/);
    return m?Number(m[0]):0;
   };
   const selectedCapacity=capacity(current.model);
   const score=item=>{
    const tokens=tokenSet(item.label);
    let points=0;
    if(selectedFamily&&family(item.label)===selectedFamily)points+=30;
    if(selectedCategory&&categories.get(normalize(item.label))===selectedCategory)points+=12;
    for(const token of tokens)if(currentTokens.has(token))points+=9;
    const otherCapacity=capacity(item.label);
    if(selectedCapacity&&otherCapacity){
     const distance=Math.abs(selectedCapacity-otherCapacity);
     points+=distance===0?10:distance<=100?8:distance<=250?5:distance<=500?2:0;
    }
    return points;
   };
   // Keep pills within the identified model family when available.
   // Everything remains accessible through the full A–Z catalogue below.
   let ranked=links.filter(item=>!item.current&&
    (!selectedFamily||family(item.label)===selectedFamily));
   if(!ranked.length&&selectedCategory)ranked=links.filter(item=>!item.current&&
    categories.get(normalize(item.label))===selectedCategory);
   // If neither family nor category is established, avoid presenting random
   // models as related; the full manufacturer catalogue remains available.
   if(!ranked.length&&!selectedFamily&&!selectedCategory)ranked=[];
   ranked.sort((a,b)=>score(b)-score(a)||a.label.localeCompare(b.label,'en-GB',{numeric:true}));
   // Show a useful cross-section of the same manufacturer-specific family;
   // the pills wrap naturally on wider screens. The full catalogue remains expandable.
   const compact=ranked.slice(0,14);
   safeNav(panel.querySelector('[data-v2-quick-related]'),compact);
   safeNav(panel.querySelector('[data-v2-quick-all]'),links);
   panel.querySelector('.anybike-v2-all-models summary').textContent=
    'View all '+links.length+' '+make+' models';
   // The international stock section is directly below the hero. This
   // panel follows it, ahead of Documented model specification.
   placement.after(panel);
   panel.dataset.anybikeV2Source='published-catalogue-and-routes';
  }
 }
 const rendered=safeNav(target,links);
 if(rendered){
  const heading=target.closest('section')?.querySelector('h2');
  if(heading)heading.textContent='Explore '+make+' motorcycles';
  target.dataset.anybikeV2Source='published-catalogue-and-routes';
 }
}
async function manufacturerNavigation(){
 const index=document.getElementById('databaseMotorcycleTypes');
 const after=index?.closest('section');
 if(!after)return;
 try{
  const html=await fetchPublished('/motorcycle-manufacturers.html');
  const doc=new DOMParser().parseFromString(html,'text/html');
  const entries=new Map();
  for(const node of doc.querySelectorAll('.brand')){
   const link=node.matches('a[href]')?node:node.querySelector('a[href]');
   const label=node.querySelector('strong')?.textContent?.trim()||'';
   const name=label||node.getAttribute('data-name')||'';
   if(!name||!link)continue;
   const source=new URL(link.getAttribute('href'),location.origin);
   if(source.origin!==location.origin)continue;
   // The A–Z directory commonly points to sourcing forms. A model-guide
   // link must instead open the real manufacturer page.
   const url=name==='BMW'?'/bmw-motorcycles.html':
    name==='Harley-Davidson'?'/harley-davidson-motorcycles.html':
    '/motorcycle-brand.html?make='+encodeURIComponent(name);
   const key=normalize(name);
   if(key===normalize(make)||!key||entries.has(key))continue;
   entries.set(key,{label:label.length<60?label:name,url});
  }
  if(!entries.size)return;
  const panel=makePanel('approvedV2Manufacturers','Explore other motorcycle manufacturers',
   'Browse published AnyBike manufacturer pages. Newly published names appear as the manufacturer directory is updated.',after);
  const nav=panel.querySelector('nav');
  safeNav(nav,[...entries.values()].sort((a,b)=>a.label.localeCompare(b.label,'en-GB')));
  panel.dataset.anybikeV2Source='published-manufacturer-directory';
 }catch(error){console.warn('V2 manufacturer directory unavailable',error);}
}
async function countryNavigation(){
 const section=document.getElementById('r1300CountryMarkets');
 const nav=section?.querySelector('nav[aria-label="Country market links"]');
 if(!nav)return;
 try{
  const db=window.supabase?.createClient?.(ENDPOINT,KEY);
  if(!db){section.hidden=true;return;}
  const {data,error}=await db.rpc('public_anybike_country_navigation_v1');
  if(error)throw error;
  const rows=(Array.isArray(data)?data:[]).filter(x=>validCountryPath(x.url)&&String(x.label||'').trim());
  if(!rows.length){section.hidden=true;return;}
  section.hidden=false;
  const regions=new Map(),seen=new Set();
  for(const item of rows){
   if(seen.has(item.url))continue;seen.add(item.url);
   const region=String(item.region||'Other markets');
   if(!regions.has(region))regions.set(region,[]);
   regions.get(region).push({label:item.label,url:item.url});
  }
  nav.replaceChildren();
  section.querySelectorAll('.anybike-v2-country-regions').forEach(old=>old.remove());
  const overview=document.createElement('a');overview.href='/international-markets.html';
  overview.textContent='View all '+seen.size+' international markets →';nav.append(overview);
  const groups=document.createElement('div');groups.className='anybike-v2-country-regions';
  for(const [region,items] of [...regions].sort((a,b)=>a[0].localeCompare(b[0],'en-GB'))){
   const details=document.createElement('details'),summary=document.createElement('summary');
   summary.textContent=region+' ('+items.length+')';details.append(summary);
   const links=document.createElement('nav');links.className='guide-links';
   links.setAttribute('aria-label',region+' country pages');
   safeNav(links,items.sort((a,b)=>a.label.localeCompare(b.label,'en-GB')));
   details.append(links);groups.append(details);
  }
  section.append(groups);
  section.dataset.anybikeV2Source='public-country-navigation-rpc';
 }catch(error){section.hidden=true;console.warn('V2 country directory unavailable',error);}
}
async function globalNavigation(){
 const anchor=document.getElementById('r1300CountryMarkets');
 if(!anchor||!make)return;
 const panel=makePanel('approvedV2GlobalStories','Discover '+make+' on AnyBike Global',
  'Factory history, engineering stories and comparisons to help you understand the motorcycles behind the specifications.',anchor);
 const nav=panel.querySelector('nav');
 nav.classList.add('anybike-v2-story-grid');
 panel.classList.add('anybike-v2-global-feature');
 const brandLabel=document.createElement('p');brandLabel.className='anybike-v2-global-eyebrow';
 brandLabel.textContent='ANYBIKE GLOBAL';
 panel.querySelector('h2').before(brandLabel);
 // Feature the editorial stories before the compact market directory.
 anchor.before(panel);
 const more={label:'Explore all AnyBike Global stories →',url:'/anybike-global.html'};
 const renderStories=entries=>{
  if(!entries.length){panel.remove();return;}
  nav.replaceChildren();
  for(const entry of entries){
   const card=document.createElement('article');card.className='anybike-v2-story-card';
   const eyebrow=document.createElement('p');eyebrow.className='anybike-v2-story-tag';
   eyebrow.textContent=entry.tag||'Motorcycle story';
   const title=document.createElement('h3');title.textContent=entry.label;
   const summary=document.createElement('p');summary.textContent=entry.description||'Read the published story on AnyBike Global.';
   const action=document.createElement('a');action.href=entry.url;
   action.textContent='Read story →';
   card.append(eyebrow,title,summary,action);nav.append(card);
  }
  const moreLink=document.createElement('a');moreLink.href=more.url;
  moreLink.className='anybike-v2-global-all';moreLink.textContent=more.label;
  panel.append(moreLink);
 };
 try{
  const doc=new DOMParser().parseFromString(await fetchPublished('/anybike-global.html'),'text/html');
  const entries=[];
  for(const article of doc.querySelectorAll('article.tile')){
   const title=article.querySelector('h3')?.textContent?.trim();
   if(!title)continue;
   const names=(article.getAttribute('data-manufacturer')||'').split(',').map(normalize);
   const same=names.length&&names.some(x=>x===normalize(make));
   const fallback=(!names.some(Boolean)&&(' '+normalize(title)+' ').includes(' '+normalize(make)+' '));
   if(!same&&!fallback)continue;
   const direct=article.querySelector('a[href^="/global/"]');
   const path=direct?.getAttribute('href')||('/anybike-global.html#'+article.id);
   if(!/^\/(?:global\/[a-z0-9-]+\.html|anybike-global\.html#[a-z0-9-]+)$/.test(path))continue;
   const description=article.querySelector('p')?.textContent?.trim()||'';
   const tag=article.querySelector('.tag')?.textContent?.trim()||'AnyBike Global';
   entries.push({label:title,url:path,description,tag});
  }
  renderStories(entries.slice(0,6));
 }catch(error){renderStories([]);console.warn('V2 published Global index unavailable',error);}
}
// A failed or incomplete catalogue identity must not create model-specific links.
if(make&&current?.model)await Promise.allSettled([modelNavigation(),manufacturerNavigation(),countryNavigation(),globalNavigation()]);
