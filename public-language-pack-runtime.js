/*
AnyBike multilingual runtime
Applies full language packs to current public/customer pages.
*/
(function(){
  const path=String(location.pathname||"").toLowerCase();
  const supported=new Set([
    "/customer-dashboard.html","/customer-messages.html","/my-searches.html","/my-watchlist.html",
    "/my-purchases.html","/accounts-documents.html","/buy-motorcycles.html","/sell-your-motorcycle.html",
    "/partners-integrations.html","/freight-forwarders.html","/services-and-fees.html","/privacy-policy.html"
  ]);
  if(!supported.has(path)) return;

  window.AnyBikeLanguagePacks=window.AnyBikeLanguagePacks||{};

  function language(){
    return String(
      localStorage.getItem("anybikeLanguage")||
      localStorage.getItem("anybike_language")||
      document.documentElement.lang||
      "en"
    ).toLowerCase().split("-")[0];
  }

  let scheduled=false;
  function apply(){
    scheduled=false;
    const lang=language();
    const map=window.AnyBikeLanguagePacks[lang];
    if(!map) return;

    const root=document.querySelector("main")||document.body;
    root.querySelectorAll("*").forEach(el=>{
      if(el.children.length) return;
      const key=String(el.textContent||"").replace(/\s+/g," ").trim();
      const translated=map[key];
      if(translated && translated!==key) el.textContent=translated;
    });

    root.querySelectorAll("[placeholder]").forEach(el=>{
      const key=String(el.getAttribute("placeholder")||"").replace(/\s+/g," ").trim();
      const translated=map[key];
      if(translated && translated!==key) el.setAttribute("placeholder",translated);
    });

    root.querySelectorAll("[title]").forEach(el=>{
      const key=String(el.getAttribute("title")||"").replace(/\s+/g," ").trim();
      const translated=map[key];
      if(translated && translated!==key) el.setAttribute("title",translated);
    });

    document.documentElement.lang=lang;
    document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(apply);
  }

  window.addEventListener("anybikeLanguageChanged",()=>setTimeout(schedule,0));
  document.addEventListener("DOMContentLoaded",()=>setTimeout(schedule,40));
  const root=document.querySelector("main")||document.body;
  if(root){
    const observer=new MutationObserver(schedule);
    observer.observe(root,{childList:true,subtree:true});
  }
  setTimeout(schedule,120);
})();