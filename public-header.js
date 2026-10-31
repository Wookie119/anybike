
// Version customer Message Centre links consistently across public pages.
// A different query URL avoids stale cached HTML for the unversioned path.
(function versionCustomerMessageLinks(){
  const version="20261018c";
  function updateLinks(root){
    if(!root?.querySelectorAll)return;
    root.querySelectorAll('a[href]').forEach(function(a){
      try{
        const u=new URL(a.getAttribute("href"),location.href);
        if(u.origin!==location.origin || u.pathname!=="/customer-messages.html")return;
        if(u.searchParams.has("debug_load"))return;
        u.searchParams.set("v",version);
        a.href=u.pathname+u.search+u.hash;
      }catch(_){}
    });
  }
  document.addEventListener("click",function(e){
    const a=e.target.closest?.('a[href]');
    if(a)updateLinks({querySelectorAll:()=>[a]});
  },true);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>updateLinks(document));
  else updateLinks(document);
})();
(function loadMarketPageStandardisation(){
  try{
    if(!window.location.pathname.toLowerCase().includes("/markets/"))return;
    if(document.querySelector('script[data-anybike-market-standard="true"]'))return;
    const s=document.createElement("script");
    s.src="/market-page-standardisation.js?v=202610071455";
    s.defer=true;
    s.dataset.anybikeMarketStandard="true";
    document.head.appendChild(s);
  }catch(e){}
})();

(function markInternationalMarketPage(){
  try{
    if(window.location.pathname.toLowerCase().includes("/markets/")){
      document.documentElement.classList.add("anybike-market-page");
    }
  }catch(e){}
})();

(function ensureFreshPublicHeaderCss(){
  try{
    const links=[...document.querySelectorAll('link[rel="stylesheet"]')];
    links.forEach(function(link){
      const href=String(link.getAttribute("href")||"");
      if(href.includes("public-header.css")){
        link.setAttribute("href","/public-header.css?v=20261016-dealer-dropdown-350");
      }
    });
  }catch(e){}
})();

(function ensureAnyBikeVisitorTracker(){
  try{
    if(window.__anybikeVisitorTrackerLoaderAdded)return;
    window.__anybikeVisitorTrackerLoaderAdded=true;

    if(document.querySelector('script[src*="visitor-tracker.js"]'))return;

    const script=document.createElement("script");
    script.src="/visitor-tracker.js?v=202610061325";
    script.defer=true;
    script.dataset.anybikeVisitorTracker="shared";
    (document.head||document.documentElement).appendChild(script);
  }catch(error){
    console.warn("AnyBike visitor tracker could not be loaded",error);
  }
})();


(function ensureAnyBikeFavicon(){
  try{
    let icon=document.querySelector('link[rel~="icon"]');
    if(!icon){
      icon=document.createElement('link');
      icon.rel='icon';
      document.head.appendChild(icon);
    }
    icon.href='/anybike-logo-new.jpg';
    icon.type='image/jpeg';
  }catch(e){}
})();
/*
AnyBike
File: public-header.js
Version: 2026.09.16-4
Date: 16 July 2026

Changes
--------
✓ Matches the current V3 public-header.html IDs
✓ Preserves shared public header loading
✓ Preserves customer login/logout state
✓ Preserves language and currency preferences
✓ Preserves customer notification loading
✓ Preserves protected customer-page session rechecks
✓ Keeps mobile drawer and desktop account menu behaviour
*/

document.addEventListener("DOMContentLoaded", loadPublicHeader);
document.addEventListener("DOMContentLoaded", anybikeApplyPublicStockVisibility);

async function anybikeGetPublicStockVisibility(){
  try{
    const response=await fetch("https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_get_public_stock_visibility_v1",{
      method:"POST",
      headers:{
        "apikey":"sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK",
        "Content-Type":"application/json"
      },
      body:"{}",
      cache:"no-store"
    });
    if(!response.ok) return false;
    const data=await response.json();
    return data?.enabled!==false;
  }catch(error){
    console.warn("Public stock visibility setting unavailable",error);
    return false;
  }
}

function anybikeMarkHiddenByStockToggle(element){
  if(!element)return;
  element.dataset.anybikeHiddenByStockToggle="true";
  element.style.setProperty("display","none","important");
}

function anybikeUpdatePublicStockMenu(enabled){
  document.querySelectorAll('[data-anybike-public-stock-link="true"]').forEach(function(link){
    if(enabled){
      link.style.removeProperty("display");
    }else{
      link.style.setProperty("display","none","important");
    }
  });
}

function anybikeRestorePublicStockSurfaces(){
  document.documentElement.dataset.publicStockVisible="true";
  anybikeUpdatePublicStockMenu(true);

  document.getElementById("anybikePublicStockVisibilityStyles")?.remove();

  document.querySelectorAll('[data-anybike-hidden-by-stock-toggle="true"]').forEach(function(element){
    element.style.removeProperty("display");
    delete element.dataset.anybikeHiddenByStockToggle;
  });

  const path=window.location.pathname.toLowerCase();

  if(path==="/"||path.endsWith("/index.html")){
    document.querySelectorAll("section.hero,.vmoto-feature,#stock.stock-section").forEach(function(element){
      element.style.removeProperty("display");
    });
  }

  if(
    path.endsWith("/motorcycle-brand.html")||
    path.endsWith("/motorcycle-model.html")||
    path.endsWith("/motorcycle-variant.html")
  ){
    const stock=document.getElementById("stock");
    const section=stock?.closest("section");
    if(section)section.style.removeProperty("display");
    if(stock)stock.style.removeProperty("display");
  }

  if(path.includes("/markets/")){
    document.querySelectorAll(".market-selection,#countryBuyerInterestSection,.stock-grid,.ab-stock-grid").forEach(function(element){
      element.style.removeProperty("display");
      const section=element.closest?.("section");
      if(section)section.style.removeProperty("display");
    });
  }

  document.querySelectorAll(".stock-card,.ab-stock-card,.bike,.card").forEach(function(element){
    if(element.dataset.anybikeHiddenByStockToggle==="true"){
      element.style.removeProperty("display");
      delete element.dataset.anybikeHiddenByStockToggle;
    }
  });

  if(window.AnyBikePublicStockVisibilityObserver){
    window.AnyBikePublicStockVisibilityObserver.disconnect();
    window.AnyBikePublicStockVisibilityObserver=null;
  }
}

function anybikeHidePublicStockSurfaces(){
  document.documentElement.dataset.publicStockVisible="false";
  anybikeUpdatePublicStockMenu(false);

  let style=document.getElementById("anybikePublicStockVisibilityStyles");
  if(!style){
    style=document.createElement("style");
    style.id="anybikePublicStockVisibilityStyles";
    style.textContent=[
      'html:not(.anybike-international-dealer) a[href="/available-stock.html"]:not(.anybike-international-vq-link),html:not(.anybike-international-dealer) a[href^="/available-stock.html?"]:not(.anybike-international-vq-link),html:not(.anybike-international-dealer) a[href^="available-stock.html"]:not(.anybike-international-vq-link),a[href^="/bike-details.html?id="]{display:none!important}',
      '.market-selection,#countryBuyerInterestSection,.ab-stock-grid,.ab-stock-label,.ab-stock-card{display:none!important}'
    ].join("");
    document.head.appendChild(style);
  }

  const path=window.location.pathname.toLowerCase();
  if(path.endsWith("/bike-details.html")){
    window.location.replace("/buy-motorcycles.html");
    return;
  }

  if(
    path.endsWith("/motorcycle-brand.html")||
    path.endsWith("/motorcycle-model.html")||
    path.endsWith("/motorcycle-variant.html")
  ){
    const stock=document.getElementById("stock");
    const section=stock?.closest("section");
    if(section)anybikeMarkHiddenByStockToggle(section);
    else if(stock)anybikeMarkHiddenByStockToggle(stock);
  }

  if(path==="/"||path.endsWith("/index.html")||path.endsWith("/buy-motorcycles.html")||path.includes("/markets/")){
    document.querySelectorAll('a[href^="/bike-details.html?id="]').forEach(function(link){
      const card=link.closest(".stock-card,.ab-stock-card,.bike,.card");
      if(card)anybikeMarkHiddenByStockToggle(card);
      else anybikeMarkHiddenByStockToggle(link);
    });
  }

  if(path.includes("/markets/")){
    document.querySelectorAll(".stock-grid,.ab-stock-grid").forEach(function(grid){
      const section=grid.closest("section");
      if(section)anybikeMarkHiddenByStockToggle(section);
      else anybikeMarkHiddenByStockToggle(grid);
    });
  }

  if(path==="/"||path.endsWith("/index.html")||path.endsWith("/buy-motorcycles.html")){
    document.querySelectorAll(".stock-grid").forEach(function(grid){
      const hasPublicBikeLinks=!!grid.querySelector('a[href^="/bike-details.html?id="]');
      if(!hasPublicBikeLinks)return;
      const section=grid.closest("section");
      if(section)anybikeMarkHiddenByStockToggle(section);
      else anybikeMarkHiddenByStockToggle(grid);
    });

    if(path==="/"||path.endsWith("/index.html")){
      document.querySelectorAll('.hero-route[href="/available-stock.html"],.hero-route[href^="/available-stock.html?"]').forEach(function(route){
        const hero=route.closest("section.hero");
        if(hero)anybikeMarkHiddenByStockToggle(hero);
      });
      const homeStock=document.getElementById("stock");
      if(homeStock?.classList.contains("stock-section")){
        anybikeMarkHiddenByStockToggle(homeStock);
      }
    }
  }
}

