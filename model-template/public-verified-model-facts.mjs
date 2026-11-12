// Shared verified catalogue facts enrichment for every generic model guide.
// This is a separately verified, source-linked factual projection, NOT a
// universal editorial publication or a source for motorcycle stock.
const ENDPOINT='https://tuehtnezhdnkqbbhttgp.supabase.co';
const PUBLIC_KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
const sections={
 model_year:'Documented model years and specifications',
 engineering:'Engineering and technical development',
 engine:'Engine and powertrain',transmission:'Transmission',
 specification:'Documented specifications',performance:'Performance',
 dimensions:'Dimensions and weights',chassis:'Chassis and suspension',
 wheels:'Wheels and tyres',brakes:'Braking system',
 factory_colours:'Factory colours and finishes',
 manufacturing_evidence:'Factory and manufacturing evidence',
 manufacturing:'Manufacturing',production:'Production records',
 market_launch:'Market introductions',history:'Motorcycle history',
 competition:'Competition history',motorsport:'Documented racing and motorsport',design:'Design and development',
 touring:'Touring equipment and specifications',
 factory_documents:'Factory documents and brochures',
 used_buying:'Used buying and ownership guidance'
};
// Fixed category order keeps every exact-model guide consistent even when
// factory facts arrive in a different year/order from Supabase.
const researchOrder=[
 'model_year','market_launch','history','design','engineering','engine',
 'transmission','performance','specification','dimensions','chassis','wheels',
 'brakes','factory_colours','manufacturing_evidence','manufacturing','production',
 'competition','motorsport','touring','factory_documents','used_buying'
];
const safeText=x=>typeof x==='string'?x.trim():'';
const validUrl=x=>typeof x==='string'&&/^https:\/\/[^\s/?#]+(?:[^\s]*)$/i.test(x);
const factLabels={
 engine_cc:'Engine capacity (cc)',power:'Power',weight:'Weight',
 technical_changes:'Engineering changes',torque_nm:'Torque (Nm)',
 engine_capacity_cc:'Engine capacity (cc)',fuel_capacity_litres:'Fuel capacity (litres)',
 model_year:'Model year',production_year:'Production year',
 power_hp:'Power (hp)',engine_type:'Engine configuration'
};
// These administrative keys can occur inside otherwise sourced JSON. They are
// not factual model specifications and must never leak into public research.
const internalValueKeys=new Set([
 'source','source_url','source_name','url','photo_url','image_url',
 'editorial_status','publication_status','verification_status',
 'approval_status','review_status','reviewer','reviewer_notes',
 'internal_notes','private_notes','draft','draft_notes','unverified',
 'created_at','updated_at','approved_at','published_at','audit_id',
 'document_url'
]);
const pretty=x=>factLabels[x]||x.replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase());
const scalar=x=>typeof x==='string'&&x.trim()?x.trim():typeof x==='number'&&Number.isFinite(x)?String(x):null;
// Source-approved measurements keep the number and stated unit together.
// Do not guess units from the model name or category, and never render HTML.
const documentedMeasurement=value=>{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const unit=safeText(value.unit);
 const amount=value.amount;
 if(!/^[a-zA-Z0-9%°/ .-]{1,24}$/.test(unit)||
    (typeof amount!=='number'&&typeof amount!=='string')||
    !String(amount).trim()||!Number.isFinite(Number(amount)))return null;
 return Number(amount).toLocaleString('en-GB',{maximumFractionDigits:3})+' '+unit;
};
const displayValue=value=>{
 const single=scalar(value);
 if(single!==null)return single;
 // Verified factory style/edition lists are usable research; never treat
 // nested editorial drafts, objects, or an unsourced image array as text.
 // Preserve long but bounded sets of approved factory colours/editions.
 if(Array.isArray(value)&&value.length>0&&value.length<=60&&
    value.every(x=>typeof x==='string'&&x.trim()&&x.trim().length<=90)){
  return value.map(x=>x.trim()).join(' · ');
 }
 return null;
};
// A small number of approved factory engineering records compare named
// derivatives in a nested object (e.g. R 12 vs R 12 nineT). Expose only the
// recognised numeric engine measurements; never render arbitrary nested JSON.
const variantMeasurements={
 power_hp:'hp',power_kw:'kW',torque_nm:'Nm',engine_cc:'cc',engine_capacity_cc:'cc'
};
export function verifiedEngineeringVariants(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return [];
 const out=[];
 for(const [name,details] of Object.entries(value)){
  if(!/^[a-zA-Z0-9][a-zA-Z0-9 -]{0,79}$/.test(name)||
     !details||typeof details!=='object'||Array.isArray(details))continue;
  const metrics=Object.entries(details)
   .filter(([key,v])=>Object.hasOwn(variantMeasurements,key)&&typeof v==='number'&&
    Number.isFinite(v)&&v>=0)
   .map(([key,v])=>pretty(key)+' '+v.toLocaleString('en-GB')+' '+variantMeasurements[key]);
  // A credible side-by-side factory comparison contains at least two
  // documented measurements; never display private or unreviewed fields.
  if(metrics.length>=2)out.push({label:name,value:metrics.join(' · ')});
 }
 return out.length>=2?out:[];
}
export function exactVerifiedModelFacts(rows,make,model){
 if(!Array.isArray(rows)||!safeText(make)||!safeText(model))return [];
 const seen=new Set(),out=[];
 for(const row of rows){
  if(!row||safeText(row.make).toLowerCase()!==safeText(make).toLowerCase()||
      safeText(row.model).toLowerCase()!==safeText(model).toLowerCase()||
      !Object.hasOwn(sections,row.category)||!safeText(row.label)||
      !validUrl(row.source_url)||!Number.isSafeInteger(Number(row.fact_id))||
      Number(row.fact_id)<=0||seen.has(Number(row.fact_id)))continue;
  // Render only simple sourced fact fields; never inject arbitrary HTML or
  // publication metadata, and never present another model's figures.
  let facts=[];
  if(scalar(row.value)!==null)facts=[{label:'Record',value:scalar(row.value)}];
  else if(row.value&&typeof row.value==='object'&&!Array.isArray(row.value)){
   const measurement=documentedMeasurement(row.value);
   if(measurement)facts.push({label:'Documented value',value:measurement});
   if(row.category==='engineering')facts.push(...verifiedEngineeringVariants(row.value));
   facts.push(...Object.entries(row.value).filter(([key,value])=>
    /^[a-z][a-z0-9_]{0,50}$/i.test(key)&&
    !internalValueKeys.has(key.toLowerCase())&&
    !((measurement||Object.hasOwn(row.value,'unit'))&&(key==='amount'||key==='unit'))&&
    displayValue(value)!==null&&
    String(displayValue(value)).length<=500).map(([key,value])=>({label:pretty(key),value:displayValue(value)})));
  }
  if(!facts.length)continue;
  seen.add(Number(row.fact_id));
  out.push({...row,display:facts});
 }
 return out;
}
// Factory records are chronology, not generic unsorted specification rows.
// A manufacturer may document only YYYY or YYYY-MM; display that precision
// exactly rather than inventing a day or assuming a retail launch date.
const factoryCategories=new Set(['manufacturing_evidence','manufacturing','production']);
export function verifiedFactoryDate(fact){
 if(!fact||!factoryCategories.has(fact.category))return '';
 const dated=safeText(fact.value?.date||fact.value?.milestone_date);
 if(/^(18[8-9]\d|19\d\d|20\d\d|2100)(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/.test(dated))return dated;
 const year=Number(fact.start_year);
 return Number.isInteger(year)&&year>=1885&&year<=2100?String(year):'';
}
export function orderedVerifiedFactoryFacts(items){
 if(!Array.isArray(items))return [];
 return [...items].sort((a,b)=>{
  const left=verifiedFactoryDate(a),right=verifiedFactoryDate(b);
  if(left&&right)return left.localeCompare(right)||(Number(a.fact_id)-Number(b.fact_id));
  if(left)return -1;
  if(right)return 1;
  return Number(a.fact_id)-Number(b.fact_id);
 });
}
const node=(doc,tag,value)=>{const el=doc.createElement(tag);el.textContent=String(value??'');return el;};
export function mountVerifiedModelFacts(body,rows,make,model){
 if(!body||body.querySelector?.('[data-anybike-verified-model-facts]'))return 0;
 const facts=exactVerifiedModelFacts(rows,make,model);
 if(!facts.length)return 0;
 const doc=body.ownerDocument||document;
 const grouped=new Map();
 for(const fact of facts){
  if(!grouped.has(fact.category))grouped.set(fact.category,[]);
  grouped.get(fact.category).push(fact);
 }
 const panel=doc.createElement('section');
 panel.className='card feature anybike-verified-model-research';
 panel.dataset.anybikeVerifiedModelFacts='1';
 panel.style.cssText='grid-column:1/-1;min-width:0;background:#171717;color:#fff;border:1px solid #555;border-top:3px solid #ed1c24';
 const heading=node(doc,'h2',make+' '+model+' — documented factory research');
 heading.style.cssText='color:#fff;line-height:1.3;overflow-wrap:anywhere';
 panel.append(heading);
 const yearFacts=facts.filter(x=>x.category==='model_year'&&x.start_year!==null&&x.start_year!==''&&Number.isInteger(Number(x.start_year))&&Number(x.start_year)>=1885&&Number(x.start_year)<=2100);
 const sortedYears=[...new Set(yearFacts.map(x=>Number(x.start_year)))].sort((a,b)=>a-b);
 if(sortedYears.length){
  const intro=node(doc,'p',
   'Factory-source records document '+sortedYears.length+' individual reference year'+
   (sortedYears.length===1?'':'s')+' for the '+make+' '+model+
   ': '+sortedYears.join(', ')+
   '. These are documented versions, not a claim of continuous production.');
  intro.style.cssText='font-size:16px;line-height:1.65;color:#f0f0f0';
  panel.append(intro);
 }
 const caveat=node(doc,'p','Model-year and market-specific source records. Figures are not interchangeable between generations; verify the exact motorcycle before buying.');
 caveat.style.cssText='color:#e8e8e8;line-height:1.65';
 panel.append(caveat);
 for(const category of researchOrder){
  const originalItems=grouped.get(category);
  if(!originalItems?.length)continue;
  const items=factoryCategories.has(category)?orderedVerifiedFactoryFacts(originalItems):originalItems;
  const group=doc.createElement('div');
  group.style.cssText='padding:14px 0;border-top:1px solid #444';
  const groupHeading=node(doc,'h3',sections[category]);
  groupHeading.style.cssText='color:#fff;line-height:1.35';
  group.append(groupHeading);
  const grid=doc.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:16px;align-items:stretch';
  for(const fact of items){
   const article=doc.createElement('article');
   article.style.cssText='background:#242424;color:#fff;border:1px solid #666;border-radius:8px;padding:18px;min-width:0;overflow-wrap:anywhere';
   const productionDate=verifiedFactoryDate(fact);
   if(productionDate){
    article.style.borderLeft='3px solid #ed1c24';
    const dated=node(doc,'p','Factory record: '+productionDate);
    dated.style.cssText='font-size:14px;font-weight:700;color:#fff;margin:0 0 8px';
    article.append(dated);
   }
   const factHeading=node(doc,'h4',fact.label);
   factHeading.style.cssText='color:#fff;line-height:1.4;margin:0 0 10px;overflow-wrap:anywhere';
   article.append(factHeading);
   const detail=[fact.start_year!==null&&fact.start_year!==''&&Number.isInteger(Number(fact.start_year))&&Number(fact.start_year)>=1885&&Number(fact.start_year)<=2100&&'Reference year: '+fact.start_year,
    safeText(fact.market)&&'Market: '+fact.market].filter(Boolean);
   if(detail.length){
    const detailLine=node(doc,'p',detail.join(' · '));
    detailLine.style.cssText='color:#e5e5e5;line-height:1.5';
    article.append(detailLine);
   }
   const dl=doc.createElement('dl');
   dl.style.cssText='display:grid;grid-template-columns:minmax(0,34%) minmax(0,1fr);gap:9px 14px;line-height:1.55;overflow-wrap:anywhere;color:#fff;margin:0';
   for(const entry of fact.display){
    const term=node(doc,'dt',entry.label),value=node(doc,'dd',entry.value);
    term.style.cssText='color:#e1e1e1;font-weight:600;min-width:0;margin:0';
    value.style.cssText='color:#fff;min-width:0;margin:0;overflow-wrap:anywhere';
    dl.append(term,value);
   }
   article.append(dl);
   // Only fact records already approved, audited and assigned to factory
   // documents may include a clickable official reference. Other arbitrary
   // value keys never become navigable HTML or private download links.
   if(fact.category==='factory_documents'&&fact.value&&
      typeof fact.value==='object'&&!Array.isArray(fact.value)){
    const documentUrl=safeText(fact.value.document_url);
    const name=safeText(fact.value.document_title).slice(0,140)||'Open manufacturer document archive';
    if(validUrl(documentUrl)&&/^https:\/\/[^\s]+$/i.test(documentUrl)){
     const ref=node(doc,'a',name+' ↗');
     ref.href=documentUrl;ref.target='_blank';ref.rel='noopener noreferrer';
     ref.style.cssText='display:inline-block;margin-top:12px;color:#fff;text-decoration:underline;text-decoration-color:#ed1c24;text-underline-offset:3px;overflow-wrap:anywhere';
     article.append(ref);
    }
   }
   grid.append(article);
  }
  group.append(grid);
  // A factory archive shared by multiple years only needs one visible
  // reference per research group; each fact still has verified provenance.
  const sources=new Map();
  for(const fact of items){
   if(!sources.has(fact.source_url))
    sources.set(fact.source_url,safeText(fact.source_name)||'Manufacturer source');
  }
  const references=doc.createElement('p');
  references.style.cssText='margin:12px 0 0;color:#f0f0f0;line-height:1.7;overflow-wrap:anywhere';
  references.append(node(doc,'strong',sources.size===1?'Source: ':'Sources: '));
  for(const [url,name] of sources){
   const source=node(doc,'a',name+' ↗');
   source.href=url;source.target='_blank';source.rel='noopener noreferrer';
   source.style.cssText='display:inline-block;color:#fff;text-decoration:underline;text-decoration-color:#ed1c24;text-underline-offset:3px;margin-right:16px;overflow-wrap:anywhere';
   references.append(source);
  }
  group.append(references);
  panel.append(group);
 }
 // Preserve stock and enquiry panels above #body; place factual research
 // ahead of generic fallback and discovery cards, without replacing either.
 body.insertBefore(panel,body.firstChild);
 // Once sourced research is visible, the old unsourced "About this model"
 // placeholder is redundant. Keep all enquiry and buying action cards.
 const removeGenericPlaceholder=()=>{
  for(const card of body.querySelectorAll?.('section.card')||[]){
   if(card===panel)continue;
   if(card.querySelector?.('h2')?.textContent?.trim()==='About this model')
    card.remove();
  }
 };
 removeGenericPlaceholder();
 // The legacy guide can insert its generic placeholder after this sourced
 // panel. Observe only late, direct placeholder cards for a short period.
 // Never rescan the entire page after unrelated stock/research DOM updates.
 if(typeof MutationObserver!=='undefined'){
  let finished=false;
  const watcher=new MutationObserver(records=>{
   if(finished)return;
   const placeholderAdded=records.some(record=>[...record.addedNodes].some(element=>
    element.nodeType===1&&element.matches?.('section.card')&&
    element.querySelector('h2')?.textContent?.trim()==='About this model'
   ));
   if(!placeholderAdded)return;
   finished=true;
   watcher.disconnect();
   removeGenericPlaceholder();
  });
  watcher.observe(body,{childList:true});
  setTimeout(()=>{finished=true;watcher.disconnect();},4000);
 }
 return facts.length;
}
export async function installVerifiedModelFacts({body,make,model,client}={}){
 if(!body||!safeText(make)||!safeText(model))return 0;
 const db=client||globalThis.supabase?.createClient?.(ENDPOINT,PUBLIC_KEY);
 if(!db)return 0;
 try{
  const {data,error}=await db.rpc('public_anybike_verified_model_facts_v1',
   {p_make:make,p_model:model});
  if(error||!Array.isArray(data))return 0;
  return mountVerifiedModelFacts(body,data,make,model);
 }catch(error){
  console.warn('Verified model research unavailable; existing model guide retained',error);
  return 0;
 }
}
// Use the SAME public sourced-facts renderer on verified existing BMW guides.
// Dedicated routes are resolved by the database; never derive the motorcycle
// identity from a filename or render unpublished universal research.
if(typeof document!=='undefined'&&typeof location!=='undefined'){
 const start=async()=>{
  const body=document.getElementById('body');if(!body)return;
  if(location.pathname==='/motorcycle-model-guide.html'){
   const p=new URLSearchParams(location.search);
   await installVerifiedModelFacts({body,make:(p.get('make')||'').trim(),model:(p.get('model')||'').trim()});
   return;
  }
  if(!location.pathname.startsWith('/bmw-')||
     !location.pathname.endsWith('.html')||
     location.pathname==='/bmw-motorcycles.html'||
     location.pathname==='/bmw-r1300gs.html')return;
  const db=globalThis.supabase?.createClient?.(ENDPOINT,PUBLIC_KEY);
  if(!db)return;
  try{
   const {data,error}=await db.rpc('public_anybike_manufacturer_model_routes_v1',{p_make:'BMW'});
   if(error||!Array.isArray(data))return;
   const exact=data.filter(x=>x?.make==='BMW'&&x.url===location.pathname&&typeof x.model==='string');
   if(exact.length!==1)return;
   await installVerifiedModelFacts({body,make:'BMW',model:exact[0].model,client:db});
  }catch(error){console.warn('Verified BMW research route unavailable; existing guide preserved',error);}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void start(),{once:true});
 else void start();
}
