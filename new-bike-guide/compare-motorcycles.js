/* AnyBike UK motorcycle comparison — one template, checked-in canonical model routes.
   No invented specs and no per-model edits. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const text=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
const absolute=u=>{try{const x=new URL(u,location.origin);return x.origin===location.origin?x.href:null}catch{return null}};
const MAX=4,MIN=2;
let all=[],chosen=[null,null,null],categories=new Map(),activeCategory='';
function show(message){$('compare-status').textContent=message}
function selectedIds(){return chosen.filter(Boolean).map(x=>x.model_id)}
function writeShareUrl(items){
 const url=new URL(location.href);
 if(items.length>=MIN&&new Set(items.map(x=>x.model_id)).size===items.length){url.searchParams.set('bikes',items.map(x=>x.model_id).join(','))}
 else url.searchParams.delete('bikes');
 history.replaceState(null,'',url.pathname+url.search+url.hash);
}
function addSelector(){
 if(chosen.length>=MAX)return;
 chosen.push(null);renderSelectors();
}
function cardPicker(index){
 const shell=text('div');shell.className='compare-picker';
 const h=text('h3','Motorcycle '+(index+1));shell.append(h);
 const selected=chosen[index];
 const makes=[...new Set(all.map(x=>x.make))].sort((a,b)=>a.localeCompare(b,'en'));
 const fields=text('div');fields.className='compare-picker-fields';
 const makeLabel=text('label','Manufacturer');const make=text('select');
 const any=text('option','Choose manufacturer');any.value='';make.append(any);
 for(const brand of makes){const o=text('option',brand);o.value=brand;make.append(o)}
 make.value=selected?.make||'';
 const modelLabel=text('label','Motorcycle model');const model=text('select');
 const refreshModels=()=>{
  model.replaceChildren();const blank=text('option','Choose model');blank.value='';model.append(blank);
  const candidates=all.filter(x=>x.make===make.value&&(!activeCategory||categories.get(x.model_id)===activeCategory)).sort((a,b)=>a.model.localeCompare(b.model,'en'));
  for(const bike of candidates){const op=text('option',bike.model);op.value=String(bike.model_id);model.append(op)}
  model.disabled=!make.value;
  model.value=chosen[index]?.make===make.value?String(chosen[index]?.model_id||''):'';
 };
 make.onchange=()=>{chosen[index]=null;refreshModels();renderResults()};
 model.onchange=()=>{chosen[index]=all.find(x=>x.model_id===Number(model.value))||null;renderResults()};
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
 if(items.length<MIN){show('Choose at least two motorcycles to build a comparison.');return}
 if(!valid){show('Please choose different motorcycles in each position.');return}
 show('Comparison ready — '+items.length+' motorcycles from AnyBike’s published catalogue.');
 const intro=text('p','Compare the selected motorcycles below. Current UK new-bike prices, year-specific specifications and variant equipment will appear only after they have been independently verified or supplied under a licensed manufacturer feed.');
 host.append(intro);
 const wrap=text('div');wrap.className='comparison-table-scroll';
 const table=text('table');table.className='comparison-table';
 const head=text('thead'),tr=text('tr');tr.append(text('th','Comparison'));
 for(const x of items){tr.append(text('th',x.make+' '+x.model))}head.append(tr);table.append(head);
 const body=text('tbody');
 const data=[
  ['Manufacturer',x=>x.make],
  ['Model',x=>x.model],
  ['Catalogue category (provisional)',x=>categories.get(x.model_id)||'Not classified'],
  ['Current UK model range',()=> 'Not yet verified'],
  ['UK list price',()=> 'Awaiting verified current UK price'],
  ['Model year / variant',()=> 'Choose on verified model page'],
  ['Engine / power / torque',()=> 'See verified model research'],
  ['Seat height / weight',()=> 'See verified model research'],
  ['UK authorised dealers',()=> 'UK listings are being verified']
 ];
 for(const [label,get] of data){const row=text('tr');row.append(text('th',label));for(const x of items)row.append(text('td',get(x)));body.append(row)}
 const links=text('tr');links.append(text('th','Research this model'));
 for(const x of items){const td=text('td'),a=text('a','View AnyBike model page');a.href=absolute(x.url)||'/motorcycle-manufacturers.html';td.append(a);links.append(td)}
 body.append(links);table.append(body);wrap.append(table);host.append(wrap);
 const notice=text('p','AnyBike comparisons are independent. Manufacturer trademarks identify the motorcycles; no brand endorsement is implied. Specifications vary by model year, market and variant. No unverified figures or copied manufacturer artwork are displayed here.');
 notice.className='comparison-notice';host.append(notice);
 // Comparison URL is synchronised by writeShareUrl, including when a selection is cleared.
}
async function share(){
 const url=location.href;
 try{await navigator.clipboard.writeText(url);show('Comparison link copied. You can paste it into WhatsApp, an email or a message.')}
 catch{const input=prompt('Copy your comparison link:',url);if(input!==null)show('Your comparison link is shown above.')}
}
function restore(){
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
  const groups=[...new Set(categories.values())].sort((a,b)=>a.localeCompare(b,'en'));
  for(const group of groups){const option=text('option',group);option.value=group;select.append(option)}
  select.onchange=()=>{activeCategory=select.value;chosen=[null,null,null];renderSelectors();show(activeCategory?'Showing catalogue models in '+activeCategory+'. Select two or more motorcycles.':'Showing motorcycles from all catalogue categories.');};
 }catch(e){console.warn('Optional catalogue category filter unavailable',e)}
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
  // Category metadata is helpful for discovery, not a verified technical specification.
  loadCategories();
  $('sample-comparison').onclick=()=>{
   // These are canonical, published AnyBike model IDs from the checked-in route manifest.
   const examples=[77,255,104].map(id=>all.find(model=>model.model_id===id));
   if(examples.some(x=>!x)){show('Example motorcycles are not currently in the published model directory.');return}
   activeCategory='';
   const select=$('compare-category');if(select)select.value='';
   chosen=examples;
   renderSelectors();
   show('Example loaded: BMW R 1300 GS, Triumph Tiger 1200 and Ducati Multistrada V4. Current UK specifications remain subject to verification.');
  };
  $('clear-comparison').onclick=()=>{
   chosen=[null,null,null];activeCategory='';
   const select=$('compare-category');if(select)select.value='';
   renderSelectors();show('Comparison cleared. Choose two to four motorcycles.');
  };
  $('add-motorcycle').onclick=addSelector;
  $('share-comparison').onclick=share;
  $('print-comparison').onclick=()=>window.print();
 }catch(error){show('The published motorcycle directory could not be loaded. Please try again.');console.warn('AnyBike comparison directory unavailable',error)}
}
start();
})();
