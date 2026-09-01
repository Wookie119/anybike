if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded",loadPublicHeader,{once:true});
}else{
  loadPublicHeader();
}

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
    stock:"Available Stock",
    buy:"Buy a Motorcycle",
    sell:"Sell Your Motorcycle",
    export:"Export Services",
    connect:"AnyBike Connect",
    account:"My AnyBike",
    signIn:"Sign In",
    createAccount:"Create Free Account",
    dashboard:"Dashboard",
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
    sell:"Motorrad verkaufen",
    export:"Exportservice",
    connect:"AnyBike Kontakt",
    account:"Mein AnyBike",
    signIn:"Anmelden",
    createAccount:"Kostenloses Konto",
    dashboard:"Übersicht",
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
    sell:"Vendre votre moto",
    export:"Services d’exportation",
    connect:"Contacter AnyBike",
    account:"Mon AnyBike",
    signIn:"Se connecter",
    createAccount:"Créer un compte gratuit",
    dashboard:"Tableau de bord",
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
    sell:"Vender tu moto",
    export:"Servicios de exportación",
    connect:"Contactar con AnyBike",
    account:"Mi AnyBike",
    signIn:"Iniciar sesión",
    createAccount:"Crear cuenta gratuita",
    dashboard:"Panel",
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
    sell:"بيع دراجتك",
    export:"خدمات التصدير",
    connect:"تواصل مع AnyBike",
    account:"حسابي",
    signIn:"تسجيل الدخول",
    createAccount:"إنشاء حساب مجاني",
    dashboard:"لوحة التحكم",
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
    stock:"Stok Tersedia",
    buy:"Beli Sepeda Motor",
    sell:"Jual Sepeda Motor Anda",
    export:"Layanan Ekspor",
    connect:"Hubungi AnyBike",
    account:"AnyBike Saya",
    signIn:"Masuk",
    createAccount:"Buat Akun Gratis",
    dashboard:"Dasbor",
    profile:"Profil Saya",
    savedSearches:"Pencarian Tersimpan",
    watchlist:"Daftar Pantauan",
    recentlyViewed:"Terakhir Dilihat",
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
    stock:"Stok Tersedia",
    buy:"Beli Motosikal",
    sell:"Jual Motosikal Anda",
    export:"Perkhidmatan Eksport",
    connect:"Hubungi AnyBike",
    account:"AnyBike Saya",
    signIn:"Log Masuk",
    createAccount:"Buat Akaun Percuma",
    dashboard:"Papan Pemuka",
    profile:"Profil Saya",
    savedSearches:"Carian Tersimpan",
    watchlist:"Senarai Pantauan",
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
    stock:"现有库存",
    buy:"购买摩托车",
    sell:"出售您的摩托车",
    export:"出口服务",
    connect:"联系 AnyBike",
    account:"我的 AnyBike",
    signIn:"登录",
    createAccount:"免费注册",
    dashboard:"控制面板",
    profile:"我的资料",
    savedSearches:"已保存搜索",
    watchlist:"关注列表",
    recentlyViewed:"最近浏览",
    requests:"摩托车需求",
    logout:"退出登录",
    notifications:"通知",
    noNotifications:"暂无新通知。",
    close:"关闭"
  }
};

