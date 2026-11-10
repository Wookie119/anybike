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
 competition:'Competition history',design:'Design and development'
};
const safeText=x=>typeof x==='string'?x.trim():'';
const validUrl=x=>typeof x==='string'&&/^https:\/\/[^\s/?#]+(?:[^\s]*)$/i.test(x);
const pretty=x=>x.replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase());
const scalar=x=>typeof x==='string'?x:typeof x==='number'&&Number.isFinite(x)?String(x):null;
export function exactVerifiedModelFacts(rows,make,model){
 if(!Array.isArray(rows)||!safeText(make)||!safeText(model))return [];
 const seen=new Set(),out=[];
 for(const row of rows){
  if(!row||safeText(row.make).toLowerCase()!==make.toLowerCase()||
      safeText(row.model).toLowerCase()!==model.toLowerCase()||
      !Object.hasOwn(sections,row.category)||!safeText(row.label)||
      !validUrl(row.source_url)||!Number.isSafeInteger(Number(row.fact_id))||
      Number(row.fact_id)<=0||seen.has(row.fact_id))continue;
  // Render only simple sourced fact fields; never inject arbitrary HTML or
  // publication metadata, and never present another model's figures.
  let facts=[];
  if(scalar(row.value)!==null)facts=[{label:'Record',value:scalar(row.value)}];
  else if(row.value&&typeof row.value==='object'&&!Array.isArray(row.value)){
   facts=Object.entries(row.value).filter(([key,value])=>
    /^[a-z][a-z0-9_]{0,50}$/i.test(key)&&scalar(value)!==null&&
    String(scalar(value)).length<=350).slice(0,12)
    .map(([key,value])=>({label:pretty(key),value:scalar(value)}));
  }
  if(!facts.length)continue;
  seen.add(row.fact_id);
  out.push({...row,display:facts});
 }
 return out.slice(0,60);
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
 panel.style.cssText='grid-column:1/-1;border-top:3px solid #ed1c24';
 panel.append(node(doc,'h2',make+' '+model+' — documented factory research'));
 panel.append(node(doc,'p','Model-year and market-specific source records. Figures are not interchangeable between generations; verify the exact motorcycle before buying.'));
 for(const [category,items] of grouped){
  const group=doc.createElement('div');
  group.style.cssText='padding:14px 0;border-top:1px solid #444';
  group.append(node(doc,'h3',sections[category]));
  const grid=doc.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px';
  for(const fact of items){
   const article=doc.createElement('article');
   article.style.cssText='background:#202020;border:1px solid #555;border-radius:8px;padding:14px';
   article.append(node(doc,'h4',fact.label));
   const detail=[fact.start_year&&'Model/source year: '+fact.start_year,
    safeText(fact.market)&&'Market: '+fact.market].filter(Boolean);
   if(detail.length)article.append(node(doc,'p',detail.join(' · ')));
   const dl=doc.createElement('dl');
   dl.style.cssText='display:grid;grid-template-columns:minmax(90px,auto) 1fr;gap:5px 12px';
   for(const entry of fact.display){
    dl.append(node(doc,'dt',entry.label),node(doc,'dd',entry.value));
   }
   article.append(dl);
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
  references.style.cssText='margin:12px 0 0';
  references.append(node(doc,'strong',sources.size===1?'Source: ':'Sources: '));
  for(const [url,name] of sources){
   const source=node(doc,'a',name+' ↗');
   source.href=url;source.target='_blank';source.rel='noopener noreferrer';
   source.style.cssText='margin-right:16px';
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
 if(typeof MutationObserver!=='undefined'){
  const watcher=new MutationObserver(()=>removeGenericPlaceholder());
  watcher.observe(body,{childList:true});
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
if(typeof document!=='undefined'&&typeof location!=='undefined'&&
   location.pathname==='/motorcycle-model-guide.html'){
 const start=()=>{
  const p=new URLSearchParams(location.search);
  void installVerifiedModelFacts({body:document.getElementById('body'),
   make:(p.get('make')||'').trim(),model:(p.get('model')||'').trim()});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
}
