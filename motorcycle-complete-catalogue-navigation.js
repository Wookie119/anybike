/* AnyBike complete catalogue navigation — public names and existing routes only.
   Never reads draft editorial sections, stock or private customer data. */
(function(){
'use strict';
const path=location.pathname;
const isBrand=path==='/motorcycle-brand.html'||path==='/bmw-motorcycles.html'||path==='/harley-davidson-motorcycles.html';
const isGuide=path==='/motorcycle-model-guide.html'||/^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(path)&&!isBrand;
if(!isBrand&&!isGuide)return;
const params=new URLSearchParams(location.search);
const make=path==='/bmw-motorcycles.html'||path.startsWith('/bmw-')?'BMW':path==='/harley-davidson-motorcycles.html'||path.startsWith('/harley-davidson-')?'Harley-Davidson':params.get('make');
if(!make)return;
const normalize=x=>String(x||'').toLocaleLowerCase('en').replace(/[^a-z0-9]/g,'');
const makeUrl=m=>m==='BMW'?'/bmw-motorcycles.html':m==='Harley-Davidson'?'/harley-davidson-motorcycles.html':'/motorcycle-brand.html?make='+encodeURIComponent(m);
const genericUrl=(m,n)=>'/motorcycle-model-guide.html?make='+encodeURIComponent(m)+'&model='+encodeURIComponent(n);
const css='.anybike-complete-directory{margin:22px 0;padding:22px;background:#252525;border:1px solid #ed1c24;border-radius:12px;color:#fff}.anybike-complete-directory h2{margin:0 0 8px;color:#fff}.anybike-complete-directory p{color:#ddd}.anybike-complete-directory nav{display:flex;flex-wrap:wrap;gap:9px}.anybike-complete-directory a,.anybike-complete-directory .nav-pill{display:inline-flex;align-items:center;min-height:40px;padding:8px 13px;background:#303030;border:1px solid #767676;border-radius:99px;color:#fff;text-decoration:none;font-weight:650;font-size:14px}.anybike-complete-directory a:hover,.anybike-complete-directory a:focus-visible{border-color:#ed1c24;outline-offset:3px}.anybike-complete-directory .nav-pill[aria-current="page"]{border-color:#ed1c24;background:#3a3a3a}.anybike-complete-directory .dir-count{font-size:13px;color:#bbb;margin:4px 0 14px}';
const style=document.createElement('style');style.textContent=css;document.head.append(style);
function pill(nav,label,url,current){
 const el=document.createElement(current?'span':'a');el.className='nav-pill';el.textContent=label+(current?'':' →');
 if(current)el.setAttribute('aria-current','page');else el.href=url;nav.append(el);
}
function section(title,note,entries,current,urlFor){
 const sec=document.createElement('section');sec.className='anybike-complete-directory';
 const h=document.createElement('h2');h.textContent=title;
 const intro=document.createElement('p');intro.textContent=note;
 const count=document.createElement('p');count.className='dir-count';
 const kind=title.includes('manufacturers')?'manufacturer':'model';
 count.textContent=entries.length+' '+kind+(entries.length===1?'':'s')+' in this directory';
 const nav=document.createElement('nav');nav.setAttribute('aria-label',title);
 entries.forEach(name=>pill(nav,name,urlFor(name),normalize(name)===normalize(current)));
 sec.append(h,intro,count,nav);return sec;
}
async function mount(){
 const main=document.querySelector('main');if(!main||document.querySelector('[data-complete-catalogue-navigation]'))return;
 let catalogue;
 try{const res=await fetch('/data/motorcycle-catalogue-master.json',{cache:'default'});if(!res.ok)throw Error('Catalogue unavailable');catalogue=await res.json();}catch(e){console.warn('Complete catalogue navigation unavailable',e);return}
 const rows=Array.isArray(catalogue.models)?catalogue.models.filter(x=>x&&typeof x.make==='string'&&typeof x.model==='string'&&x.make.trim()&&x.model.trim()):[];
 if(!rows.length)return;
 const makes=[...new Map(rows.map(x=>[normalize(x.make),x.make])).values()].sort((a,b)=>a.localeCompare(b,'en'));

 const publicModels=rows.filter(x=>normalize(x.make)===normalize(make));
 // Use the same canonical, name-reviewed Supabase directory as manufacturer
 // model cards. The static public catalogue is an offline fallback only.
 let databaseModels=[];
 try{
  const response=await fetch('https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_manufacturer_catalogue_names_v1',{
   method:'POST',
   headers:{'apikey':'sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK','Content-Type':'application/json'},
   body:JSON.stringify({p_make:make})
  });
  if(response.ok){
   const data=await response.json();
   if(Array.isArray(data))databaseModels=data.filter(x=>
    x&&normalize(x.make)===normalize(make)&&typeof x.model==='string'&&x.model.trim()&&x.model.length<=120);
  }
 }catch(error){console.warn('Canonical manufacturer model names unavailable; using reviewed public catalogue',error)}
 let routes=[];
 if((make==='BMW'||make==='Harley-Davidson')&&window.supabase?.createClient){
   try{
    const client=window.supabase.createClient('https://tuehtnezhdnkqbbhttgp.supabase.co','sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK');
    const result=await client.rpc('public_anybike_manufacturer_model_routes_v1',{p_make:make});
    if(!result.error&&Array.isArray(result.data))routes=result.data.filter(x=>x&&x.make===make&&typeof x.model==='string'&&typeof x.url==='string'&&/^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(x.url));
   }catch(error){console.warn('Dedicated model route lookup unavailable',error)}
 }
 const byModel=new Map(routes.map(x=>[normalize(x.model),x.url]));
 // The public catalogue is the reviewed directory. Existing verified BMW
 // and Harley guide routes may also appear even before a catalogue refresh.
 const models=[...new Map([...(databaseModels.length?databaseModels:publicModels).map(x=>x.model),...routes.map(x=>x.model)]
  .filter(Boolean).map(name=>[normalize(name),name])).values()]
  .sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
 if(!models.length)return;
 // Every manufacturer page must show the same complete, clickable model-pill
 // directory as the approved R 1300 GS guide. Use exact manufacturer matching,
 // never unrelated makes or a small curated subset.
 if(isBrand){
  if(models.length){
   const nav=section('All '+make+' motorcycle models','Choose any '+make+' model to open its individual AnyBike model guide.',models,'',name=>byModel.get(normalize(name))||genericUrl(make,name));
   nav.dataset.completeCatalogueNavigation='1';
   const existing=main.querySelector('nav[aria-label="All '+make+' model guides"],nav[aria-label="Related '+make+' model guides"]');
   if(existing){
    existing.replaceChildren(...Array.from(nav.querySelector('nav').children));
    existing.setAttribute('aria-label','All '+make+' model guides');
   }else{
    const modelGroups=main.querySelector('#modelGroups,#models');
    if(modelGroups)modelGroups.before(nav);else main.append(nav);
   }
  }
  const other=makes.filter(m=>normalize(m)!==normalize(make));
  const manufacturers=section('Explore all motorcycle manufacturers','Browse every manufacturer in the AnyBike public catalogue.',other,'',makeUrl);
  manufacturers.dataset.completeCatalogueNavigation='1';main.append(manufacturers);
  return;
 }

 // Curate genuine relatives only. A broad category (e.g. "Heritage") is
 // never enough to link a 1923 R 32 with a modern GS or RT.
 const family=n=>{
  const words=String(n||'').toUpperCase().split(/[^A-Z0-9/]+/).filter(Boolean);
  return words.find(x=>['GS','G/S','RT','RS','RR','XR','GT','GTL','ST'].includes(x))||null;
 };
 const base=n=>String(n||'').toUpperCase().replace(/ (ADVENTURE|TE|LE|SE|ASA|HIGHLINE|LOW)$/,'').trim();
 async function correctRelated(){
  let guides=[];
  try{const response=await fetch('/data/motorcycle-model-guides.json');
   if(response.ok){const json=await response.json();guides=Object.values(json.models||{});}}catch(_){}
  const yearMap=new Map(guides.filter(x=>x&&normalize(x.make)===normalize(make)).map(x=>[normalize(x.model),x.production?.first_model_year]));
  const existingModel=routes.find(x=>x.url===path)?.model;
  const current=params.get('model')||existingModel;
  const currentYear=yearMap.get(normalize(current));
  const currentFamily=family(current);
  const chosen=models.filter(other=>{
   if(normalize(other)===normalize(current))return false;
   if(base(other)===base(current))return true;
   if(!currentFamily||family(other)!==currentFamily)return false;
   const year=yearMap.get(normalize(other));
   return Number.isInteger(currentYear)&&Number.isInteger(year)&&Math.abs(currentYear-year)<=22;
  }).slice(0,12);
  function render(){
   const headings=Array.from(main.querySelectorAll('h2,h3')).filter(h=>/^(Explore related .* models|Model family and related motorcycles)$/i.test(h.textContent.trim()));
   headings.forEach(h=>{
    const panel=h.closest('section');
    if(!panel||panel.dataset.anybikeCuratedRelated==='1')return;
    if(!chosen.length){panel.remove();return;}
    panel.dataset.anybikeCuratedRelated='1';
    h.textContent='Related '+make+' model family';
    const old=panel.querySelector('ul.facts,nav');
    const nav=document.createElement('nav');
    nav.setAttribute('aria-label','Related '+make+' model family');
    nav.style.cssText='display:flex;flex-wrap:wrap;gap:9px';
    chosen.forEach(name=>pill(nav,name,byModel.get(normalize(name))||genericUrl(make,name),false));
    if(old)old.replaceWith(nav);else panel.append(nav);
    const paragraph=panel.querySelector('p');
    if(paragraph)paragraph.textContent='Documented family or comparable generation. Browse the complete '+make+' directory for all other models.';
   });
  }
  render();
  // Legacy guide loaders can add the related-model panel after the first
  // render. Observe only newly inserted RELATED headings; unrelated stock
  // cards, image loads, country links and header widgets must not re-run
  // expensive full-page heading scans or starve the browser's event loop.
  const isRelatedHeading=h=>/^(Explore related .* models|Model family and related motorcycles)$/i.test(h.textContent.trim());
  let scheduled=false;
  const observer=new MutationObserver(records=>{
   const relatedAdded=records.some(record=>[...record.addedNodes].some(node=>{
    if(node.nodeType!==1)return false;
    if(node.matches?.('h2,h3')&&isRelatedHeading(node))return true;
    return [...(node.querySelectorAll?.('h2,h3')||[])].some(isRelatedHeading);
   }));
   if(!relatedAdded||scheduled)return;
   scheduled=true;
   requestAnimationFrame(()=>{scheduled=false;render();});
  });
  observer.observe(main,{childList:true,subtree:true});
 }

 const currentName=params.get('model')||routes.find(x=>x.url===path)?.model||'';
 void correctRelated();
 const entries=models;
 const nav=section('Explore other '+make+' models','Every named model from this manufacturer, including the motorcycle you are viewing. Select any other model to open its guide.',entries,currentName,m=>byModel.get(normalize(m))||genericUrl(make,m));
 nav.dataset.completeCatalogueNavigation='1';
 const existing=main.querySelector('nav[aria-label="Related BMW model guides"],nav[aria-label="Related Harley-Davidson model guides"]');
 if(existing){
   // Keep the approved R 1300 GS design and place the complete navigation
   // inside its existing pill area, rather than adding a duplicate section.
   existing.replaceChildren(...Array.from(nav.querySelector('nav').children));
   existing.setAttribute('aria-label','All '+make+' model guides');
   nav.remove();return;
 }
 const buyerActions=main.querySelector('#ukSellerAction,#nextAction,section[aria-label="UK motorcycle selling"]');
 if(buyerActions)buyerActions.before(nav);else main.append(nav);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void mount(),{once:true});
else void mount();
})();