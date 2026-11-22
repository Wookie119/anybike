/* AnyBike UK motorcycle comparison — one Supabase directory, verified specifications; no per-model edits. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const text=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
const absolute=u=>{try{const x=new URL(u,location.origin);return x.origin===location.origin?x.href:null}catch{return null}};
const MAX=4,MIN=2;
let all=[],chosen=[null,null,null],categories=new Map(),ridingStyles=new Map(),activeCategory='';
let stockShortlist=new Set();
const FACTS_RPC='https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_verified_model_facts_v1';
const PRESENTATION_RPC='https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_comparison_presentation_v1';
let categoryArtwork=[],approvedModelArtwork=new Map();
const FACTS_KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
const factRequests=new Map();
let factsRenderGeneration=0;
const measuredRows=[
 ['Engine displacement','engine','Engine displacement','cc'],
 ['Power','performance','Maximum power','hp'],
 ['Torque','performance','Maximum torque','Nm'],
 ['Seat height','dimensions','Seat height','mm'],
 ['Fuel tank','dimensions','Fuel tank','litres'],
 ['Unladen road-ready weight','dimensions','Unladen road-ready weight','kg']
];
function sourceUrl(v){try{const u=new URL(v);return u.protocol==='https:'?u.href:null}catch{return null}}
async function fetchVerifiedFacts(bike){
 const key=bike.model_id;
 if(factRequests.has(key))return factRequests.get(key);
 const job=(async()=>{
  const response=await fetch(FACTS_RPC,{method:'POST',headers:{apikey:FACTS_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({p_make:bike.make,p_model:bike.model}),signal:AbortSignal.timeout(6500)});
  if(!response.ok)throw Error('Verified facts service '+response.status);
  const rows=await response.json();
  if(!Array.isArray(rows))throw Error('Invalid source-verified facts response');
  return rows.filter(f=>f&&f.make===bike.make&&f.model?.toLowerCase()===bike.model.toLowerCase()&&
   Number.isSafeInteger(Number(f.fact_id))&&Number(f.fact_id)>0&&sourceUrl(f.source_url)&&
   typeof f.category==='string'&&typeof f.label==='string');
 })();
 factRequests.set(key,job);
 job.catch(()=>{if(factRequests.get(key)===job)factRequests.delete(key)});
 return job;
}
function exactMeasurement(rows,category,label,unit){
 const matches=rows.filter(f=>f.category===category&&f.label.toLowerCase()===label.toLowerCase()&&
  f.value&&typeof f.value==='object'&&!Array.isArray(f.value)&&
  typeof f.value.amount==='number'&&Number.isFinite(f.value.amount)&&f.value.amount>=0&&
  f.value.unit===unit&&sourceUrl(f.source_url));
 if(matches.length!==1)return null; // no ambiguous generations or conflicting units
 const f=matches[0];
 const qualifier=typeof f.value.qualifier==='string'&&/^[a-zA-Z0-9 .,()\/-]{1,70}$/.test(f.value.qualifier)?f.value.qualifier:'';
 return {display:f.value.amount.toLocaleString('en-GB',{maximumFractionDigits:2})+' '+unit+
   (qualifier?' ('+qualifier+')':''),source:f.source_url};
}
async function fillVerifiedComparisons(bikes,tableBody){
 const generation=++factsRenderGeneration;
 const positions=new Map();
 for(const [heading,category,label,unit] of measuredRows){
  const row=text('tr');row.append(text('th',heading));
  const cells=[];
  for(const bike of bikes){
   const cell=text('td','Loading…');cells.push(cell);row.append(cell);
  }
  positions.set(heading,cells);tableBody.append(row);
 }
 const facts=await Promise.allSettled(bikes.map(fetchVerifiedFacts));
 if(generation!==factsRenderGeneration||!tableBody.isConnected)return;
 measuredRows.forEach(([heading,category,label,unit])=>{
  const cells=positions.get(heading);
  facts.forEach((result,index)=>{
   const cell=cells[index];cell.replaceChildren();
   const found=result.status==='fulfilled'?exactMeasurement(result.value,category,label,unit):null;
   if(!found){cell.textContent='—';return}
   cell.append(text('span',found.display),text('span',' '));
   const link=text('a','Source');link.href=found.source;link.target='_blank';link.rel='noopener noreferrer';
   link.className='compare-fact-source';cell.append(link);
  });
 });
}

function show(message){$('compare-status').textContent=message}
function selectedIds(){return chosen.filter(Boolean).map(x=>x.model_id)}
function writeShareUrl(items){
 const url=new URL(location.href);
 if(items.length>=MIN&&new Set(items.map(x=>x.model_id)).size===items.length){url.searchParams.set('bikes',items.map(x=>x.model_id).join(','))}
 else url.searchParams.delete('bikes');
 history.replaceState(null,'',url.pathname+url.search+url.hash);
}
function approvedPhoto(photo){
 if(!photo||typeof photo!=='object')return null;
 const url=sourceUrl(photo.url),source=sourceUrl(photo.source);
 if(!url||!source||typeof photo.alt!=='string'||!photo.alt.trim()||typeof photo.licence!=='string'||!photo.licence.trim())return null;
 return {url,source,alt:photo.alt,attribution:typeof photo.attribution==='string'?photo.attribution:'',licence:photo.licence};
}
function photoCredit(photo){
 const small=text('small');small.className='comparison-photo-credit';
 const link=text('a','Photo credit · '+photo.licence);link.href=photo.source;link.rel='noopener noreferrer';link.target='_blank';
 link.title=photo.attribution||photo.licence;small.append(link);return small;
}
function renderCategoryPhotos(){
 const select=$('compare-category'),panel=select?.closest('.comparison-filter-panel');
 if(!panel||!categoryArtwork.length)return;
 let host=$('comparison-category-photos');
 if(!host){host=text('nav');host.id='comparison-category-photos';host.className='comparison-category-photos';host.setAttribute('aria-label','Choose a motorcycle riding style');panel.insertAdjacentElement('afterend',host)}
 host.hidden=!categoryArtwork.some(category=>approvedPhoto(category?.image));
 const fragment=document.createDocumentFragment();
 for(const category of categoryArtwork){
  if(!category||!/^[a-z-]+$/.test(category.slug)||typeof category.label!=='string'||!category.label.trim())continue;
  const wrap=text('div');wrap.className='comparison-category-photo-item';
  const button=text('button');button.type='button';button.className='comparison-category-photo-card';
  button.setAttribute('aria-pressed',String(activeCategory===category.slug));
  const photo=approvedPhoto(category.image);
  if(photo){
   const img=text('img');img.src=photo.url;img.alt=photo.alt;img.loading='lazy';img.decoding='async';img.onerror=()=>{img.remove();button.classList.add('comparison-category-no-image')};button.append(img);
  }else button.classList.add('comparison-category-no-image');
  const title=text('span',category.label);title.className='comparison-category-photo-title';button.append(title);
  button.onclick=()=>{activeCategory=activeCategory===category.slug?'':category.slug;select.value=activeCategory;applyFilters();show(activeCategory?'Choose motorcycles in the selected riding style.':'Choose motorcycles from all riding styles.')};
  wrap.append(button);if(photo)wrap.append(photoCredit(photo));fragment.append(wrap);
 }
 host.replaceChildren(fragment);
}
function selectedPhoto(modelId){return approvedModelArtwork.get(modelId)||null}
async function loadApprovedPresentation(){
 try{
  const response=await fetch(PRESENTATION_RPC,{method:'POST',headers:{apikey:FACTS_KEY,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw Error('Approved presentation '+response.status);
  const data=await response.json();
  if(!data||!Array.isArray(data.categories)||!Array.isArray(data.images))throw Error('Invalid approved imagery response');
  const photos=new Map();
  for(const item of data.images){const photo=approvedPhoto(item);if(Number.isSafeInteger(item?.model_id)&&photo)photos.set(item.model_id,photo)}
  approvedModelArtwork=photos;
  categoryArtwork=data.categories.filter(item=>item&&typeof item.slug==='string'&&typeof item.label==='string');
  renderCategoryPhotos();renderSelectors();
 }catch(error){console.warn('Approved imagery unavailable; comparison remains functional',error)}
}

// Simple customer-facing styles. Legacy catalogue categories remain in the source data.
// Source of truth for customer-facing names: /motorcycle-types.html.
// Map legacy catalogue terms only; do not create new public riding categories.
// Approved riding-style classification comes from Supabase, not a browser-side alias list.
function ridingStyle(id){return ridingStyles.get(id)||'';}
function matchesBike(bike){
 return !activeCategory||ridingStyle(bike.model_id)===activeCategory;
}
function applyFilters(){
 chosen=chosen.map(bike=>bike&&matchesBike(bike)?bike:null);
 renderSelectors();
 const matching=all.filter(matchesBike);
 $('filter-count').textContent=matching.length+' motorcycles to choose from'+(activeCategory?' in this riding style':'')+'. Select the manufacturer and model below.';
 renderCategoryPhotos();
}
function addSelector(){
 if(chosen.length>=MAX)return;
 chosen.push(null);renderSelectors();
}
function cardPicker(index){
 const shell=text('div');shell.className='compare-picker';
 const h=text('h3','Motorcycle '+(index+1));shell.append(h);
 const selected=chosen[index];
 const makes=[...new Set(all.filter(matchesBike).map(x=>x.make))].sort((a,b)=>a.localeCompare(b,'en'));
 const fields=text('div');fields.className='compare-picker-fields';
 const makeLabel=text('label','Manufacturer');const make=text('select');
 const any=text('option','Choose manufacturer');any.value='';make.append(any);
 for(const brand of makes){const o=text('option',brand);o.value=brand;make.append(o)}
 make.value=selected?.make||'';
 const modelLabel=text('label','Motorcycle model');const model=text('select');
 const refreshModels=()=>{
  model.replaceChildren();const blank=text('option','Choose model');blank.value='';model.append(blank);
  const candidates=all.filter(x=>x.make===make.value&&matchesBike(x)).sort((a,b)=>a.model.localeCompare(b.model,'en'));
  const usedIds=new Set(chosen.filter((c,i)=>i!==index&&c).map(c=>c.model_id));
  for(const bike of candidates){
   const op=text('option',bike.model);op.value=String(bike.model_id);
   op.disabled=usedIds.has(bike.model_id);model.append(op);
  }
  if(!candidates.length&&make.value){const unavailable=text('option','No models found');unavailable.disabled=true;model.append(unavailable)}
  model.disabled=!make.value;
  model.value=chosen[index]?.make===make.value?String(chosen[index]?.model_id||''):'';
 };
 make.onchange=()=>{chosen[index]=null;refreshModels();renderResults()};
 model.onchange=()=>{chosen[index]=all.find(x=>x.model_id===Number(model.value))||null;renderSelectors()};
 refreshModels();
 makeLabel.append(make);modelLabel.append(model);fields.append(makeLabel,modelLabel);
 shell.append(fields);
 if(selected){const photo=selectedPhoto(selected.model_id);if(photo){
  const area=text('div');area.className='comparison-selected-photo comparison-photo-frame';area.style.setProperty('--comparison-photo','url('+JSON.stringify(photo.url)+')');
  const img=text('img');img.src=photo.url;img.alt=photo.alt;img.loading='lazy';img.decoding='async';img.onerror=()=>area.remove();
  area.append(img,photoCredit(photo));shell.append(area);
 }}
 const actions=text('div');actions.className='compare-actions';
 const remove=text('button','Remove');remove.type='button';remove.className='subtle-button';remove.setAttribute('aria-label','Remove motorcycle '+(index+1));
 remove.onclick=()=>{chosen.splice(index,1);while(chosen.length<MIN)chosen.push(null);renderSelectors()};
 actions.append(remove);shell.append(actions);return shell;
}
function renderSelectors(){
 const host=$('compare-selectors');host.replaceChildren();
 chosen.forEach((_,i)=>host.append(cardPicker(i)));
 $('add-motorcycle').disabled=chosen.length>=MAX;
 renderResults();
}
// A customer can shortlist one or two of their compared motorcycles for Available Stock.
function renderStockShortlist(items){
 let host=$('comparison-stock-shortlist');
 if(!host){host=text('section');host.id='comparison-stock-shortlist';host.className='comparison-stock-shortlist';host.setAttribute('aria-label','Find compared motorcycles for sale');$('comparison-results').prepend(host)}
 const validIds=new Set(items.map(b=>b.model_id));
 stockShortlist=new Set([...stockShortlist].filter(id=>validIds.has(id)));
 const title=text('h3','Find your next motorcycle');
 const description=text('p','Choose one or two of the motorcycles you compared, then search Available Stock.');
 const choices=text('div');choices.className='comparison-stock-choices';
 for(const bike of items){
  const label=text('label');label.className='comparison-stock-choice';
  const check=text('input');check.type='checkbox';check.value=String(bike.model_id);check.checked=stockShortlist.has(bike.model_id);
  const name=text('span',bike.make+' '+bike.model);
  check.onchange=()=>{
   if(check.checked){if(stockShortlist.size>=2){check.checked=false;return}stockShortlist.add(bike.model_id)}
   else stockShortlist.delete(bike.model_id);
   renderStockShortlist(items);
  };
  label.append(check,name);choices.append(label);
 }
 const action=text('button','Find Bikes for Sale');action.type='button';action.className='comparison-find-stock';
 action.disabled=stockShortlist.size===0||stockShortlist.size>2;
 action.onclick=()=>{
  const bikes=items.filter(b=>stockShortlist.has(b.model_id)).slice(0,2);
  if(!bikes.length)return;
  const url=new URL('/available-stock.html',location.origin);
  url.searchParams.set('compare',bikes.map(b=>b.model_id).join(','));
  url.searchParams.set('bikes',bikes.map(b=>b.model_id).join(','));
  url.searchParams.set('makes',bikes.map(b=>b.make).join('|'));
  url.searchParams.set('models',bikes.map(b=>b.model).join('|'));
  location.assign(url.href);
 };
 const help=text('small',stockShortlist.size===0?'Tick one or two motorcycles above to enable Find Bikes for Sale.':stockShortlist.size+' of 2 motorcycles selected · Ready to search Available Stock.');
 host.replaceChildren(title,description,choices,action,help);
}
function renderResults(){
 const host=$('comparison-results');host.replaceChildren();
 const items=chosen.filter(Boolean),ids=selectedIds(),distinct=new Set(ids);
 const valid=items.length>=MIN&&distinct.size===items.length;
 writeShareUrl(valid?items:[]);
 $('share-comparison').disabled=!valid;
 $('print-comparison').disabled=!valid;
 const linkField=$('share-link');
 if(linkField){linkField.value=valid?location.href:'';linkField.hidden=!valid}
 if(items.length<MIN){show('Choose at least two motorcycles to build a comparison.');return}
 if(!valid){show('Please choose different motorcycles in each position.');return}
 show('Comparing '+items.length+' motorcycles.');
 renderStockShortlist(items);
 const intro=text('p','Compare key specifications and open each motorcycle’s model page for more details.');
 host.append(intro);
 const wrap=text('div');wrap.className='comparison-table-scroll';
 const table=text('table');table.className='comparison-table';
 const head=text('thead'),tr=text('tr');tr.append(text('th','Comparison'));
 for(const x of items){tr.append(text('th',x.make+' '+x.model))}head.append(tr);table.append(head);
 if(items.some(b=>selectedPhoto(b.model_id))){
  const pBody=text('tbody'),pRow=text('tr');pRow.className='comparison-model-photo-row';pRow.append(text('th','Motorcycle photograph'));
  for(const bike of items){
   const cell=text('td'),photo=selectedPhoto(bike.model_id);
   if(photo){
     const frame=text('div');frame.className='comparison-photo-frame';frame.style.setProperty('--comparison-photo','url('+JSON.stringify(photo.url)+')');
     const img=text('img');img.src=photo.url;img.alt=photo.alt;img.loading='lazy';img.decoding='async';
     img.onerror=()=>{frame.remove();cell.prepend(text('span','Photograph unavailable'))};
     frame.append(img);cell.append(frame,photoCredit(photo));
   }else cell.append(text('span','Photograph not yet approved'));
   pRow.append(cell);
  }pBody.append(pRow);table.append(pBody);
 }
 const body=text('tbody');
 const typeRow=text('tr');typeRow.append(text('th','Motorcycle type'));
 for(const bike of items)typeRow.append(text('td',categories.get(bike.model_id)||'—'));
 body.append(typeRow);table.append(body);
 // Technical measurements are populated only from AnyBike's independently sourced research.
 const factBody=text('tbody');factBody.className='comparison-facts';table.append(factBody);
 const linksBody=text('tbody'),links=text('tr');links.append(text('th','Explore this motorcycle'));
 for(const bike of items){const td=text('td'),a=text('a','View model details');a.href=absolute(bike.url)||'/motorcycle-manufacturers.html';td.append(a);links.append(td)}
 linksBody.append(links);table.append(linksBody);wrap.append(table);host.append(wrap);
 void fillVerifiedComparisons(items,factBody);
 const notice=text('p','Figures shown are from linked sources and may refer to particular model years or versions. Confirm current specifications, availability and prices with a dealer.');
 notice.className='comparison-notice';host.append(notice);
 // Comparison URL is synchronised by writeShareUrl, including when a selection is cleared.
}
async function share(){
 const url=location.href;
 try{await navigator.clipboard.writeText(url);show('Comparison link copied. You can paste it into WhatsApp, an email or a message.')}
 catch{const input=prompt('Copy your comparison link:',url);if(input!==null)show('Your comparison link is shown above.')}
}
function restore(){
 chosen=[null,null,null];
 const parts=(new URLSearchParams(location.search).get('bikes')||'').split(',').filter(Boolean);
 if(parts.length<2||parts.length>MAX||parts.some(x=>!/^[1-9][0-9]*$/.test(x)))return;
 const ids=parts.map(Number);
 if(new Set(ids).size!==ids.length)return;
 const resolved=ids.map(id=>all.find(x=>x.model_id===id));
 if(resolved.every(Boolean))chosen=resolved;
}
function installDirectoryStyles(styles){
 const select=$('compare-category');
 if(!select||!Array.isArray(styles))return;
 select.querySelectorAll('option:not([value=""])').forEach(option=>option.remove());
 const seen=new Set();
 for(const style of styles){
  if(!style||typeof style.slug!=='string'||!/^[a-z-]+$/.test(style.slug)||
     typeof style.label!=='string'||!style.label.trim()||seen.has(style.slug))continue;
  const option=text('option',style.label);option.value=style.slug;select.append(option);seen.add(style.slug);
 }
 select.onchange=()=>{
  activeCategory=select.value;
  applyFilters();
  renderCategoryPhotos();
  show(activeCategory?'Choose motorcycles in the selected riding style.':'Choose motorcycles from all riding styles.');
 };
}
// Read manufacturer navigation from the canonical Supabase catalogue.
// The page contains no repeated brand list, so new brands appear automatically.
async function loadComparisonManufacturers(){
 const host=$('comparison-manufacturer-links');if(!host)return;
 try{
  const response=await fetch('https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_comparison_manufacturers_v1',{
   method:'POST',headers:{apikey:FACTS_KEY,'Content-Type':'application/json'},
   body:'{}',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Manufacturer directory unavailable');
  const brands=await response.json();
  if(!Array.isArray(brands)||!brands.length)return;
  const fragment=document.createDocumentFragment();
  for(const entry of brands){
   if(!entry||typeof entry.name!=='string'||!entry.name.trim()||
      typeof entry.url!=='string'||!/^\/[a-z0-9-]+\.html(?:\?make=[^&#]+)?$/i.test(entry.url))continue;
   const link=text('a',entry.name);link.href=entry.url;fragment.append(link);
  }
  if(fragment.childNodes.length)host.replaceChildren(fragment);
 }catch(error){console.warn('Manufacturer links unavailable',error)}
}
async function start(){
 try{
  // Read the central AnyBike Supabase catalogue on every page load.
  // No checked-in model JSON, category JSON or manufacturer lists.
  const response=await fetch('https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_comparison_directory_v1',{
   method:'POST',headers:{apikey:FACTS_KEY,'Content-Type':'application/json'},
   body:'{}',cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Live motorcycle directory HTTP '+response.status);
  const json=await response.json();
  if(!json||!Array.isArray(json.models)||!Array.isArray(json.styles))throw Error('Invalid live directory');
  const source=json.models;
  all=source.filter(x=>x&&Number.isSafeInteger(x.model_id)&&x.model_id>0&&
   typeof x.make==='string'&&x.make.trim()&&typeof x.model==='string'&&x.model.trim()&&
   (x.url===null||typeof x.url==='string'&&/^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(x.url))
  ).map(x=>({
   make:x.make,model:x.model,model_id:x.model_id,
   url:x.url||'/motorcycle-model-guide.html?make='+encodeURIComponent(x.make)+'&model='+encodeURIComponent(x.model)
  }));
  if(!all.length)throw Error('Live motorcycle directory is empty');
  categories.clear();ridingStyles.clear();
  for(const item of source){
   if(!Number.isSafeInteger(item?.model_id))continue;
   if(typeof item.category==='string')categories.set(item.model_id,item.category);
   if(typeof item.style==='string')ridingStyles.set(item.model_id,item.style);
  }
  installDirectoryStyles(json.styles);
  restore();renderSelectors();applyFilters();
  void loadComparisonManufacturers();
  void loadApprovedPresentation();
  $('clear-comparison').onclick=()=>{
   chosen=[null,null,null];activeCategory='';stockShortlist.clear();
   const select=$('compare-category');if(select)select.value='';
   applyFilters();show('Comparison cleared. Choose two to four motorcycles.');
  };
  $('add-motorcycle').onclick=addSelector;
  $('share-comparison').onclick=share;
  $('print-comparison').onclick=()=>window.print();
  window.addEventListener('popstate',()=>{restore();renderSelectors()});
 }catch(error){show('Motorcycles could not be loaded. Please refresh the page.');console.warn('AnyBike comparison directory unavailable',error)}
}
start();
})();
