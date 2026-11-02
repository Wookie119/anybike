// Universal motorcycle V2 editorial normalization. No model allowlist or credentials.
// This module does not grant publication access; Supabase RLS must independently
// restrict browser reads to approved published editorial records.
const safeText=v=>typeof v==="string"?v.trim():"";
const list=v=>Array.isArray(v)?v:[];
const safePath=v=>typeof v==="string"&&/^\/[a-z0-9][a-z0-9/-]*\.html(?:#[a-z0-9-]+)?(?:\?[a-zA-Z0-9%&=._-]+)?$/.test(v);
const safeHttps=v=>typeof v==="string"&&/^https:\/\//.test(v);
export const REQUIRED_V2_SECTIONS=Object.freeze([
 "introduction","model_development","engineering_gallery","stories_and_comparisons",
 "factory_colours","technical_specifications","heritage","related_models",
 "motorcycle_types","country_markets","customer_action","production_evidence",
 "sources_and_references"
]);
export function normalizeMotorcycleV2(record){
 if(!record||record.preview_visible!==true)throw Error("Editorial is not published");
 const guide=record.editorial;
 if(!guide||typeof guide!=="object")throw Error("Missing editorial");
 const make=safeText(guide.make),model=safeText(guide.model),slug=safeText(record.slug);
 if(!make||!model||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error("Invalid model identity");
 const links=items=>list(items).filter(x=>x&&safeText(x.label)&&safePath(x.url)).map(x=>({label:safeText(x.label),url:x.url}));
 const story=guide.global_stories||{};
 return Object.freeze({
  modelId:record.model_id,slug,make,model,
  title:make+" "+model,
  hero:guide.hero||{},
  sections:list(guide.sections),
  development:guide.production||{},
  engineering:guide.engineering_reference||{},
  galleries:guide.engineering_gallery_media||{},
  stories:safePath(story.url)?story:null,
  colours:list(guide.production?.official_colours),
  specifications:list(guide.production?.specifications),
  heritage:list(guide.deep_dive),
  relatedModels:links(guide.related_model_links),
  motorcycleTypes:links(guide.motorcycle_type_links),
  customerActions:links(guide.action_links),
  ui:guide.ui_strings||{},
  navigation:guide.navigation_copy||{},
  media:guide.photography||{},
  sources:list(guide.sources).filter(x=>!x?.url||safeHttps(x.url))
 });
}
export function auditMotorcycleV2(record){
 const result={errors:[],warnings:[],sections:[...REQUIRED_V2_SECTIONS]};
 let model;
 try{model=normalizeMotorcycleV2(record);}catch(e){result.errors.push(e.message);return result;}
 if(!safeText(model.hero?.summary)&&!safeText(record.editorial?.summary))result.warnings.push("Hero summary absent");
 if(!model.stories)result.warnings.push("No Global stories link");
 if(!model.relatedModels.length)result.warnings.push("No related model links");
 if(!model.motorcycleTypes.length)result.warnings.push("No motorcycle type links");
 if(!model.heritage.length)result.warnings.push("No heritage cards");
 if(!model.development?.generations?.length)result.warnings.push("No model generations");
 if(!model.colours.length)result.warnings.push("No factory colours");
 if(!model.specifications.length)result.warnings.push("No technical specifications");
 if(!model.customerActions.length)result.warnings.push("No customer action");
 return result;
}
