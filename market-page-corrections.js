/* AnyBike market-page corrections
   Central correction layer for country flags and UK handover/shipping content.
*/
(function(){
  const MARKET_COUNTRIES={"antigua-and-barbuda":["Antigua and Barbuda","ag"],"argentina":["Argentina","ar"],"australia":["Australia","au"],"austria":["Austria","at"],"bahamas":["Bahamas","bs"],"bahrain":["Bahrain","bh"],"barbados":["Barbados","bb"],"belgium":["Belgium","be"],"belize":["Belize","bz"],"bolivia":["Bolivia","bo"],"brazil":["Brazil","br"],"canada":["Canada","ca"],"chile":["Chile","cl"],"colombia":["Colombia","co"],"costa-rica":["Costa Rica","cr"],"cuba":["Cuba","cu"],"denmark":["Denmark","dk"],"dominica":["Dominica","dm"],"dominican-republic":["Dominican Republic","do"],"ecuador":["Ecuador","ec"],"egypt":["Egypt","eg"],"el-salvador":["El Salvador","sv"],"finland":["Finland","fi"],"france":["France","fr"],"germany":["Germany","de"],"grenada":["Grenada","gd"],"guatemala":["Guatemala","gt"],"guyana":["Guyana","gy"],"haiti":["Haiti","ht"],"honduras":["Honduras","hn"],"india":["India","in"],"indonesia":["Indonesia","id"],"ireland":["Ireland","ie"],"italy":["Italy","it"],"jamaica":["Jamaica","jm"],"japan":["Japan","jp"],"jordan":["Jordan","jo"],"kenya":["Kenya","ke"],"kuwait":["Kuwait","kw"],"malaysia":["Malaysia","my"],"mexico":["Mexico","mx"],"morocco":["Morocco","ma"],"netherlands":["Netherlands","nl"],"new-zealand":["New Zealand","nz"],"nicaragua":["Nicaragua","ni"],"nigeria":["Nigeria","ng"],"norway":["Norway","no"],"oman":["Oman","om"],"panama":["Panama","pa"],"paraguay":["Paraguay","py"],"peru":["Peru","pe"],"philippines":["Philippines","ph"],"portugal":["Portugal","pt"],"puerto-rico":["Puerto Rico","pr"],"qatar":["Qatar","qa"],"reunion":["Réunion Island","re"],"saint-kitts-and-nevis":["Saint Kitts and Nevis","kn"],"saint-lucia":["Saint Lucia","lc"],"saint-vincent-and-the-grenadines":["Saint Vincent and the Grenadines","vc"],"saudi-arabia":["Saudi Arabia","sa"],"singapore":["Singapore","sg"],"south-africa":["South Africa","za"],"south-korea":["South Korea","kr"],"spain":["Spain","es"],"sweden":["Sweden","se"],"switzerland":["Switzerland","ch"],"taiwan":["Taiwan","tw"],"thailand":["Thailand","th"],"trinidad-and-tobago":["Trinidad and Tobago","tt"],"turkiye":["Türkiye","tr"],"uae":["UAE","ae"],"uruguay":["Uruguay","uy"],"usa":["USA","us"]};
  const UK_PORTS=["Bristol","Dover","Felixstowe","Harwich","Hull","Immingham","London Gateway","Plymouth","Poole","Portbury","Portsmouth","Purfleet","Sheerness","Southampton","Thamesport","Tilbury"];
  const ARTICLE_COUNTRIES=new Set(["bahamas","netherlands","philippines","uae","usa"]);

  function esc(value){
    return String(value??"").replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch];
    });
  }

  function currentMarket(){
    const m=location.pathname.match(/\/markets\/([^\/]+)\.html$/i);
    if(!m)return null;
    const slug=m[1].toLowerCase();
    const row=MARKET_COUNTRIES[slug];
    return row?{slug:slug,name:row[0],code:row[1]}:null;
  }

  function fixFlag(market){
    const flag=document.querySelector(".country-flag");
    if(!flag)return;
    flag.setAttribute("aria-label",market.name+" flag");
    flag.innerHTML='<img src="https://flagcdn.com/w160/'+encodeURIComponent(market.code)+'.png" '+
      'srcset="https://flagcdn.com/w320/'+encodeURIComponent(market.code)+'.png 2x" '+
      'alt="'+esc(market.name)+' flag" width="76" height="48" '+
      'style="width:100%;height:100%;object-fit:cover;display:block">';
  }

  function fixHero(market){
    const img=document.querySelector(".hero-bike");

    if(img){
      // Country landing-page heroes must remain country-specific and neutral.
      // Never promote a motorcycle from buyer-interest data into the hero.
      if(market.slug==="australia"){
        img.src="/assets/australia-motorcycle-hero.jpg";
      }else if(market.slug==="france"){
        img.src="/assets/france-hero-horo.webp";
      }else if(market.slug!=="reunion"){
        img.src="/assets/"+market.slug+"-motorcycle-hero.webp";
      }

      img.alt="UK motorcycle sourcing for buyers in "+market.name;
      img.dataset.marketHero="country";
    }

    const strong=document.querySelector(".country-line strong");
    if(strong)strong.textContent=market.name;
  }

  function cleanCountryGrammar(market){
    if(ARTICLE_COUNTRIES.has(market.slug))return;
    const wrong="the "+market.name;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const parent=node.parentElement;
      if(!parent || /^(SCRIPT|STYLE|TEXTAREA)$/i.test(parent.tagName))continue;
      if(node.nodeValue.indexOf(wrong)>=0){
        node.nodeValue=node.nodeValue.split(wrong).join(market.name);
      }
    }
  }

  function marketMoney(gbp){
    try{
      if(typeof money==="function") return money(gbp);
    }catch(error){}

    const value=Number(gbp);
    return Number.isFinite(value) && value>0
      ? "£"+Math.round(value).toLocaleString("en-GB")
      : "Price on request";
  }

  function marketMileage(mileage){
    const value=Number(mileage);
    if(!Number.isFinite(value) || value<=0)return "";
    return Math.round(value).toLocaleString("en-GB")+" miles";
  }

  function uniqueBy(arr,keyFn){
    const seen=new Set();
    return arr.filter(function(item){
      const key=keyFn(item);
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  }

  function diverseSimilar(rows,limit){
    const counts={};
    const out=[];
    rows.slice().sort(function(a,b){
      return Number(b.similarity_score||0)-Number(a.similarity_score||0);
    }).forEach(function(bike){
      if(out.length>=limit)return;
      const key=((bike.make||"")+"|"+(bike.model||"")).toLowerCase();
      if((counts[key]||0)>=2)return;
      counts[key]=(counts[key]||0)+1;
      out.push(bike);
    });
    return out;
  }

  function marketBikeCard(bike,label){
    const title=[bike.year,bike.make,bike.model,bike.variant].filter(Boolean).join(" ");
    const image=bike.image_url
      ? '<img src="'+esc(bike.image_url)+'" alt="'+esc(title)+'" loading="lazy" onerror="this.onerror=null;this.src=\'/anybike-logo-new.jpg\'">'
      : '<img src="/anybike-logo-new.jpg" alt="'+esc(title)+'" loading="lazy">';

    return '<a class="stock-card" href="/bike-details.html?id='+encodeURIComponent(bike.bike_id)+'">'+
      image+
      '<div class="stock-copy">'+
        '<h3>'+esc(title)+'</h3>'+
        (bike.mileage!=null?'<div class="stock-meta">'+esc(marketMileage(bike.mileage))+'</div>':'')+
        '<div class="stock-price">'+esc(marketMoney(bike.price_gbp))+'</div>'+
        '<div class="stock-meta" style="margin-top:8px;color:#ed3b3b;font-weight:900">'+esc(label)+' →</div>'+
      '</div>'+
    '</a>';
  }

  function interestSectionHtml(market,viewed,similar){
    const makes=uniqueBy(
      viewed.map(function(b){return b.make}).filter(Boolean),
      function(v){return String(v).toLowerCase()}
    ).slice(0,8);
    const models=uniqueBy(
      viewed.map(function(b){return [b.make,b.model].filter(Boolean).join(" ")}).filter(Boolean),
      function(v){return String(v).toLowerCase()}
    ).slice(0,10);

    const signalHtml=(makes.length||models.length)
      ? '<div class="signal-bar" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:24px 0">'+
          '<div class="signal-card" style="border:1px solid #2d2d2d;border-radius:18px;padding:20px;background:#111">'+
            '<strong>Brands attracting interest</strong>'+
            '<div class="area-list" style="margin-top:12px">'+
              (makes.length?makes.map(function(m){return '<span>'+esc(m)+'</span>'}).join(""):'<span>Building from real viewing activity</span>')+
            '</div>'+
          '</div>'+
          '<div class="signal-card" style="border:1px solid #2d2d2d;border-radius:18px;padding:20px;background:#111">'+
            '<strong>Models attracting interest</strong>'+
            '<div class="area-list" style="margin-top:12px">'+
              (models.length?models.map(function(m){return '<span>'+esc(m)+'</span>'}).join(""):'<span>Building from real viewing activity</span>')+
            '</div>'+
          '</div>'+
        '</div>'
      : '';

    const groups=[];
    if(viewed.length){
      groups.push(
        '<div class="stock-group-label" style="grid-column:1/-1;margin:6px 0 2px">'+
          '<strong style="display:block;font-size:1.15rem">Recently viewed in '+esc(market.name)+'</strong>'+
          '<span style="display:block;color:#aaa;margin-top:4px">Real recent viewing activity associated with this market. Individual visitors are never identified.</span>'+
        '</div>'+
        viewed.map(function(b){return marketBikeCard(b,"View this motorcycle")}).join("")
      );
    }
    if(similar.length){
      groups.push(
        '<div class="stock-group-label" style="grid-column:1/-1;margin:22px 0 2px">'+
          '<strong style="display:block;font-size:1.15rem">Similar motorcycles currently available</strong>'+
          '<span style="display:block;color:#aaa;margin-top:4px">Current UK stock selected from the makes, models, years, engine sizes and budgets attracting interest above.</span>'+
        '</div>'+
        similar.map(function(b){return marketBikeCard(b,"View similar motorcycle")}).join("")
      );
    }

    return '<section class="section" id="countryBuyerInterestSection" data-country-interest="'+esc(market.slug)+'">'+
      '<div class="wrap">'+
        '<div class="section-head">'+
          '<div class="eyebrow">Buyer interest in '+esc(market.name)+'</div>'+
          '<h2>Motorcycles attracting attention in '+esc(market.name)+'.</h2>'+
          '<p>Real motorcycles viewed from this market appear first. Where suitable, the selection then continues with similar motorcycles currently available in the United Kingdom. We do not show visitor identities or imply a number of buyers.</p>'+
        '</div>'+
        signalHtml+
        '<div class="stock-grid">'+groups.join("")+'</div>'+
      '</div>'+
    '</section>';
  }

  async function loadCountryBuyerInterest(market){
    // Réunion has its own fully localised buyer-interest + similar-stock implementation.
    if(market.slug==="reunion" && (document.getElementById("reunionMarketSelectionGrid") || document.getElementById("reunionInterestGrid")))return;
    if(document.getElementById("countryBuyerInterestSection"))return;

    let client=null;
    try{
      if(typeof sb!=="undefined" && sb?.rpc){
        client=sb;
      }else if(window.supabase?.createClient){
        client=window.supabase.createClient(
          "https://tuehtnezhdnkqbbhttgp.supabase.co",
          "sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK"
        );
      }
    }catch(error){
      console.warn("Country buyer-interest client unavailable",error);
      return;
    }

    if(!client)return;

    try{
      const results=await Promise.all([
        client.rpc("get_country_motorcycle_interest_v1",{p_country:market.name,p_limit:8}),
        client.rpc("get_country_similar_motorcycles_v2",{p_country:market.name,p_limit:16})
      ]);

      if(results[0].error)throw results[0].error;
      if(results[1].error)throw results[1].error;

      const viewed=Array.isArray(results[0].data)
        ? results[0].data.filter(function(b){return b && b.bike_id && b.make && b.model})
        : [];

      // Do not manufacture a demand section where no real country activity exists.
      if(!viewed.length)return;

      const viewedIds=new Set(viewed.map(function(b){return b.bike_id}));
      const similar=diverseSimilar(
        (Array.isArray(results[1].data)?results[1].data:[]).filter(function(b){
          return b && b.bike_id && b.make && b.model && !viewedIds.has(b.bike_id);
        }),
        8
      );

      const hero=document.querySelector(".hero");
      if(!hero)return;

      hero.insertAdjacentHTML("afterend",interestSectionHtml(market,viewed,similar));
    }catch(error){
      console.warn("Country buyer interest could not be loaded",market.name,error);
    }
  }

  function replaceShipping(market){
    const grid=document.querySelector(".port-grid");
    if(!grid)return;
    const section=grid.closest("section");
    if(!section)return;

    const head=section.querySelector(".section-head");
    if(head){
      head.innerHTML='<div class="eyebrow">Motorcycle transport to '+esc(market.name)+'</div>'+
        '<h2>UK handover and shipping arrangements for '+esc(market.name)+'.</h2>'+
        '<p>AnyBike arranges the UK-side motorcycle collection and handover. You can nominate your own freight forwarder, shipping agent, warehouse or port handling facility. Your freight provider is responsible for the onward international shipment to '+esc(market.name)+'.</p>';
    }

    const chips=UK_PORTS.map(function(p){return '<span>'+esc(p)+'</span>';}).join("");

    grid.innerHTML=
      '<article class="port-card"><h3>AnyBike UK handover ports</h3>'+
      '<p>AnyBike can arrange UK delivery to the agreed handover point used by your freight forwarder. The available AnyBike handover ports are:</p>'+
      '<div class="area-list">'+chips+'</div></article>'+
      '<article class="port-card"><h3>Your freight forwarder to '+esc(market.name)+'</h3>'+
      '<p>Before purchase, confirm the destination, international route, receiving agent and final delivery arrangements with your chosen freight provider. AnyBike coordinates the UK handover using the agreed reference and collection instructions.</p>'+
      '<div class="area-list"><span>Buyer-nominated shipper</span><span>UK handover agreed before collection</span><span>Shipping reference recorded</span></div></article>'+
      '<article class="port-card"><h3>Import and registration in '+esc(market.name)+'</h3>'+
      '<p>Import approval, customs duty, taxes, technical compliance, inspection and registration rules are determined by the relevant authorities in '+esc(market.name)+'. Check these requirements before committing to a motorcycle.</p>'+
      '<div class="area-list"><span>Import rules</span><span>Customs</span><span>Taxes &amp; fees</span><span>Registration</span></div></article>'+
      '<article class="port-card"><h3>Documents and UK collection</h3>'+
      '<p>AnyBike confirms the motorcycle documents available for the transaction and arranges the agreed UK collection. The motorcycle is then handed to the nominated freight provider for onward transport to '+esc(market.name)+'.</p>'+
      '<div class="area-list"><span>UK collection</span><span>Condition evidence</span><span>Available documents</span><span>Freight handover</span></div></article>';

    const faq=document.querySelector(".faq");
    if(faq){
      faq.querySelectorAll("details").forEach(function(d){
        const s=d.querySelector("summary");
        const txt=(s?.textContent||"").toLowerCase();
        if(txt.indexOf("which "+market.name.toLowerCase()+" ports")>=0 || txt.indexOf("which ports can be considered")>=0){
          s.textContent="How is international shipping to "+market.name+" arranged?";
          const p=d.querySelector("p");
          if(p)p.textContent="AnyBike arranges the agreed UK-side handover. The buyer or nominated freight forwarder arranges the international route and destination handling in "+market.name+".";
        }
      });
    }
  }

  function run(){
    const market=currentMarket();
    if(!market)return;
    fixFlag(market);
    fixHero(market);
    cleanCountryGrammar(market);
    replaceShipping(market);
    loadCountryBuyerInterest(market);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();
})();