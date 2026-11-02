// Shared read-only editorial data layer for the LOCKED BMW model template.
// No Supabase credentials, customer data, inventory or unpublished data are used.
// Preview integration only until the approved model design and routes are validated.
const ALLOWED_MODELS=Object.freeze({
  "bmw-r1300gs":{make:"BMW",model:"R 1300 GS",catalogueSlug:"bmw-r-1300-gs"},
  "bmw-r1250gs":{make:"BMW",model:"R 1250 GS",catalogueSlug:"bmw-r-1250-gs"}
});
function stringValue(value){return typeof value==="string"?value.trim():"";}
function verifiedLinks(entries){
 return (Array.isArray(entries)?entries:[]).filter(x=>x&&typeof x==="object"&&/^https:\/\//.test(stringValue(x.source)));
}
export function normalizeModelGuide(key,guide,catalogueModel){
 const identity=ALLOWED_MODELS[key];
 if(!identity||!guide||guide.make!==identity.make||guide.model!==identity.model)throw Error("Unapproved or mismatched model guide");
 const record=catalogueModel||{};
 if(record.make&&record.make!==identity.make||record.model&&record.model!==identity.model)throw Error("Catalogue identity mismatch");
 const production=guide.production||{};
 const generations=verifiedLinks(production.generations||[]);
 const milestones=verifiedLinks(production.generation_milestones||[]);
 const specifications=verifiedLinks(production.specifications||[]);
 const colours=verifiedLinks(production.official_colours||[]);
 return Object.freeze({
  key,make:identity.make,model:identity.model,catalogueSlug:identity.catalogueSlug,
  heading:identity.make+" "+identity.model,
  summary:stringValue(guide.summary),
  history:stringValue(guide.years),
  generations,milestones,specifications,colours,
  productionEndYear:production.production_end_year??null,
  engineeringRows:Array.isArray(guide.engineering_reference?.rows)?guide.engineering_reference.rows.filter(r=>Array.isArray(r)&&r.length===2&&r.every(v=>typeof v==='string')):[],
  // Photos without explicit republication rights must NEVER be used as images.
  gallery:[],
  photoStatus:"awaiting-approved-rights-and-model-specific-images",
  publicationStatus:"preview-only"
 });
}
export async function loadApprovedBmwModel(key,{fetcher=fetch}={}){
 if(!Object.hasOwn(ALLOWED_MODELS,key))throw Error("Model not yet approved for template testing");
 const [guideRes,catalogueRes]=await Promise.all([
  fetcher("/data/motorcycle-model-guides.json"),
  fetcher("/data/motorcycle-catalogue-base.json")
 ]);
 if(!guideRes.ok||!catalogueRes.ok)throw Error("Editorial data unavailable");
 const [guides,catalogue]=await Promise.all([guideRes.json(),catalogueRes.json()]);
 const identity=ALLOWED_MODELS[key];
 const row=(catalogue.models||[]).find(x=>x.make===identity.make&&x.model===identity.model);
 return normalizeModelGuide(key,guides.models?.[key],row);
}
