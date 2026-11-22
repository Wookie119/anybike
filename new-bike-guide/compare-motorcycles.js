/* AnyBike UK motorcycle comparison — one template, checked-in canonical model routes.
   No invented specs and no per-model edits. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const text=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
const absolute=u=>{try{const x=new URL(u,location.origin);return x.origin===location.origin?x.href:null}catch{return null}};
const MAX=4,MIN=2;
let all=[],chosen=[null,null,null],categories=new Map(),activeCategory='',capacity=new Map(),engineFilterEnabled=false,engineMin=null,engineMax=null;
const FACTS_RPC='https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_verified_model_facts_v1';
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
// Simple customer-facing styles. Legacy catalogue categories remain in the source data.
const styleGroups=[
 ['Adventure',['adventure','adventure & gs','adventure scooters','dual sport','rally']],
 ['Sports',['sports','sport','sport & performance','racing']],
 ['Touring',['touring','touring & roadsters','sport touring','sports touring']],
 ['Naked & Roadsters',['roadsters','roadster','naked & roadsters']],
 ['Cruisers',['cruisers','heritage / cruiser']],
 ['Classics',['classics','classic','modern classics','heritage & historic']],
 ['Off-road',['off-road','motocross','trials','supermoto']],
 ['Scooters & Commuters',['scooters','scooter / electric','electric scooters','underbone','commuters']]
];
const customerStyles=[...styleGroups.map(group=>group[0]),'Other Motorcycles'];
function ridingStyle(id){
 const raw=(categories.get(id)||'').toLowerCase().trim();
 const found=styleGroups.find(([,aliases])=>aliases.includes(raw));
 return found?.[0]||'Other Motorcycles';
}
function matchesBike(bike){
 if(activeCategory&&ridingStyle(bike.model_id)!==activeCategory)return false;
 if(!engineFilterEnabled)return true;
 const cc=capacity.get(bike.model_id)?.cc;
 return Number.isInteger(cc)&&(engineMin===null||cc>=engineMin)&&(engineMax===null||cc<=engineMax);
}
function availableCount(){return all.filter(matchesBike).length}
function applyFilters(){
 chosen=chosen.map(bike=>bike&&matchesBike(bike)?bike:null);
 renderSelectors();
 const filtered=availableCount();
 $('filter-count').textContent=filtered+' motorcycle'+(filtered===1?'':'s')+' match'+(filtered===1?'es':'')+' your selection'+(engineFilterEnabled?' (models with a documented engine capacity only).':'.');
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
  for(const bike of candidates){const op=text('option',bike.model);op.value=String(bike.model_id);op.disabled=usedIds.has(bike.model_id);model.append(op)}
  if(!candidates.length&&make.value){const unavailable=text('option','No motorcycles in this category');unavailable.disabled=true;model.append(unavailable)}
  model.disabled=!make.value;
  model.value=chosen[index]?.make===make.value?String(chosen[index]?.model_id||''):'';
 };
 make.onchange=()=>{chosen[index]=null;refreshModels();renderResults()};
 model.onchange=()=>{chosen[index]=all.find(x=>x.model_id===Number(model.value))||null;renderSelectors()};
 refreshModels();
 makeLabel.append(make);modelLabel.append(model);fields.append(makeLabel,modelLabel);
 shell.append(fields);
 const actions=text('div');actions.className='compare-actions';
 const remove=text('button','Remove');remove.type='button';remove.className='subtle-button';remove.setAttribute('aria-label','Remove motorcycle '+(index+1));
 remove.onclick=()=>{chosen.splice(index,1);while(chosen.length<MIN)chosen.push(null);renderSelectors()};
 actions.append(remove);
 shell.append(actions);return shell
}
function renderSelectors(){
 const host=$('compare-selectors');host.replaceChildren();
 chosen.forEach((_,i)=>host.append(cardPicker(i)));
 $('add-motorcycle').disabled=chosen.length>=MAX;
 renderResults();
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
 const intro=text('p','Compare key specifications and open each motorcycle’s model page for more details.');
 host.append(intro);
 const wrap=text('div');wrap.className='comparison-table-scroll';
 const table=text('table');table.className='comparison-table';
 const head=text('thead'),tr=text('tr');tr.append(text('th','Comparison'));
 for(const x of items){tr.append(text('th',x.make+' '+x.model))}head.append(tr);table.append(head);
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
async function loadCategories(){
 try{
  const response=await fetch('/data/motorcycle-catalogue-master.json',{cache:'force-cache',signal:AbortSignal.timeout(6500)});
  if(!response.ok)return;
  const data=await response.json();
  for(const m of Array.isArray(data.models)?data.models:[]){
   if(Number.isSafeInteger(m.model_id)&&typeof m.category==='string'&&m.category.trim())categories.set(m.model_id,m.category.trim());
  }
  const select=$('compare-category');if(!select)return;
  const found=new Set(all.map(m=>ridingStyle(m.model_id)));
  const groups=customerStyles.filter(style=>found.has(style));
  select.querySelectorAll('option:not([value=""])').forEach(option=>option.remove());
  for(const group of groups){const option=text('option',group);option.value=group;select.append(option)}
  applyFilters();
  select.onchange=()=>{activeCategory=select.value;applyFilters();show(activeCategory?'Choose motorcycles in the '+activeCategory+' category.':'Choose motorcycles from any riding style.');};
  if(chosen.some(Boolean))renderResults();
 }catch(e){console.warn('Optional catalogue category filter unavailable',e)}
}
// Read manufacturer navigation from the canonical Supabase catalogue.
// The page contains no repeated brand list, so new brands appear automatically.
async function loadEngineSizes(){
 try{
  const response=await fetch('https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_comparison_engine_sizes_v1',{
   method:'POST',headers:{apikey:FACTS_KEY,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Engine capacity service unavailable');
  const rows=await response.json();
  if(!Array.isArray(rows))throw Error('Engine capacity data invalid');
  for(const row of rows)if(Number.isSafeInteger(row?.model_id)&&Number.isSafeInteger(row?.cc)&&
   row.cc>0&&row.cc<=3000&&sourceUrl(row.source_url))capacity.set(row.model_id,{cc:row.cc,source_url:row.source_url});
  $('capacity-preset').disabled=false;
  $('capacity-min').disabled=false;
  $('capacity-max').disabled=false;
  $('capacity-preset').onchange=()=>{
   const value=$('capacity-preset').value;
   if(!value){$('capacity-min').value='';$('capacity-max').value=''}
   else{
    const [min,max]=value.split('-');
    $('capacity-min').value=min||'';
    $('capacity-max').value=max||'';
   }
   updateEngineSelection();
  };
  for(const id of ['capacity-min','capacity-max'])$(id).onchange=()=>{
   $('capacity-preset').value='custom';updateEngineSelection();
  };
  applyFilters();
 }catch(error){$('filter-count').textContent='Engine size filtering is temporarily unavailable.';console.warn('Engine capacity filter unavailable',error)}
}
function updateEngineSelection(){
 const minText=$('capacity-min').value.trim(),maxText=$('capacity-max').value.trim();
 const min=minText?Number(minText):null,max=maxText?Number(maxText):null;
 if((min!==null&&(!Number.isInteger(min)||min<1||min>3000))||
    (max!==null&&(!Number.isInteger(max)||max<1||max>3000))||
    (min!==null&&max!==null&&min>max)){
  $('filter-count').textContent='Enter an engine size between 1 and 3,000 cc, with minimum no greater than maximum.';return
 }
 engineMin=min;engineMax=max;engineFilterEnabled=min!==null||max!==null;
 applyFilters();
}
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
  const response=await fetch('/data/universal-v2-model-routes.json',{cache:'no-cache',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('model directory HTTP '+response.status);
  const json=await response.json();
  const source=Array.isArray(json.models)?json.models:[];
  all=source.filter(x=>x&&Number.isSafeInteger(x.model_id)&&x.model_id>0&&typeof x.make==='string'&&typeof x.model==='string'&&/^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(x.url||''));
  if(!all.length)throw Error('published model catalogue unavailable');
  restore();renderSelectors();
  void loadEngineSizes();
  void loadComparisonManufacturers();
  // Category metadata is helpful for discovery, not a verified technical specification.
  loadCategories();
  $('sample-comparison').onclick=()=>{
   // These are canonical, published AnyBike model IDs from the checked-in route manifest.
   const examples=[77,255,104].map(id=>all.find(model=>model.model_id===id));
   if(examples.some(x=>!x)){show('These motorcycles are currently unavailable. Please select other models.');return}
   activeCategory='';engineFilterEnabled=false;engineMin=null;engineMax=null;
   for(const id of ['capacity-min','capacity-max'])$(id).value='';$('capacity-preset').value='';
   const select=$('compare-category');if(select)select.value='';
   chosen=examples;
   renderSelectors();
   show('Ready to compare BMW, Triumph and Ducati.');
  };
  $('clear-comparison').onclick=()=>{
   chosen=[null,null,null];activeCategory='';
   const select=$('compare-category');if(select)select.value='';
   engineFilterEnabled=false;engineMin=null;engineMax=null;
   for(const id of ['capacity-min','capacity-max'])$(id).value='';$('capacity-preset').value='';
   renderSelectors();show('Comparison cleared. Choose two to four motorcycles.');
  };
  $('add-motorcycle').onclick=addSelector;
  $('share-comparison').onclick=share;
  $('print-comparison').onclick=()=>window.print();
  window.addEventListener('popstate',()=>{restore();renderSelectors()});
 }catch(error){show('Motorcycles could not be loaded. Please refresh the page.');console.warn('AnyBike comparison directory unavailable',error)}
}
start();
})();
