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
    noNotifications:"No notifications yet.",
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
    noNotifications:"Noch keine Benachrichtigungen.",
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
    noNotifications:"Aucune notification.",
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
    noNotifications:"Aún no hay notificaciones.",
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
    noNotifications:"لا توجد إشعارات بعد.",
    close:"إغلاق"
  }
};

async function loadPublicHeader(){
  const holder = document.getElementById("publicHeader");
  if(!holder) return;

  try{
    const headerRes = await fetch("/public-header.html", { cache:"no-store" });
    if(!headerRes.ok) throw new Error("Header request failed: " + headerRes.status);

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

  mobileMenuButton?.addEventListener("click", () => document.body.classList.add("mobile-menu-open"));
  mobileMenuClose?.addEventListener("click", closeMobileMenu);
  mobileDrawerBackdrop?.addEventListener("click", closeMobileMenu);

  accountButton?.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    publicAccount?.classList.toggle("menu-open");
    notificationPopover?.classList.remove("open");
  });

  notificationButton?.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    notificationPopover?.classList.toggle("open");
    publicAccount?.classList.remove("menu-open");
  });

  document.addEventListener("click", e => {
    if(publicAccount && !publicAccount.contains(e.target)){
      publicAccount.classList.remove("menu-open");
    }

    if(
      notificationPopover &&
      notificationButton &&
      !notificationPopover.contains(e.target) &&
      !notificationButton.contains(e.target)
    ){
      notificationPopover.classList.remove("open");
    }
  });

  let savedLanguage = normaliseLanguage(localStorage.getItem("anybikeLanguage") || "en");
  let savedCurrency = normaliseCurrency(localStorage.getItem("anybikeCurrency") || "GBP");
  let user = null;

  try{
    if(typeof sb !== "undefined" && sb?.auth){
      const result = await sb.auth.getUser();
      user = result?.data?.user || null;

      if(user){
        const { data:profile } = await sb
          .from("customer_profiles")
          .select("preferred_language,preferred_currency")
          .eq("id", user.id)
          .maybeSingle();

        if(profile?.preferred_language){
          savedLanguage = normaliseLanguage(profile.preferred_language);
          localStorage.setItem("anybikeLanguage", savedLanguage);
        }

        if(profile?.preferred_currency){
          savedCurrency = normaliseCurrency(profile.preferred_currency);
          localStorage.setItem("anybikeCurrency", savedCurrency);
        }
      }
    }
  }catch(error){
    console.warn("Header account preferences unavailable", error);
  }

  if(languageSelect){
    languageSelect.value = savedLanguage;
    languageSelect.addEventListener("change", () => {
      const language = normaliseLanguage(languageSelect.value);
      localStorage.setItem("anybikeLanguage", language);
      saveHeaderPreference("preferred_language", language);
      applyHeaderLanguage(language);
    });
  }

  if(currencySelect){
    currencySelect.value = savedCurrency;
    currencySelect.addEventListener("change", () => {
      const currency = normaliseCurrency(currencySelect.value);
      localStorage.setItem("anybikeCurrency", currency);
      saveHeaderPreference("preferred_currency", currency);
      applyHeaderCurrency(currency);
    });
  }

  if(user){
    loggedOutMenu?.classList.add("hidden");
    loggedInMenu?.classList.remove("hidden");
    mobileLoggedOutMenu?.classList.add("hidden");
    mobileLoggedInMenu?.classList.remove("hidden");

    loadCustomerMessageCounts(user.id);
    loadCustomerNotifications(user.id);
  }else{
    loggedOutMenu?.classList.remove("hidden");
    loggedInMenu?.classList.add("hidden");
    mobileLoggedOutMenu?.classList.remove("hidden");
    mobileLoggedInMenu?.classList.add("hidden");

    setMessageCount(0);
    setNotificationCount(0);
    renderNotificationList([]);
  }

  logoutLink?.addEventListener("click", logoutCustomer);
  mobileLogoutLink?.addEventListener("click", logoutCustomer);

  setActivePublicNav();
  applyHeaderLanguage(savedLanguage);
  applyHeaderCurrency(savedCurrency);
  updateHeaderTimes();
  setInterval(updateHeaderTimes, 30000);
}

