/* AnyBike shared international market intelligence engine
   v1.1 | 25 Sep 2026
   Additive layer: works across both legacy rich market pages and newer lightweight guides.
   Never manufactures buyer demand. Country-specific local destination data is only shown when verified/configured.
*/
(function(){
  "use strict";

  if(window.__anybikeMarketEngineStarted) return;
  window.__anybikeMarketEngineStarted=true;

  const SUPABASE_URL="https://tuehtnezhdnkqbbhttgp.supabase.co";
  const SUPABASE_KEY="sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK";
  const UK_PORTS=["Bristol","Dover","Felixstowe","Harwich","Hull","Immingham","London Gateway","Plymouth","Poole","Portbury","Portsmouth","Purfleet","Sheerness","Southampton","Thamesport","Tilbury"];

  const VERIFIED_LOCAL_DESTINATIONS={
    reunion:{
      title:"Arrival in Réunion",
      intro:"Port Réunion, at Le Port / Pointe des Galets, is the island’s main maritime gateway. Final delivery or collection depends on the buyer’s freight forwarder and agreed destination.",
      ports:["Port Réunion","Le Port","Pointe des Galets"],
      places:["Saint-Denis","Sainte-Marie","La Possession","Saint-Paul","Saint-Leu","Saint-Pierre","Saint-Louis","Le Tampon","Saint-Benoît","Saint-André"]
    }
  };

  function esc(value){
    return String(value==null?"":value).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch];
    });
  }

  function slugFromPath(){
    const match=String(location.pathname||"").match(/\/markets\/([^\/]+)\.html$/i);
    return match?match[1].toLowerCase():"";
  }

  function marketName(){
    const candidates=[
      document.querySelector(".country-line strong"),
      document.querySelector(".country strong"),
      document.querySelector("[data-market-name]")
    ];
    for(let i=0;i<candidates.length;i++){
      const value=(candidates[i]?.textContent||"").trim();
      if(value) return value;
    }
    const title=String(document.title||"");
    let match=title.match(/\bfor\s+(.+?)\s*\|\s*AnyBike/i);
    if(match?.[1]) return match[1].trim();
    match=title.match(/\bpour\s+(?:la |le |les |l’|l')?(.+?)\s*\|\s*AnyBike/i);
    if(match?.[1]) return match[1].trim();
    const slug=slugFromPath();
    return slug.split("-").map(function(part){return part.charAt(0).toUpperCase()+part.slice(1);}).join(" ");
  }

  function ensureStyles(){
    if(document.getElementById("anybikeMarketEngineStyles")) return;
    const style=document.createElement("style");
    style.id="anybikeMarketEngineStyles";
    style.textContent=
      "body .section{padding-top:46px!important;padding-bottom:46px!important}"+
      "body .section .section-head{margin-bottom:22px!important}"+
      "body .section .source-panel,body .section .cta{margin-top:0!important;margin-bottom:0!important}"+
      ".ab-market-section{padding:46px 0;border-bottom:1px solid rgba(255,255,255,.08);background:#080808;color:#fff}"+
      ".ab-market-wrap{width:min(1240px,92vw);margin:0 auto}"+
      ".ab-market-head{max-width:900px;margin-bottom:28px}"+
      ".ab-market-eyebrow{color:#ed1c24;font-size:12px;font-weight:950;letter-spacing:.14em;text-transform:uppercase}"+
      ".ab-market-head h2{margin:8px 0 12px;font-size:clamp(34px,4.5vw,58px);line-height:1.03;letter-spacing:-.045em}"+
      ".ab-market-head p{margin:0;color:#aaa;font-size:18px}"+
      ".ab-signal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:0 0 18px}"+
      ".ab-signal-card,.ab-local-card,.ab-model-panel{padding:22px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#111}"+
      ".ab-signal-card strong,.ab-local-card h3,.ab-model-panel h3{display:block;margin:0 0 8px;font-size:20px}"+
      ".ab-signal-card p,.ab-local-card p,.ab-model-panel p{margin:0;color:#999}"+
      ".ab-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}"+
      ".ab-tag{display:inline-flex;align-items:center;min-height:34px;padding:6px 11px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:#181818;color:#ddd;font-size:12px;font-weight:850;text-decoration:none}"+
      "a.ab-tag:hover{border-color:#ed1c24;color:#fff}"+
      ".ab-stock-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}"+
      ".ab-stock-label{grid-column:1/-1;margin-top:8px}"+
      ".ab-stock-label strong{display:block;font-size:20px}.ab-stock-label span{display:block;color:#929292;font-size:13px;margin-top:4px}"+
      ".ab-stock-card{overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#111;color:#fff;text-decoration:none;transition:.18s}"+
      ".ab-stock-card:hover{transform:translateY(-3px);border-color:#ed1c24}"+
      ".ab-stock-card img{display:block;width:100%;height:205px;object-fit:cover;background:#1a1a1a}"+
      ".ab-stock-copy{padding:16px}.ab-stock-copy h3{margin:0 0 7px;font-size:18px;line-height:1.25}.ab-stock-meta{color:#999;font-size:13px}.ab-stock-price{margin-top:9px;font-size:21px;font-weight:950}.ab-stock-action{margin-top:9px;color:#ed1c24;font-size:13px;font-weight:950}"+
      ".ab-market-actions{display:flex;flex-wrap:wrap;gap:11px;margin-top:22px}.ab-market-btn{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:12px 20px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:#161616;color:#fff;text-decoration:none;font-weight:950}.ab-market-btn.primary{background:#ed1c24;border-color:#ed1c24}"+
      ".ab-local-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}"+
      ".ab-link-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}"+
      ".ab-link-card{display:flex;flex-direction:column;min-height:145px;padding:19px;border:1px solid rgba(255,255,255,.12);border-radius:17px;background:#111;color:#fff;text-decoration:none;transition:.18s}"+
      ".ab-link-card:hover{transform:translateY(-2px);border-color:#ed1c24}.ab-link-card strong{font-size:17px;margin-bottom:7px}.ab-link-card span{color:#999;font-size:13px;line-height:1.45}.ab-link-card b{margin-top:auto;padding-top:12px;color:#ed1c24;font-size:12px}"+
      ".ab-hero-enhanced{padding:0!important;display:grid!important;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);min-height:560px;overflow:hidden}"+
      ".ab-hero-enhanced>.wrap{width:auto!important;margin:0!important;padding:64px max(4vw,calc((100vw - 1240px)/2));padding-right:42px;align-self:center}"+
      ".ab-hero-scene{min-height:560px;background:#141414 center/cover no-repeat;position:relative}.ab-hero-scene:after{content:\"\";position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,5,5,.2),transparent 28%)}"+
      "@media(max-width:950px){.ab-stock-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ab-link-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ab-hero-enhanced{grid-template-columns:1fr;min-height:0}.ab-hero-enhanced>.wrap{padding:50px 5vw}.ab-hero-scene{min-height:390px}}"+
      "@media(max-width:700px){body .section{padding-top:36px!important;padding-bottom:36px!important}.ab-market-section{padding:36px 0}.ab-signal-grid,.ab-local-grid,.ab-stock-grid,.ab-link-grid{grid-template-columns:1fr}.ab-stock-card img{height:230px}.ab-market-actions{display:grid}.ab-market-btn{width:100%}.ab-hero-scene{min-height:300px}}";
    document.head.appendChild(style);
  }

  function money(gbp){
    const value=Number(gbp);
    if(!Number.isFinite(value)||value<=0) return "Price on request";
    if(typeof window.money==="function"){
      try{return window.money(value);}catch(error){}
    }
    return "£"+Math.round(value).toLocaleString("en-GB");
  }

  function mileage(value){
    const n=Number(value);
    return Number.isFinite(n)&&n>0?Math.round(n).toLocaleString("en-GB")+" miles":"";
  }

  function unique(values,limit){
    const seen=new Set();
    const out=[];
    values.forEach(function(value){
      const clean=String(value||"").trim();
      const key=clean.toLowerCase();
      if(!clean||seen.has(key)||out.length>=limit) return;
      seen.add(key);out.push(clean);
    });
    return out;
  }

  function diverseSimilar(rows,limit){
    const counts={};
    const out=[];
    rows.slice().sort(function(a,b){return Number(b.similarity_score||0)-Number(a.similarity_score||0);}).forEach(function(bike){
      if(out.length>=limit) return;
      const key=((bike.make||"")+"|"+(bike.model||"")).toLowerCase();
      if((counts[key]||0)>=2) return;
      counts[key]=(counts[key]||0)+1;
      out.push(bike);
    });
    return out;
  }

  function bikeCard(bike,label){
    const title=[bike.year,bike.make,bike.model,bike.variant].filter(Boolean).join(" ");
    const img=bike.image_url||"/anybike-logo-new.jpg";
    return '<a class="ab-stock-card" href="/bike-details.html?id='+encodeURIComponent(bike.bike_id)+'">'+
      '<img src="'+esc(img)+'" alt="'+esc(title)+'" loading="lazy" onerror="this.onerror=null;this.src=\'/anybike-logo-new.jpg\'">'+
      '<div class="ab-stock-copy"><h3>'+esc(title)+'</h3>'+
      (mileage(bike.mileage)?'<div class="ab-stock-meta">'+esc(mileage(bike.mileage))+'</div>':'')+
      '<div class="ab-stock-price">'+esc(money(bike.price_gbp))+'</div>'+
      '<div class="ab-stock-action">'+esc(label)+' →</div></div></a>';
  }

  function brandUrl(make){
    return "/available-stock.html?make="+encodeURIComponent(make);
  }

  function modelUrl(make,model){
    return "/available-stock.html?make="+encodeURIComponent(make)+"&model="+encodeURIComponent(model);
  }

  function buildSignals(viewed){
    const makes=unique(viewed.map(function(b){return b.make;}),8);
    const models=[];
    const modelRows=[];
    const seen=new Set();
    viewed.forEach(function(b){
      const make=String(b.make||"").trim();
      const model=String(b.model||"").trim();
      if(!make||!model) return;
      const key=(make+"|"+model).toLowerCase();
      if(seen.has(key)||modelRows.length>=10) return;
      seen.add(key);
      modelRows.push({make:make,model:model,label:make+" "+model});
      models.push(make+" "+model);
    });
    return {makes:makes,models:models,modelRows:modelRows};
  }

  function signalsHtml(signals){
    return '<div class="ab-signal-grid">'+
      '<div class="ab-signal-card"><strong>Brands attracting interest</strong><p>Calculated from real motorcycle viewing activity associated with this market.</p><div class="ab-tags">'+
      signals.makes.map(function(make){return '<a class="ab-tag" href="'+brandUrl(make)+'">'+esc(make)+'</a>';}).join("")+
      '</div></div>'+
      '<div class="ab-signal-card"><strong>Models attracting interest</strong><p>These links are generated from real demand and are ready to connect to future Brand → Model → Variant research pages.</p><div class="ab-tags">'+
      signals.modelRows.map(function(row){return '<a class="ab-tag" data-future-model-key="'+esc(row.make+"|"+row.model)+'" href="'+modelUrl(row.make,row.model)+'">'+esc(row.label)+'</a>';}).join("")+
      '</div></div></div>';
  }

  function demandSectionHtml(name,viewed,similar){
    const signals=buildSignals(viewed);
    let groups='';
    if(viewed.length){
      groups+='<div class="ab-stock-label"><strong>Recently viewed in '+esc(name)+'</strong><span>Real recent viewing activity associated with this market. Individual visitors are never identified.</span></div>'+
        viewed.slice(0,8).map(function(b){return bikeCard(b,"View this motorcycle");}).join("");
    }
    if(similar.length){
      groups+='<div class="ab-stock-label"><strong>Similar motorcycles currently available</strong><span>Current UK motorcycles selected from the makes, models, years, engine sizes and budgets attracting interest above.</span></div>'+
        similar.slice(0,8).map(function(b){return bikeCard(b,"View similar motorcycle");}).join("");
    }
    return '<section class="ab-market-section" id="countryBuyerInterestSection" data-anybike-market-engine="demand">'+
      '<div class="ab-market-wrap"><div class="ab-market-head"><div class="ab-market-eyebrow">Buyer interest in '+esc(name)+'</div>'+
      '<h2>Motorcycles attracting attention in '+esc(name)+'.</h2>'+
      '<p>Real motorcycles viewed from this market appear first. Where suitable, the selection continues with similar motorcycles currently available in the United Kingdom.</p></div>'+
      signalsHtml(signals)+'<div class="ab-stock-grid">'+groups+'</div>'+
      '<div class="ab-market-actions"><a class="ab-market-btn primary" href="/available-stock.html">Browse available motorcycles</a><a class="ab-market-btn" href="/buy-motorcycles.html">Ask AnyBike to source another motorcycle</a></div>'+
      '</div></section>';
  }

  function enhanceExistingDemand(viewed){
    const existing=document.getElementById("countryBuyerInterestSection")||document.getElementById("market-interest");
    if(!existing||existing.querySelector("[data-anybike-model-links]")) return;
    const signals=buildSignals(viewed);
    if(!signals.modelRows.length&&!signals.makes.length) return;
    const wrap=existing.querySelector(".wrap")||existing;
    const panel=document.createElement("div");
    panel.className="ab-model-panel";
    panel.dataset.anybikeModelLinks="1";
    panel.style.marginTop="18px";
    panel.innerHTML='<h3>Demand → Brand / Model links</h3><p>This is generated from real market activity. Today it opens filtered stock; when the Brand → Model → Variant pages are live, these same demand keys can point directly to those research pages.</p>'+
      '<div class="ab-tags">'+
      signals.makes.slice(0,6).map(function(make){return '<a class="ab-tag" href="'+brandUrl(make)+'">'+esc(make)+'</a>';}).join("")+
      signals.modelRows.slice(0,8).map(function(row){return '<a class="ab-tag" data-future-model-key="'+esc(row.make+"|"+row.model)+'" href="'+modelUrl(row.make,row.model)+'">'+esc(row.label)+'</a>';}).join("")+
      '</div>';
    wrap.appendChild(panel);
  }


  function enhanceHero(slug,name){
    const hero=document.querySelector(".hero");
    if(!hero || hero.querySelector(".hero-media,.ab-hero-scene")) return;

    const wrap=hero.querySelector(":scope > .wrap");
    if(!wrap) return;

    const candidates=slug==="reunion"
      ? ["/assets/reunion-hero-selected.jpg","/assets/reunion-motorcycle-hero.webp"]
      : ["/assets/"+slug+"-motorcycle-hero.webp"];

    function tryCandidate(index){
      if(index>=candidates.length) return;
      const src=candidates[index];
      const img=new Image();
      img.onload=function(){
        hero.classList.add("ab-hero-enhanced");
        const scene=document.createElement("div");
        scene.className="ab-hero-scene";
        scene.setAttribute("role","img");
        scene.setAttribute("aria-label","Motorcycle and scenic view for "+name);
        scene.style.backgroundImage='url("'+src.replace(/"/g,"%22")+'")';
        hero.appendChild(scene);
      };
      img.onerror=function(){ tryCandidate(index+1); };
      img.src=src;
    }
    tryCandidate(0);
  }

  function addInternalLinks(name){
    if(document.querySelector("[data-anybike-internal-links]")) return;
    const main=document.querySelector("main");
    if(!main) return;

    const french=String(document.documentElement.lang||"").toLowerCase().startsWith("fr");
    const copy=french ? {
      eyebrow:"Explorer AnyBike",
      title:"Plus de services pour acheter une moto au Royaume-Uni pour "+name+".",
      intro:"Poursuivez votre parcours AnyBike : recherche de moto, inspection, collecte, préparation export et informations sur les marchés internationaux.",
      links:[
        ["/available-stock.html","Motos disponibles","Parcourez les motos actuellement disponibles via AnyBike.","Voir le stock →"],
        ["/buy-motorcycles.html","Faire rechercher une moto","Indiquez la marque, le modèle, l’année, le kilométrage et le budget recherchés.","Créer une demande →"],
        ["/motorcycle-inspection.html","Inspection de moto","Découvrez les options d’inspection et de contrôle disponibles avant l’achat.","Voir les inspections →"],
        ["/motorcycle-collection.html","Collecte au Royaume-Uni","Découvrez comment AnyBike et Move Motorcycles collectent les motos auprès des vendeurs britanniques.","Service de collecte →"],
        ["/export-crating.html","Caisse export","Préparation et mise en caisse lorsque votre itinéraire d’expédition l’exige.","Voir la caisse export →"],
        ["/shipping-advice.html","Conseils d’expédition","Préparez la remise au Royaume-Uni à votre transitaire ou agent maritime désigné.","Conseils d’expédition →"],
        ["/freight-forwarders.html","Transitaires","Consultez les informations sur les transitaires pour le transport international.","Voir les transitaires →"],
        ["/services-and-fees.html","Services & frais","Consultez les services AnyBike et les frais applicables.","Voir les services & frais →"],
        ["/international-markets.html","Marchés internationaux","Explorez tous les guides pays et territoires AnyBike.","Voir tous les marchés →"],
        ["/anybike-connect.html","AnyBike Connect","Contactez AnyBike et expliquez-nous ce que vous souhaitez acheter ou organiser.","Contacter AnyBike →"]
      ]
    } : {
      eyebrow:"Explore AnyBike",
      title:"More help buying a UK motorcycle for "+name+".",
      intro:"Continue into motorcycle sourcing, inspection, collection, export preparation and international market information without leaving the AnyBike buying journey.",
      links:[
        ["/available-stock.html","Available Motorcycles","Browse motorcycles currently available through AnyBike.","Browse stock →"],
        ["/buy-motorcycles.html","Source a Motorcycle","Tell AnyBike the make, model, year, mileage and budget you need.","Create a sourcing request →"],
        ["/motorcycle-inspection.html","Motorcycle Inspection","See the inspection and condition-check options available before purchase.","Inspection options →"],
        ["/motorcycle-collection.html","UK Motorcycle Collection","How AnyBike and Move Motorcycles collect motorcycles from UK sellers.","Collection service →"],
        ["/export-crating.html","Export Crating","Preparation and crating options when required by the shipping route.","Export crating →"],
        ["/shipping-advice.html","Shipping Advice","Plan the UK handover to your nominated freight forwarder or shipping agent.","Shipping advice →"],
        ["/freight-forwarders.html","Freight Forwarders","Explore freight-forwarder information for onward international transport.","Freight forwarders →"],
        ["/services-and-fees.html","Services & Fees","See AnyBike services, buying support and applicable charges.","View services & fees →"],
        ["/international-markets.html","International Markets","Explore the full network of AnyBike destination-country guides.","View all markets →"],
        ["/anybike-connect.html","AnyBike Connect","Contact AnyBike and tell us what you are trying to buy or arrange.","Connect with AnyBike →"]
      ]
    };

    const section=document.createElement("section");
    section.className="ab-market-section";
    section.dataset.anybikeInternalLinks="1";
    section.innerHTML='<div class="ab-market-wrap">'+
      '<div class="ab-market-head"><div class="ab-market-eyebrow">'+esc(copy.eyebrow)+'</div>'+
      '<h2>'+esc(copy.title)+'</h2><p>'+esc(copy.intro)+'</p></div>'+
      '<div class="ab-link-grid">'+copy.links.map(function(link){
        return '<a class="ab-link-card" href="'+esc(link[0])+'"><strong>'+esc(link[1])+'</strong><span>'+esc(link[2])+'</span><b>'+esc(link[3])+'</b></a>';
      }).join("")+'</div></div>';

    const finalCta=main.querySelector(".cta")?.closest("section");
    if(finalCta&&finalCta.parentNode) finalCta.parentNode.insertBefore(section,finalCta);
    else main.appendChild(section);
  }


  function decorateJourneyLinks(name){
    const from=window.location.pathname+window.location.search;
    const pageTitle=document.title||("AnyBike market: "+name);
    document.querySelectorAll('a[href^="/anybike-connect.html"],a[href^="/buy-motorcycles.html"]').forEach(function(link){
      try{
        const url=new URL(link.getAttribute("href"),window.location.origin);
        if(!url.searchParams.has("from")) url.searchParams.set("from",from);
        if(!url.searchParams.has("pageTitle")) url.searchParams.set("pageTitle",pageTitle);
        link.setAttribute("href",url.pathname+url.search+url.hash);
      }catch(error){}
    });
  }

  function standardiseUkHandover(name){
    if(document.querySelector("[data-anybike-handover-standardised]")) return;
    const pillContainers=Array.from(document.querySelectorAll(".pills,.port-list,.area-list"));
    const hasUkPorts=pillContainers.some(function(node){
      const text=(node.textContent||"").toLowerCase();
      return text.includes("southampton")&&text.includes("tilbury")&&text.includes("bristol");
    });
    if(hasUkPorts){
      const target=pillContainers.find(function(node){
        const text=(node.textContent||"").toLowerCase();
        return text.includes("southampton")&&text.includes("tilbury")&&text.includes("bristol");
      });
      if(target) target.dataset.anybikeHandoverStandardised="1";
      return;
    }

    const main=document.querySelector("main");
    if(!main) return;
    const section=document.createElement("section");
    section.className="ab-market-section";
    section.dataset.anybikeHandoverStandardised="1";
    section.innerHTML='<div class="ab-market-wrap"><div class="ab-market-head"><div class="ab-market-eyebrow">UK collection & handover</div>'+
      '<h2>From the UK seller to your nominated freight provider.</h2>'+
      '<p>AnyBike arranges the UK-side collection and agreed handover. The buyer’s nominated freight forwarder or shipping agent is responsible for onward international transport to '+esc(name)+'.</p></div>'+
      '<div class="ab-local-card"><h3>AnyBike UK handover ports</h3><p>The handover point is agreed before collection and can be linked to the freight provider’s shipping reference.</p><div class="ab-tags">'+
      UK_PORTS.map(function(port){return '<span class="ab-tag">'+esc(port)+'</span>';}).join("")+
      '</div></div></div>';
    const last=main.querySelector("section:last-of-type");
    if(last) main.insertBefore(section,last); else main.appendChild(section);
  }

  function addVerifiedLocalDestination(slug,name){
    if(document.querySelector("[data-anybike-local-destination]")) return;
    if(slug==="reunion"&&document.getElementById("handover")) return;
    const data=VERIFIED_LOCAL_DESTINATIONS[slug];
    if(!data) return;
    const main=document.querySelector("main");
    if(!main) return;
    const section=document.createElement("section");
    section.className="ab-market-section";
    section.dataset.anybikeLocalDestination=slug;
    section.innerHTML='<div class="ab-market-wrap"><div class="ab-market-head"><div class="ab-market-eyebrow">Destination information</div><h2>'+esc(data.title)+'</h2><p>'+esc(data.intro)+'</p></div>'+
      '<div class="ab-local-grid"><div class="ab-local-card"><h3>Ports / receiving points</h3><div class="ab-tags">'+data.ports.map(function(x){return '<span class="ab-tag">'+esc(x)+'</span>';}).join("")+'</div></div>'+
      '<div class="ab-local-card"><h3>Cities / regions</h3><p>Final transport depends on the freight provider and the agreed receiving arrangement in '+esc(name)+'.</p><div class="ab-tags">'+data.places.map(function(x){return '<span class="ab-tag">'+esc(x)+'</span>';}).join("")+'</div></div></div></div>';
    const handover=document.querySelector("[data-anybike-handover-standardised]");
    if(handover&&handover.parentNode) handover.parentNode.insertBefore(section,handover.nextSibling);
    else main.appendChild(section);
  }

  function loadSupabaseSdk(){
    if(window.supabase?.createClient) return Promise.resolve();
    return new Promise(function(resolve,reject){
      const existing=document.querySelector('script[src*="@supabase/supabase-js"]');
      if(existing){
        existing.addEventListener("load",resolve,{once:true});
        existing.addEventListener("error",reject,{once:true});
        setTimeout(function(){if(window.supabase?.createClient) resolve();},0);
        return;
      }
      const script=document.createElement("script");
      script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.async=true;
      script.onload=resolve;
      script.onerror=reject;
      document.head.appendChild(script);
    });
  }

  async function getClient(){
    try{
      if(typeof window.sb!=="undefined"&&window.sb?.rpc) return window.sb;
    }catch(error){}
    await loadSupabaseSdk();
    if(!window.supabase?.createClient) return null;
    return window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  }

  async function loadDemand(name){
    const client=await getClient();
    if(!client) return;
    const results=await Promise.all([
      client.rpc("get_country_motorcycle_interest_v1",{p_country:name,p_limit:8}),
      client.rpc("get_country_similar_motorcycles_v2",{p_country:name,p_limit:16})
    ]);
    if(results[0].error) throw results[0].error;
    if(results[1].error) throw results[1].error;
    const viewed=(Array.isArray(results[0].data)?results[0].data:[]).filter(function(b){return b&&b.bike_id&&b.make&&b.model;});
    if(!viewed.length) return;
    const viewedIds=new Set(viewed.map(function(b){return b.bike_id;}));
    const similar=diverseSimilar((Array.isArray(results[1].data)?results[1].data:[]).filter(function(b){
      return b&&b.bike_id&&b.make&&b.model&&!viewedIds.has(b.bike_id);
    }),8);

    const existing=document.getElementById("countryBuyerInterestSection")||document.getElementById("market-interest");
    if(existing){
      enhanceExistingDemand(viewed);
      return;
    }
    const hero=document.querySelector(".hero");
    if(hero) hero.insertAdjacentHTML("afterend",demandSectionHtml(name,viewed,similar));
  }

  async function run(){
    const slug=slugFromPath();
    if(!slug) return;
    const name=marketName();
    ensureStyles();
    enhanceHero(slug,name);
    standardiseUkHandover(name);
    addVerifiedLocalDestination(slug,name);
    addInternalLinks(name);
    decorateJourneyLinks(name);
    try{
      await loadDemand(name);
    }catch(error){
      console.warn("AnyBike market demand engine unavailable",slug,error);
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();
})();