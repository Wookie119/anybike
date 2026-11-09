// AnyBike database-first research cards for the EXISTING BMW model URLs.
// Uses only the path-allowlisted public RPC projection; never reads raw editorial.
// The original manufacturer-guide card remains when its database section is empty.
const safeText=value=>typeof value==='string'?value.trim():'';
const arr=value=>Array.isArray(value)?value:[];
const https=value=>typeof value==='string'&&/^https:\/\//.test(value);
const internal=value=>typeof value==='string'&&/^\/(?:bmw-[a-z0-9]+|motorcycle-type-[a-z0-9-]+|markets\/[a-z0-9-]+)\.html$/.test(value);
const text=(tag,value,className)=>{
 const el=document.createElement(tag);el.textContent=String(value??'');
 if(className)el.className=className;
 return el;
};
const sourceLink=(url,label)=>{
 if(!https(url))return null;
 const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;
 return a;
};
const routeLink=entry=>{
 if(!entry||!internal(entry.url)||!safeText(entry.label))return null;
 const a=document.createElement('a');a.href=entry.url;a.textContent=entry.label;return a;
};
/**
 * Use only approved relative URLs from the published BMW projection.
 * Prevent duplicate, self-referential and malformed links without altering
 * source editorial records or generating speculative related motorcycles.
 */
export function filterModelNavigationEntries(items,currentPath=''){
 const seen=new Set();
 return arr(items).filter(entry=>{
  if(!entry||!internal(entry.url)||!safeText(entry.label))return false;
  if(entry.url===currentPath||seen.has(entry.url))return false;
  seen.add(entry.url);
  return true;
 });
}
const section=(name,title)=>{
 const element=document.createElement('section');element.className='card anybike-db-research-card';
 element.dataset.anybikeDbSection=name;element.append(text('h2',title));
 return element;
};
const createColours=items=>{
 const entries=arr(items).filter(x=>safeText(x?.name));
 if(!entries.length)return null;
 const el=section('factory_colours','Factory colours');
 el.append(text('p','Factory colour references are taken from dated manufacturer records. The source year may be an announcement year, not the motorcycle model year; confirm the actual year, edition and market.'));
 const grid=document.createElement('div');grid.className='anybike-db-mini-grid';
 for(const c of entries){
  const card=document.createElement('article');
  card.append(text('h3',c.name));
  // Existing manufacturer colour records can use the press announcement year.
  // Never relabel that as a verified model year without separate validation.
  const meta=[safeText(c.variant),safeText(c.market),c.model_year?'Source record year: '+c.model_year+' · confirm model year':''].filter(Boolean);
  if(meta.length)card.append(text('p',meta.join(' · ')));
  const link=sourceLink(c.source,'Manufacturer source ↗');if(link)card.append(link);
  grid.append(card);
 }
 el.append(grid);return el;
};
const specValue=(value,unit)=>{
 const number=typeof value==='number'?value:null;
 return Number.isFinite(number)?number.toLocaleString('en-GB')+unit:'';
};
const createSpecs=items=>{
 const entries=arr(items).filter(x=>x&&https(x.source));
 if(!entries.length)return null;
 const el=section('technical_specifications','Documented technical specifications');
 el.append(text('p','These figures apply to the cited manufacturer reference and market, not necessarily to every year or equipment edition. Check the individual motorcycle.'));
 const grid=document.createElement('div');grid.className='anybike-db-mini-grid';
 for(const spec of entries){
  const card=document.createElement('article');
  card.append(text('h3',[safeText(spec.market),safeText(spec.model_year),safeText(spec.variant)].filter(Boolean).join(' · ')||'Manufacturer technical reference'));
  const fields=[
   ['Engine',specValue(spec.engine_cc,' cc')],['Power',specValue(spec.power_hp,' hp')],
   ['Torque',specValue(spec.torque_nm,' Nm')],['Battery',specValue(spec.battery_kwh,' kWh')],
   ['Transmission',safeText(spec.transmission)]
  ].filter(([,value])=>value);
  const list=document.createElement('dl');list.className='anybike-db-tech-list';
  for(const [label,value]of fields){list.append(text('dt',label),text('dd',value));}
  card.append(list);
  const link=sourceLink(spec.source,'Manufacturer technical source ↗');if(link)card.append(link);
  grid.append(card);
 }
 el.append(grid);return el;
};
const createNavigation=(name,title,items)=>{
 const currentPath=typeof location==='object'?location.pathname:'';
 const links=filterModelNavigationEntries(items,currentPath).map(routeLink).filter(Boolean);
 if(!links.length)return null;
 const el=section(name,title),nav=document.createElement('nav');
 nav.className='anybike-db-model-links';nav.setAttribute('aria-label',title);
 nav.append(...links);el.append(nav);return el;
};
const createEngineering=items=>{
 const entries=arr(items).filter(x=>safeText(x?.title)&&safeText(x?.description));
 if(!entries.length)return null;
 const el=section('engineering_gallery','Engineering and buying research');
 const grid=document.createElement('div');grid.className='anybike-db-mini-grid';
 for(const e of entries){
  const card=document.createElement('article');
  card.append(text('h3',e.title),text('p',e.description));grid.append(card);
 }
 el.append(grid);return el;
};
const createHeritage=items=>{
 const entries=arr(items).filter(x=>safeText(x?.title));
 if(!entries.length)return null;
 const el=section('heritage','Factory, ownership and heritage');
 for(const entry of entries){
  const details=document.createElement('details');details.className='anybike-db-heritage';
  details.append(text('summary',entry.title));
  if(safeText(entry.subtitle))details.append(text('p',entry.subtitle));
  for(const p of arr(entry.paragraphs).filter(safeText))details.append(text('p',p));
  el.append(details);
 }
 return el;
};
/**
 * Replaces only legacy section cards whose exact heading matches a
 * populated, model-identity-checked Supabase projection. A MutationObserver
 * handles older page loaders resolving after the new data feed.
 * Never affects hero, sale stock, year galleries or sourcing actions.
 */
