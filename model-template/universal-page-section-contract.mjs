// AnyBike universal editorial section contract: ONE shared 20-slot structure.
// Pure data mapping. No template variants, credentials, public data access or stock queries.
export const SECTION_COUNT=20;
export const SECTION_KEYS=Object.freeze(Array.from({length:SECTION_COUNT},(_,i)=>'section_'+String(i+1).padStart(2,'0')));
const validId=v=>(typeof v==='number'&&Number.isSafeInteger(v)&&v>0)||
 (typeof v==='string'&&/^[1-9][0-9]*$/.test(v)&&Number.isSafeInteger(Number(v)));
const safeText=v=>typeof v==='string'?v.trim():'';
const populated=v=>typeof v==='string'?v.trim().length>0:Array.isArray(v)?v.length>0:
 v!==null&&typeof v==='object'&&Object.keys(v).length>0;
const safeRecord=r=>r&&typeof r==='object'&&!Array.isArray(r);
// A JSON object can be nonempty but consist only of source, image-rights
// or bookkeeping fields. Count it as a research slot only when its keys
// correspond to content the shared 20-section renderer actually understands.
// The DOM renderer still applies nested review rules and suppresses empty cards.
const RENDERED_RESEARCH_FIELDS=new Set([
 'summary','description','text','body','years','subtitle','period','date',
 'year','event','change','evidence','title','heading','label','name',
 'rows','link','url','source','source_url','customer_copy',
 'items','paragraphs','entries','cards','links','hero','production',
 'timeline','production_evidence','generations','milestones','specifications',
 'colours','types','related_model_links','global_stories','deep_dive',
 'development_cards','actions','engineering','development','editions',
 'technical_specifications','motorcycle_types','country_markets',
 'verified_catalogue_facts'
]);
const SUBSTANTIVE_RESEARCH_FIELDS=new Set([...RENDERED_RESEARCH_FIELDS].filter(k=>
 !['title','heading','label','name','url','source','source_url','link'].includes(k)));
export function hasRenderableUniversalResearch(content){
 if(typeof content==='string')return !!content.trim();
 if(typeof content==='number')return Number.isFinite(content);
 if(Array.isArray(content))return content.length>0;
 if(!safeRecord(content))return false;
 return Object.entries(content).some(([key,value])=>
  SUBSTANTIVE_RESEARCH_FIELDS.has(key)&&
  (typeof value==='string'?!!value.trim():
   typeof value==='number'?Number.isFinite(value):
   Array.isArray(value)?value.length>0:
   safeRecord(value)?Object.keys(value).length>0:false));
}
// Publication's review reference belongs to the complete factory section.
// Where old R 1300 GS drafts omit a nested verification flag, explicitly
// signed-off, sourced and valid factory rows can be rendered. A pending flag,
// unknown source or missing review reference always fails closed.
export function reviewedStandaloneEngineering(section){
 const engineering=section?.content?.engineering;
 if(!safeRecord(engineering))return false;
 const nestedStatus=safeText(engineering.verification_status).toLowerCase();
 if(['verified','approved','published'].includes(nestedStatus))return true;
 if(nestedStatus)return false;
 return Boolean(safeText(section.publication_review_reference))&&
  /^https:\/\//i.test(safeText(engineering.source))&&
  Array.isArray(engineering.rows)&&engineering.rows.length>0&&
  engineering.rows.every(pair=>Array.isArray(pair)&&pair.length===2&&
   safeText(pair[0])&&
   (safeText(pair[1])||
    typeof pair[1]==='number'&&Number.isFinite(pair[1])));
}
export function canonicalPageEntity(entity){
 if(!safeRecord(entity)||!['manufacturer','model'].includes(entity.type)||!validId(entity.id))
  throw Error('Canonical manufacturer/model ID and entity type required');
 if(entity.type==='model'&&!validId(entity.manufacturer_id))
  throw Error('Model requires canonical manufacturer_id');
 const name=safeText(entity.name);
 if(!name)throw Error('Entity name missing');
 return Object.freeze({type:entity.type,id:Number(entity.id),
  manufacturer_id:entity.type==='model'?Number(entity.manufacturer_id):Number(entity.id),
  name});
}
/**
 * sections: reviewed public projection from the server, not raw editorial tables.
 * published_at and editorial_status MUST be validated by the server as well.
 * No empty cards and no fallback to content from another model/manufacturer.
 */
