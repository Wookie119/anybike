/*
AnyBike
File: public-header.js
Version: 2026.07.13-5
Date: 13 July 2026

Changes
--------
✓ Preserves the shared public header, account menu, language and currency
✓ Fixes Messages counting every historical AnyBike reply
✓ Counts unread conversations from the latest sender only
✓ Includes single-bike enquiry conversations
✓ Includes My AnyBike and Global Buyer Message Centre threads
✓ Customer replies clear the relevant unread count after refresh
✓ Uses the same unread total for Messages and the notification bell
✓ Replaces stale customer_notifications counts in the header
✓ Refreshes customer message counts every 60 seconds
*/

document.addEventListener("DOMContentLoaded", loadPublicHeader);

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
  }
};

let anybikeHeaderUser = null;
let anybikeHeaderRefreshTimer = null;

async function loadPublicHeader(){
  const holder = document.getElementById("publicHeader");

  if(!holder){
    return;
  }

  try{
    const headerRes = await fetch("/public-header.html", {
      cache:"no-store"
    });

    if(!headerRes.ok){
      throw new Error("Header request failed: " + headerRes.status);
    }

    holder.innerHTML = await headerRes.text();
    await setupPublicHeader();
  }catch(error){
    console.error("Public header could not be loaded", error);
  }
}

