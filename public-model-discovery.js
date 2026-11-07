/* AnyBike public model discovery — catalogue-driven links, published pages only.
 * Source: the existing public motorcycle catalogue JSON; sitemap validates destinations.
 * Never requests protected stock, users, dealer records or private Supabase tables.
 */
(function(){
"use strict";
const path=location.pathname.toLowerCase();
const make=path.startsWith("/bmw-")?"BMW":path.startsWith("/harley-davidson-")?"Harley-Davidson":null;
if(!make||!document.querySelector("main")||document.querySelector('[data-anybike-model-discovery="1"]'))return;
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const slug=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"").replace(/[^a-z0-9]/g,"");
const root=make==="BMW"?"/bmw-":"/harley-davidson-";
const modelPath=model=>root+(make==="BMW"?slug(model):String(model).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""))+".html";
const brandUrl=brand=>brand==="BMW"?"/bmw-motorcycles.html":brand==="Harley-Davidson"?"/harley-davidson-motorcycles.html":"/motorcycle-brand.html?make="+encodeURIComponent(brand);
const alternative=make==="BMW"?["Harley-Davidson","Honda","Triumph","KTM","Ducati","Yamaha"]:["BMW","Indian Motorcycle","Triumph","Honda","Royal Enfield","Ducati"];
Promise.all([
 fetch("/data/motorcycle-catalogue-master.json",{cache:"default"}).then(r=>{if(!r.ok)throw Error("Catalogue unavailable");return r.json()}),
 fetch("/sitemap.xml",{cache:"default"}).then(r=>{if(!r.ok)throw Error("Sitemap unavailable");return r.text()})
]).then(([data,xml])=>{
 const parsed=new DOMParser().parseFromString(xml,"application/xml");
 if(parsed.querySelector("parsererror"))return;
 const listed=new Set(Array.from(parsed.getElementsByTagName("loc")).map(el=>{try{const u=new URL(el.textContent);return u.origin===location.origin?u.pathname.toLowerCase():"";}catch(_){return "";}}));
 const records=Array.isArray(data.models)?data.models:[];
 const family=records.filter(x=>norm(x.make)===norm(make)&&x.model);
 const current=family.find(x=>modelPath(x.model).toLowerCase()===path);
 const related=family.filter(x=>{
  const dest=modelPath(x.model).toLowerCase();
  return dest!==path&&listed.has(dest)&&(current?.category?x.category===current.category:true);
 }).slice(0,10);
 const extra=family.filter(x=>{
  const dest=modelPath(x.model).toLowerCase();
  return dest!==path&&listed.has(dest)&&!related.some(y=>norm(y.model)===norm(x.model));
 }).slice(0,5);
 const existing=new Set(Array.from(document.querySelectorAll('main a[href]')).map(a=>{
   try{const u=new URL(a.href,location.href);return u.origin===location.origin?u.pathname.toLowerCase()+u.search:"";}catch(_){return "";}
 }));
 const models=[...related,...extra].filter(x=>!existing.has(modelPath(x.model).toLowerCase()));
 if(!models.length&&alternative.every(x=>existing.has(brandUrl(x).toLowerCase())))return;
 const section=document.createElement("section");
 section.dataset.anybikeModelDiscovery="1";
 section.setAttribute("aria-label","Explore more motorcycles and manufacturers");
 section.style.cssText="margin:24px 0;padding:18px 20px;border:1px solid #ed1c24;border-radius:12px;background:#171717;color:#fff";
 const heading=document.createElement("h2");
 heading.textContent="Explore more motorcycle models and brands";
 heading.style.cssText="margin:0 0 8px;font-size:22px;color:#fff";
 const intro=document.createElement("p");
 intro.textContent="Browse published model guides, other manufacturers and motorcycle stories on AnyBike.";
 intro.style.cssText="margin:0 0 12px;color:#ccc;line-height:1.5";
 const nav=document.createElement("nav");
 nav.setAttribute("aria-label","Published motorcycle model and brand links");
 nav.style.cssText="display:flex;flex-wrap:wrap;gap:9px";
 const seen=new Set();
 const link=(label,href)=>{
  const key=href.toLowerCase();
  if(seen.has(key)||existing.has(key)||key===path)return;
  seen.add(key);
  const a=document.createElement("a");
  a.textContent=label+" →";a.href=href;
  a.style.cssText="display:inline-flex;align-items:center;padding:9px 13px;color:#fff;text-decoration:none;background:#222;border:1px solid #ed1c24;border-radius:999px;font-size:13px;font-weight:700";
  nav.appendChild(a);
 };
 models.forEach(x=>link(make+" "+x.model,modelPath(x.model)));
 alternative.forEach(x=>link(x+" motorcycles",brandUrl(x)));
 link("All 49 manufacturers","/motorcycle-manufacturers.html");
 link("AnyBike Global","/anybike-global.html");
 if(!nav.children.length)return;
 section.append(heading,intro,nav);
 document.querySelector("main").append(section);
}).catch(error=>console.warn("AnyBike public model discovery unavailable:",error.message));
})();
/* Shared approved Available Stock on model guides. Independent of discovery-link results. */
(function loadPublishedInternationalMotorcycles(){
 const p=location.pathname.toLowerCase();
 if(!/\.html$/.test(p)||/-v2\.html$|-backup[^/]*\.html$|-preview\.html$/.test(p))return;
 if(!/^\/(?:bmw|harley-davidson|royal-enfield|moto-guzzi|indian|honda|yamaha|ducati|triumph|kawasaki|suzuki|ktm|aprilia|husqvarna|benelli|cfmoto|zero|vmoto)-/.test(p)&&p!='/motorcycle-model.html'&&p!='/motorcycle-model-guide.html')return;
 if(p.endsWith("-motorcycles.html")||p.endsWith("-models.html"))return;
 if(document.querySelector('script[data-anybike-shared-international-stock]'))return;
 const script=document.createElement("script");
 script.src="/public-international-model-stock.js?v=20261107c";
 script.dataset.anybikeSharedInternationalStock="1";
 document.head.appendChild(script);
})();
