/* AnyBike Global editorial cross-links. Read-only: no stock, authentication or database access. */
(function(){
"use strict";
const root=document.querySelector("[data-global-stories-brand]");
if(!root)return;
const brand=(root.getAttribute("data-global-stories-brand")||new URLSearchParams(location.search).get("make")||"").trim();
if(!brand)return;
const normal=s=>String(s||"").toLocaleLowerCase("en-GB").replace(/&amp;/g,"&").replace(/[^a-z0-9]+/g," ").trim();
const brandKey=normal(brand);
const label=brand==="BMW"?"BMW":brand;
const encode=s=>String(s||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const slug=s=>normal(s).replace(/\s+/g,"-").slice(0,72);
function matches(article){
 const declared=normal(article.getAttribute("data-manufacturer")||"");
 if(declared)return declared.split(/\s*,\s*/).some(x=>x===brandKey);
 const tag=normal(article.querySelector(".tag")?.textContent);
 const title=normal(article.querySelector("h3")?.textContent);
 const text=normal(article.textContent);
 const links=[...article.querySelectorAll("a[href]")].map(a=>a.getAttribute("href")||"");
 const matchPhrase=(s)=>(" "+s+" ").includes(" "+brandKey+" ");
 return matchPhrase(title)||matchPhrase(tag)||matchPhrase(text)||
  links.some(h=>{try{const u=new URL(h,location.origin);return normal(u.searchParams.get("make"))===brandKey||u.pathname.toLowerCase().includes("/global/"+slug(brand)+"-")}catch{return false}});
}
fetch("/anybike-global.html",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("Global feed unavailable");return r.text()}).then(html=>{
 const page=new DOMParser().parseFromString(html,"text/html");
 const articles=[...page.querySelectorAll("article.tile")];
 const items=articles.filter(a=>a.querySelector("h3")&&a.querySelector("p")&&matches(a));
 if(!items.length){root.hidden=true;return}
 const cards=items.slice(0,3).map(article=>{
  const title=article.querySelector("h3").textContent.trim();
  const tag=article.querySelector(".tag")?.textContent.trim()||"AnyBike Global";
  const description=article.querySelector("p")?.textContent.trim()||"";
  const standalone=[...article.querySelectorAll('a[href^="/global/"]')][0];
  const target=standalone?.getAttribute("href")||("/anybike-global.html#"+(article.id||("global-story-"+slug(title))));
  return '<article class="global-story-card"><div class="global-story-tag">'+encode(tag)+'</div><h3>'+encode(title)+'</h3><p>'+encode(description)+'</p><a href="'+encode(target)+'">Read the Global story →</a></article>';
 });
 const grid=root.querySelector("[data-global-stories-list]");
 if(!grid)return;
 grid.innerHTML=cards.join("");
 root.querySelector("[data-global-stories-title]").textContent=label+" stories from AnyBike Global";
 root.hidden=false;
}).catch(()=>{root.hidden=true});
})();