let anybikeHeaderUser = null;
let anybikeHeaderRefreshTimer = null;
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

  function openMobileMenu(event){
    event?.preventDefault();
    event?.stopPropagation();

    document.body.classList.add("mobile-menu-open");
    document.body.style.overflow = "hidden";

    if(mobileDrawer){
      mobileDrawer.classList.add("open");
      mobileDrawer.style.transform = "translateX(0)";
      mobileDrawer.style.visibility = "visible";
      mobileDrawer.style.pointerEvents = "auto";
    }

    if(mobileDrawerBackdrop){
      mobileDrawerBackdrop.classList.add("open");
      mobileDrawerBackdrop.style.opacity = "1";
      mobileDrawerBackdrop.style.visibility = "visible";
      mobileDrawerBackdrop.style.pointerEvents = "auto";
    }

    mobileMenuButton?.setAttribute("aria-expanded","true");
  }

  mobileMenuButton?.addEventListener("click",openMobileMenu);

  mobileMenuClose?.addEventListener("click",closeMobileMenu);
  mobileDrawerBackdrop?.addEventListener("click",closeMobileMenu);

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

  document
    .querySelectorAll(
      "#phMessagesV3, " +
      "#phMessages, " +
      "#loggedInMenu a[data-i18n='messages'], " +
      "#mobileLoggedInMenu a[data-i18n='messages']"
    )
    .forEach(function(link){
      link.setAttribute("href","/customer-messages.html");
    });

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

    await loadCustomerHeaderActivity(user);

    if(anybikeHeaderRefreshTimer){
      clearInterval(anybikeHeaderRefreshTimer);
    }

    anybikeHeaderRefreshTimer = setInterval(function(){
      loadCustomerHeaderActivity(user);
    },60000);

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
  updateHeaderTimes();

  if(anybikeHeaderClockTimer){
    clearInterval(anybikeHeaderClockTimer);
  }

  anybikeHeaderClockTimer = setInterval(updateHeaderTimes,30000);

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
  const mobileDrawer = document.getElementById("mobileDrawer");
  const mobileDrawerBackdrop = document.getElementById("mobileDrawerBackdrop");
  const mobileMenuButton = document.getElementById("mobileMenuButton");

  document.body.classList.remove("mobile-menu-open");
  mobileDrawer?.classList.remove("open");
  mobileDrawerBackdrop?.classList.remove("open");
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

  if(path.includes("contact-us") || path.includes("anybike-connect")){
    markActive("connect");
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

function normaliseCustomerNotificationLink(link){
  const raw=String(link || "").trim();

  if(!raw){
    return "/customer-messages.html";
  }

  try{
    const url=new URL(raw,window.location.origin);
    const path=String(url.pathname || "").toLowerCase();

    if(path.endsWith("/customer-dashboard.html")){
      const threadId=String(url.searchParams.get("thread") || "").trim();
      const isOldMessagesLink=
        url.hash.toLowerCase()==="#messages" ||
        Boolean(threadId);

      if(isOldMessagesLink){
        return threadId
          ? `/customer-messages.html?thread=${encodeURIComponent(threadId)}`
          : "/customer-messages.html";
      }
    }
  }catch(error){
    console.warn("Could not normalise customer notification link",error);
  }

  return raw;
}

async function loadCustomerHeaderActivity(user){
  if(typeof sb === "undefined" || !user){
    setMessageCount(0);
    setNotificationCount(0);
    renderNotificationList([]);
    return;
  }

  try{
    const {data,error} = await sb
      .from("customer_notifications")
      .select("id,title,message,type,link,is_read,created_at")
      .eq("customer_id",user.id)
      .eq("is_read",false)
      .order("created_at",{ascending:false});

    if(error){
      throw error;
    }

    const notifications = (data || []).map(function(notification){
      const type = String(notification.type || "").toLowerCase();

      return {
        id:notification.id,
        title:notification.title || "Notification",
        message:notification.message || "",
        link:normaliseCustomerNotificationLink(notification.link),
        icon:type.includes("message") ? "💬" : "🔔",
        date:notification.created_at
      };
    });

    setMessageCount(notifications.length);
    setNotificationCount(notifications.length);
    renderNotificationList(notifications);

    window.dispatchEvent(new CustomEvent("anybikeCustomerUnreadChanged",{
      detail:{
        count:notifications.length,
        items:notifications
      }
    }));

  }catch(error){
    console.error("Notification load failed",error);

    setMessageCount(0);
    setNotificationCount(0);
    renderNotificationList([]);
  }
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
    const link = normaliseCustomerNotificationLink(item.link);

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
      const link = normaliseCustomerNotificationLink(
        item.getAttribute("data-notification-link")
      );

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
});

document.addEventListener("visibilitychange",function(){
  if(document.visibilityState === "visible"){
    verifyCustomerSession();
  }
});

/* =========================================================
   ANYBIKE LIVE VISITOR TRACKING
   Added 01 September 2026
   Sends anonymous live visitor/session activity to the
   Supabase track-visitor Edge Function.
   ========================================================= */

(function initialiseAnyBikeVisitorTracking(){
  const TRACK_VISITOR_URL =
    "https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/track-visitor";

  const HEARTBEAT_MS = 30000;

  let heartbeatTimer = null;
  let lastSendStartedAt = 0;

  function createUuid(){
    if(window.crypto?.randomUUID){
      return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function(char){
        const random = Math.random() * 16 | 0;
        const value = char === "x" ? random : (random & 0x3 | 0x8);
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
    const userAgent = String(navigator.userAgent || "");

    if(/tablet|ipad|playbook|silk/i.test(userAgent)){
      return "Tablet";
    }

    if(
      /mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i
        .test(userAgent)
    ){
      return "Mobile";
    }

    return "Desktop";
  }

  function detectBrowser(){
    const userAgent = String(navigator.userAgent || "");

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
      if(anybikeHeaderUser?.id){
        return anybikeHeaderUser.id;
      }
    }catch(error){
      // Header may not have finished loading yet.
    }

    return null;
  }

  async function sendVisitorHeartbeat(){
    const now = Date.now();

    // Prevent accidental duplicate sends firing at almost the same moment.
    if(now - lastSendStartedAt < 1500){
      return;
    }

    lastSendStartedAt = now;

    const payload = {
      visitor_id:getOrCreateVisitorId(),
      session_id:getOrCreateSessionId(),
      user_id:getLoggedInUserId(),
      current_path:
        window.location.pathname +
        window.location.search,
      page_title:document.title || "",
      referrer:document.referrer || "",
      language:navigator.language || "",
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      device_type:detectDeviceType(),
      browser:detectBrowser()
    };

    try{
      const response = await fetch(TRACK_VISITOR_URL,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(payload),
        keepalive:true
      });

      if(!response.ok){
        const errorText = await response.text().catch(() => "");
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
    sendVisitorHeartbeat();

    if(heartbeatTimer){
      clearInterval(heartbeatTimer);
    }

    heartbeatTimer = setInterval(function(){
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
      sendVisitorHeartbeat();
    }
  });

  window.addEventListener("focus",function(){
    sendVisitorHeartbeat();
  });

  // When the shared AnyBike header finishes resolving the customer
  // session, send again so a logged-in visitor can be linked to user_id.
  window.addEventListener("anybikePublicHeaderReady",function(){
    sendVisitorHeartbeat();
  });
})();