function normaliseLanguage(value){
  return Object.prototype.hasOwnProperty.call(ANYBIKE_HEADER_TRANSLATIONS, value) ? value : "en";
}

function normaliseCurrency(value){
  return Object.prototype.hasOwnProperty.call(ANYBIKE_HEADER_CURRENCY_RATES, value) ? value : "GBP";
}

function closeMobileMenu(){
  document.body.classList.remove("mobile-menu-open");
}

async function logoutCustomer(e){
  e.preventDefault();
  try{
    if(typeof sb !== "undefined" && sb?.auth) await sb.auth.signOut();
  }catch(error){
    console.warn("Customer logout failed", error);
  }
  window.location.href = "/customer-register.html";
}

function setActivePublicNav(){
  const path = window.location.pathname;
  const hash = window.location.hash;
  document.querySelectorAll(".public-nav a[data-page]").forEach(link => link.classList.remove("active"));

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

  if(path.includes("contact-us")){
    markActive("connect");
  }

  function markActive(page){
    document.querySelector('.public-nav a[data-page="' + page + '"]')?.classList.add("active");
  }
}

async function saveHeaderPreference(field, value){
  try{
    if(typeof sb === "undefined" || !sb?.auth) return;

    const { data:{ user } } = await sb.auth.getUser();
    if(!user) return;

    const updateData = {};
    updateData[field] = value;

    await sb.from("customer_profiles").update(updateData).eq("id", user.id);
  }catch(error){
    console.warn("Header preference could not be saved to profile", error);
  }
}

async function loadCustomerMessageCounts(userId){
  try{
    if(typeof sb === "undefined"){
      setMessageCount(0);
      return;
    }

    const { data:enquiries } = await sb
      .from("bike_enquiries")
      .select("id")
      .eq("customer_id", userId);

    if(!enquiries?.length){
      setMessageCount(0);
      return;
    }

    const { count } = await sb
      .from("enquiry_messages")
      .select("id", { count:"exact", head:true })
      .in("enquiry_id", enquiries.map(e => e.id))
      .eq("sender", "AnyBike");

    setMessageCount(count || 0);
  }catch(error){
    console.warn("Message count unavailable", error);
    setMessageCount(0);
  }
}

async function loadCustomerNotifications(userId){
  try{
    if(typeof sb === "undefined"){
      setNotificationCount(0);
      renderNotificationList([]);
      return;
    }

    const { data, error } = await sb
      .from("customer_notifications")
      .select("*")
      .eq("customer_id", userId)
      .order("created_at", { ascending:false });

    if(error) throw error;

    const items = data || [];
    setNotificationCount(items.filter(n => !n.is_read).length);
    renderNotificationList(items);
  }catch(error){
    console.warn("Customer notifications unavailable", error);
    setNotificationCount(0);
    renderNotificationList([]);
  }
}

function renderNotificationList(items){
  const list = document.getElementById("notificationList");
  if(!list) return;

  const language = normaliseLanguage(localStorage.getItem("anybikeLanguage") || "en");
  const t = ANYBIKE_HEADER_TRANSLATIONS[language];

  if(!items?.length){
    list.innerHTML = "<p>" + escapeHtml(t.noNotifications) + "</p>";
    return;
  }

  list.innerHTML = items.map(n => `
    <a href="${escapeHtml(n.link || "#")}" class="notification-item ${n.is_read ? "read" : "unread"}">
      <span class="notification-icon">${n.icon || "🔔"}</span>
      <span class="notification-copy">
        <strong>${escapeHtml(n.title || t.notifications)}</strong>
        <small>${escapeHtml(n.message || "")}</small>
      </span>
    </a>
  `).join("");
}

