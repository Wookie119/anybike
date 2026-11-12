// Approved exact-model historical and engineering photography on the existing
// generic model guide. Separate from the hero and the protected dedicated BMW
// / Harley designs. No new layout or approval of unlicensed photographs.
const API='https://tuehtnezhdnkqbbhttgp.supabase.co';
const KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
const clean=x=>typeof x==='string'?x.trim():'';
const https=x=>/^https:\/\/[^\s/?#]+(?:[^\s]*)$/i.test(clean(x));
export function approvedExactModelGallery(rows,make,model){
 if(!Array.isArray(rows)||!clean(make)||!clean(model))return [];
 const seen=new Set(),out=[];
 for(const r of rows){
  if(!r||clean(r.make)!==clean(make)||clean(r.model)!==clean(model)||
    !https(r.image_url)||!https(r.source_page_url)||!https(r.licence_url)||
    !clean(r.licence)||!clean(r.attribution)||!clean(r.title)||
    !['whole_motorcycle','engine','component','detail'].includes(r.subject_category))continue;
  if(seen.has(r.image_url))continue;
  seen.add(r.image_url);
  out.push(r);
 }
 return out;
}
const node=(doc,tag,text)=>{const n=doc.createElement(tag);n.textContent=String(text??'');return n;};
export function mountApprovedModelGallery(body,loaded,make,model){
 if(!body||body.querySelector?.('[data-anybike-model-research-gallery]'))return 0;
 const rows=approvedExactModelGallery(loaded,make,model);
 if(!rows.length)return 0;
 const doc=body.ownerDocument||document;
 const panel=doc.createElement('section');
 panel.className='card feature anybike-verified-model-gallery';
 panel.dataset.anybikeModelResearchGallery='1';
 panel.style.cssText='grid-column:1/-1;min-width:0;background:#171717;color:#fff;border:1px solid #555;border-top:3px solid #ed1c24';
 const heading=node(doc,'h2',make+' '+model+' — documented model photography');
 heading.style.cssText='color:#fff;line-height:1.35';
 panel.append(heading);
 const intro=node(doc,'p','Photographs are dated where documented. Colour, equipment and trim can differ by year and market; images do not establish the specification of a motorcycle for sale.');
 intro.style.cssText='color:#eee;line-height:1.6';panel.append(intro);
 const grid=doc.createElement('div');
 grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px;align-items:start';
 for(const r of rows){
  const figure=doc.createElement('figure');
  figure.style.cssText='min-width:0;margin:0;padding:12px;border:1px solid #666;border-radius:8px;background:#242424;color:#fff';
  const img=doc.createElement('img');
  img.src=r.image_url;img.alt=make+' '+model+' — '+r.title;
  img.loading='lazy';img.decoding='async';
  img.style.cssText='display:block;max-width:100%;width:100%;height:auto;max-height:290px;object-fit:contain;background:#222;border-radius:4px';
  figure.append(img);
  const caption=doc.createElement('figcaption');
  caption.style.cssText='padding-top:10px;color:#eee;line-height:1.55;overflow-wrap:anywhere';
  caption.append(node(doc,'strong',r.title));
  if(Number.isInteger(Number(r.model_year_start))&&Number(r.model_year_start)>=1885&&Number(r.model_year_start)<=2100){
   const yr=r.model_year_end===null||r.model_year_end===''?String(r.model_year_start):
    String(r.model_year_start)+(String(r.model_year_end)===String(r.model_year_start)?'':'–'+r.model_year_end);
   caption.append(node(doc,'p','Documented reference year: '+yr));
  }
  const credit=node(doc,'p','Photo: '+r.attribution+' · Licence: '+r.licence);
  caption.append(credit);
  for(const [url,label] of [[r.source_page_url,'Original photo and attribution ↗'],[r.licence_url,'Licence terms ↗']]){
   const link=node(doc,'a',label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';
   link.style.cssText='display:inline-block;margin-right:14px;color:#fff;text-decoration:underline;text-decoration-color:#ed1c24;text-underline-offset:3px;overflow-wrap:anywhere';
   caption.append(link);
  }
  figure.append(caption);grid.append(figure);
 }
 panel.append(grid);
 body.append(panel);
 return rows.length;
}
export async function installApprovedModelGallery({body,make,model,client,imageFactory}={}){
 if(!body||!clean(make)||!clean(model))return 0;
 const db=client||globalThis.supabase?.createClient?.(API,KEY);
 if(!db)return 0;
 try{
  const {data,error}=await db.rpc('public_anybike_verified_model_gallery_v1',{p_make:make,p_model:model});
  if(error||!Array.isArray(data))return 0;
  const records=approvedExactModelGallery(data,make,model);
  const image=createImageLoader(imageFactory);
  const checks=await Promise.all(records.map(async r=>(await image(r.image_url))?r:null));
  return mountApprovedModelGallery(body,checks.filter(Boolean),make,model);
 }catch(err){
  console.warn('Optional approved photo gallery unavailable; existing model guide retained',err);
  return 0;
 }
}
function createImageLoader(imageFactory){
 return async url=>{
  const im=imageFactory?imageFactory():typeof Image==='function'?new Image():null;
  if(!im)return false;
  return await new Promise(resolve=>{
   im.onload=()=>resolve(true);
   im.onerror=()=>resolve(false);
   im.src=url;
  });
 };
}
if(typeof document!=='undefined'&&typeof location!=='undefined'&&location.pathname==='/motorcycle-model-guide.html'){
 const start=()=>{
  const params=new URLSearchParams(location.search);
  const body=document.getElementById('body');
  if(body)void installApprovedModelGallery({body,make:clean(params.get('make')),model:clean(params.get('model'))});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
}
