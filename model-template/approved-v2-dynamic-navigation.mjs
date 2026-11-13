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
 if(window.__anybikeV2ModelIdentity?.make&&window.__anybikeV2ModelIdentity?.model){
  resolve(window.__anybikeV2ModelIdentity);return;
 }
 window.addEventListener('anybike:v2-model-identity-ready',
  ()=>resolve(window.__anybikeV2ModelIdentity),{once:true});
});
const make=String(current.make||'').trim();
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
 // The established public RPC only returns already-published dedicated guide URLs.
 try{
  const db=window.supabase?.createClient?.(ENDPOINT,KEY);
  if(db){
   const {data,error}=await db.rpc('public_anybike_manufacturer_model_routes_v1',{p_make:make});
   if(error)throw error;
   for(const row of Array.isArray(data)?data:[]){
    if(normalize(row.make)!==normalize(make)||!validModelPath(row.url)||!String(row.model||'').trim())continue;
    approved.set(normalize(row.model),{label:row.model,url:row.url});
   }
  }
 }catch(error){console.warn('V2 public model routes unavailable',error);}
 // This existing public JSON catalogue is a directory of names, not a claim
 // that their engineering research is approved. Prefer a validated dedicated
 // route; otherwise use the existing exact-model generic route until rollout.
 let models=[];
 try{
  const published=JSON.parse(await fetchPublished('/data/motorcycle-catalogue-master.json'));
  models=(Array.isArray(published.models)?published.models:[])
   .filter(row=>normalize(row.make)===normalize(make)&&typeof row.model==='string'&&row.model.trim())
   .filter(row=>!/\b(?:apr|representative|finance offer|discount)\b/i.test(row.model))
   .map(row=>row.model.trim());
 }catch(error){console.warn('V2 public model directory unavailable',error);}
 const combined=new Map();
 for(const name of models)combined.set(normalize(name),{
  label:name,url:'/motorcycle-model-guide.html?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(name)
 });
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
   const modelWords=normalize(current.model).split(' ').filter(Boolean);
   // A model family is manufacturer-specific: "R" identifies BMW's broad
   // R-series, but the same prefix cannot be treated as a family rule for
   // Honda, Suzuki, Harley-Davidson or any other manufacturer.
   const bmwSeries=label=>{
    if(normalize(make)!=='bmw')return '';
    const match=String(label||'').trim().match(/^([RFMKCSG])\s*(?=\d|nine\b)/i);
    return match?match[1].toUpperCase():'';
   };
   const currentSeries=bmwSeries(current.model);
   // Suzuki's RM and RM-Z are motocross ranges; Address/Bandit are not
   // related to RM250 merely because they belong to the same manufacturer.
   const suzukiMotocross=label=>/^RM(?:-?Z)?\s*\d+/i.test(String(label||'').trim());
   const isSuzukiMotocross=normalize(make)==='suzuki'&&suzukiMotocross(current.model);
   const currentNumber=Number(modelWords.find(word=>/^\d{3,4}$/.test(word))||0);
   const score=item=>{
    const words=normalize(item.label).split(' ').filter(Boolean);
    if(item.current)return -1000;
    let points=0;
    if(currentSeries&&bmwSeries(item.label)===currentSeries)points+=25;
    if(isSuzukiMotocross&&suzukiMotocross(item.label)){
     points+=25;
     // Closest RM two-strokes first; RM-Z motocross models are related by
     // riding discipline, not represented as an identical engine platform.
     if(/^RM\s*\d+/i.test(item.label))points+=10;
    }
    // Prioritise the nearest GS relatives *within* BMW's R family.
    // The R-series itself remains broad: R 18 and R 32 are still eligible.
    if(normalize(make)==='bmw'){
     if(modelWords.includes('gs')&&words.includes('gs'))points+=14;
     const number=Number(words.find(word=>/^\d{3,4}$/.test(word))||0);
     if(currentNumber&&number){
      const distance=Math.abs(currentNumber-number);
      points+=distance===0?10:distance<=100?8:distance<=200?6:distance<=400?3:0;
     }
    }else{
     // Without an approved manufacturer-specific family definition, use
     // shared descriptive model tokens, never a one-letter prefix.
     if(modelWords[0]?.length>2&&words[0]===modelWords[0])points+=8;
     if(modelWords.length>1&&modelWords[1].length>2&&words[1]===modelWords[1])points+=7;
    }
    if(modelWords.some(x=>x.length>2&&words.includes(x)))points+=3;
    return points;
   };
   // Related pills must stay inside the same BMW series. A matching
   // capacity number alone does NOT make a K 1300 S related to an R 1300 GS.
   // The expandable full catalogue below remains unrestricted.
   const ranked=links.filter(item=>{
    if(item.current)return false;
    if(normalize(make)==='bmw'&&currentSeries)
     return bmwSeries(item.label)===currentSeries;
    if(isSuzukiMotocross)return suzukiMotocross(item.label);
    return true;
   }).sort((a,b)=>score(b)-score(a)||a.label.localeCompare(b.label,'en-GB',{numeric:true}));
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
  if(!db)return;
  const {data,error}=await db.rpc('public_anybike_country_navigation_v1');
  if(error)throw error;
  const rows=(Array.isArray(data)?data:[]).filter(x=>validCountryPath(x.url)&&String(x.label||'').trim());
  if(!rows.length)return;
  const regions=new Map(),seen=new Set();
  for(const item of rows){
   if(seen.has(item.url))continue;seen.add(item.url);
   const region=String(item.region||'Other markets');
   if(!regions.has(region))regions.set(region,[]);
   regions.get(region).push({label:item.label,url:item.url});
  }
  nav.replaceChildren();
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
 }catch(error){console.warn('V2 country directory unavailable',error);}
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
await Promise.allSettled([modelNavigation(),manufacturerNavigation(),countryNavigation(),globalNavigation()]);
