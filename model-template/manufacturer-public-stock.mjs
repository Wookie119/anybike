// Shared manufacturer stock gallery; the existing public endpoint is the sole publication boundary.
import {liveStockLink} from './live-stock-navigation.mjs';
const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const brandKey=v=>({bmwmotorrad:'bmw',indianmotorcycle:'indian',indianmotorcycles:'indian'}[norm(v)]||norm(v));
export function manufacturerStock(items,make){
 const seen=new Set(),key=brandKey(make);
 if(!key||!Array.isArray(items))return [];
 return items.filter(b=>{
  if(brandKey(b?.make)!==key||!b.model||b.item_id==null||String(b.item_id)===''||!Number.isFinite(Number(b.price))||Number(b.price)<=0||seen.has(String(b.item_id)))return false;
  seen.add(String(b.item_id));return true;
 });
}
function node(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
const gbp=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'});
export function renderManufacturerStock(root,make,items){
 const rows=manufacturerStock(items,make);
 if(!root||!rows.length||document.querySelector('[data-manufacturer-live-stock]'))return 0;
 const section=node('section');section.dataset.manufacturerLiveStock='1';section.className='section';
 section.style.cssText='margin:24px 0;padding:18px;background:#151515;color:#fff;border:1px solid #444;border-left:3px solid '+(rows.find(row=>/^#[0-9a-f]{6}$/i.test(row.accent_hex||''))?.accent_hex||(brandKey(make)==='harleydavidson'?'#FF6600':'#ED1C24'))+';border-radius:12px';
 const header=node('div');header.style.cssText='display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px';
 const title=node('h2',make+' motorcycles for sale');title.style.margin='0';
 const all=node('a','View all '+rows.length+' motorcycles →');all.href=liveStockLink(rows[0].make);all.style.cssText='color:#fff;text-decoration:underline;font-weight:700';
 header.append(title,all);
 const grid=node('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px';
 for(const bike of rows.slice(0,6)){
  const card=node('a');card.href='/international-vq-motorcycle.html?id='+encodeURIComponent(bike.item_id);card.style.cssText='display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid #555;border-radius:10px;background:#222;color:#fff;text-decoration:none';
  // Only images explicitly returned by the existing buyer-safe service.
  const img=node('img');img.alt=make+' '+bike.model;img.loading='lazy';img.style.cssText='width:100%;aspect-ratio:4/3;object-fit:contain;background:#151515;border-radius:6px';
  const fallback='/anybike-image-coming-soon.png';
  try{const u=new URL(bike.image_url,location.origin);img.src=bike.image_url&&u.protocol==='https:'?u.href:fallback;}catch{img.src=fallback;}
  img.addEventListener('error',()=>{if(!img.src.endsWith(fallback))img.src=fallback;},{once:true});
  const name=node('strong',make+' '+bike.model);
  const details=node('span',[bike.year,Number(bike.mileage)>0?Number(bike.mileage).toLocaleString('en-GB')+' miles':''].filter(Boolean).join(' · '));
  const price=node('strong',gbp.format(Number(bike.price)));price.style.fontSize='20px';
  card.append(img,name);if(details.textContent)card.append(details);card.append(price);
  if(bike.vat_qualifying===true){const vat=node('span','VAT Qualifying');vat.style.cssText='color:#8ee4a0;font-weight:700';card.append(vat);}
  card.append(node('span','View motorcycle →'));grid.append(card);
 }
 section.append(header,grid);root.before(section);return rows.length;
}
export async function mountManufacturerStock(){
 const path=location.pathname;
 const fixed={'/bmw-motorcycles.html':'BMW','/harley-davidson-motorcycles.html':'Harley-Davidson','/indian-motorcycles.html':'Indian Motorcycle'};
 const make=fixed[path]||(path==='/motorcycle-brand.html'?new URLSearchParams(location.search).get('make'):'');
 if(!make||document.querySelector('meta[name="robots"]')?.content.includes('noindex'))return;
 const root=document.querySelector('main #models')||document.querySelector('main #modelFamilies')?.closest('section');
 if(!root)return;
 // Archive navigation is independent of current stock availability.
 if(!document.querySelector('[data-manufacturer-archive-link]')){
  const nav=node('nav');nav.dataset.manufacturerArchiveLink='1';
  nav.setAttribute('aria-label',make+' motorcycle archive');
  nav.style.cssText='margin:12px 0;display:flex;flex-wrap:wrap;gap:8px';
  const archive=node('a','View '+make+' motorcycle archive →');
  archive.href='/motorcycle-archive.html?'+new URLSearchParams({make});
  archive.style.cssText='display:inline-flex;align-items:center;padding:8px 13px;border:1px solid #555;border-radius:999px;background:#242424;color:#fff;text-decoration:none;font-weight:600';
  nav.append(archive);root.before(nav);
 }
 try{
  let token;
  try{
   const client=globalThis.supabase?.createClient?.(
    'https://tuehtnezhdnkqbbhttgp.supabase.co',
    'sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK');
   token=(await client?.auth.getSession())?.data?.session?.access_token;
  }catch(error){console.warn('Optional stock session unavailable',error);}
  const endpoint='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/international-public-stock';
  const response=await fetch(endpoint+(token?'?scope=uk':''),{
   cache:'no-store',signal:AbortSignal.timeout(15000),
   headers:token?{Authorization:'Bearer '+token}:{}
  });
  if(!response.ok)return;
  const data=await response.json();renderManufacturerStock(root,make,data.items);
 }catch(error){console.warn('Manufacturer stock temporarily unavailable',error);}
}
if(typeof document!=='undefined'){
 const start=()=>void mountManufacturerStock();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
