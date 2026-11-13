// Adapt the existing public BMW model-history RPC to the ONE approved V2 renderer.
// Only exact-model, source-linked records are accepted; no unpublished/draft
// content, inferred dates, cross-model data or embedded stock is propagated.
const norm=x=>String(x||'').toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,' ').trim();
const validSource=x=>typeof x==='string'&&/^https:\/\/[^\s]+$/.test(x);
export function mergeApprovedBmwHistory(guide,history,{make,model,approvedRoute,preferExisting=false}={}){
 if(norm(make)!=='bmw'||!/^\/bmw-[a-z0-9-]+\.html$/.test(String(approvedRoute||'')))return guide;
 if(!history||norm(history.make)!=='bmw'||norm(history.model)!==norm(model))return guide;
 const generations=(Array.isArray(history.generations)?history.generations:[]).filter(entry=>
  entry&&typeof entry.label==='string'&&entry.label.trim()&&
  typeof entry.description==='string'&&entry.description.trim()&&validSource(entry.source));
 const base=guide&&typeof guide==='object'?guide:{};
 if(!generations.length&&!String(history.hero_summary||'').trim()&&!String(history.hero_years||'').trim())return guide;
 // The canonical BMW public history projection supersedes older checked-in
 // generation notes, but not separately verified V2 editorial sections.
 const production={...(base.production||{})};
 if(generations.length&&(!preferExisting||!Array.isArray(production.generations)||!production.generations.length))production.generations=generations.map(g=>({
  label:g.label,description:g.description,source:g.source,
  model_year:g.model_year,announcement_year:g.announcement_year,
  engine_cc:g.engine_cc,power_hp:g.power_hp,torque_nm:g.torque_nm,
  transmission:g.transmission,body_type:g.body_type,
  official_photo_gallery_url:validSource(g.official_photo_gallery_url)?g.official_photo_gallery_url:null
 }));
 const hero={...(base.hero||{})};
 if(String(history.hero_summary||'').trim()&&(!preferExisting||!Array.isArray(hero.paragraphs)||!hero.paragraphs.length))hero.paragraphs=[history.hero_summary.trim()];
 if(String(history.hero_years||'').trim()&&(!preferExisting||!String(hero.years||'').trim()))hero.years=history.hero_years.trim();
 return {...base,make,model,production,hero};
}
