// Shared exact-model public stock matcher for the LOCKED universal model template.
// Only matches records already published by the protected international-public-stock
// endpoint; it does not affect security, RLS or country access decisions.
export const normalizeModelIdentity=value=>String(value??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const TRIM_PARTS=['tripleblack','option719','mcompetition','competition','anniversary','exclusive','standard','rallye','trophy','sport','premium','touring','special','limited','edition','iconic','urban','se','te','hp','le','gt','114','107'];
function approvedTrimSuffix(suffix){
 if(!suffix)return true;
 let remainder=suffix;
 while(remainder){
  const part=TRIM_PARTS.find(token=>remainder.startsWith(token));
  if(!part)return false;
  remainder=remainder.slice(part.length);
 }
 return true;
}
export function isExactPublicMotorcycle(item,{make,model}={}){
 if(!item||!make||!model)return false;
 if(normalizeModelIdentity(item.make)!==normalizeModelIdentity(make))return false;
 const expected=normalizeModelIdentity(model);
 const stockModel=normalizeModelIdentity(item.model);
 if(!expected||!stockModel.startsWith(expected))return false;
 if(!approvedTrimSuffix(stockModel.slice(expected.length)))return false;
 if(item.item_id===null||item.item_id===undefined||item.item_id==='')return false;
 if(typeof item.image_url!=='string'||!/^https:\/\//.test(item.image_url))return false;
 return Number.isFinite(Number(item.price))&&Number(item.price)>0;
}
export function matchingPublishedMotorcycles(items,identity,{limit=6}={}){
 if(!Array.isArray(items))return [];
 return items.filter(item=>isExactPublicMotorcycle(item,identity)).slice(0,Math.max(0,Math.min(24,Math.trunc(limit)||0)));
}
