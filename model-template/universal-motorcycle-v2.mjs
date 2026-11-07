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
  // Manufacturer announcements are preserved as dated timeline evidence;
  // do not reinterpret press-release dates as production/model-year dates.
  timeline:list(guide.model_year_timeline).filter(x=>x&&safeText(x.period)&&safeText(x.description)).map(x=>({
   period:safeText(x.period),description:safeText(x.description),
   source:safeHttps(x.source)?x.source:null
  })),
  // Model-year gallery cards may be sourced from manufacturer evidence; they
  // are editorial drafts until imagery/content approvals are recorded.
  modelYearCards:list(guide.model_year_cards).filter(x=>x&&safeText(x.period)&&safeText(x.description)).map(x=>({
   period:safeText(x.period),description:safeText(x.description),
   source:safeHttps(x.source)?x.source:null,
   cardType:safeText(x.card_type)||'documented_model_year',
   imageStatus:safeText(x.image_status)||'not_approved',
   contentStatus:safeText(x.content_status)||'pending_editorial_review',
   imageUrl:safeHttps(x.image_url)&&x.image_status==='approved'?x.image_url:null
  })),
  engineering:guide.engineering_reference||{},
  // Pending editorial technical evidence can inform review but must never
  // be passed off as a published, factory-verified specification.
  engineeringReviewStatus:safeText(guide.engineering_reference?.verification_status)||'unreviewed',
  engineeringRows:list(guide.engineering_reference?.rows).filter(x=>Array.isArray(x)&&safeText(x[0])&&safeText(x[1])).map(x=>[safeText(x[0]),safeText(x[1])]),
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
// Canonical 13-slot data contract. This maps diverse editorial records into
// one design without adding new page structures or inventing missing evidence.
// 'ready' means the slot has relevant editorial input, NOT publication approval.
export function buildMotorcycleV2Sections(record){
 const model=normalizeMotorcycleV2(record),guide=record.editorial;
 const hasList=items=>Array.isArray(items)&&items.length>0;
 const withValue=content=>({content,ready:hasList(content)||(content&&typeof content==='object'&&Object.keys(content).length>0)||typeof content==='string'&&content.trim().length>0});
 const heritage=hasList(model.heritage)?model.heritage:model.sections;
 const heroText=model.hero?.summary||guide.summary||'';
 const citedTimeline=model.timeline.filter(x=>x.source).map(x=>({label:x.period,url:x.source,description:x.description}));
 const sourceEvidence=hasList(model.sources)?model.sources:
  hasList(guide.reference_links)?guide.reference_links:
  hasList(citedTimeline)?citedTimeline:
  model.development?.documented_production_evidence||[];
 const slots={
  introduction:withValue(heroText),
  model_development:withValue(hasList(model.modelYearCards)?model.modelYearCards:hasList(model.timeline)?model.timeline:model.development?.generations||[]),
  engineering_gallery:withValue(guide.development_cards||[]),
  stories_and_comparisons:withValue(model.stories||{}),
  factory_colours:withValue(model.colours),
  technical_specifications:withValue(model.specifications),
  heritage:withValue(heritage),
  related_models:withValue(model.relatedModels),
  motorcycle_types:withValue(model.motorcycleTypes),
  country_markets:withValue(guide.country_market_links||[]),
  customer_action:withValue(model.customerActions),
  production_evidence:withValue(model.development?.documented_production_evidence||[]),
  sources_and_references:withValue(sourceEvidence)
 };
 return Object.freeze(REQUIRED_V2_SECTIONS.map(id=>Object.freeze({id,ready:Boolean(slots[id].ready),content:slots[id].content})));
}
export function auditMotorcycleV2(record){
 const result={errors:[],warnings:[],sections:[...REQUIRED_V2_SECTIONS],missingSections:[],readyToRollout:false};
 let model;
 try{model=normalizeMotorcycleV2(record);}catch(e){result.errors.push(e.message);return result;}
 const slotAudit=buildMotorcycleV2Sections(record);
 result.missingSections=slotAudit.filter(slot=>!slot.ready).map(slot=>slot.id);
 result.readyToRollout=result.missingSections.length===0;
 if(result.missingSections.length)result.warnings.push("Missing approved master sections: "+result.missingSections.join(", "));
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
