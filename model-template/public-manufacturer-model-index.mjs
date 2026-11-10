// Database-driven directory of existing public model-guide URLs.
// A source-verified route is NOT editorial publication approval. We expose
// only link destinations for HTML guides that already exist on the website.
// No unpublished research, stock records or protected catalogue are requested.
const ENDPOINT='https://tuehtnezhdnkqbbhttgp.supabase.co';
const PUBLIC_KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
const prefixFor=make=>make==='BMW'?'/bmw-':make==='Harley-Davidson'?'/harley-davidson-':'';
export function validatedManufacturerModelLinks(rows,make){
 const prefix=prefixFor(make),seen=new Set();
 if(!prefix||!Array.isArray(rows))return [];
 return rows.filter(row=>{
  const url=row?.url,model=row?.model;
  if(row?.make!==make||typeof model!=='string'||!model.trim()||
     typeof url!=='string'||!url.startsWith(prefix)||
     !/^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(url)||
     seen.has(url))return false;
  seen.add(url);return true;
 }).map(row=>({model:row.model.trim(),url:row.url}))
  .sort((a,b)=>a.model.localeCompare(b.model,'en'));
}
export async function mountManufacturerModelIndex({
 root=typeof document==='undefined'?null:document.querySelector('main'),
 make=null,client=null
}={}){
 if(!root||!prefixFor(make)||root.querySelector('[data-anybike-model-index]'))return false;
 const db=client||globalThis.supabase?.createClient?.(ENDPOINT,PUBLIC_KEY);
 if(!db)return false;
 try{
  const {data,error}=await db.rpc('public_anybike_manufacturer_model_routes_v1',{p_make:make});
  if(error)return false;
  const links=validatedManufacturerModelLinks(data,make);
  if(!links.length||root.querySelector('[data-anybike-model-index]'))return false;
  const doc=root.ownerDocument||document;
  const section=doc.createElement('section');
  section.className='card anybike-database-model-index';
  section.dataset.anybikeModelIndex='1';
  section.style.cssText='margin:22px 0;padding:22px;background:#202024;color:#fff;border:1px solid #555;border-left:3px solid #ed1c24;border-radius:12px';
  const title=doc.createElement('h2');
  title.textContent=make+' model guide directory';
  const note=doc.createElement('p');
  note.textContent='Browse existing AnyBike model guides. Research and stock availability are specific to each motorcycle.';
  const details=doc.createElement('details');
  const summary=doc.createElement('summary');
  summary.textContent='Browse '+links.length+' database-linked model guides';
  summary.style.cssText='cursor:pointer;font-weight:700;padding:10px 0';
  details.append(summary);
  const nav=doc.createElement('nav');
  nav.setAttribute('aria-label',make+' model guide index');
  nav.style.cssText='display:flex;flex-wrap:wrap;gap:9px;padding:12px 0';
  details.append(nav);
  details.addEventListener('toggle',()=>{
   if(!details.open||nav.childElementCount)return;
   for(const link of links){
    const a=doc.createElement('a');
    a.href=link.url;a.textContent=link.model;
    a.style.cssText='display:inline-flex;align-items:center;min-height:40px;padding:9px 13px;border:1px solid #555;border-radius:999px;background:#242424;color:#fff;text-decoration:none';
    nav.append(a);
   }
  });
  // This index intentionally lists only source-verified canonical route records.
  // Existing independently researched guides are preserved on the approved
  // manufacturer page even when their canonical catalogue mapping is pending.
  const allGuides=doc.createElement('a');
  allGuides.href='#models';
  allGuides.textContent='Explore the full '+make+' model guide collection';
  allGuides.style.cssText='display:inline-block;margin-top:14px;color:#fff;text-decoration:underline;text-underline-offset:3px';
  section.append(title,note,details,allGuides);root.append(section);
  return true;
 }catch(error){
  console.warn('Public model guide directory unavailable; approved manufacturer page retained',error);
  return false;
 }
}
if(typeof document!=='undefined'&&typeof location!=='undefined'){
 const fixed=location.pathname==='/bmw-motorcycles.html'?'BMW':
  location.pathname==='/harley-davidson-motorcycles.html'?'Harley-Davidson':null;
 const requested=location.pathname==='/motorcycle-brand.html'?
  new URLSearchParams(location.search).get('make'):fixed;
 if(prefixFor(requested)){
  const start=()=>void mountManufacturerModelIndex({make:requested});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
 }
}
