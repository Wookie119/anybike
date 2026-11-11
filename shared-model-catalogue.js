/* Shared AnyBike catalogue extension: informational content only; no protected stock. */
(function(){
"use strict";
const q=new URLSearchParams(location.search);
const make=(q.get("make")||"").trim(), model=(q.get("model")||"").trim();
if(!make||!model)return;
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const target=document.querySelector("#body");
if(!target)return;
// BMW has dedicated, indexable model pages. Keep other makes on their existing guide route until verified dedicated pages exist.
const relatedUrl=(make,model)=>norm(make)==="bmw" ? "/bmw-"+norm(model)+".html" : "/motorcycle-model-guide.html?make="+encodeURIComponent(make)+"&model="+encodeURIComponent(model);
Promise.allSettled([
fetch("/data/motorcycle-catalogue-master.json").then(r=>{if(!r.ok)throw Error("catalogue");return r.json()}),
fetch("/anybike-global.html").then(r=>{if(!r.ok)throw Error("Global");return r.text()})
]).then(results=>{
if(results[0].status==="fulfilled"){
const entries=Array.isArray(results[0].value.models)?results[0].value.models:[];
const exact=entries.find(x=>norm(x.make)===norm(make)&&norm(x.model)===norm(model));
const related=entries.filter(x=>norm(x.make)===norm(make)&&norm(x.model)!==norm(model)&&(exact?.category?x.category===exact.category:true)).slice(0,8);
if(related.length){
const section=document.createElement("section");section.className="card feature";section.id="catalogueRelatedModels";
section.innerHTML="<h2>Model family and related motorcycles</h2><p>Explore other "+escape(make)+" models in the AnyBike motorcycle catalogue.</p>"+(exact?.category?"<p class='meta'>Category: "+escape(exact.category)+"</p>":"")+"<ul class='facts'>"+related.map(x=>"<li><a href='"+relatedUrl(x.make,x.model)+"'>"+escape(x.make+" "+x.model)+" →</a></li>").join("")+"</ul>";
target.appendChild(section);
}}
if(results[1].status==="fulfilled"){
const page=new DOMParser().parseFromString(results[1].value,"text/html");
const links=[...page.querySelectorAll('a[href^="/global/"],a[href^="https://www.anybike.co.uk/global/"]')];
const matches=links.filter(a=>norm(a.textContent).includes(norm(make))||norm(a.textContent).includes(norm(model))).slice(0,6);
const unique=[...new Map(matches.map(a=>[a.getAttribute("href"),a])).values()];
if(unique.length){
const section=document.createElement("section");section.className="card feature";section.id="catalogueGlobalStories";
section.innerHTML="<h2>Related AnyBike Global stories</h2><ul class='facts'>"+unique.map(a=>"<li><a href='"+escape(a.getAttribute("href"))+"'>"+escape(a.textContent.trim().replace(/(?:\s*[→↗])+\s*$/u,""))+" →</a></li>").join("")+"</ul><p><a href='/anybike-global.html'>Explore AnyBike Global →</a></p>";
target.appendChild(section);
}}
}).catch(()=>{});
})();
