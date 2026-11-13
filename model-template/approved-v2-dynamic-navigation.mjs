/* AnyBike approved V2 navigation. Shared by the approved master and future model routes.
 * Public sources only: manufacturer model routes, published model directory,
 * published manufacturer directory, country navigation RPC, and live Global index.
 * No private catalogue tables, draft stories, inventory, or credentials with write access.
 */
const ENDPOINT='https://tuehtnezhdnkqbbhttgp.supabase.co';
const KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
const current=window.__anybikeV2ModelIdentity||{make:'BMW',model:'R 1300 GS'};
const make=String(current.make||'').trim();
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
  .map(item=>({...item,current:normalize(item.label)===normalize(current.model)}));
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
   const name=node.getAttribute('data-name')||link?.textContent||'';
   if(!name||!link)continue;
   const path=new URL(link.getAttribute('href'),location.origin);
   if(path.origin!==location.origin||!/^\/(?:motorcycle-brand\.html|bmw-motorcycles\.html|harley-davidson-motorcycles\.html)$/.test(path.pathname))continue;
   const label=(link.textContent||name).replace(/\s+/g,' ').trim();
   const url=path.pathname+(path.search||'');
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
 const panel=makePanel('approvedV2GlobalStories','AnyBike Global — '+make+' stories',
  'Read published manufacturer stories, history and comparisons on AnyBike Global.',anchor);
 const nav=panel.querySelector('nav');
 const more={label:'Explore all AnyBike Global stories →',url:'/anybike-global.html'};
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
   entries.push({label:title,url:path});
  }
  safeNav(nav,[...entries.slice(0,12),more]);
 }catch(error){safeNav(nav,[more]);console.warn('V2 published Global index unavailable',error);}
}
await Promise.allSettled([modelNavigation(),manufacturerNavigation(),countryNavigation(),globalNavigation()]);