export function applyBmwDatabaseSections(body,content){
 if(!body||!content||content.make!=='BMW')return ()=>{};
 const cards=[
  ['factory_colours',createColours(content.factory_colours),['factory colours']],
  ['technical_specifications',createSpecs(content.technical_specifications),['technical specifications']],
  ['related_models',createNavigation('related_models','Explore related BMW models',content.related_models),['explore related bmw models']],
  ['motorcycle_types',createNavigation('motorcycle_types','Motorcycle types',content.motorcycle_types),['motorcycle types']],
  ['engineering_gallery',createEngineering(content.engineering_cards),['engineering and buying research']],
  ['heritage',createHeritage(content.heritage),['factory, ownership and heritage']],
  ['country_markets',createNavigation('country_markets','Countries and markets',content.country_markets),['countries and markets']]
 ].filter(([,card])=>Boolean(card));
 let updating=false;
 const reconcile=()=>{
  if(updating)return;
  updating=true;
  try{
   for(const [id,card,headings] of cards){
    const others=[...body.children].filter(child=>
     child!==card&&child.matches?.('section.card')&&
     !child.dataset.anybikeDbSection&&
     headings.includes(safeText(child.querySelector('h2')?.textContent).toLowerCase())
    );
    // Replace the matching legacy research card at its approved position.
    // Appending every database card to the end moves research below actions
    // and silently changes the page's editorial layout.
    if(others.length){
     const primary=others[0];
     if(primary!==card)primary.replaceWith(card);
     for(const duplicate of others.slice(1))duplicate.remove();
    }else if(!card.isConnected){
     // A database-only section has no old slot to replace. Keep it with
     // research cards rather than introducing a second page layout.
     const anchors=[...body.children].filter(child=>
      child.matches?.('section.card')&&
      (child.classList.contains('anybike-db-research-card')||
       child.querySelector('h2'))
     );
     const last=anchors.at(-1);
     if(last)last.after(card);else body.append(card);
    }
   }
  }finally{updating=false;}
 };
 reconcile();
 const observer=new MutationObserver(records=>{
  if(records.some(r=>r.addedNodes.length))reconcile();
 });
 observer.observe(body,{childList:true});
 return ()=>observer.disconnect();
}
