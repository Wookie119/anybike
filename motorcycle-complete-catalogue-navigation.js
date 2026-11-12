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
 const count=document.createElement('p');count.className='dir-count';count.textContent=entries.length+' manufacturer'+(title.includes('manufacturers')?'s':' model')+(entries.length===1?'':'s')+' in this directory';
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
 if(isBrand){
   const other=makes.filter(m=>normalize(m)!==normalize(make));
   const manufacturers=section('Explore all motorcycle manufacturers','Browse every manufacturer in the AnyBike public catalogue.',other,'',makeUrl);
   manufacturers.dataset.completeCatalogueNavigation='1';main.append(manufacturers);
   // Complete model catalogue is already rendered on the generic brand page.
   // Dedicated BMW and Harley pages have their own approved guides and the
   // independent database-backed route index; do not hide or replace these.
   return;
 }
 const models=[...new Map(rows.filter(x=>normalize(x.make)===normalize(make)).map(x=>[normalize(x.model),x.model])).values()].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
 if(!models.length)return;
 let routes=[];
 if((make==='BMW'||make==='Harley-Davidson')&&window.supabase?.createClient){
   try{
    const client=window.supabase.createClient('https://tuehtnezhdnkqbbhttgp.supabase.co','sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK');
    const result=await client.rpc('public_anybike_manufacturer_model_routes_v1',{p_make:make});
    if(!result.error&&Array.isArray(result.data))routes=result.data.filter(x=>x&&x.make===make&&typeof x.model==='string'&&typeof x.url==='string'&&/^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(x.url));
   }catch(error){console.warn('Dedicated model route lookup unavailable',error)}
 }
 const byModel=new Map(routes.map(x=>[normalize(x.model),x.url]));
 const currentName=params.get('model')||routes.find(x=>x.url===path)?.model||'';
 const entries=models.filter(x=>normalize(x)!==normalize(currentName));
 const nav=section('Explore other '+make+' models','Every named model in the AnyBike public catalogue. Choose a model to view its own guide, production history and sourcing information.',entries,'',m=>byModel.get(normalize(m))||genericUrl(make,m));
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