async function setupPublicHeader(){
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const mobileMenuClose = document.getElementById("mobileMenuClose");
  const mobileDrawerBackdrop = document.getElementById("mobileDrawerBackdrop");
  const publicAccount = document.querySelector(".public-account");
  const accountButton = document.getElementById("phAccountButton");
  const notificationButton = document.getElementById("phNotifications");
  const notificationPopover = document.getElementById("notificationPopover");
  const loggedOutMenu = document.getElementById("loggedOutMenu");
  const loggedInMenu = document.getElementById("loggedInMenu");
  const mobileLoggedOutMenu = document.getElementById("mobileLoggedOutMenu");
  const mobileLoggedInMenu = document.getElementById("mobileLoggedInMenu");
  const logoutLink = document.getElementById("phLogout");
  const mobileLogoutLink = document.getElementById("phMobileLogout");
  const languageSelect = document.getElementById("phLanguage");
  const currencySelect = document.getElementById("phCurrency");

  mobileMenuButton?.addEventListener("click", function(){
    document.body.classList.add("mobile-menu-open");
  });

  mobileMenuClose?.addEventListener("click", closeMobileMenu);
  mobileDrawerBackdrop?.addEventListener("click", closeMobileMenu);

  accountButton?.addEventListener("click", function(event){
    event.preventDefault();
    event.stopPropagation();

    publicAccount?.classList.toggle("menu-open");
    notificationPopover?.classList.remove("open");
  });

  notificationButton?.addEventListener("click", function(event){
    event.preventDefault();
    event.stopPropagation();

    notificationPopover?.classList.toggle("open");
    publicAccount?.classList.remove("menu-open");
  });

  document.addEventListener("click", function(event){
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

  let savedLanguage = normaliseLanguage(
    localStorage.getItem("anybikeLanguage") || "en"
  );

  let savedCurrency = normaliseCurrency(
    localStorage.getItem("anybikeCurrency") || "GBP"
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
          localStorage.setItem("anybikeLanguage",savedLanguage);
        }

        if(profile?.preferred_currency){
          savedCurrency = normaliseCurrency(profile.preferred_currency);
          localStorage.setItem("anybikeCurrency",savedCurrency);
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

      localStorage.setItem("anybikeLanguage",language);
      saveHeaderPreference("preferred_language",language);
      applyHeaderLanguage(language);
    });
  }

  if(currencySelect){
    currencySelect.value = savedCurrency;

    currencySelect.addEventListener("change",function(){
      const currency = normaliseCurrency(currencySelect.value);

      localStorage.setItem("anybikeCurrency",currency);
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

  setInterval(updateHeaderTimes,30000);

  window.dispatchEvent(new CustomEvent("anybikePublicHeaderReady",{
    detail:{
      user:user || null
    }
  }));
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
  const path = window.location.pathname;
  const hash = window.location.hash;

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

  if(path.includes("contact-us") || path.includes("anybike-connect")){
    markActive("connect");
    return;
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

    await sb
      .from("customer_profiles")
      .update(updateData)
      .eq("id",user.id);
  }catch(error){
    console.warn("Header preference could not be saved",error);
  }
}

function isCustomerSenderValue(value,userEmail){
  const sender = String(value || "").trim().toLowerCase();
  const email = String(userEmail || "").trim().toLowerCase();

  if(!sender){
    return false;
  }

  return sender === "customer" ||
    sender === "buyer" ||
    sender === "user" ||
    sender.includes("customer") ||
    (email && sender === email);
}

function isCustomerMessageRow(message,userEmail){
  return [
    message?.sender,
    message?.sender_type,
    message?.sender_name,
    message?.sender_email
  ].some(function(value){
    return isCustomerSenderValue(value,userEmail);
  });
}

async function loadCustomerHeaderActivity(user){

  if(typeof sb === "undefined" || !user){
    setMessageCount(0);
    setNotificationCount(0);
    renderNotificationList([]);
    return;
  }

  const { data, error } = await sb
    .from("customer_notifications")
    .select("id,title,message,link,is_read,created_at")
    .eq("customer_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending:false });

  if(error){
    console.error("Notification load failed", error);
    setMessageCount(0);
    setNotificationCount(0);
    renderNotificationList([]);
    return;
  }

  const notifications = (data || []).map(function(n){
    return {
      id:n.id,
      title:n.title || "Notification",
      message:n.message || "",
      link:n.link || "/customer-dashboard.html#messages",
      icon:"🔔",
      date:n.created_at
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

}

  setMessageCount(notifications.length);
  setNotificationCount(notifications.length);
  renderNotificationList(notifications);

  window.dispatchEvent(new CustomEvent("anybikeCustomerUnreadChanged",{
    detail:{
      count:notifications.length,
      items:notifications
    }
  }));

}
async function loadUnreadSingleBikeConversations(user,unreadItems){
  const enquiryResult = await sb
    .from("bike_enquiries")
    .select("id,bike_id,created_at,available_stock(id,make,model,year)")
    .eq("customer_id",user.id);

  if(enquiryResult.error){
    console.warn("Single-bike enquiries unavailable",enquiryResult.error.message);
    return;
  }

  const enquiries = enquiryResult.data || [];

  if(!enquiries.length){
    return;
  }

  const enquiryIds = enquiries.map(function(enquiry){
    return enquiry.id;
  });

  const messagesResult = await sb
    .from("enquiry_messages")
    .select("id,enquiry_id,sender,message,created_at")
    .in("enquiry_id",enquiryIds)
    .order("created_at",{ascending:true});

  if(messagesResult.error){
    console.warn("Single-bike messages unavailable",messagesResult.error.message);
    return;
  }

  const latestByEnquiry = new Map();

  (messagesResult.data || []).forEach(function(message){
    latestByEnquiry.set(String(message.enquiry_id),message);
  });

  enquiries.forEach(function(enquiry){
    const latest = latestByEnquiry.get(String(enquiry.id));

    if(!latest){
      return;
    }

    if(isCustomerMessageRow(latest,user.email)){
      return;
    }

    const bike = enquiry.available_stock || {};
    const title = [bike.year,bike.make,bike.model]
      .filter(Boolean)
      .join(" ") || "Motorcycle enquiry";

    unreadItems.push({
      type:"single-bike",
      id:"bike-" + String(enquiry.id),
      title:title,
      message:String(latest.message || "").substring(0,120),
      date:latest.created_at || enquiry.created_at,
      icon:"🏍️",
      link:"/customer-dashboard.html#messages"
    });
  });
}

async function loadUnreadMessageCentreConversations(user,unreadItems){
  if(!user.email){
    return;
  }

  const threadsResult = await sb
    .from("message_centre_threads")
    .select("id,subject,source_type,department,last_message,last_message_at,last_sender,status")
    .eq("customer_email",user.email)
    .order("last_message_at",{ascending:false});

  if(threadsResult.error){
    console.warn("Message Centre threads unavailable",threadsResult.error.message);
    return;
  }

  (threadsResult.data || []).forEach(function(thread){
    if(isCustomerSenderValue(thread.last_sender,user.email)){
      return;
    }

    unreadItems.push({
      type:"message-centre",
      id:"thread-" + String(thread.id),
      title:thread.subject || thread.department || "AnyBike message",
      message:String(thread.last_message || "").substring(0,120),
      date:thread.last_message_at || "",
      icon:String(thread.source_type || "").toLowerCase().includes("global buyer")
        ? "🌍"
        : "💬",
      link:"/customer-dashboard.html#messages"
    });
  });
}

function renderNotificationList(items){
  const list = document.getElementById("notificationList");

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
    return `
      <a href="${escapeHtml(item.link || "#")}"
         class="notification-item unread">
        <span class="notification-icon">${item.icon || "🔔"}</span>

        <span class="notification-copy">
          <strong>${escapeHtml(item.title || translations.notifications)}</strong>
          <small>${escapeHtml(item.message || "")}</small>
        </span>
      </a>
    `;
  }).join("");
}

function setMessageCount(total){
  total = Number(total) || 0;

  const link = document.getElementById("phMessages");
  const count = document.getElementById("phMessagesCount");

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

  const button = document.getElementById("phNotifications");
  const count = document.getElementById("phNotificationsCount");

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
  localStorage.setItem("anybikeCurrency",currency);

  updateSharedPagePrices(currency);

  if(typeof window.updateDisplayedPrices === "function"){
    try{
      window.updateDisplayedPrices();
    }catch(error){
      console.warn(error);
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
  localStorage.setItem("anybikeLanguage",language);

  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

  setText("[data-i18n='messages']",translations.messages);
  setText("[data-i18n='language']",translations.language);
  setText("[data-i18n='currency']",translations.currency);
  setText("[data-i18n='home']",translations.home);
  setText("[data-i18n='stock']",translations.stock);
  setText("[data-i18n='buy']",translations.buy);
  setText("[data-i18n='sell']",translations.sell);
  setText("[data-i18n='export']",translations.export);
  setText("[data-i18n='connect']",translations.connect);
  setText("[data-i18n='account']",translations.account);
  setText("[data-i18n='signIn']",translations.signIn);
  setText("[data-i18n='createAccount']",translations.createAccount);
  setText("[data-i18n='dashboard']",translations.dashboard);
  setText("[data-i18n='profile']",translations.profile);
  setText("[data-i18n='savedSearches']",translations.savedSearches);
  setText("[data-i18n='watchlist']",translations.watchlist);
  setText("[data-i18n='recentlyViewed']",translations.recentlyViewed);
  setText("[data-i18n='requests']",translations.requests);
  setText("[data-i18n='logout']",translations.logout);
  setText("[data-i18n='notifications']",translations.notifications);
  setText("[data-i18n='close']",translations.close);

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