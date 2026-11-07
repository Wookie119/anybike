// Single-source, public-safe editorial photo matching.
// Strict identity, exact model-year evidence and approved licence/attribution.
// No product adverts, filename guesses, related-model fallback or stock imagery.
const norm=value=>String(value??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const https=value=>typeof value==='string'&&/^https:\/\//i.test(value);
const year=value=>Number.isInteger(Number(value))&&Number(value)>=1885&&Number(value)<=2100?Number(value):null;
export function documentedCardYear(card){
 if(!card||card.cardType==='documented_generation'||card.card_type==='documented_generation')return null;
 // Only explicit metadata is precise enough to associate a model-year photograph.
 const candidate=card.modelYear??card.model_year;
 return year(candidate);
}
export function approvedPhotoForModelYear(photos,{make,model,card}={}){
 const modelYear=documentedCardYear(card);
 if(!make||!model||!modelYear||!Array.isArray(photos))return null;
 return photos.find(photo=>
  photo?.approval_status==='approved'&&norm(photo.manufacturer)===norm(make)&&
  norm(photo.model)===norm(model)&&
  photo.subject_category==='whole_motorcycle'&&
  year(photo.model_year_start)!==null&&
  year(photo.model_year_end)!==null&&
  modelYear>=Number(photo.model_year_start)&&modelYear<=Number(photo.model_year_end)&&
  https(photo.image_url)&&https(photo.source_page_url)&&
  typeof photo.attribution==='string'&&photo.attribution.trim().length>0&&
  typeof photo.licence==='string'&&photo.licence.trim().length>0&&
  https(photo.licence_url)
 )||null;
}
export function approvedPhotoCoverage(photos,identities){
 const entries=Array.isArray(identities)?identities:[];
 return entries.map(entry=>({
  ...entry,
  years:(Array.isArray(entry.cards)?entry.cards:[]).map(card=>({
   period:card.period,
   approved:!!approvedPhotoForModelYear(photos,{make:entry.make,model:entry.model,card})
  }))
 }));
}