function setMessageCount(total){
  const link = document.getElementById("phMessages");
  const count = document.getElementById("phMessagesCount");
  if(count) count.textContent = total;
  if(link){
    link.classList.toggle("has-messages", total > 0);
    link.setAttribute("aria-label", "Messages " + total);
  }
}

function setNotificationCount(total){
  const button = document.getElementById("phNotifications");
  const count = document.getElementById("phNotificationsCount");
  if(count) count.textContent = total;
  if(button){
    button.classList.toggle("has-notifications", total > 0);
    button.setAttribute("aria-label", "Notifications " + total);
  }
}

function updateHeaderTimes(){
  const now = new Date();

  const localTime = now.toLocaleString([], {
    weekday:"short", day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"
  });

  const ukTime = now.toLocaleString("en-GB", {
    timeZone:"Europe/London",
    weekday:"short", day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"
  });

  const localEl = document.getElementById("phLocalTime");
  const ukEl = document.getElementById("phUkTime");

  if(localEl) localEl.textContent = "Local " + localTime;
  if(ukEl) ukEl.textContent = "UK " + ukTime;
}

function applyHeaderCurrency(currency){
  currency = normaliseCurrency(currency);
  window.anybikeCurrency = currency;
  localStorage.setItem("anybikeCurrency", currency);

  updateSharedPagePrices(currency);

  if(typeof window.updateDisplayedPrices === "function"){
    try{ window.updateDisplayedPrices(); }catch(error){ console.warn(error); }
  }

  window.dispatchEvent(new CustomEvent("anybikeCurrencyChanged", {
    detail:{ currency }
  }));
}

function updateSharedPagePrices(currency){
  const rate = ANYBIKE_HEADER_CURRENCY_RATES[currency] || 1;

  document.querySelectorAll("[data-price-gbp]").forEach(element => {
    const raw = Number(element.dataset.priceGbp);
    if(!Number.isFinite(raw)) return;

    element.textContent = (raw * rate).toLocaleString("en-GB", {
      style:"currency",
      currency,
      maximumFractionDigits:0
    });
  });
}

function applyHeaderLanguage(language){
  language = normaliseLanguage(language);
  const t = ANYBIKE_HEADER_TRANSLATIONS[language];

  window.anybikeLanguage = language;
  localStorage.setItem("anybikeLanguage", language);
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

  setText("[data-i18n='messages']", t.messages);
  setText("[data-i18n='language']", t.language);
  setText("[data-i18n='currency']", t.currency);
  setText("[data-i18n='home']", t.home);
  setText("[data-i18n='stock']", t.stock);
  setText("[data-i18n='buy']", t.buy);
  setText("[data-i18n='sell']", t.sell);
  setText("[data-i18n='export']", t.export);
  setText("[data-i18n='connect']", t.connect);
  setText("[data-i18n='account']", t.account);
  setText("[data-i18n='signIn']", t.signIn);
  setText("[data-i18n='createAccount']", t.createAccount);
  setText("[data-i18n='dashboard']", t.dashboard);
  setText("[data-i18n='profile']", t.profile);
  setText("[data-i18n='savedSearches']", t.savedSearches);
  setText("[data-i18n='watchlist']", t.watchlist);
  setText("[data-i18n='recentlyViewed']", t.recentlyViewed);
  setText("[data-i18n='requests']", t.requests);
  setText("[data-i18n='logout']", t.logout);
  setText("[data-i18n='notifications']", t.notifications);
  setText("[data-i18n='close']", t.close);

  const notificationList = document.getElementById("notificationList");
  if(notificationList && notificationList.querySelector("p")){
    notificationList.innerHTML = "<p>" + escapeHtml(t.noNotifications) + "</p>";
  }

  window.dispatchEvent(new CustomEvent("anybikeLanguageChanged", {
    detail:{ language }
  }));
}

function setText(selector, value){
  document.querySelectorAll(selector).forEach(element => {
    element.textContent = value;
  });
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);
}