async function anybikeApplyPublicStockVisibility(){
  const enabled=await anybikeGetPublicStockVisibility();
  window.AnyBikePublicStockVisible=enabled;
  window.dispatchEvent(new CustomEvent("anybikePublicStockVisibilityChanged",{detail:{enabled:enabled}}));
  if(enabled){
    anybikeRestorePublicStockSurfaces();
    return;
  }

  anybikeHidePublicStockSurfaces();
  const observer=new MutationObserver(function(){
    if(window.AnyBikePublicStockVisible===false)anybikeHidePublicStockSurfaces();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.AnyBikePublicStockVisibilityObserver=observer;
}

function loadAnyBikePublicPageLanguageController(){
  if(window.AnyBikePageLanguage){
    return Promise.resolve(window.AnyBikePageLanguage);
  }

  return new Promise(function(resolve){
    const existing=document.querySelector('script[data-anybike-page-language="true"]');

    if(existing){
      existing.addEventListener("load",function(){
        resolve(window.AnyBikePageLanguage || null);
      },{once:true});
      resolve(window.AnyBikePageLanguage || null);
      return;
    }

    const script=document.createElement("script");
    script.src="/public-page-language.js?v=20260920-7";
    script.async=false;
    script.dataset.anybikePageLanguage="true";
    script.onload=function(){
      resolve(window.AnyBikePageLanguage || null);
    };
    script.onerror=function(){
      console.warn("AnyBike public page language controller could not be loaded.");
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

loadAnyBikePublicPageLanguageController();

const ANYBIKE_HEADER_CURRENCY_RATES = {
  GBP:1,
  EUR:1.17,
  USD:1.27,
  AUD:1.93,
  NZD:2.10,
  CAD:1.73,
  AED:4.66
};

window.AnyBikeCurrency = {
  rates:ANYBIKE_HEADER_CURRENCY_RATES,
  formatGBP:function(gbp,currency){
    const value=Number(gbp);
    if(!Number.isFinite(value) || value<=0) return "Price on request";
    const code=normaliseCurrency(currency || window.anybikeCurrency || localStorage.getItem("anybikeCurrency") || "GBP");
    const converted=Math.round(value*(ANYBIKE_HEADER_CURRENCY_RATES[code]||1));
    const locale=code==="USD"?"en-US":"en-GB";
    return converted.toLocaleString(locale,{
      style:"currency",
      currency:code,
      currencyDisplay:"symbol",
      maximumFractionDigits:0
    });
  }
};

const ANYBIKE_HEADER_TRANSLATIONS = {
  en:{
    messages:"Messages",
    language:"Language",
    currency:"Currency",
    home:"Home",
    stock:"Motorcycles",
    buy:"Buy a Motorcycle",
    sell:"Sell to Us",
    export:"Export",
    connect:"Connect",
    account:"My AnyBike",
    signIn:"Sign In",
    createAccount:"Create Free Account",
    dashboard:"Dashboard",
    handPicked:"Hand-picked for You",
    potentialMatches:"Potential Matches",
    offers:"My Offers",
    purchases:"My Purchases",
    accountsDocuments:"Accounts & Documents",
    dealership:"My Dealership",
    profile:"My Profile",
    savedSearches:"Saved Searches",
    watchlist:"Watchlist",
    recentlyViewed:"Recently Viewed",
    requests:"Motorcycle Requests",
    logout:"Logout",
    notifications:"Notifications",
    noNotifications:"No new notifications.",
    close:"Close"
  },
  de:{
    messages:"Nachrichten",
    language:"Sprache",
    currency:"Währung",
    home:"Startseite",
    stock:"Verfügbare Motorräder",
    buy:"Motorrad kaufen",
    sell:"An AnyBike verkaufen",
    export:"Exportservice",
    connect:"AnyBike Kontakt",
    account:"Mein AnyBike",
    signIn:"Anmelden",
    createAccount:"Kostenloses Konto",
    dashboard:"Übersicht",
    handPicked:"Für Sie ausgewählt",
    potentialMatches:"Potenzielle Treffer",
    offers:"Meine Angebote",
    purchases:"Meine Käufe",
    accountsDocuments:"Konten & Dokumente",
    dealership:"Mein Händlerbereich",
    profile:"Mein Profil",
    savedSearches:"Gespeicherte Suchen",
    watchlist:"Merkliste",
    recentlyViewed:"Zuletzt angesehen",
    requests:"Motorradanfragen",
    logout:"Abmelden",
    notifications:"Benachrichtigungen",
    noNotifications:"Keine neuen Benachrichtigungen.",
    close:"Schließen"
  },
  fr:{
    messages:"Messages",
    language:"Langue",
    currency:"Devise",
    home:"Accueil",
    stock:"Motos disponibles",
    buy:"Acheter une moto",
    sell:"Vendre à AnyBike",
    export:"Services d’exportation",
    connect:"Contacter AnyBike",
    account:"Mon AnyBike",
    signIn:"Se connecter",
    createAccount:"Créer un compte gratuit",
    dashboard:"Tableau de bord",
    handPicked:"Sélectionnées pour vous",
    potentialMatches:"Correspondances potentielles",
    offers:"Mes offres",
    purchases:"Mes achats",
    accountsDocuments:"Comptes & documents",
    dealership:"Ma concession",
    profile:"Mon profil",
    savedSearches:"Recherches enregistrées",
    watchlist:"Favoris",
    recentlyViewed:"Vues récemment",
    requests:"Demandes de motos",
    logout:"Déconnexion",
    notifications:"Notifications",
    noNotifications:"Aucune nouvelle notification.",
    close:"Fermer"
  },
  es:{
    messages:"Mensajes",
    language:"Idioma",
    currency:"Moneda",
    home:"Inicio",
    stock:"Motos disponibles",
    buy:"Comprar una moto",
    sell:"Vender a AnyBike",
    export:"Servicios de exportación",
    connect:"Contactar con AnyBike",
    account:"Mi AnyBike",
    signIn:"Iniciar sesión",
    createAccount:"Crear cuenta gratuita",
    dashboard:"Panel",
    handPicked:"Sélectionnées pour vous",
    potentialMatches:"Correspondances potentielles",
    offers:"Mis ofertas",
    purchases:"Mis compras",
    accountsDocuments:"Cuentas y documentos",
    dealership:"Mi concesionario",
    profile:"Mi perfil",
    savedSearches:"Búsquedas guardadas",
    watchlist:"Favoritos",
    recentlyViewed:"Vistos recientemente",
    requests:"Solicitudes de motos",
    logout:"Cerrar sesión",
    notifications:"Notificaciones",
    noNotifications:"No hay notificaciones nuevas.",
    close:"Cerrar"
  },
  ar:{
    messages:"الرسائل",
    language:"اللغة",
    currency:"العملة",
    home:"الرئيسية",
    stock:"الدراجات المتاحة",
    buy:"شراء دراجة نارية",
    sell:"البيع إلى AnyBike",
    export:"خدمات التصدير",
    connect:"تواصل مع AnyBike",
    account:"حسابي",
    signIn:"تسجيل الدخول",
    createAccount:"إنشاء حساب مجاني",
    dashboard:"لوحة التحكم",
    handPicked:"مختارة لك",
    potentialMatches:"التطابقات المحتملة",
    offers:"عروضي",
    purchases:"مشترياتي",
    accountsDocuments:"الحسابات والمستندات",
    dealership:"وكالتي",
    profile:"ملفي الشخصي",
    savedSearches:"عمليات البحث المحفوظة",
    watchlist:"قائمة المتابعة",
    recentlyViewed:"شوهدت مؤخراً",
    requests:"طلبات الدراجات",
    logout:"تسجيل الخروج",
    notifications:"الإشعارات",
    noNotifications:"لا توجد إشعارات جديدة.",
    close:"إغلاق"
  },
  id:{
    messages:"Pesan",
    language:"Bahasa",
    currency:"Mata Uang",
    home:"Beranda",
    stock:"Motor Tersedia",
    buy:"Beli Sepeda Motor",
    sell:"Jual ke AnyBike",
    export:"Layanan Ekspor",
    connect:"Hubungi AnyBike",
    account:"AnyBike Saya",
    signIn:"Masuk",
    createAccount:"Buat Akun Gratis",
    dashboard:"Dasbor",
    handPicked:"Pilihan untuk Anda",
    potentialMatches:"Potensi Kecocokan",
    offers:"Penawaran Saya",
    purchases:"Pembelian Saya",
    accountsDocuments:"Akaun & Dokumen",
    dealership:"Pengedar Saya",
    accountsDocuments:"Akun & Dokumen",
    dealership:"Dealer Saya",
    profile:"Profil Saya",
    savedSearches:"Pencarian Tersimpan",
    watchlist:"Daftar Pantau",
    recentlyViewed:"Baru Dilihat",
    requests:"Permintaan Sepeda Motor",
    logout:"Keluar",
    notifications:"Notifikasi",
    noNotifications:"Tidak ada notifikasi baru.",
    close:"Tutup"
  },
  ms:{
    messages:"Mesej",
    language:"Bahasa",
    currency:"Mata Wang",
    home:"Laman Utama",
    stock:"Motosikal Tersedia",
    buy:"Beli Motosikal",
    sell:"Jual kepada AnyBike",
    export:"Perkhidmatan Eksport",
    connect:"Hubungi AnyBike",
    account:"AnyBike Saya",
    signIn:"Log Masuk",
    createAccount:"Buat Akaun Percuma",
    dashboard:"Papan Pemuka",
    handPicked:"Dipilih untuk Anda",
    potentialMatches:"Padanan Berpotensi",
    offers:"Tawaran Saya",
    purchases:"Pembelian Saya",
    profile:"Profil Saya",
    savedSearches:"Carian Disimpan",
    watchlist:"Senarai Pantau",
    recentlyViewed:"Baru Dilihat",
    requests:"Permintaan Motosikal",
    logout:"Log Keluar",
    notifications:"Pemberitahuan",
    noNotifications:"Tiada pemberitahuan baharu.",
    close:"Tutup"
  },
  zh:{
    messages:"消息",
    language:"语言",
    currency:"货币",
    home:"首页",
    stock:"可售摩托车",
    buy:"购买摩托车",
    sell:"卖给 AnyBike",
    export:"出口服务",
    connect:"联系 AnyBike",
    account:"我的 AnyBike",
    signIn:"登录",
    createAccount:"免费创建账户",
    dashboard:"控制面板",
    handPicked:"为您精选",
    potentialMatches:"潜在匹配",
    offers:"我的报价",
    purchases:"我的购买",
    accountsDocuments:"账户与文件",
    dealership:"我的经销商",
    profile:"我的资料",
    savedSearches:"已保存搜索",
    watchlist:"关注列表",
    recentlyViewed:"最近浏览",
    requests:"摩托车需求",
    logout:"退出",
    notifications:"通知",
    noNotifications:"暂无新通知。",
    close:"关闭"
  }
};

let anybikeHeaderUser = null;
let anybikeHeaderRefreshTimer = null;
let anybikeHeaderRealtimeChannel = null;
let anybikeHeaderClockTimer = null;

/*
  ANYBIKE CUSTOMER NEXT ACTION STANDARD
  -------------------------------------
  Every signed-in customer workflow page should make the next required step
  obvious. Pages with their own authoritative workflow card keep it. Pages
  without one receive a shared fallback automatically.

  Page-specific code can call window.AnyBikeCustomerNextAction.set(...) to
  replace the fallback with live workflow state and identify who is waiting.
*/
const ANYBIKE_CUSTOMER_NEXT_ACTION_PAGES={
  "/customer-dashboard.html":{title:"Continue your AnyBike journey",text:"Complete the item currently shown as needing your attention.",waitingFor:"You",label:"CONTINUE →"},
  "/customer-profile.html":{title:"Complete your buyer setup",text:"Finish the next incomplete profile or shipping section so AnyBike has what it needs to act for you.",waitingFor:"You",label:"CONTINUE SETUP →"},
  "/customer-messages.html":{title:"Read or reply to your latest message",text:"Open the conversation that needs your attention. If AnyBike is waiting for information, reply in the same thread.",waitingFor:"You",label:"OPEN MESSAGES →"},
  "/customer-sourced-matches.html":{title:"Choose the motorcycles you want us to check",text:"Tick Interested on the motorcycles you would seriously consider buying, then save your choices.",waitingFor:"You",label:"REVIEW MOTORCYCLES →"},
  "/customer-offer.html":{title:"Review your AnyBike offer",text:"Check the motorcycle, price and terms, then make the decision shown on this page.",waitingFor:"You",label:"REVIEW OFFER →"},
  "/my-purchases.html":{title:"Complete the next purchase step",text:"Open the motorcycle that needs payment, documents or another purchase action from you.",waitingFor:"You",label:"OPEN PURCHASE →"},
  "/accounts-documents.html":{title:"Review your accounts and documents",text:"AnyBike will show the specific payment, document or account step that needs attention when this page finishes loading.",waitingFor:"You",label:"CONTINUE →"},
  "/my-watchlist.html":{title:"Choose what you want to do next",text:"Open a saved motorcycle to review it, or start a sourcing request if you want AnyBike to find alternatives.",waitingFor:"You",label:"REVIEW WATCHLIST →"},
  "/my-searches.html":{title:"Continue a saved search",text:"Open one of your saved searches to see current motorcycles or refine what you are looking for.",waitingFor:"You",label:"OPEN SAVED SEARCHES →"},
  "/my-dealership-stock.html":{title:"Review your dealership stock",text:"Open the stock item that needs the next update, response or action.",waitingFor:"You",label:"OPEN STOCK →"}
};

function anybikeCustomerOperationalPage(){
  const path=String(location.pathname||"").replace(/\/{2,}/g,"/").toLowerCase();
  return ANYBIKE_CUSTOMER_NEXT_ACTION_PAGES[path] ? path : "";
}

function anybikeCustomerHasOwnNextAction(){
  if(document.querySelector("#nextActionPanel,[data-anybike-next-action],.next-action,#purchaseNextActionsPanel,#buyerSetupNextAction")) return true;
  return [...document.querySelectorAll("h1,h2,h3,strong,.eyebrow")]
    .some(el=>/your next action/i.test(String(el.textContent||"")));
}

function anybikeInstallCustomerNextActionStyles(){
  if(document.getElementById("anybike-customer-next-action-style")) return;
  const style=document.createElement("style");
  style.id="anybike-customer-next-action-style";
  style.textContent=`
    .anybike-customer-next-action{width:min(1640px,calc(100% - 32px));max-width:none;margin:12px auto;padding:10px 14px;border:2px solid #ed1c24;border-radius:14px;background:linear-gradient(135deg,rgba(237,28,36,.14),#111 58%);color:#fff;box-shadow:0 0 0 1px rgba(237,28,36,.08)}
    .anybike-customer-next-action .abna-kicker{color:#ed1c24;font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;margin-bottom:2px}
    .anybike-customer-next-action .abna-main{display:flex;align-items:center;gap:16px;justify-content:space-between}
    .anybike-customer-next-action .abna-copy{min-width:0;flex:1}
    .anybike-customer-next-action h2{margin:0;font-size:clamp(20px,1.7vw,25px);line-height:1.08}
    .anybike-customer-next-action p{margin:4px 0 0;color:#d6d6d6;line-height:1.3;font-size:13px;max-width:none}
    .anybike-customer-next-action .abna-status{margin-top:4px;color:#aaa;font-size:11px;font-weight:800}
    .anybike-customer-next-action .abna-btn{width:auto!important;border:1px solid #ed1c24;border-radius:9px;background:#ed1c24;color:#fff;padding:9px 15px;font-weight:950;cursor:pointer;text-decoration:none;white-space:nowrap;flex:0 0 auto}
    @media(max-width:760px){
      .anybike-customer-next-action{width:calc(100% - 20px);padding:11px}
      .anybike-customer-next-action .abna-main{align-items:stretch;flex-direction:column;gap:9px}
      .anybike-customer-next-action .abna-btn{width:100%!important}
    }
  `;
  document.head.appendChild(style);
}

function anybikeCustomerMainContainer(){
  return document.querySelector("main") || document.body;
}

function anybikeRenderCustomerNextAction(config){
  const path=anybikeCustomerOperationalPage();
  if(!path) return null;
  const defaults=ANYBIKE_CUSTOMER_NEXT_ACTION_PAGES[path];
  const cfg=Object.assign({},defaults,config||{});
  const container=anybikeCustomerMainContainer();
  if(!container) return null;

  anybikeInstallCustomerNextActionStyles();

  let card=document.getElementById("anybikeCustomerSharedNextAction");
  if(!card){
    card=document.createElement("section");
    card.id="anybikeCustomerSharedNextAction";
    card.className="anybike-customer-next-action";
    card.dataset.anybikeNextAction="shared";
    container.insertBefore(card,container.firstElementChild || null);
  }

  const safe=function(v){
    return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  };

  const waitingFor=String(cfg.waitingFor||"You");
  const statusHtml=waitingFor && waitingFor!=="You"
    ? '<div class="abna-status">Waiting for: '+safe(waitingFor)+'</div>'
    : '';

  card.innerHTML=
    '<div class="abna-kicker">'+safe(cfg.kicker||"Your next action")+'</div>'+
    '<div class="abna-main">'+
      '<div class="abna-copy">'+
        '<h2>'+safe(cfg.title||"Continue")+'</h2>'+
        '<p>'+safe(cfg.text||"")+'</p>'+
        statusHtml+
      '</div>'+
      '<button type="button" class="abna-btn" id="anybikeCustomerNextActionButton">'+safe(cfg.label||"CONTINUE →")+'</button>'+
    '</div>';

  const button=document.getElementById("anybikeCustomerNextActionButton");
  if(button){
    button.onclick=function(){
      if(typeof cfg.onClick==="function"){cfg.onClick();return;}
      if(cfg.href){location.href=cfg.href;return;}
      if(cfg.selector){
        const target=document.querySelector(cfg.selector);
        if(target){target.scrollIntoView({behavior:"smooth",block:"center"});target.focus?.();return;}
      }
      const target=[...container.querySelectorAll("button:not(:disabled),a.btn,input:not([type=hidden]),select,textarea")]
        .find(el=>!card.contains(el));
      if(target){target.scrollIntoView({behavior:"smooth",block:"center"});target.focus?.();}
    };
  }
  return card;
}

function anybikeEnsureCustomerNextAction(){
  if(!anybikeCustomerOperationalPage()) return;
  if(anybikeCustomerHasOwnNextAction()) return;
  anybikeRenderCustomerNextAction();
}

window.AnyBikeCustomerNextAction={
  set:function(config){return anybikeRenderCustomerNextAction(config||{});},
  ensure:anybikeEnsureCustomerNextAction,
  hide:function(){document.getElementById("anybikeCustomerSharedNextAction")?.remove();}
};


async function anybikeEnsureHeaderAuthClient(){
  // Public information pages may load the shared header without Supabase.
  // Initialise its own client only on those pages; reuse existing page clients.
  if(typeof sb!=="undefined" && sb?.auth)return;
  if(!window.supabase?.createClient){
    await new Promise(function(resolve,reject){
      const script=document.createElement("script");
      script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload=resolve;
      script.onerror=()=>reject(new Error("Supabase library unavailable"));
      document.head.appendChild(script);
    });
  }
  if(typeof sb==="undefined" && window.supabase?.createClient){
    window.sb=window.supabase.createClient(
      "https://tuehtnezhdnkqbbhttgp.supabase.co",
      "sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK"
    );
  }
}
async function loadPublicHeader(){
  const holder = document.getElementById("publicHeader");

  if(!holder){
    return;
  }

  try{
    const headerRes = await fetch("/public-header.html",{
      cache:"no-store"
    });

    if(!headerRes.ok){
      throw new Error("Header request failed: " + headerRes.status);
    }

    holder.innerHTML = await headerRes.text();
    try{await anybikeEnsureHeaderAuthClient();}catch(e){console.warn("Header authentication unavailable",e);}
    // Identify approved test accounts before slower navigation/profile setup.
    anybikeShowPublicSignedInIdentity().catch(()=>{});
    await setupPublicHeader();
    // International VQ gallery is separately secured and must not enable the legacy public stock feed.
    document.querySelectorAll(".export-dropdown-links,.mobile-export-links").forEach(function(host){
      if(host.querySelector(".anybike-international-vq-link"))return;
      const link=document.createElement("a");
      link.href="/available-stock.html?vat=qualifying";
      link.className="anybike-international-vq-link";
      link.textContent="Available Stock — VAT Qualifying";
      link.setAttribute("aria-label","International VAT Qualifying motorcycle gallery");
      host.appendChild(link);
    });
    anybikeShowPublicSignedInIdentity().catch(()=>{});
    // Allow time to travel from the nav label to a manufacturer link.
    document.querySelectorAll(".public-manufacturers-menu").forEach(function(menu){
      if(menu.dataset.hoverDelayReady)return;
      menu.dataset.hoverDelayReady="1";
      let closeTimer=null;
      menu.addEventListener("pointerenter",function(){clearTimeout(closeTimer);const nav=document.querySelector(".public-header");if(nav)menu.style.setProperty("--anybike-manufacturer-top",Math.round(nav.getBoundingClientRect().bottom)+"px");menu.classList.add("menu-open");});
      menu.addEventListener("pointerleave",function(){clearTimeout(closeTimer);closeTimer=setTimeout(function(){if(!menu.matches(":hover")&&!menu.contains(document.activeElement))menu.classList.remove("menu-open");},650);});
      menu.addEventListener("focusin",function(){clearTimeout(closeTimer);menu.classList.add("menu-open");});
      menu.addEventListener("focusout",function(){clearTimeout(closeTimer);closeTimer=setTimeout(function(){if(!menu.contains(document.activeElement)&&!menu.matches(":hover"))menu.classList.remove("menu-open");},250);});
    });
    // Manufacturers uses the same hover/focus mega-menu behaviour as Markets.
    // No pointer-enter pinning or background scroll lock.
    if(typeof window.AnyBikePublicStockVisible==="boolean") anybikeUpdatePublicStockMenu(window.AnyBikePublicStockVisible);
    setTimeout(anybikeEnsureCustomerNextAction,100);

  }catch(error){
    console.error("Public header could not be loaded",error);
  }
}


function anybikeSortElementsByLabel(elements,getLabel){
  return [...elements].sort(function(a,b){
    return String(getLabel(a)||"").trim().localeCompare(
      String(getLabel(b)||"").trim(),
      "en",
      {sensitivity:"base"}
    );
  });
}

function anybikePublicNavLabel(node){
  if(node.classList?.contains("public-markets-menu")) return "Markets";
  if(node.classList?.contains("public-export-menu")) return "Export Services";
  if(node.classList?.contains("public-account")) return "My AnyBike";
  return node.textContent.trim();
}

function anybikeSortPublicNavigationAlphabetically(){
  const nav=document.querySelector(".public-nav");
  if(nav){
    const account=nav.querySelector(":scope > .public-account");
    const items=[...nav.children].filter(function(node){return node!==account;});
    anybikeSortElementsByLabel(items,anybikePublicNavLabel).forEach(function(node){
      nav.insertBefore(node,account||null);
    });
    if(account)nav.appendChild(account);
  }

  const mobileNav=document.querySelector(".mobile-nav");
  if(mobileNav){
    const items=[...mobileNav.children];
    anybikeSortElementsByLabel(items,function(node){
      const summary=node.querySelector?.(":scope > summary");
      return summary ? summary.textContent : node.textContent;
    }).forEach(function(node){mobileNav.appendChild(node);});
  }

  document.querySelectorAll(".export-dropdown-links").forEach(function(host){
    anybikeSortElementsByLabel(host.children,function(node){
      return node.querySelector("strong")?.textContent || node.textContent;
    }).forEach(function(node){host.appendChild(node);});
  });

  document.querySelectorAll(".mobile-export-links").forEach(function(host){
    anybikeSortElementsByLabel(host.querySelectorAll(":scope > a"),function(node){
      return node.textContent;
    }).forEach(function(node){host.appendChild(node);});
  });

  const marketsGrid=document.querySelector(".markets-dropdown-grid");
  if(marketsGrid){
    const groups=anybikeSortElementsByLabel(
      marketsGrid.querySelectorAll(":scope > .markets-dropdown-group"),
      function(group){return group.querySelector(":scope > strong")?.textContent || "";}
    );
    groups.forEach(function(group){
      anybikeSortElementsByLabel(group.querySelectorAll(":scope > a"),function(a){
        return a.textContent;
      }).forEach(function(a){group.appendChild(a);});
      marketsGrid.appendChild(group);
    });
  }

  document.querySelectorAll(".mobile-markets-links").forEach(function(host){
    const all=[...host.children];
    const leading=all.filter(function(n){return n.tagName==="A" && !n.previousElementSibling;});
    const regions=[];
    let current=null;
    all.forEach(function(node){
      if(node.classList?.contains("mobile-markets-region")){
        current={label:node.textContent.trim(),heading:node,links:[]};
        regions.push(current);
      }else if(current && node.tagName==="A"){
        current.links.push(node);
      }
    });
    if(!regions.length)return;
    host.innerHTML="";
    leading.forEach(function(node){host.appendChild(node);});
    regions.sort(function(a,b){return a.label.localeCompare(b.label,"en",{sensitivity:"base"});});
    regions.forEach(function(region){
      host.appendChild(region.heading);
      region.links.sort(function(a,b){
        return a.textContent.trim().localeCompare(b.textContent.trim(),"en",{sensitivity:"base"});
      }).forEach(function(a){host.appendChild(a);});
    });
  });
}

function anybikeSortAccountMenuAlphabetically(menu){
  if(!menu)return;
  const logout=menu.querySelector('a[id="phLogout"],a[id="phMobileLogout"]');
  const hr=menu.querySelector("hr");
  const anchors=[...menu.querySelectorAll(":scope > a")].filter(function(a){return a!==logout;});
  anchors.sort(function(a,b){
    return a.textContent.trim().localeCompare(b.textContent.trim(),"en",{sensitivity:"base"});
  });
  anchors.forEach(function(a){menu.insertBefore(a,hr||logout||null);});
  if(hr && logout){
    menu.appendChild(hr);
    menu.appendChild(logout);
  }else if(logout){
    menu.appendChild(logout);
  }
}

// Scope top-level menu visibility to signed-in UK dealer accounts only.
// !important prevents navigation hover/display rules restoring hidden links.
(function installUkDealerNavStyle(){
  if(document.getElementById("anybikeUkDealerNavRule"))return;
  const style=document.createElement("style");
  style.id="anybikeUkDealerNavRule";
  style.textContent='html.anybike-uk-dealer .public-nav > a[href="/vmoto.html"],html.anybike-uk-dealer .public-nav > a[href="/buy-motorcycles.html"],html.anybike-uk-dealer .mobile-nav > a[href="/vmoto.html"],html.anybike-uk-dealer .mobile-nav > a[href="/buy-motorcycles.html"],html.anybike-uk-dealer .public-nav > a[href="/sell-your-motorcycle.html"],html.anybike-uk-dealer .mobile-nav a[href="/sell-your-motorcycle.html"],html.anybike-uk-dealer .public-top-right > label:has(> #phCurrency){display:none!important}';
  document.head.appendChild(style);
})();
function anybikeSortMyAnyBikeMenus(){
  anybikeSortAccountMenuAlphabetically(document.getElementById("loggedInMenu"));
  anybikeSortAccountMenuAlphabetically(document.getElementById("mobileLoggedInMenu"));
}

async function addMyDealershipMenuIfEligible(user){
  if(!user || typeof sb === "undefined")return;
  try{
    // Verified dealer organisations can open live dealership stock management.
    // Newly registered UK dealers have a visible dealership entry with setup guidance,
    // but are never granted stock or bidding permissions by navigation alone.
    const [dealerResult,profileResult]=await Promise.all([
      sb.rpc("dealer_get_my_dealership"),
      sb.from("customer_profiles").select("customer_type").eq("id",user.id).maybeSingle()
    ]);
    const dealership=Array.isArray(dealerResult.data)?dealerResult.data[0]:dealerResult.data;
    const customerType=String(profileResult.data?.customer_type||user.user_metadata?.customer_type||"");
    if(!dealership && !["uk_dealer","uk_distributor"].includes(customerType))return;
    const href="/my-dealership.html";
    for(const menuId of ["loggedInMenu","mobileLoggedInMenu"]){
      const menu=document.getElementById(menuId);
      if(!menu)continue;
      let link=menu.querySelector('[data-dealer-menu-link="true"]');
      if(!link){
        link=document.createElement("a");
        link.dataset.dealerMenuLink="true";
        link.textContent="My Dealership";
        const anchor=menu.querySelector('[data-dealer-menu-anchor="true"]');
        if(anchor)anchor.insertAdjacentElement("afterend",link);
        else menu.appendChild(link);
      }
      link.href=href;
      link.textContent=(ANYBIKE_HEADER_TRANSLATIONS[normaliseLanguage(window.anybikeLanguage||localStorage.getItem('anybikeLanguage'))]||ANYBIKE_HEADER_TRANSLATIONS.en).dealership||'My Dealership';
      // The UK dealer account uses its own workspace, so omit export-buyer
      // shortcuts from its account menu. Do not change other account types.
      if(["uk_dealer","uk_distributor"].includes(customerType)){
        document.documentElement.classList.add("anybike-uk-dealer");
        // Hide only UK dealer top-level public Trade and VMoto links (desktop/mobile).
        for(const navSelector of [".public-nav",".mobile-nav"]){
          const nav=document.querySelector(navSelector);
          if(!nav)continue;
          [...nav.children].forEach(function(item){
            const label=(item.querySelector(":scope > summary")?.textContent||item.textContent||"").trim().toLowerCase();
            if(label==="trade"||label==="vmoto")item.style.display="none";
          });
        }
        // UK dealership header: the Tour replaces research menus here only.
        const desktopNav=document.querySelector(".public-nav");
        if(desktopNav){
          for(const selector of [".public-manufacturers-menu",".public-markets-menu",".public-export-menu"]){
            const el=desktopNav.querySelector(selector);
            if(el)el.style.display="none";
          }
          // Freight forwarding is explained in the Tour for UK dealerships.
          [...desktopNav.querySelectorAll(":scope > a")].forEach(function(link){
            if((link.textContent||"").trim().toLowerCase()==="freight forwarders")link.style.display="none";
          });
          let tour=desktopNav.querySelector('[data-uk-dealer-tour="true"]');
          if(!tour){
            tour=document.createElement("a");
            tour.dataset.ukDealerTour="true";
            tour.href="/uk-dealer-international-tour.html";
            tour.textContent="Tour";
            const account=desktopNav.querySelector(".public-account");
            desktopNav.insertBefore(tour,account||null);
          }
        }
        const mobileNav=document.querySelector(".mobile-nav");
        if(mobileNav){
          for(const el of [...mobileNav.children]){
            const label=(el.querySelector(":scope > summary")?.textContent||el.textContent||"").trim().toLowerCase();
            if(label==="manufacturers"||label==="markets"||label==="export"||label==="export services"||label==="freight forwarders"||el.classList.contains("mobile-manufacturers-menu"))el.style.display="none";
          }
          if(!mobileNav.querySelector('[data-uk-dealer-tour="true"]')){
            const tour=document.createElement("a");
            tour.dataset.ukDealerTour="true";
            tour.href="/uk-dealer-international-tour.html";
            tour.textContent="Tour";
            mobileNav.appendChild(tour);
          }
        }
        // Keep one concise UK dealer account menu on both desktop and mobile, including the service guide.
        // Service actions live on My Dealership, not in the account dropdown.
        const entries=[
          ["Accounts & Documents","/accounts-documents.html"],
          ["Messages","/customer-messages.html"],
          ["My Dealership","/my-dealership.html"],
          ["My Profile","/customer-profile.html"],
          ["My Purchases","/my-purchases.html"],
          ["My Selling","/my-selling.html"],
          ["Start Here","/dealer-welcome.html"]
        ];
        const logout=menu.querySelector('a[id*="Logout"], a[href="#"][data-i18n="logout"]');
        [...menu.querySelectorAll("a")].forEach(a=>{if(a!==logout)a.remove()});
        entries.forEach(([label,href])=>{const a=document.createElement("a");a.href=href;a.textContent=label;a.dataset.ukDealerShortcut=href;menu.insertBefore(a,logout||null)});
        if(logout){logout.style.removeProperty("display");logout.textContent="Logout";}
        const accountHome=menu.querySelector('[data-dealer-menu-link="true"]');
        if(accountHome)accountHome.textContent="My Dealership";
      }
    }
    if(["intl_dealer","intl_distributor","eu_dealer","eu_distributor"].includes(customerType)){
      document.documentElement.classList.add("anybike-international-dealer");
      for(const menuId of ["loggedInMenu","mobileLoggedInMenu"]){
        const menu=document.getElementById(menuId);if(!menu)continue;
        menu.querySelectorAll('a[href="/my-selling.html"],a[href="/sell-your-motorcycle.html"]').forEach(a=>a.remove());
        if(!menu.querySelector('[data-international-stock-menu="true"]')){
          const a=document.createElement("a");a.href="/available-stock.html?vat=qualifying";
          a.textContent="Available Stock";a.dataset.internationalStockMenu="true";
          menu.prepend(a);
        }
      }
      document.querySelectorAll('.public-nav a[href="/sell-your-motorcycle.html"],.mobile-nav a[href="/sell-your-motorcycle.html"]').forEach(a=>a.style.display="none");
      for(const navSelector of [".public-nav",".mobile-nav"]){
        const nav=document.querySelector(navSelector);if(!nav)continue;
        if(!nav.querySelector('[data-international-available-stock="true"]')){
          const a=document.createElement("a");a.href="/available-stock.html?vat=qualifying";
          a.textContent="Available Stock";a.dataset.internationalAvailableStock="true";
          const home=nav.querySelector('a[data-page="home"],a[href="/"]');
          if(home)home.insertAdjacentElement("afterend",a);else nav.prepend(a);
        }
      }
    }
    anybikeSortMyAnyBikeMenus();
  }catch(error){console.warn("Dealer menu check unavailable",error);}
}

async function anybikeApplyPrivateCustomerMenu(user){
 if(!user||!window.sb?.from)return;
 try{
  const {data,error}=await window.sb.from("customer_profiles").select("customer_type").eq("id",user.id).maybeSingle();
  if(error||data?.customer_type!=="uk_private")return;
  const links=[
   ["My Dashboard","/private-dashboard.html"],
   ["Sell My Motorbike","/uk-motorcycle-selling.html"],
   ["My Motorcycles / My Selling","/my-selling.html"],
   ["My Messages","/customer-messages.html"],
   ["My Purchases","/my-purchases.html"],
   ["My Profile","/customer-profile.html"],
   ["Logout","#"]
  ];
  for(const id of ["loggedInMenu","mobileLoggedInMenu"]){
   const menu=document.getElementById(id);if(!menu)continue;
   const existingLogout=menu.querySelector('a[id*="Logout"]');
   const logoutClick=existingLogout?()=>existingLogout.click():null;
   for(const node of [...menu.children]){
    if(node.matches("a")||node.hasAttribute("data-dealer-menu-anchor"))node.remove();
   }
   links.forEach(([label,href])=>{
    const a=document.createElement("a");a.textContent=label;a.href=href;
    if(label==="Logout"){a.href="#";a.addEventListener("click",async e=>{e.preventDefault();if(logoutClick){logoutClick();return}await window.sb.auth.signOut();location.assign("/")})}
    menu.appendChild(a);
   });
  }
 }catch(e){console.warn("Private customer menu unavailable",e)}
}
async function setupPublicHeader(){
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const mobileMenuClose = document.getElementById("mobileMenuClose");
  const mobileDrawerBackdrop = document.getElementById("mobileDrawerBackdrop");
  const mobileDrawer = document.getElementById("mobileDrawer");

  const publicAccount = document.querySelector(".public-account");
  const accountButton = document.getElementById("phAccountButton");

  const notificationButton = document.getElementById("phNotificationsV3");
  const notificationPopover = document.getElementById("notificationPopoverV3");
  const notificationCloseButton = document.getElementById("notificationCloseButtonV3");

  const loggedOutMenu = document.getElementById("loggedOutMenu");
  const loggedInMenu = document.getElementById("loggedInMenu");
  const mobileLoggedOutMenu = document.getElementById("mobileLoggedOutMenu");
  const mobileLoggedInMenu = document.getElementById("mobileLoggedInMenu");

  const logoutLink = document.getElementById("phLogout");
  const mobileLogoutLink = document.getElementById("phMobileLogout");

  anybikeSortPublicNavigationAlphabetically();
  anybikeSortMyAnyBikeMenus();

  const languageSelect = document.getElementById("phLanguage");
  const currencySelect = document.getElementById("phCurrency");

  // Render clocks immediately after the shared header is inserted so auth/profile calls cannot leave placeholders visible.
  updateHeaderTimes();
  if(anybikeHeaderClockTimer){ clearInterval(anybikeHeaderClockTimer); }
  anybikeHeaderClockTimer = setInterval(updateHeaderTimes,30000);

  function openMobileMenu(event){
    event?.preventDefault();
    event?.stopPropagation();

    document.body.classList.add("mobile-menu-open");
    document.body.style.overflow = "hidden";

    if(mobileDrawer){
      mobileDrawer.style.display = "block";
      mobileDrawer.style.transform = "translateX(0)";
      mobileDrawer.style.visibility = "visible";
      mobileDrawer.style.pointerEvents = "auto";
    }

    if(mobileDrawerBackdrop){
      mobileDrawerBackdrop.style.display = "block";
      mobileDrawerBackdrop.style.visibility = "visible";
      mobileDrawerBackdrop.style.opacity = "1";
      mobileDrawerBackdrop.style.pointerEvents = "auto";
    }

    mobileMenuButton?.setAttribute("aria-expanded","true");
  }

  mobileMenuButton?.setAttribute("aria-expanded","false");

  mobileMenuButton?.addEventListener("click",openMobileMenu);
  mobileMenuClose?.addEventListener("click",closeMobileMenu);
  mobileDrawerBackdrop?.addEventListener("click",closeMobileMenu);

  mobileDrawer?.querySelectorAll("a[href]").forEach(function(link){
    link.addEventListener("click",function(){
      closeMobileMenu();
    });
  });

  accountButton?.addEventListener("click",function(event){
    event.preventDefault();
    event.stopPropagation();

    publicAccount?.classList.toggle("menu-open");
    notificationPopover?.classList.remove("open");
  });

  notificationButton?.addEventListener("click",function(event){
    event.preventDefault();
    event.stopPropagation();

    notificationPopover?.classList.toggle("open");
    publicAccount?.classList.remove("menu-open");
  });

  notificationButton?.addEventListener("mouseenter",function(){
    if(window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches){
      notificationPopover?.classList.add("open");
      publicAccount?.classList.remove("menu-open");
    }
  });

  notificationPopover?.addEventListener("mouseleave",function(){
    if(window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches){
      notificationPopover?.classList.remove("open");
    }
  });

  notificationCloseButton?.addEventListener("click",function(event){
    event.preventDefault();
    notificationPopover?.classList.remove("open");
  });

  document.addEventListener("click",function(event){
    if(publicAccount && !publicAccount.contains(event.target)){
      publicAccount.classList.remove("menu-open");
    }

    if(
      notificationPopover &&
      notificationButton &&
      !notificationPopover.contains(event.target) &&
      !notificationButton.contains(event.target)
    ){
      notificationPopover.classList.remove("open");
    }
  });

  document.addEventListener("keydown",function(event){
    if(event.key !== "Escape"){
      return;
    }

    publicAccount?.classList.remove("menu-open");
    notificationPopover?.classList.remove("open");
    closeMobileMenu();
  });

  let savedLanguage = normaliseLanguage(
    localStorage.getItem("anybikeLanguage") ||
    localStorage.getItem("anybike_language") ||
    "en"
  );

  let savedCurrency = normaliseCurrency(
    localStorage.getItem("anybikeCurrency") ||
    localStorage.getItem("anybike_currency") ||
    "GBP"
  );

  let user = null;

  try{
    if(typeof sb !== "undefined" && sb?.auth){
      const sessionResult = await sb.auth.getSession();
      user = sessionResult?.data?.session?.user || null;

      if(!user){
        const userResult = await sb.auth.getUser();
        user = userResult?.data?.user || null;
      }

      if(user){
        const profileResult = await sb
          .from("customer_profiles")
          .select("preferred_language,preferred_currency")
          .eq("id",user.id)
          .maybeSingle();

        const profile = profileResult?.data || null;

        if(profile?.preferred_language){
          savedLanguage = normaliseLanguage(profile.preferred_language);
          saveLocalLanguage(savedLanguage);
        }

        if(profile?.preferred_currency){
          savedCurrency = normaliseCurrency(profile.preferred_currency);
          saveLocalCurrency(savedCurrency);
        }
      }
    }
  }catch(error){
    console.warn("Header account preferences unavailable",error);
  }

  anybikeHeaderUser = user;

  if(languageSelect){
    languageSelect.value = savedLanguage;

    languageSelect.addEventListener("change",function(){
      const language = normaliseLanguage(languageSelect.value);

      saveLocalLanguage(language);
      saveHeaderPreference("preferred_language",language);
      applyHeaderLanguage(language);
    });
  }

  if(currencySelect){
    currencySelect.value = savedCurrency;

    currencySelect.addEventListener("change",function(){
      const currency = normaliseCurrency(currencySelect.value);

      saveLocalCurrency(currency);
      saveHeaderPreference("preferred_currency",currency);
      applyHeaderCurrency(currency);
    });
  }

  if(user){
    loggedOutMenu?.classList.add("hidden");
    loggedInMenu?.classList.remove("hidden");
    mobileLoggedOutMenu?.classList.add("hidden");
    mobileLoggedInMenu?.classList.remove("hidden");

    await addMyDealershipMenuIfEligible(user);
    await anybikeApplyPrivateCustomerMenu(user);
    document.documentElement.classList.add("anybike-home-account-resolved");
    document.documentElement.classList.add("anybike-home-audience-resolved");
    await loadCustomerHeaderActivity(user);
    bindHeaderMessagePageUnreadSync();
    startCustomerHeaderRealtime(user);

    if(anybikeHeaderRefreshTimer){
      clearInterval(anybikeHeaderRefreshTimer);
    }

    /*
      Realtime is preferred. This 5-second timer is only a fallback for pages
      or browsers where the realtime subscription is unavailable/delayed.
    */
    anybikeHeaderRefreshTimer = setInterval(function(){
      if(document.visibilityState === "visible"){
        loadCustomerHeaderActivity(user);
      }
    },5000);

  }else{
    document.documentElement.classList.add("anybike-home-account-resolved");
    document.documentElement.classList.add("anybike-home-audience-resolved");
    loggedOutMenu?.classList.remove("hidden");
    loggedInMenu?.classList.add("hidden");
    mobileLoggedOutMenu?.classList.remove("hidden");
    mobileLoggedInMenu?.classList.add("hidden");

    setMessageCount(0);
    setNotificationCount(0);
    renderNotificationList([]);
  }

  logoutLink?.addEventListener("click",logoutCustomer);
  mobileLogoutLink?.addEventListener("click",logoutCustomer);

  setActivePublicNav();
  applyHeaderLanguage(savedLanguage);
  applyHeaderCurrency(savedCurrency);

  window.dispatchEvent(new CustomEvent("anybikePublicHeaderReady",{
    detail:{
      user:user || null
    }
  }));
}

function saveLocalLanguage(language){
  localStorage.setItem("anybikeLanguage",language);
  localStorage.setItem("anybike_language",language);
}

function saveLocalCurrency(currency){
  localStorage.setItem("anybikeCurrency",currency);
  localStorage.setItem("anybike_currency",currency);
}

function normaliseLanguage(value){
  return Object.prototype.hasOwnProperty.call(
    ANYBIKE_HEADER_TRANSLATIONS,
    value
  ) ? value : "en";
}

function normaliseCurrency(value){
  return Object.prototype.hasOwnProperty.call(
    ANYBIKE_HEADER_CURRENCY_RATES,
    value
  ) ? value : "GBP";
}

function closeMobileMenu(){
  document.body.classList.remove("mobile-menu-open");
  document.body.style.overflow = "";

  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const mobileDrawer = document.getElementById("mobileDrawer");
  const mobileDrawerBackdrop = document.getElementById("mobileDrawerBackdrop");

  if(mobileDrawer){
    mobileDrawer.style.transform = "translateX(-105%)";
    mobileDrawer.style.visibility = "";
    mobileDrawer.style.pointerEvents = "";
    mobileDrawer.style.display = "";
  }

  if(mobileDrawerBackdrop){
    mobileDrawerBackdrop.style.display = "none";
    mobileDrawerBackdrop.style.visibility = "";
    mobileDrawerBackdrop.style.opacity = "";
    mobileDrawerBackdrop.style.pointerEvents = "";
  }

  mobileMenuButton?.setAttribute("aria-expanded","false");
}

async function logoutCustomer(event){
  event?.preventDefault();

  try{
    if(typeof sb !== "undefined" && sb?.auth){
      await sb.auth.signOut();
    }
  }catch(error){
    console.warn("Customer logout failed",error);
  }

  window.location.href = "/customer-register.html";
}

function setActivePublicNav(){
  const path = String(window.location.pathname || "").toLowerCase();
  const hash = String(window.location.hash || "").toLowerCase();

  document
    .querySelectorAll(".public-nav a[data-page]")
    .forEach(function(link){
      link.classList.remove("active");
    });

  if(path === "/" || path.endsWith("/index.html")){
    markActive(hash === "#export-services" ? "export" : "home");
    return;
  }

  if(path.includes("available-stock") || path.includes("bike-details")){
    markActive("stock");
    return;
  }

  if(path.includes("buy-motorcycles") || path.includes("bulk-buying-request")){
    markActive("buy");
    return;
  }

  if(path.includes("sell-your-motorcycle")){
    markActive("sell");
    return;
  }

  if(path.includes("export-services")){
    markActive("export");
    return;
  }

  if(path.includes("about-us")){
    markActive("about");
    return;
  }

  if(path.includes("contact-us") || path.includes("anybike-connect")){
    const params = new URLSearchParams(window.location.search);
    const journey = String(params.get("journey") || "").toLowerCase();

    if(journey === "dealer" || journey === "trade"){
      markActive("buy");
    }else{
      markActive("connect");
    }
  }

  function markActive(page){
    document
      .querySelector('.public-nav a[data-page="' + page + '"]')
      ?.classList.add("active");
  }
}

async function saveHeaderPreference(field,value){
  try{
    if(typeof sb === "undefined" || !sb?.auth){
      return;
    }

    const userResult = await sb.auth.getUser();
    const user = userResult?.data?.user || null;

    if(!user){
      return;
    }

    const updateData = {};
    updateData[field] = value;

    const {error} = await sb
      .from("customer_profiles")
      .update(updateData)
      .eq("id",user.id);

    if(error){
      throw error;
    }

  }catch(error){
    console.warn("Header preference could not be saved",error);
  }
}

function startCustomerHeaderRealtime(user){
  if(
    typeof sb === "undefined" ||
    !user?.id ||
    anybikeHeaderRealtimeChannel
  ){
    return;
  }

  try{
    anybikeHeaderRealtimeChannel =
      sb
        .channel("anybike-customer-header-activity-" + user.id)
        .on(
          "postgres_changes",
          {
            event:"*",
            schema:"public",
            table:"message_centre_messages"
          },
          function(){
            loadCustomerHeaderActivity(user);
          }
        )
        .on(
          "postgres_changes",
          {
            event:"*",
            schema:"public",
            table:"customer_notifications"
          },
          function(){
            loadCustomerHeaderActivity(user);
          }
        )
        .subscribe();

  }catch(error){
    console.warn("Customer header realtime unavailable",error);
  }
}


async function anybikeFilterCompletedActionNotifications(notifications){
  const rows=Array.isArray(notifications)?notifications:[];
  if(!rows.length || typeof sb==="undefined") return rows;

  const needsPurchaseState=rows.some(function(row){
    return String(row?.type||"").toLowerCase()==="payment_due";
  });
  const needsOfferState=rows.some(function(row){
    return String(row?.type||"").toLowerCase()==="deal_formal_offer";
  });

  let purchases=[];
  let offers=[];

  const queries=[];
  queries.push(needsPurchaseState ? sb.rpc("get_my_purchases_v7") : Promise.resolve({data:[],error:null}));
  queries.push(needsOfferState ? sb.rpc("get_my_deal_offers_v4") : Promise.resolve({data:[],error:null}));

  try{
    const results=await Promise.all(queries);
    if(!results[0]?.error) purchases=Array.isArray(results[0]?.data)?results[0].data:[];
    if(!results[1]?.error) offers=Array.isArray(results[1]?.data)?results[1].data:[];

    const staleIds=[];

    const active=rows.filter(function(row){
      const type=String(row?.type||"").toLowerCase();
      const link=String(row?.link||"");
      let stale=false;

      if(type==="payment_due"){
        try{
          const url=new URL(link,window.location.origin);
          const deal=String(url.searchParams.get("deal")||"").trim();
          const payment=String(url.searchParams.get("payment")||"").toLowerCase();
          const purchase=purchases.find(function(p){
            return String(p?.deal_number||"").trim()===deal;
          });

          if(purchase){
            const balance=Number(purchase.customer_balance_motorcycle_gbp||0);
            const allocated=Number(purchase.customer_allocated_motorcycle_gbp||0);
            const depositDue=Number(purchase.deposit_due_gbp||0);
            const depositOutstanding=Number(purchase.deposit_outstanding_gbp||0);

            if(payment==="deposit"){
              stale=
                balance<=0.009 ||
                allocated+0.009>=depositDue ||
                depositOutstanding<=0.009;
            }else if(payment==="balance"){
              stale=balance<=0.009;
            }
          }
        }catch(_ignore){}
      }

      if(type==="deal_formal_offer"){
        try{
          const url=new URL(link,window.location.origin);
          const offerId=Number(url.searchParams.get("deal_offer")||url.searchParams.get("offer")||0);
          const offer=offers.find(function(o){return Number(o?.offer_id||0)===offerId;});
          if(offer){
            const status=String(offer.offer_status||"").toLowerCase();
            const decision=String(offer.customer_decision||"").toLowerCase();
            stale=
              ["accepted","declined","expired"].includes(status) ||
              ["accepted","declined"].includes(decision);
          }
        }catch(_ignore){}
      }

      if(stale && row?.id) staleIds.push(row.id);
      return !stale;
    });

    if(staleIds.length){
      const result=await sb
        .from("customer_notifications")
        .update({is_read:true})
        .in("id",staleIds);

      if(result.error){
        console.warn("Completed customer notifications could not be cleared",result.error);
      }
    }

    return active;
  }catch(error){
    console.warn("Completed notification state could not be checked",error);
    return rows;
  }
}

async function loadCustomerHeaderActivity(user){
  if(typeof sb === "undefined" || !user){
    setMessageCount(0);
    setNotificationCount(0);
    renderNotificationList([]);
    return;
  }

  try{
    /*
      MESSAGE BADGE
      -------------
      Use the same read-state model already used by the customer messaging UI:
      latest message per owned Message Centre thread +
      localStorage key anybike_customer_read_message_ids.

      This is READ-ONLY header logic. It does not alter live messaging,
      Message Centre delivery, replies, realtime subscriptions or routing.
    */
    const unreadMessageInfo = await getHeaderUnreadMessageThreadCount(user);
    const unreadMessageCount = typeof unreadMessageInfo === "number" ? unreadMessageInfo : unreadMessageInfo.count;
    setMessageCount(unreadMessageCount);

    /*
      BELL NOTIFICATIONS
      ------------------
      customer_notifications is used for the bell only.
      Message-type notification rows are deliberately excluded because
      the Messages badge now comes from the actual conversation state.
    */
    const {data,error} = await sb
      .from("customer_notifications")
      .select("id,title,message,type,link,is_read,created_at")
      .eq("customer_id",user.id)
      .eq("is_read",false)
      .order("created_at",{ascending:false});

    if(error){
      throw error;
    }

    // Message notifications are real bell items too. Previously every type="message"
    // row was excluded, so an admin's bell test disappeared despite being saved.
    const activeNotificationRows = await anybikeFilterCompletedActionNotifications(data || []);
    const hasMessageNotifications = activeNotificationRows.some(function(notification){
      return String(notification.type || "").toLowerCase().includes("message");
    });

    const notifications = activeNotificationRows
      .map(function(notification){
        const type=String(notification.type || "").toLowerCase();
        const directSourcing=
          type==="sourcing_matches" ||
          /motorcycle match(?:es)? ready/i.test(String(notification.title || "")) ||
          /hand-picked selection/i.test(String(notification.message || ""));

        return {
          id:notification.id,
          title:notification.title || "Notification",
          message:notification.message || "",
          link:notification.link || "/customer-messages.html",
          icon:directSourcing ? "🏍" : "🔔",
          date:notification.created_at,
          directSourcing:directSourcing
        };
      });

    /*
      CUSTOMER BELL
      -------------
      Specific action notifications must come before the generic Messages item.
      A hand-picked sourcing notification already tells the buyer exactly what
      to do, so do not make them open Message Centre first and search for it.
    */
    const bellItems = notifications
      .slice()
      .sort(function(a,b){
        return Number(!!b.directSourcing)-Number(!!a.directSourcing);
      });

    if(unreadMessageCount > 0 && !hasMessageNotifications){
      const offerNotice=unreadMessageInfo && typeof unreadMessageInfo==="object" ? unreadMessageInfo.offer : null;
      if(offerNotice){
        bellItems.push({
          id:"",
          title:"Your AnyBike motorcycle purchase offer is ready",
          message:offerNotice.motorcycle+" · Review your offer and respond securely.",
          link:"/customer-messages.html?thread="+encodeURIComponent(offerNotice.threadId),
          icon:"🏍",
          date:new Date().toISOString()
        });
      }
      const remaining=unreadMessageCount-(offerNotice?1:0);
      if(remaining>0)bellItems.push({
        id:"",
        title:remaining===1?"1 unread message from AnyBike":remaining+" unread messages from AnyBike",
        message:"Open My Messages to read the latest conversation.",
        link:"/customer-messages.html",
        icon:"💬",
        date:new Date().toISOString()
      });
    }

    const bellCount = notifications.length + (hasMessageNotifications ? 0 : unreadMessageCount);

    setNotificationCount(bellCount);
    renderNotificationList(bellItems);

    const messageNotificationCount=activeNotificationRows.filter(row=>String(row.type||"").toLowerCase().includes("message")).length;
    const displayedMessageCount=Math.max(unreadMessageCount,messageNotificationCount);
    window.anybikeCustomerUnreadSnapshot={count:bellCount,messageCount:displayedMessageCount,notificationCount:bellCount};
    window.dispatchEvent(new CustomEvent("anybikeCustomerUnreadChanged",{
      detail:{
        count:bellCount,
        messageCount:displayedMessageCount,
        notificationCount:bellCount,
        items:bellItems
      }
    }));

  }catch(error){
    console.error("Header activity load failed",error);

    /*
      Fail closed on badges only. Never interfere with messaging itself.
    */
    setMessageCount(0);
    setNotificationCount(0);
    renderNotificationList([]);
  }
}


async function getHeaderUnreadMessageThreadCount(user){
  if(typeof sb === "undefined" || !user?.id){
    return 0;
  }

  try{
    /*
      Match the same two conversation sources shown by customer-messages.html:
      1) bike_enquiries -> enquiry_messages
      2) customer-visible message_centre_threads -> message_centre_messages

      The read-state remains the existing localStorage map:
      anybike_customer_read_message_ids

      This function is read-only. It does not send, receive, update or subscribe
      to messages and therefore does not alter AnyBike instant messaging.
    */
    const results = await Promise.allSettled([
      sb
        .from("bike_enquiries")
        .select("id")
        .eq("customer_id",user.id),

      sb
        .from("message_centre_threads")
        .select("id,source_type,department,subject")
        .eq("customer_id",user.id)
    ]);

    const bikeRows =
      results[0].status === "fulfilled" && !results[0].value?.error
        ? (results[0].value?.data || [])
        : [];

    const allThreads =
      results[1].status === "fulfilled" && !results[1].value?.error
        ? (results[1].value?.data || [])
        : [];

    /*
      Keep this filter aligned with customer-messages.html so the header only
      counts conversations the customer can actually see in My Messages.
    */
    const visibleThreads = allThreads.filter(function(thread){
      const source = String(thread.source_type || "").toLowerCase();
      const department = String(thread.department || "").toLowerCase();
      const subject = String(thread.subject || "").toLowerCase();

      return (
        source.includes("global buyer") ||
        source.includes("bulk") ||
        source.includes("my anybike") ||
        source.includes("private buyer") ||
        source.includes("private seller") ||
        source.includes("sell your bike") ||
        source.includes("sell my motorcycle") ||
        source.includes("dealer") ||
        source.includes("trader") ||
        source.includes("importer") ||
        source.includes("exporter") ||
        source.includes("finance") ||
        source.includes("shipping") ||
        source.includes("marketplace") ||
        source.includes("trade partner") ||
        source.includes("supplier") ||
        source.includes("manufacturer") ||
        source.includes("press") ||
        source.includes("website support") ||
        source.includes("general enquiry") ||
        department.includes("global buyer") ||
        subject.includes("global buyer")
      );
    });

    const bikeIds = bikeRows
      .map(function(row){ return Number(row.id); })
      .filter(function(id){ return Number.isFinite(id); });

    const threadIds = visibleThreads
      .map(function(row){ return Number(row.id); })
      .filter(function(id){ return Number.isFinite(id); });

    const messageQueries = [];

    if(bikeIds.length){
      messageQueries.push(
        sb
          .from("enquiry_messages")
          .select("*")
          .in("enquiry_id",bikeIds)
          .order("created_at",{ascending:false})
      );
    }else{
      messageQueries.push(Promise.resolve({data:[],error:null}));
    }

    if(threadIds.length){
      messageQueries.push(
        sb
          .from("message_centre_messages")
          .select("*")
          .in("thread_id",threadIds)
          .order("created_at",{ascending:false})
      );
    }else{
      messageQueries.push(Promise.resolve({data:[],error:null}));
    }

    const messageResults = await Promise.all(messageQueries);

    const enquiryMessages = messageResults[0]?.data || [];
    const threadMessages = messageResults[1]?.data || [];

    if(messageResults[0]?.error){
      throw messageResults[0].error;
    }

    if(messageResults[1]?.error){
      throw messageResults[1].error;
    }

    const latestBikeMessage = new Map();
    enquiryMessages.forEach(function(message){
      const key = String(message.enquiry_id ?? "");
      if(key && !latestBikeMessage.has(key)){
        latestBikeMessage.set(key,message);
      }
    });

    const latestThreadMessage = new Map();
    threadMessages.forEach(function(message){
      const key = String(message.thread_id ?? "");
      if(key && !latestThreadMessage.has(key)){
        latestThreadMessage.set(key,message);
      }
    });

    const readMap = getHeaderCustomerReadMessageMap();
    let unreadCount = 0;
    let unreadOffer = null;

    /*
      Bike enquiry unread rule copied from customer-messages.html:
      only a latest message from AnyBike can be unread.
      The read-map key is bike-<enquiry id>.
    */
    latestBikeMessage.forEach(function(message,enquiryId){
      const sender = String(message?.sender || "").toLowerCase();

      if(!sender.includes("anybike")){
        return;
      }

      const latestKey = String(message?.id || message?.created_at || "");
      const readKey = String(readMap["bike-" + String(enquiryId)] || "");

      if(latestKey && readKey !== latestKey){
        unreadCount += 1;
      }
    });

    /*
      Message Centre unread rule copied from customer-messages.html:
      customer-originated latest messages are never unread.
      The read-map key is the bare thread id.
    */
    latestThreadMessage.forEach(function(message,threadId){
      if(isHeaderCustomerMessageSender(message,user)){
        return;
      }

      const latestKey = String(message?.id || message?.created_at || "");
      const readKey = String(readMap[String(threadId)] || "");

      if(latestKey && readKey !== latestKey){
        unreadCount += 1;
        const body=String(message?.message || "");
        if(!unreadOffer && (/AnyBike Offer\s*[—-]/i.test(body) || /ANYBIKE\s*\|\s*MOTORCYCLE PURCHASE OFFER/i.test(body))){
          const match=body.match(/(?:AnyBike Offer\s*[—-]\s*|Motorcycle:\s*)([^\n\r]+)/i);
          unreadOffer={threadId:threadId,motorcycle:match?match[1].trim():"Your motorcycle"};
        }
      }
    });

    return {count:unreadCount,offer:unreadOffer};

  }catch(error){
    console.warn("Header unread message count unavailable",error);
    return 0;
  }
}


let anybikeHeaderMessagePageObserver = null;

function bindHeaderMessagePageUnreadSync(){
  const container = document.getElementById("customerEnquiries");

  if(!container){
    return;
  }

  const syncFromVisibleMessageCards = function(){
    const cards = container.querySelectorAll(".customer-enquiry");
    const unread = container.querySelectorAll(".customer-enquiry.has-unread");

    /*
      Only trust the DOM after conversations have actually rendered.
      This is display-only and does not change message data or read state.
    */
    if(cards.length){
      setMessageCount(unread.length);
    }
  };

  syncFromVisibleMessageCards();

  if(anybikeHeaderMessagePageObserver){
    anybikeHeaderMessagePageObserver.disconnect();
  }

  anybikeHeaderMessagePageObserver = new MutationObserver(function(){
    syncFromVisibleMessageCards();
  });

  anybikeHeaderMessagePageObserver.observe(container,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:["class"]
  });
}


function getHeaderCustomerReadMessageMap(){
  try{
    const raw = localStorage.getItem(
      "anybike_customer_read_message_ids"
    );

    const parsed = raw ? JSON.parse(raw) : {};

    return parsed && typeof parsed === "object"
      ? parsed
      : {};

  }catch(error){
    return {};
  }
}


function isHeaderCustomerMessageSender(message,user){
  const values = [
    message?.sender_type,
    message?.sender_name,
    message?.sender,
    message?.sender_email
  ]
    .filter(Boolean)
    .map(function(value){
      return String(value).trim().toLowerCase();
    });

  const customerEmail = String(user?.email || "")
    .trim()
    .toLowerCase();

  return values.some(function(value){
    return (
      value === "customer" ||
      value === "buyer" ||
      value === "user" ||
      value.includes("customer") ||
      (customerEmail && value === customerEmail)
    );
  });
}


function renderNotificationList(items){
  const list = document.getElementById("notificationListV3");

  if(!list){
    return;
  }

  const language = normaliseLanguage(
    localStorage.getItem("anybikeLanguage") || "en"
  );

  const translations = ANYBIKE_HEADER_TRANSLATIONS[language];

  if(!items?.length){
    list.innerHTML =
      "<p>" + escapeHtml(translations.noNotifications) + "</p>";
    return;
  }

  list.innerHTML = items.slice(0,12).map(function(item){
    const originalLink = item.link || "/customer-messages.html";
    const sellerReference=String(item.message||"").match(/AB-S-\d{6}/i)?.[0] || "";
    const sellerNotice=/bidding has finished for your motorcycle|a dealer has made an offer on your motorcycle/i.test(String(item.title||""));
    const link=sellerNotice && sellerReference && String(originalLink).includes("/my-selling.html") && !String(originalLink).includes("reference=")
      ? "/my-selling.html?reference="+encodeURIComponent(sellerReference)
      : originalLink;
    const lowerLink=String(link).toLowerCase();
    const lowerTitle=String(item.title||"").toLowerCase();
    let actionLabel="Open →";

    if(lowerLink.includes("accounts") || lowerTitle.includes("proforma") || lowerTitle.includes("payment")){
      actionLabel="View payment details →";
    }else if(lowerLink.includes("/my-selling.html") || lowerTitle.includes("a dealer has made an offer on your motorcycle") || lowerTitle.includes("bidding has finished for your motorcycle")){
      actionLabel="View motorcycle progress →";
    }else if(lowerTitle.includes("offer") || lowerLink.includes("offer")){
      actionLabel="Review offer →";
    }else if(lowerLink.includes("sourced") || lowerTitle.includes("hand-picked") || lowerTitle.includes("match")){
      actionLabel="View motorcycles →";
    }else if(lowerLink.includes("message")){
      actionLabel="Open messages →";
    }else if(lowerLink.includes("purchase")){
      actionLabel="View purchase →";
    }

    let dateLabel="";
    if(item.date){
      try{
        const d=new Date(item.date);
        if(!Number.isNaN(d.getTime())){
          dateLabel=d.toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
        }
      }catch(error){}
    }

    return `
      <a
        href="${escapeHtml(link)}"
        class="notification-item unread"
        data-notification-id="${escapeHtml(item.id)}"
        data-notification-link="${escapeHtml(link)}"
      >
        <span class="notification-icon" aria-hidden="true">${escapeHtml(item.icon || "🔔")}</span>

        <span class="notification-copy">
          <span class="notification-title-row">
            <strong>${escapeHtml(item.title || translations.notifications)}</strong>
            ${dateLabel ? `<time>${escapeHtml(dateLabel)}</time>` : ""}
          </span>
          <small>${escapeHtml(item.message || "")}</small>
          <span class="notification-action">${escapeHtml(actionLabel)}</span>
        </span>
      </a>
    `;
  }).join("");

  list.querySelectorAll("[data-notification-id]").forEach(function(item){
    item.addEventListener("click",async function(event){
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const notificationId=item.getAttribute("data-notification-id");
      const destination=new URL(item.href,window.location.href);
      const isCustomerMessages=destination.pathname==="/customer-messages.html";
      if(isCustomerMessages && notificationId)destination.searchParams.set("notification_id",notificationId);
      if(!notificationId||!anybikeHeaderUser)return;
      event.preventDefault();
      try{
        const {error}=await sb.from("customer_notifications")
          .update({is_read:true})
          .eq("id",notificationId)
          .eq("customer_id",anybikeHeaderUser.id);
        if(error)throw error;
        item.remove();
        await loadCustomerHeaderActivity(anybikeHeaderUser);
      }catch(error){
        console.warn("Notification could not be marked read",error);
      }finally{
        window.location.assign(destination.toString());
      }
    });
  });
}

function setMessageCount(total){
  total = Number(total) || 0;

  const link = document.getElementById("phMessagesV3");
  const count = document.getElementById("phMessagesV3Count");

  if(count){
    count.textContent = total;
    count.style.display = total > 0 ? "inline-flex" : "none";
  }

  if(link){
    link.classList.toggle("has-messages",total > 0);
    link.setAttribute("aria-label","Messages " + total);
  }
}

function setNotificationCount(total){
  total = Number(total) || 0;

  const button = document.getElementById("phNotificationsV3");
  const count = document.getElementById("phNotificationsV3Count");

  if(count){
    count.textContent = total;
    count.style.display = total > 0 ? "inline-flex" : "none";
  }

  if(button){
    button.classList.toggle("has-notifications",total > 0);
    button.setAttribute("aria-label","Notifications " + total);
  }
}

function updateHeaderTimes(){
  const now = new Date();

  const localTime = now.toLocaleString([],{
    weekday:"short",
    day:"2-digit",
    month:"short",
    hour:"2-digit",
    minute:"2-digit"
  });

  const ukTime = now.toLocaleString("en-GB",{
    timeZone:"Europe/London",
    weekday:"short",
    day:"2-digit",
    month:"short",
    hour:"2-digit",
    minute:"2-digit"
  });

  const localEl = document.getElementById("phLocalTime");
  const ukEl = document.getElementById("phUkTime");

  if(localEl){
    localEl.textContent = "Local " + localTime;
  }

  if(ukEl){
    ukEl.textContent = "UK " + ukTime;
  }
}

function applyHeaderCurrency(currency){
  currency = normaliseCurrency(currency);

  window.anybikeCurrency = currency;
  saveLocalCurrency(currency);

  const currencySelect = document.getElementById("phCurrency");

  if(currencySelect && currencySelect.value !== currency){
    currencySelect.value = currency;
  }

  updateSharedPagePrices(currency);

  if(typeof window.updateDisplayedPrices === "function"){
    try{
      window.updateDisplayedPrices();
    }catch(error){
      console.warn("Page price refresh failed",error);
    }
  }

  window.dispatchEvent(new CustomEvent("anybikeCurrencyChanged",{
    detail:{
      currency:currency
    }
  }));
}

function updateSharedPagePrices(currency){
  const rate = ANYBIKE_HEADER_CURRENCY_RATES[currency] || 1;

  document
    .querySelectorAll("[data-price-gbp]")
    .forEach(function(element){
      const raw = Number(element.dataset.priceGbp);

      if(!Number.isFinite(raw)){
        return;
      }

      element.textContent = window.AnyBikeCurrency.formatGBP(raw,currency);
    });
}

function applyHeaderLanguage(language){
  language = normaliseLanguage(language);

  const translations = ANYBIKE_HEADER_TRANSLATIONS[language];

  window.anybikeLanguage = language;
  saveLocalLanguage(language);

  const languageSelect = document.getElementById("phLanguage");

  if(languageSelect && languageSelect.value !== language){
    languageSelect.value = language;
  }

  document.documentElement.lang = language;

  /*
  Keep the page layout left-to-right for all languages.
  This matches the current AnyBike public-site decision.
  */
  document.documentElement.dir = "ltr";

  Object.keys(translations).forEach(function(key){
    setText("[data-i18n='" + key + "']",translations[key]);
  });
  // Account items added by the dealer flow share the selected site language.
  const sharedExtraLabels={
    en:{mySelling:"My Selling",vatExportGuide:"VAT Export Guide"},
    fr:{mySelling:"Mes ventes",vatExportGuide:"Guide TVA à l’exportation"},
    de:{mySelling:"Meine Verkäufe",vatExportGuide:"Leitfaden zur Export-Umsatzsteuer"},
    es:{mySelling:"Mis ventas",vatExportGuide:"Guía de IVA para exportaciones"},
    ar:{mySelling:"مبيعاتي",vatExportGuide:"دليل ضريبة القيمة المضافة للتصدير"},
    id:{mySelling:"Penjualan saya",vatExportGuide:"Panduan PPN ekspor"},
    ms:{mySelling:"Jualan saya",vatExportGuide:"Panduan VAT eksport"},
    zh:{mySelling:"我的销售",vatExportGuide:"出口增值税指南"}
  };
  const extra=sharedExtraLabels[language]||sharedExtraLabels.en;
  Object.keys(extra).forEach(function(key){setText("[data-i18n='"+key+"']",extra[key]);});
  document.querySelectorAll('[data-dealer-menu-link="true"]').forEach(function(link){
    link.textContent=translations.dealership||"My Dealership";
  });

  window.dispatchEvent(new CustomEvent("anybikeLanguageChanged",{
    detail:{
      language:language
    }
  }));

  if(window.AnyBikePageLanguage){
    window.AnyBikePageLanguage.apply(language);
  }
}

function setText(selector,value){
  document
    .querySelectorAll(selector)
    .forEach(function(element){
      element.textContent = value;
    });
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,function(char){
    return {
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[char];
  });
}

/* =========================================================
   SESSION RECHECK — PREVENT PROTECTED CUSTOMER PAGES RETURNING
   FROM THE BROWSER BACK/FORWARD CACHE AFTER LOGOUT
   ========================================================= */

const ANYBIKE_PROTECTED_CUSTOMER_PAGES = [
  "/customer-dashboard.html",
  "/my-watchlist.html",
  "/my-searches.html"
];

let anybikeCustomerSessionRecheckRunning = false;

function isProtectedCustomerPage(){
  const path = String(window.location.pathname || "")
    .replace(/\/{2,}/g,"/")
    .toLowerCase();

  return ANYBIKE_PROTECTED_CUSTOMER_PAGES.includes(path);
}

function getCustomerReturnLoginUrl(){
  const returnUrl =
    window.location.pathname +
    window.location.search +
    window.location.hash;

  return "/customer-login.html?return=" +
    encodeURIComponent(returnUrl);
}

async function verifyCustomerSession(){
  if(!isProtectedCustomerPage()){
    return true;
  }

  if(anybikeCustomerSessionRecheckRunning){
    return false;
  }

  anybikeCustomerSessionRecheckRunning = true;

  try{
    if(typeof sb === "undefined" || !sb?.auth){
      window.location.replace(getCustomerReturnLoginUrl());
      return false;
    }

    const {data,error} = await sb.auth.getSession();

    if(error){
      console.warn("Customer session recheck failed",error.message);
    }

    const user = data?.session?.user || null;

    if(!user){
      document.documentElement.classList.add("customer-auth-pending");
      window.location.replace(getCustomerReturnLoginUrl());
      return false;
    }

    document.documentElement.classList.remove("customer-auth-pending");
    return true;

  }catch(error){
    console.warn("Customer session recheck failed",error);

    document.documentElement.classList.add("customer-auth-pending");
    window.location.replace(getCustomerReturnLoginUrl());
    return false;

  }finally{
    anybikeCustomerSessionRecheckRunning = false;
  }
}

window.addEventListener("pageshow",function(event){
  if(event.persisted && isProtectedCustomerPage()){
    document.documentElement.classList.add("customer-auth-pending");
    verifyCustomerSession();
  }
});

window.addEventListener("focus",function(){
  verifyCustomerSession();

  if(anybikeHeaderUser){
    loadCustomerHeaderActivity(anybikeHeaderUser);
  }
});

document.addEventListener("visibilitychange",function(){
  if(document.visibilityState === "visible"){
    verifyCustomerSession();

    if(anybikeHeaderUser){
      loadCustomerHeaderActivity(anybikeHeaderUser);
    }
  }
});
/* =========================================================
   ANYBIKE LIVE VISITOR + JOURNEY TRACKING
   ========================================================= */

(function initialiseAnyBikeVisitorTracking(){
  if(window.__anybikeVisitorJourneyTrackingStarted){ return; }
  window.__anybikeVisitorJourneyTrackingStarted=true;

  const TRACK_VISITOR_URL =
    "https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/track-visitor";

  const HEARTBEAT_MS = 30000;

  let heartbeatTimer = null;
  let lastSendStartedAt = 0;
  const pageViewId = createUuid();
  let accumulatedVisibleMs = 0;
  let visibleStartedAt =
    document.visibilityState === "visible"
      ? Date.now()
      : null;

  function createUuid(){
    if(window.crypto?.randomUUID){
      return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function(char){
        const random = Math.random() * 16 | 0;
        const value = char === "x"
          ? random
          : (random & 0x3 | 0x8);

        return value.toString(16);
      }
    );
  }

  function getOrCreateVisitorId(){
    const key = "anybike_visitor_id";

    try{
      let value = localStorage.getItem(key);

      if(!value){
        value = createUuid();
        localStorage.setItem(key,value);
      }

      return value;

    }catch(error){
      console.warn("AnyBike visitor ID storage unavailable",error);
      return createUuid();
    }
  }

  function getOrCreateSessionId(){
    const key = "anybike_session_id";

    try{
      let value = sessionStorage.getItem(key);

      if(!value){
        value = createUuid();
        sessionStorage.setItem(key,value);
      }

      return value;

    }catch(error){
      console.warn("AnyBike session ID storage unavailable",error);
      return createUuid();
    }
  }

  function detectDeviceType(){
    const userAgent=String(navigator.userAgent || "");

    if(/tablet|ipad|playbook|silk/i.test(userAgent)){
      return "Tablet";
    }

    if(/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(userAgent)){
      return "Mobile";
    }

    return "Desktop";
  }

  function detectBrowser(){
    const userAgent=String(navigator.userAgent || "");

    if(/Edg\//i.test(userAgent)) return "Edge";
    if(/OPR\//i.test(userAgent)) return "Opera";
    if(/Chrome\//i.test(userAgent)) return "Chrome";
    if(/Firefox\//i.test(userAgent)) return "Firefox";

    if(/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)){
      return "Safari";
    }

    return "Other";
  }

  function getLoggedInUserId(){
    try{
      if(
        typeof anybikeHeaderUser !== "undefined" &&
        anybikeHeaderUser?.id
      ){
        return anybikeHeaderUser.id;
      }
    }catch(error){
      // Header may not have resolved the session yet.
    }

    return null;
  }

  function commitVisibleTime(){
    if(visibleStartedAt !== null){
      accumulatedVisibleMs += Math.max(0,Date.now() - visibleStartedAt);
      visibleStartedAt = null;
    }
  }

  function resumeVisibleTime(){
    if(visibleStartedAt === null && document.visibilityState === "visible"){
      visibleStartedAt = Date.now();
    }
  }

  function activeSeconds(){
    let ms=accumulatedVisibleMs;

    if(visibleStartedAt !== null){
      ms += Math.max(0,Date.now() - visibleStartedAt);
    }

    return Math.max(0,Math.floor(ms / 1000));
  }

  async function sendVisitorHeartbeat(options){
    const settings=options || {};
    const now=Date.now();

    if(!settings.force && now - lastSendStartedAt < 1500){
      return;
    }

    lastSendStartedAt=now;

    const payload={
      visitor_id:getOrCreateVisitorId(),
      session_id:getOrCreateSessionId(),
      page_view_id:pageViewId,
      user_id:getLoggedInUserId(),

      current_path:
        window.location.pathname +
        window.location.search,

      page_title:document.title || "",
      referrer:document.referrer || "",
      language:navigator.language || "",
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      device_type:detectDeviceType(),
      browser:detectBrowser(),
      active_seconds:activeSeconds(),
      page_left:settings.pageLeft === true
    };

    try{
      const response=await fetch(TRACK_VISITOR_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload),
        keepalive:true
      });

      if(!response.ok){
        const errorText=await response.text().catch(()=>"");
        console.warn(
          "AnyBike visitor tracking request failed",
          response.status,
          errorText
        );
      }

    }catch(error){
      console.warn("AnyBike visitor tracking unavailable",error);
    }
  }

  function startVisitorHeartbeat(){
    resumeVisibleTime();
    sendVisitorHeartbeat({force:true});

    if(heartbeatTimer){
      clearInterval(heartbeatTimer);
    }

    heartbeatTimer=setInterval(function(){
      if(document.visibilityState === "visible"){
        sendVisitorHeartbeat();
      }
    },HEARTBEAT_MS);
  }

  if(document.readyState === "loading"){
    document.addEventListener(
      "DOMContentLoaded",
      startVisitorHeartbeat,
      {once:true}
    );
  }else{
    startVisitorHeartbeat();
  }

  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState === "visible"){
      resumeVisibleTime();
      sendVisitorHeartbeat({force:true});
    }else{
      commitVisibleTime();
      sendVisitorHeartbeat({force:true});
    }
  });

  window.addEventListener("focus",function(){
    resumeVisibleTime();
    sendVisitorHeartbeat();
  });

  window.addEventListener("pagehide",function(){
    commitVisibleTime();
    sendVisitorHeartbeat({force:true,pageLeft:true});
  });

  window.addEventListener("anybikePublicHeaderReady",function(){
    sendVisitorHeartbeat({force:true});
  });

})();


/* =========================================================
   LOAD LIVE CHAT ON EVERY SHARED-HEADER PAGE
   ========================================================= */
(function ensureAnyBikeLiveChatLoaded(){
  if(window.__anybikeLiveChatStarted){
    return;
  }

  const existing=document.querySelector('script[src*="/live-chat.js"]');
  if(existing){
    return;
  }

  const script=document.createElement("script");
  script.src="/live-chat.js?v=8";
  script.async=true;
  script.dataset.anybikeLiveChat="1";
  document.head.appendChild(script);
})();

/* Market country-page shared layers */
(function loadMarketPageLayers(){
  if(!/^\/markets\//i.test(window.location.pathname)) return;

  function loadEngine(){
    if(document.querySelector('script[data-anybike-market-engine]')) return;
    const engine=document.createElement("script");
    engine.src="/market-page-engine.js?v=202610071455";
    engine.defer=true;
    engine.dataset.anybikeMarketEngine="1";
    engine.addEventListener("load",function(){
      setTimeout(function(){
        window.AnyBikeMarketStandardisation?.run?.();
      },0);
    },{once:true});
    document.head.appendChild(engine);
  }

  const existingCorrections=document.querySelector('script[data-anybike-market-corrections]');
  if(existingCorrections){
    if(existingCorrections.dataset.anybikeLoaded==="1") loadEngine();
    else existingCorrections.addEventListener("load",loadEngine,{once:true});
    return;
  }

  const corrections=document.createElement("script");
  corrections.src="/market-page-corrections.js?v=202610071455";
  corrections.defer=true;
  corrections.dataset.anybikeMarketCorrections="1";
  corrections.addEventListener("load",function(){
    corrections.dataset.anybikeLoaded="1";
    loadEngine();
  },{once:true});
  corrections.addEventListener("error",loadEngine,{once:true});
  document.head.appendChild(corrections);
})();


/* =========================================================
   ANYBIKE MONEY INPUT DISPLAY — CUSTOMER/PUBLIC
   Base values remain GBP internally. Display follows the selected
   customer currency and converts back to GBP for existing page logic.
   ========================================================= */
(function anyBikeStartCurrencyAwareMoneyInputs(){
  if(window.__anybikeCurrencyMoneyInputsStarted) return;
  window.__anybikeCurrencyMoneyInputsStarted=true;

  const nativeValue=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
  if(!nativeValue || !nativeValue.get || !nativeValue.set) return;

  function currencyCode(){
    return String(window.anybikeCurrency || localStorage.getItem("anybikeCurrency") || "GBP").toUpperCase();
  }
  function rate(){
    const code=currencyCode();
    return Number(window.AnyBikeCurrency?.rates?.[code] || 1) || 1;
  }
  function clean(value){
    const raw=String(value??"").replace(/[^0-9.-]/g,"");
    if(raw===""||raw==="-"||raw===".") return "";
    const n=Number(raw);
    return Number.isFinite(n)?String(n):"";
  }
  function formatFromGbp(gbp){
    const raw=clean(gbp);
    if(raw==="") return "";
    const code=currencyCode();
    const converted=Number(raw)*rate();
    return converted.toLocaleString(code==="USD"?"en-US":"en-GB",{
      style:"currency",
      currency:code,
      currencyDisplay:"symbol",
      minimumFractionDigits:2,
      maximumFractionDigits:2
    });
  }
  function displayNumberFromGbp(gbp){
    const raw=clean(gbp);
    if(raw==="") return "";
    return (Number(raw)*rate()).toFixed(2);
  }
  function gbpFromDisplay(value){
    const raw=clean(value);
    if(raw==="") return "";
    return String(Number(raw)/rate());
  }
  function moneyContext(input){
    const label=input.closest("label");
    const nearby=[
      input.id,input.name,input.placeholder,input.getAttribute("aria-label"),
      label?.textContent||"",input.previousElementSibling?.textContent||""
    ].filter(Boolean).join(" ").toLowerCase();
    if(input.dataset.currency==="GBP"||input.dataset.currency==="gbp") return true;
    if(/[£]|\bgbp\b/.test(nearby)) return true;
    const money=/(price|\bfee\b|cost|amount|deposit|balance|charge|payment|customer total|quote|offer value|sale value)/.test(nearby);
    const nonMoney=/(percent|percentage|mileage|miles|max miles|year|quantity|qty|engine|cc|phone|mobile|postcode)/.test(nearby);
    return money&&!nonMoney;
  }
  function enhance(input){
    if(!(input instanceof HTMLInputElement)) return;
    if(input.dataset.anybikeCurrencyEnhanced==="1"||input.dataset.anybikeNoCurrency==="1") return;
    if(["hidden","checkbox","radio","date","datetime-local"].includes(input.type)) return;
    if(!moneyContext(input)) return;

    const initial=nativeValue.get.call(input);
    input.dataset.anybikeCurrencyEnhanced="1";
    input.dataset.anybikeBaseGbp=clean(initial);
    if(input.type==="number") input.type="text";
    input.inputMode="decimal";

    Object.defineProperty(input,"value",{
      configurable:true,
      get:function(){ return this.dataset.anybikeBaseGbp ?? ""; },
      set:function(value){
        this.dataset.anybikeBaseGbp=clean(value);
        nativeValue.set.call(this,document.activeElement===this?displayNumberFromGbp(this.dataset.anybikeBaseGbp):formatFromGbp(this.dataset.anybikeBaseGbp));
      }
    });

    nativeValue.set.call(input,formatFromGbp(input.dataset.anybikeBaseGbp));

    input.addEventListener("focus",function(){
      nativeValue.set.call(this,displayNumberFromGbp(this.dataset.anybikeBaseGbp));
      try{this.select();}catch(_error){}
    });
    input.addEventListener("input",function(){
      this.dataset.anybikeBaseGbp=gbpFromDisplay(nativeValue.get.call(this));
    });
    input.addEventListener("blur",function(){
      this.dataset.anybikeBaseGbp=gbpFromDisplay(nativeValue.get.call(this));
      nativeValue.set.call(this,formatFromGbp(this.dataset.anybikeBaseGbp));
    });
  }
  function scan(root){
    if(root instanceof HTMLInputElement) enhance(root);
    root?.querySelectorAll?.("input").forEach(enhance);
  }
  function refresh(){
    document.querySelectorAll('input[data-anybike-currency-enhanced="1"]').forEach(function(input){
      if(document.activeElement!==input){
        nativeValue.set.call(input,formatFromGbp(input.dataset.anybikeBaseGbp));
      }
    });
  }

  const start=function(){
    scan(document);
    new MutationObserver(function(records){
      records.forEach(r=>r.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node);}));
    }).observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("anybikeCurrencyChanged",refresh);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();


/* Account identity for testing multiple customer/dealer browsers. Display only, not authorisation. */
async function anybikeShowPublicSignedInIdentity(){
  const header=document.getElementById("publicHeader");
  const client=(typeof sb!=="undefined"&&sb?.auth)?sb:window.sb;
  if(!header || !client?.auth)return;
  const session=await client.auth.getSession();
  const user=session?.data?.session?.user;
  let strip=document.getElementById("anybikePublicSignedInIdentity");
  // Show a discreet account identifier to every signed-in customer, never to guests.
  if(!user){strip?.remove();return;}
  if(!strip){strip=document.createElement("div");strip.id="anybikePublicSignedInIdentity";strip.style.cssText="background:#101010;color:#ddd;border-bottom:1px solid #303030;padding:5px 18px;text-align:right;font:600 11px/1.4 Arial,sans-serif;overflow-wrap:anywhere";header.insertAdjacentElement("afterend",strip);}
  if(!user){strip.textContent="SIGNED IN · Guest / Not signed in";return;}
  const response=await client.from("customer_profiles").select("customer_type,full_name").eq("id",user.id).maybeSingle();
  const profile=response?.data||{};
  const roles={uk_private:"UK PRIVATE",uk_private_customer:"UK PRIVATE",uk_dealer:"UK DEALER",uk_distributor:"UK DISTRIBUTOR",international_dealer:"INTERNATIONAL DEALER",european_dealer:"EUROPEAN DEALER",international_motorcycle_dealer:"INTERNATIONAL DEALER"};
  let key=String(profile.customer_type||"").toLowerCase();
  let role=roles[key]||key.replaceAll("_"," ").toUpperCase()||"CUSTOMER";
  if(!profile.customer_type)role="CUSTOMER · ROLE NOT SET";
  // An admin does not need a customer type: use the authenticated admin role.
  try{const adminResult=await client.rpc("anybike_is_admin");if(!adminResult.error&&adminResult.data===true)role="ADMIN";}catch(_){}
  strip.style.borderBottomColor="#303030";
  strip.textContent="SIGNED IN · "+role+" · "+(profile.full_name||"")+" · "+(user.email||"Email unavailable");
  const refresh=()=>anybikeShowPublicSignedInIdentity().catch(()=>{});
  if(!window.__anybikeIdentityWatcher){window.__anybikeIdentityWatcher=true;client.auth.onAuthStateChange(()=>{setTimeout(refresh,0);});}
}


/* PROTECTED MODEL GALLERY: preserve real-stock priority, model-specific year cards, branding, and quick enquiry. Before edits run: node scripts/check-shared-model-guide-routes.mjs. Never replace with generic placeholders or remove cards during sourcing-link changes. */
/* International model stock and guest enquiries: model guides only. */
(function(){
 function start(){
  if(document.getElementById('internationalGuestRequest')||document.querySelector('.anybike-model-guest-form'))return;
  const harley=/^\/harley-davidson-[a-z0-9-]+\.html$/i.test(location.pathname);
  const standard=!!document.getElementById('generationPanel')&&!!document.getElementById('nextAction');
  if(!harley&&!standard)return;
  const heading=(document.getElementById('heading')?.textContent||document.querySelector('main h1')?.textContent||'').trim();
  const guided=location.pathname==='/motorcycle-model-guide.html';
  const params=new URLSearchParams(location.search);
  const make=guided?(params.get('make')||'').trim():harley?'Harley-Davidson':heading.split(' ')[0];
  const model=guided?(params.get('model')||'').trim():harley?heading.replace(/^Harley-Davidson\s*/i,'').trim():heading.slice(make.length).trim();
  if(!make||!model)return;
  const safe=val=>String(val||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const section=document.createElement('section');
  section.className='end-action';section.style.cssText='background:#171717;color:white;border-top:3px solid '+(harley?'#ff6600':'#ed1c24')+';border-radius:10px;margin:20px 0;padding:20px';
  section.innerHTML='<h2>'+make+' '+model+' motorcycles available internationally</h2><p>AnyBike is updating its model pages. '+make+' '+model+' motorcycles are available in the UK but may not be shown here yet. There are thousands of motorcycles available across the UK, and we only display a selection on our website. Looking for a '+make+' '+model+'? Send us an enquiry with your preferred year and specification, and we can search our UK supplier network.</p><div class="anybike-model-stock-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px"></div><h2>Enquire about this model</h2><form class="anybike-model-guest-form" style="display:grid;gap:9px;max-width:550px"><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px"><label>Full name<input name="name" required minlength="2"></label><label>Email<input name="email" type="email" required></label><label>Country<input name="country" required minlength="2"></label><label>Phone / WhatsApp<input name="phone"></label><label>Request type<select name="kind"><option>Motorcycle Enquiry</option><option>Purchase Request</option></select></label><label>Message<textarea name="message" required minlength="5" rows="3"></textarea></label><button type="submit" style="background:#ed1c24;color:white;border:0;padding:12px;font-weight:bold;cursor:pointer">Send enquiry →</button><p role="status"></p></form>';
  if(harley){const f=section.querySelector('form');f.style.cssText='display:grid;gap:12px;width:100%;max-width:820px;margin:22px auto 0;color:#fff';f.querySelector('button').style.background='#ff6600';}
  if(!(harley&&model.toLowerCase()==='fat boy')){
   const notice=section.querySelector('p');
   const bikeName=make+' '+model;
   notice.textContent='The '+bikeName+' motorcycles displayed on AnyBike are only a selection of those available from UK suppliers. Other '+bikeName+' motorcycles may be available even if no listings are currently shown here. Thousands of motorcycles are available across the UK across all makes and models. Tell us your preferred year, specification, mileage and budget, and we can search our UK supplier network for more '+bikeName+' options.';
   notice.style.cssText='color:'+(harley?'#ff6600':'#ed1c24')+';font-weight:600;line-height:1.7';
  }
  if(harley&&model.toLowerCase()==='fat boy'){
   const notice=section.querySelector('p');
   notice.textContent='The Harley-Davidson Fat Boy motorcycles displayed on AnyBike are only a selection of those available through UK suppliers. Other Fat Boys may be available even if none are currently shown here. The Fat Boy is one of Harley-Davidson’s distinctive cruiser models, with different generations, engines and specifications available across the UK market. Whether you are looking for an earlier Fat Boy, a Fat Boy 114 or a later Milwaukee-Eight model, tell us your preferred year, specification, mileage and budget. Thousands of motorcycles are available across the UK, and AnyBike displays only a selection online. Send us an enquiry and we can search our UK supplier network for a suitable Fat Boy.';
   notice.style.cssText='color:#ff6600;font-weight:600;line-height:1.7';
  }
  section.style.display='none';
  section.querySelectorAll('input:not([name="website"]),select,textarea').forEach(el=>{el.style.cssText='display:block;width:100%;box-sizing:border-box;background:#292929;color:white;border:1px solid #777;border-radius:6px;padding:11px;margin-top:5px'});
  section.querySelectorAll('label').forEach(el=>el.style.cssText='display:block;font-weight:600;color:white');
  const insertion=harley?(document.querySelector('main .image-attribution')||document.querySelector('main .harley-related-pill-nav')):document.getElementById('nextAction');
  if(!insertion)return;
  if(harley){
   insertion.after(section);
   const form=section.querySelector('form');
   const formPanel=document.createElement('section');formPanel.className='end-action';
   formPanel.style.cssText='background:#171717;color:#fff;border:1px solid #363636;border-top:3px solid #ff6600;border-radius:12px;margin:18px 0;padding:22px';
   const title=document.createElement('h2');title.textContent='Enquire about a '+make+' '+model;
   const intro=document.createElement('p');intro.textContent='International buyers can send an enquiry or purchase request without creating an account.';
   formPanel.id='international-model-enquiry';formPanel.append(title,intro,form);formPanel.style.display='none';section.after(formPanel);
   const source=document.createElement('section');source.className='end-action';
   source.style.cssText='margin:18px 0;padding:22px;background:#171717;color:#fff;border:1px solid #363636;border-radius:12px';
   const h=document.createElement('h2');h.textContent='Motorcycle Sourcing Request — '+make+' '+model;
   const p=document.createElement('p');p.textContent='For dealers buying one or more motorcycles: specify acceptable model years, quantities, budgets and shipping preferences.';
   const a=document.createElement('a');a.className='button';a.href='/bulk-buying-request.html?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(model);a.textContent='Submit a Motorcycle Sourcing Request →';
   source.append(h,p,a);source.style.display='none';formPanel.after(source);

   const leftover=section.querySelector('h2:nth-of-type(2)');if(leftover)leftover.remove();
  }else{
   insertion.before(section);
   const form=section.querySelector('form');
   const formPanel=document.createElement('section');formPanel.className='end-action';
   formPanel.style.cssText='background:#171717;color:#fff;border:1px solid #363636;border-top:3px solid #ed1c24;border-radius:12px;margin:18px 0;padding:22px';
   const title=document.createElement('h2');title.textContent='Enquire about a '+make+' '+model;
   const intro=document.createElement('p');intro.textContent='International buyers can send an enquiry or purchase request without creating an account.';
   form.style.cssText='display:grid;gap:12px;width:100%;max-width:820px;margin:22px auto 0;color:#fff';
   if(model.toLowerCase()==='fat boy')formPanel.id='international-fat-boy-enquiry';
   formPanel.append(title,intro,form);section.after(formPanel);
   const leftover=section.querySelector('h2:nth-of-type(2)');if(leftover)leftover.remove();
  }
  const attached=section.parentElement?[section,section.nextElementSibling,harley?section.nextElementSibling?.nextElementSibling:null].filter(Boolean):[];
  const reveal=()=>attached.forEach(el=>el.style.removeProperty('display'));
  const hide=()=>attached.forEach(el=>el.remove());
  const endpoint='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/';
  const client=window.supabase?.createClient?.('https://tuehtnezhdnkqbbhttgp.supabase.co','sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK');
  async function token(){return (await client?.auth.getSession())?.data?.session?.access_token}
  const form=document.querySelector('main .anybike-model-guest-form');
  form.addEventListener('submit',async event=>{
   event.preventDefault();const btn=form.querySelector('button'),status=form.querySelector('[role="status"]');btn.disabled=true;status.textContent='Sending…';
   try{
    const values=Object.fromEntries(new FormData(form).entries()),jwt=await token();
    const res=await fetch(endpoint+'international-guest-enquiry',{method:'POST',headers:{'Content-Type':'application/json',...(jwt?{'Authorization':'Bearer '+jwt}:{})},body:JSON.stringify({...values,make,model,page:location.href})});
    const result=await res.json();if(!res.ok||!result.ok)throw Error(result.error||'Unable to send');
    status.textContent='Enquiry received · Reference '+result.reference+'. AnyBike will contact you.';form.reset();
   }catch(error){status.textContent=error.message||'Unable to send your enquiry';}finally{btn.disabled=false;}
  });
  async function showUKModelGallery(){
   if(make!=='BMW'||document.getElementById('ukModelHistoryShared'))return;
   const seller=document.querySelector('main section[aria-label="UK motorcycle selling"]');
   if(!seller)return;
   const panel=document.createElement('section');panel.id='ukModelHistoryShared';panel.className='end-action';
   panel.style.cssText='background:#171717;color:#fff;border:1px solid #444;border-left:3px solid #ed1c24;border-radius:10px;margin:20px 0;padding:22px';
   const title=document.createElement('h2');title.textContent=make+' '+model+' — model years and specifications';
   const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px';
   panel.append(title,grid);seller.before(panel);
   let notes=[];
   try{
    const resp=await fetch('/data/motorcycle-model-guides.json',{cache:'default'});
    if(resp.ok){
     const data=await resp.json();
     const guide=Object.values(data.models||{}).find(g=>safe(g.make)===safe(make)&&safe(g.model)===safe(model));
     notes=(guide?.production?.generations||[]).filter(g=>g.description).map(g=>({title:g.model_year||g.label,body:g.description}));
     if(notes.length<3)notes.push(...(guide?.sections||[]).filter(x=>Array.isArray(x)&&x[1]).map(x=>({title:x[0],body:x[1]})));
    }
   }catch(e){console.warn('UK model history unavailable',e)}
   if(!notes.length){
    notes=[...document.querySelectorAll('main #body .card')].map(el=>({title:el.querySelector('h2')?.textContent?.trim(),body:el.querySelector('p')?.textContent?.trim()})).filter(n=>n.title&&n.body).slice(0,8);
   }
   if(!notes.length){panel.remove();return;}
   notes.slice(0,16).forEach(n=>{
    const card=document.createElement('article');card.style.cssText='background:#242424;border:1px solid #555;border-radius:8px;padding:12px;text-align:center;min-height:210px;display:flex;flex-direction:column;justify-content:center;gap:8px';
    const logo=document.createElement('img');logo.src='/anybike-logo-new.jpg';logo.alt='AnyBike';logo.loading='lazy';logo.style.cssText='display:block;width:min(170px,85%);height:90px;object-fit:contain;margin:0 auto';
    const h=document.createElement('strong');h.textContent=n.title;const p=document.createElement('span');p.textContent=n.body;p.style.cssText='color:#ddd;font-size:14px;line-height:1.5';
    card.append(logo,h,p);grid.append(card);
   });
   document.getElementById('nextAction')?.setAttribute('hidden','');
   document.querySelectorAll('main a[href*="bulk-buying-request.html"]').forEach(a=>{a.hidden=true});
  }
  (async()=>{try{
   const jwt=await token();const res=await fetch(endpoint+'international-public-stock',{cache:'no-store',headers:jwt?{'Authorization':'Bearer '+jwt}:{}});
   if(!res.ok){hide();if(res.status===403)await showUKModelGallery();return;}
   const data=await res.json(),grid=section.querySelector('.anybike-model-stock-grid');
   const matches=(data.items||[]).filter(x=>safe(x.make)===safe(make)&&safe(x.model).includes(safe(model))).slice(0,6);
   if(matches.length){matches.forEach(x=>{
    const a=document.createElement('a');a.href='/international-vq-motorcycle.html?id='+encodeURIComponent(x.item_id);a.style.cssText='color:white;background:#242424;border:1px solid #555;border-radius:8px;padding:12px;text-decoration:none';
    if(x.image_url){const im=document.createElement('img');im.src=x.image_url;im.alt=[x.make,x.model].join(' ');im.loading='lazy';im.style.cssText='width:100%;height:145px;object-fit:contain';a.append(im);}
    const label=document.createElement('div');label.textContent=[x.make,x.model,x.year].filter(Boolean).join(' ');a.append(label);
    const price=document.createElement('strong');price.textContent=Number(x.price)>0?Number(x.price).toLocaleString('en-GB',{style:'currency',currency:'GBP'}):'Price on request';a.append(price);
    const view=document.createElement('div');view.textContent='View motorcycle →';a.append(view);grid.append(a);
   });}
   let cardNotes=[];
   {
    try{
     const response=await fetch('/data/motorcycle-model-guides.json',{cache:'default'});
     if(response.ok){
      const all=await response.json();
      const found=Object.values(all.models||{}).find(g=>safe(g.make)===safe(make)&&safe(g.model)===safe(model));
      if(found){
       const generations=(found.production?.generations||[]).filter(g=>g.description);
       cardNotes=generations.map(g=>({title:g.model_year||g.label,body:g.description}));
       if(!cardNotes.length)cardNotes=(found.sections||[]).filter(x=>Array.isArray(x)&&x[1]).map(x=>({title:x[0],body:x[1]}));
      }
     }
    }catch(e){/* Non-critical guidance remains optional. */}
    if(safe(make)==='harleydavidson'&&safe(model)==='fatboy'){
     cardNotes=[
      {title:'1990 — Original FLSTF',body:'The original Fat Boy arrived with Evolution power, Softail construction and distinctive solid-look wheels.'},
      {title:'1991–1999 — Evolution era',body:'Classic Evolution-powered Fat Boys retained the early Softail character. Check originality, service history and modifications.'},
      {title:'2000–2006 — Twin Cam',body:'The Twin Cam era brought a different engine family from the early Evolution models. Confirm the exact factory specification.'},
      {title:'2007–2017 — Later Twin Cam',body:'Later Twin Cam Fat Boys evolved through engine and equipment updates. Compare the model year and original components.'},
      {title:'Fat Boy Lo',body:'The Fat Boy Lo offered a lower, darker-styled take on the cruiser. Check the year and actual factory equipment.'},
      {title:'2018 — Softail redesign',body:'A redesigned Softail chassis introduced a hidden rear monoshock and Milwaukee-Eight power.'},
      {title:'2018 — 107 and 114',body:'The redesigned Fat Boy range included different Milwaukee-Eight engine versions. Verify whether the bike is a 107 or 114.'},
      {title:'2021–2024 — Fat Boy 114',body:'The 114 became a prominent modern Fat Boy version. Confirm model-year equipment, mileage and accessories.'},
      {title:'Anniversary and special editions',body:'Special finishes and limited editions need year-specific checks of factory trim, documentation and originality.'},
      {title:'2025 onward — Later Fat Boy',body:'More recent Fat Boy motorcycles have updated specifications. Confirm the exact engine and market specification before buying.'},
      {title:'Wheels and styling',body:'Solid-look wheels are a signature Fat Boy design feature; check condition and any aftermarket replacements.'},
      {title:'Buying a used Fat Boy',body:'Review VIN, ownership, finance status, service history, engine configuration and any custom work before purchase.'}
     ];
    }
    if(safe(make)==='honda'&&safe(model)==='africatwincrf1100l'){
     cardNotes=[
      {title:'2020 — CRF1100L introduction',body:'The 1,084 cc parallel-twin Africa Twin replaced the earlier CRF1000L generation, with updated electronics and a lighter platform.'},
      {title:'2020 — Standard Africa Twin',body:'The standard CRF1100L emphasises adventure riding. Check the specific year, suspension, wheels and fitted accessories.'},
      {title:'2020 — Adventure Sports',body:'The CRF1100L Adventure Sports version is designed with longer-distance touring equipment. Tank size and features vary by model year.'},
      {title:'Manual and DCT versions',body:'The CRF1100L has been offered with a conventional manual gearbox or Honda’s Dual Clutch Transmission. Confirm which is fitted.'},
      {title:'2022 — Equipment updates',body:'Later CRF1100L versions received changes to equipment and transmission calibration. Verify the exact year and market specification.'},
      {title:'2024 — Adventure Sports changes',body:'The updated Adventure Sports adopted a 19-inch front wheel and revised road-touring focus; check the model year carefully.'},
      {title:'Riding modes and electronics',body:'Electronic rider aids and riding modes differ by version. Check traction control, ABS and display functionality on the actual bike.'},
      {title:'Used CRF1100L checks',body:'Confirm service history, mileage, luggage and accessories, suspension condition and any off-road damage before purchasing.'}
     ];
    }
    if(safe(make)==='honda'&&safe(model)==='africatwin'){
     cardNotes=[
      {title:'1988 — XRV650',body:'The original Africa Twin generation established the model’s rally-inspired adventure motorcycle identity.'},
      {title:'1990–2003 — XRV750',body:'The Africa Twin developed into the XRV750, with several updates across its production years.'},
      {title:'2016–2017 — CRF1000L',body:'Honda revived the Africa Twin with the CRF1000L parallel-twin adventure motorcycle.'},
      {title:'2018–2019 — CRF1000L',body:'Later CRF1000L model years included specification updates and an Adventure Sports version.'},
      {title:'2020 onward — CRF1100L',body:'The CRF1100L succeeded the CRF1000L with a larger engine and revised electronics.'},
      {title:'Adventure Sports',body:'The touring-focused Adventure Sports has year-dependent equipment; compare the exact model year and specification.'}
     ];
    }
   }
   if(!cardNotes.length&&harley){
    const sections=[...document.querySelectorAll('main .card')];
    cardNotes=sections.map(el=>{
     const h=el.querySelector('h2,h3');
     const p=el.querySelector('p');
     return h&&p?{title:h.textContent.trim(),body:p.textContent.trim()}:null;
    }).filter(x=>x&&x.body.length>35&&x.body.length<450&&!/interested|sourcing|photograph policy|uk owners|what to verify/i.test(x.title)).slice(0,12);
   }
   const emptyCardCount=cardNotes.length||(!matches.length?1:0);
   if(cardNotes.length){const heading=document.createElement('h3');heading.textContent=make+' '+model+' — model years and specifications';heading.style.cssText='grid-column:1/-1;margin:14px 0 0';grid.append(heading);}
   for(let i=0;i<emptyCardCount;i++){
    const card=document.createElement('div');card.style.cssText='background:#242424;border:1px solid #555;border-radius:8px;padding:12px;text-align:center;min-height:220px;display:flex;flex-direction:column;justify-content:center;gap:8px';
    const brand=document.createElement('img');brand.src='/anybike-logo-new.jpg';brand.alt='AnyBike';brand.loading='lazy';brand.style.cssText='display:block;width:min(170px,85%);height:100px;object-fit:contain;margin:0 auto;background:transparent;border:0;border-radius:0;padding:0';
    const name=document.createElement('strong');name.textContent=make+' '+model;
    const status=document.createElement('small');status.style.cssText='color:#ddd;line-height:1.5';const note=cardNotes[i];if(note){name.textContent=note.title||make+' '+model;status.textContent=note.body;}else{status.textContent='Additional '+make+' '+model+' motorcycles may be available — enquire with AnyBike';}
    card.append(brand,name,status);grid.append(card);
   }
   reveal();
  }catch(error){hide();}})();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
