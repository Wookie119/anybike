// Live manufacturer/model links for international motorcycle pages.
// Data source: only the buyer-safe items returned by international-public-stock.
// No static brand lists, supplier data, privileged database calls or stale fallbacks.
const tidy=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
const key=value=>tidy(value).toLocaleLowerCase('en-GB').replace(/[^a-z0-9]/g,'');
export const cleanStockModelName=value=>tidy(value)
 .replace(/\s+\d+(?:[.,]\d+)?%\s+(?:APR|A\.P\.R\.).*$/i,'')
 .replace(/\s+(?:representative|finance offer|monthly payments).*$/i,'').trim();
export const liveStockLink=(make,model='')=>{
 const params=new URLSearchParams({make,vat:'all'});
 if(model)params.set('model',model);
 return '/available-stock.html?'+params.toString();
};
export function groupLiveStock(items){
 if(!Array.isArray(items))return [];
 const makes=new Map();
 for(const item of items){
  const make=tidy(item?.make),model=cleanStockModelName(item?.model);
  if(!make||!model||item?.item_id===null||item?.item_id===undefined||item?.item_id==='')continue;
  const makeKey=key(make),modelKey=key(model);
  if(!makeKey||!modelKey)continue;
  if(!makes.has(makeKey))makes.set(makeKey,{make,models:new Map(),bikeIds:new Set()});
  const brand=makes.get(makeKey);
  const id=String(item.item_id);
  if(!brand.bikeIds.has(id)){brand.bikeIds.add(id);}
  if(!brand.models.has(modelKey))brand.models.set(modelKey,{model,bikeIds:new Set()});
  brand.models.get(modelKey).bikeIds.add(id);
 }
 return [...makes.values()].map(brand=>({
  make:brand.make,count:brand.bikeIds.size,url:liveStockLink(brand.make),
  models:[...brand.models.values()].map(x=>({model:x.model,count:x.bikeIds.size,url:liveStockLink(brand.make,x.model)}))
   .sort((a,b)=>a.model.localeCompare(b.model,'en-GB',{numeric:true,sensitivity:'base'}))
 })).sort((a,b)=>a.make.localeCompare(b.make,'en-GB',{sensitivity:'base'}));
}
export function renderLiveStockBrowse(container,items,{currentMake=''}={}){
 if(!container)return [];
 const groups=groupLiveStock(items);
 container.replaceChildren();
 container.hidden=!groups.length;
 if(!groups.length)return groups;
 container.classList.add('anybike-live-stock-browse');
 const h=document.createElement('h3');h.textContent='Explore motorcycles currently in Available Stock';
 const explanation=document.createElement('p');
 explanation.textContent='Only manufacturers and models with published motorcycles appear below. These links update automatically with Available Stock.';
 const makesTitle=document.createElement('h4');makesTitle.textContent='Manufacturers with stock';
 const makes=document.createElement('nav');makes.className='anybike-live-stock-makes';
 makes.setAttribute('aria-label','Manufacturers with motorcycles in Available Stock');
 for(const group of groups){
  const a=document.createElement('a');a.href=group.url;a.className='anybike-international-vq-link';
  a.textContent=group.make+' ('+group.count+')';makes.append(a);
 }
 const modelsTitle=document.createElement('h4');modelsTitle.textContent='Models with stock';
 const modelGroups=document.createElement('div');modelGroups.className='anybike-live-stock-model-groups';
 let defaultOpen=false;
 for(const group of groups){
  const details=document.createElement('details');details.className='anybike-live-stock-model-group';
  if(!defaultOpen&&key(currentMake)===key(group.make)){details.open=true;defaultOpen=true;}
  const summary=document.createElement('summary');
  summary.textContent=group.make+' models ('+group.models.length+')';details.append(summary);
  const models=document.createElement('nav');models.className='anybike-live-stock-models';
  models.setAttribute('aria-label',group.make+' models currently available');
  for(const entry of group.models){
   const a=document.createElement('a');a.href=entry.url;a.className='anybike-international-vq-link';
   a.textContent=entry.model+' ('+entry.count+')';models.append(a);
  }
  details.append(models);modelGroups.append(details);
 }
 if(!defaultOpen&&modelGroups.firstElementChild)modelGroups.firstElementChild.open=true;
 container.append(h,explanation,makesTitle,makes,modelsTitle,modelGroups);
 return groups;
}
