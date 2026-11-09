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
  const n=Number(s.section_number);
  if(!Number.isInteger(n)||n<1||n>SECTION_COUNT)throw Error('Section number outside universal contract');
  if(seen.has(n))throw Error('Duplicate universal section');
  seen.add(n);
  if(s.section_key!==SECTION_KEYS[n-1])throw Error('Incorrect section key');
  if(s.editorial_status!=='published'||!s.published_at||s.publication_eligible!==true)continue;
  if(!populated(s.content))continue;
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
