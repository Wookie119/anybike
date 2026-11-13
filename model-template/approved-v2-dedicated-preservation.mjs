// Reuse already-public, explicitly snapshotted research for approved model
// routes when moving them to ONE universal V2 page design. This file does NOT
// approve new factory facts or images; it preserves previously displayed copy.
// The image rules require the original credited Wikimedia source and licence.
const norm=x=>String(x||'').toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,' ').trim();
const secure=x=>typeof x==='string'&&/^https:\/\/[^\s]+$/.test(x);
const originalLicence=u=>secure(u)&&/^https:\/\/creativecommons\.org\/licenses\//.test(u);
const commonsFile=u=>secure(u)&&u.startsWith('https://commons.wikimedia.org/wiki/File:');
const commonsImage=u=>secure(u)&&u.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/');
export function preservedExistingHero(data,{make,model,url}={}){
 if(!data||norm(data.make)!==norm(make)||norm(data.model)!==norm(model)||data.url!==url)return null;
 const isBMW=data.publication_status==='migration_preservation_only';
 const isHarley=data.publication_status==='migration_snapshot_only_not_automatically_publication_approved';
 if(!isBMW&&!isHarley)return null;
 const candidate=isBMW?data.approved_existing_hero:data.photographs?.[0];
 if(!candidate||!commonsImage(candidate.image_url))return null;
 const attribution=isBMW?candidate.attribution:candidate.credit_text;
 const links=isBMW?candidate.reference_links:candidate.credit_links;
 const licence=isBMW?candidate.licence_url:links?.find(originalLicence);
 const source=links?.find(commonsFile);
 if(!attribution||!source||!originalLicence(licence))return null;
 return {make,model,image_url:candidate.image_url,source_page_url:source,
  licence_url:licence,licence:'Creative Commons — see original licence',
  attribution,title:make+' '+model+' (previously published reference photograph)'};
}
const historySection=(title,text,refs=[])=>({
 title,subtitle:'Previously published model guide — verify the exact motorcycle and year',
 paragraphs:[
  {text},
  ...refs.filter(secure).slice(0,12).map(ref=>({link:[ref,'Original reference ↗']}))
 ]
});
export function preserveDedicatedModelResearch(guide,data,{make,model,url}={}){
 if(!data||norm(data.make)!==norm(make)||norm(data.model)!==norm(model)||data.url!==url)return guide;
 const original=guide&&typeof guide==='object'?guide:{make,model};
 if(norm(original.make)!==norm(make)||norm(original.model)!==norm(model))return guide;
 if(make==='BMW'&&model==='R 1250 GS'&&data.publication_status==='migration_preservation_only'){
  const cards=Array.isArray(data.model_year_gallery?.model_year_cards)?
   data.model_year_gallery.model_year_cards.filter(c=>Number.isInteger(c.year)&&
    c.year>=2019&&c.year<=2023&&typeof c.period==='string'&&typeof c.description==='string'):[];
  const existingCards=Array.isArray(original.model_year_cards)?original.model_year_cards:[];
  // An approved V2 editorial record may contain newer, sourced model-year cards.
  const result={...original};
  if(!existingCards.length&&cards.length===5)result.model_year_cards=cards;
  const existing=(Array.isArray(original.sections)?original.sections:[])
   .filter(section=>Array.isArray(section)&&section.length===2);
  const known=new Set(existing.map(section=>norm(section[0])));
  const previous=Array.isArray(data.sections)?data.sections.filter(s=>s&&s.heading&&s.text):[];
  const combined=[...existing];
  for(const section of previous){
   const heading=norm(section.heading);
   if(!heading||known.has(heading))continue;
   known.add(heading);
   combined.push([section.heading,section.text]);
  }
  if(combined.length)result.sections=combined;
  return result;
 }
 if(make==='Harley-Davidson'&&data.publication_status==='migration_snapshot_only_not_automatically_publication_approved'){
  // Preserve ALL historically published sections, including the ones whose
  // original pages had no external citations. Display these as archived guide
  // copy, not as factory-verified specifications or a new publication slot.
  const preserved=(Array.isArray(data.sections)?data.sections:[]).filter(s=>
   s&&typeof s.title==='string'&&s.title&&typeof s.text==='string'&&s.text);
  if(!preserved.length)return guide;
  const prior=Array.isArray(original.deep_dive)?original.deep_dive:[];
  const known=new Set(prior.map(section=>norm(section.title)));
  const deep_dive=[...prior];
  for(const section of preserved){
   if(known.has(norm(section.title)))continue;
   known.add(norm(section.title));
   deep_dive.push(historySection(section.title,section.text,section.references));
  }
  return {...original,deep_dive};
 }
 return guide;
}