export function buildUniversalPageSections(entity,sections){
 const identity=canonicalPageEntity(entity);
 if(!Array.isArray(sections))throw Error('Section projection must be an array');
 const seen=new Set(),bySlot=new Map();
 for(const s of sections){
  if(!safeRecord(s))throw Error('Invalid section record');
  if(s.entity_type!==identity.type||!validId(s.entity_id)||Number(s.entity_id)!==identity.id)
   throw Error('Cross-entity section rejected');
  // The direct renderer shares this contract with the database loader. A
  // matching model ID alone must never import a different manufacturer's data.
  if(s.manufacturer_id!==undefined&&
     (!validId(s.manufacturer_id)||Number(s.manufacturer_id)!==identity.manufacturer_id))
   throw Error('Cross-manufacturer section rejected');
  const n=Number(s.section_number);
  if(!Number.isInteger(n)||n<1||n>SECTION_COUNT)throw Error('Section number outside universal contract');
  if(seen.has(n))throw Error('Duplicate universal section');
  seen.add(n);
  if(s.section_key!==SECTION_KEYS[n-1])throw Error('Incorrect section key');
  if(s.editorial_status!=='published'||!s.published_at||s.publication_eligible!==true)continue;
  // This contract also runs when callers invoke the stage renderer directly.
  // Scheduled or malformed publication timestamps may not be shown early.
  const publicationTime=Date.parse(s.published_at);
  if(!Number.isFinite(publicationTime)||publicationTime>Date.now())continue;
  if(!populated(s.content)||!hasRenderableUniversalResearch(s.content))continue;
  // The stage renderer can also be called directly by internal callers.
  // Never let that route bypass the public loader's root-level documentary
  // review, denied-publication or nested release-date checks.
  if(safeRecord(s.content)){
   const statuses=['source_verification_status','editorial_status',
    'content_status','verification_status','review_state'];
   const allowed=new Set(['verified','approved','published']);
   if(statuses.some(k=>s.content[k]!==undefined&&s.content[k]!==null&&
      (typeof s.content[k]!=='string'||
       !allowed.has(s.content[k].trim().toLowerCase()))))continue;
   if(s.content.publication_eligible===false)continue;
   if(s.content.published_at!==undefined&&s.content.published_at!==null){
    const contentDate=Date.parse(s.content.published_at);
    if(!Number.isFinite(contentDate)||contentDate>Date.now())continue;
   }
  }
  // Source-import metadata is not customer-facing editorial text. The public
  // loader rejects this shape; direct renderer callers must reject it too.
  if(safeRecord(s.content)){
   const keys=Object.keys(s.content);
   if(Array.isArray(s.content.source_blocks)&&
      keys.every(k=>['source_blocks','source_file','source_blob_sha'].includes(k)))
    continue;
   // A photo-rights dossier is not customer-facing editorial research.
   // Reject it here too: direct renderer callers cannot bypass the
   // published-only database loader's photography-only safeguard.
   if(keys.length===1&&Object.prototype.hasOwnProperty.call(s.content,'photography'))
    continue;
   // A pending engineering payload on its own is not a published section.
   // Approved surrounding editorial may still display independently, with
   // nested technical claims filtered by the renderer.
   if(keys.length===1&&safeRecord(s.content.engineering)&&
      !reviewedStandaloneEngineering(s))continue;
  }
  bySlot.set(n,Object.freeze({number:n,key:SECTION_KEYS[n-1],title:safeText(s.section_title),
   content:s.content,entity_id:identity.id,entity_type:identity.type}));
 }
 return Object.freeze(SECTION_KEYS.map((key,i)=>bySlot.get(i+1)||Object.freeze({
  number:i+1,key,title:'',content:null,entity_id:identity.id,entity_type:identity.type
 })));
}
export function visibleUniversalSections(slots){
 if(!Array.isArray(slots)||slots.length!==SECTION_COUNT)throw Error('Expected 20 canonical section slots');
 return slots.filter(s=>s.content!==null);
}
export function auditUniversalPage(entity,sections){
 const slots=buildUniversalPageSections(entity,sections);
 return Object.freeze({entity:canonicalPageEntity(entity),slots_total:SECTION_COUNT,
  populated:visibleUniversalSections(slots).length,
  missing:slots.filter(s=>s.content===null).map(s=>s.key),
  stock_position:'before_research',layout:'one_universal_framework'});
}
