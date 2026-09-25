
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
    await setupPublicHeader();

  }catch(error){
    console.error("Public header could not be loaded",error);
  }
}


async function addMyDealershipMenuIfEligible(user){

  if(!user || typeof sb === "undefined"){
    return;
  }

  try{

    const {
      data,
      error
    } =
      await sb.rpc(
        "dealer_get_my_dealership"
      );

    if(error){
      return;
    }

    const dealership =
      Array.isArray(data)
        ? data[0]
        : data;

    if(!dealership){
      return;
    }

    const desktopMenu =
      document.getElementById(
        "loggedInMenu"
      );

    const mobileMenu =
      document.getElementById(
        "mobileLoggedInMenu"
      );

    const linkHtml =
      '<a href="my-dealership-stock.html" data-dealer-menu-link="true" data-i18n="dealership">My Dealership</a>';

    if(
      desktopMenu &&
      !desktopMenu.querySelector(
        '[data-dealer-menu-link="true"]'
      )
    ){
      desktopMenu.insertAdjacentHTML(
        "afterbegin",
        linkHtml
      );
    }

    if(
      mobileMenu &&
      !mobileMenu.querySelector(
        '[data-dealer-menu-link="true"]'
      )
    ){
      mobileMenu.insertAdjacentHTML(
        "afterbegin",
        linkHtml
      );
    }

  }catch(error){

    console.warn(
      "Dealer menu check unavailable",
      error
    );
  }
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
    const unreadMessageCount = await getHeaderUnreadMessageThreadCount(user);
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

    const notifications = (data || [])
      .filter(function(notification){
        const type = String(notification.type || "").toLowerCase();
        return !type.includes("message");
      })
      .map(function(notification){
        return {
          id:notification.id,
          title:notification.title || "Notification",
          message:notification.message || "",
          link:notification.link || "/customer-messages.html",
          icon:"🔔",
          date:notification.created_at
        };
      });

    /*
      CUSTOMER BELL
      -------------
      The bell represents all current unread customer activity.
      Message conversations are counted from the real conversation state,
      while non-message alerts continue to come from customer_notifications.
      This does not alter message delivery, realtime, or read-state storage.
    */
    const bellItems = notifications.slice();

    if(unreadMessageCount > 0){
      bellItems.unshift({
        id:"",
        title:unreadMessageCount === 1
          ? "1 unread message from AnyBike"
          : unreadMessageCount + " unread messages from AnyBike",
        message:"Open My Messages to read the latest conversation.",
        link:"/customer-messages.html",
        icon:"💬",
        date:new Date().toISOString()
      });
    }

    const bellCount = unreadMessageCount + notifications.length;

    setNotificationCount(bellCount);
    renderNotificationList(bellItems);

    window.dispatchEvent(new CustomEvent("anybikeCustomerUnreadChanged",{
      detail:{
        count:bellCount,
        messageCount:unreadMessageCount,
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
      }
    });

    return unreadCount;

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
    const link = item.link || "/customer-messages.html";

    return `
      <a
        href="${escapeHtml(link)}"
        class="notification-item unread"
        data-notification-id="${escapeHtml(item.id)}"
        data-notification-link="${escapeHtml(link)}"
      >
        <span class="notification-icon">${escapeHtml(item.icon || "🔔")}</span>

        <span class="notification-copy">
          <strong>${escapeHtml(item.title || translations.notifications)}</strong>
          <small>${escapeHtml(item.message || "")}</small>
        </span>
      </a>
    `;
  }).join("");

  list.querySelectorAll("[data-notification-id]").forEach(function(item){
    item.addEventListener("click",async function(event){
      event.preventDefault();

      const notificationId = item.getAttribute("data-notification-id");
      const link =
        item.getAttribute("data-notification-link") ||
        "/customer-messages.html";

      if(notificationId && anybikeHeaderUser){
        try{
          const {error} = await sb
            .from("customer_notifications")
            .update({is_read:true})
            .eq("id",notificationId)
            .eq("customer_id",anybikeHeaderUser.id);

          if(error){
            throw error;
          }
        }catch(error){
          console.warn("Notification could not be marked read",error);
        }
      }

      window.location.href = link;
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

      element.textContent = (raw * rate).toLocaleString("en-GB",{
        style:"currency",
        currency:currency,
        maximumFractionDigits:0
      });
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

  return "/customer-register.html?return=" +
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
    engine.src="/market-page-engine.js?v=5";
    engine.defer=true;
    engine.dataset.anybikeMarketEngine="1";
    document.head.appendChild(engine);
  }

  const existingCorrections=document.querySelector('script[data-anybike-market-corrections]');
  if(existingCorrections){
    if(existingCorrections.dataset.anybikeLoaded==="1") loadEngine();
    else existingCorrections.addEventListener("load",loadEngine,{once:true});
    return;
  }

  const corrections=document.createElement("script");
  corrections.src="/market-page-corrections.js?v=3";
  corrections.defer=true;
  corrections.dataset.anybikeMarketCorrections="1";
  corrections.addEventListener("load",function(){
    corrections.dataset.anybikeLoaded="1";
    loadEngine();
  },{once:true});
  corrections.addEventListener("error",loadEngine,{once:true});
  document.head.appendChild(corrections);
})();
