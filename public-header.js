/*
AnyBike
File: public-header.js
Version: 2026.07.13-10
*/

document.addEventListener("DOMContentLoaded",loadPublicHeader);

const ANYBIKE_HEADER_RATES={GBP:1,EUR:1.17,USD:1.27,AUD:1.93,NZD:2.10,CAD:1.73,AED:4.66};
const ANYBIKE_HEADER_TEXT={
  en:{messages:"Messages",language:"Language",currency:"Currency",home:"Home",stock:"Available Stock",buy:"Buy a Motorcycle",sell:"Sell Your Motorcycle",export:"Export Services",connect:"AnyBike Connect",account:"My AnyBike",signIn:"Sign In",createAccount:"Create Free Account",dashboard:"Dashboard",profile:"My Profile",savedSearches:"Saved Searches",watchlist:"Watchlist",recentlyViewed:"Recently Viewed",requests:"Motorcycle Requests",logout:"Logout",notifications:"Notifications",noNotifications:"No new notifications.",close:"Close"},
  de:{messages:"Nachrichten",language:"Sprache",currency:"Währung",home:"Startseite",stock:"Verfügbare Motorräder",buy:"Motorrad kaufen",sell:"Motorrad verkaufen",export:"Exportservice",connect:"AnyBike Kontakt",account:"Mein AnyBike",signIn:"Anmelden",createAccount:"Kostenloses Konto",dashboard:"Übersicht",profile:"Mein Profil",savedSearches:"Gespeicherte Suchen",watchlist:"Merkliste",recentlyViewed:"Zuletzt angesehen",requests:"Motorradanfragen",logout:"Abmelden",notifications:"Benachrichtigungen",noNotifications:"Keine neuen Benachrichtigungen.",close:"Schließen"},
  fr:{messages:"Messages",language:"Langue",currency:"Devise",home:"Accueil",stock:"Motos disponibles",buy:"Acheter une moto",sell:"Vendre votre moto",export:"Services d’exportation",connect:"Contacter AnyBike",account:"Mon AnyBike",signIn:"Se connecter",createAccount:"Créer un compte gratuit",dashboard:"Tableau de bord",profile:"Mon profil",savedSearches:"Recherches enregistrées",watchlist:"Favoris",recentlyViewed:"Vues récemment",requests:"Demandes de motos",logout:"Déconnexion",notifications:"Notifications",noNotifications:"Aucune nouvelle notification.",close:"Fermer"},
  es:{messages:"Mensajes",language:"Idioma",currency:"Moneda",home:"Inicio",stock:"Motos disponibles",buy:"Comprar una moto",sell:"Vender tu moto",export:"Servicios de exportación",connect:"Contactar con AnyBike",account:"Mi AnyBike",signIn:"Iniciar sesión",createAccount:"Crear cuenta gratuita",dashboard:"Panel",profile:"Mi perfil",savedSearches:"Búsquedas guardadas",watchlist:"Favoritos",recentlyViewed:"Vistos recientemente",requests:"Solicitudes de motos",logout:"Cerrar sesión",notifications:"Notificaciones",noNotifications:"No hay notificaciones nuevas.",close:"Cerrar"},
  ar:{messages:"الرسائل",language:"اللغة",currency:"العملة",home:"الرئيسية",stock:"الدراجات المتاحة",buy:"شراء دراجة نارية",sell:"بيع دراجتك",export:"خدمات التصدير",connect:"تواصل مع AnyBike",account:"حسابي",signIn:"تسجيل الدخول",createAccount:"إنشاء حساب مجاني",dashboard:"لوحة التحكم",profile:"ملفي الشخصي",savedSearches:"عمليات البحث المحفوظة",watchlist:"قائمة المتابعة",recentlyViewed:"شوهدت مؤخراً",requests:"طلبات الدراجات",logout:"تسجيل الخروج",notifications:"الإشعارات",noNotifications:"لا توجد إشعارات جديدة.",close:"إغلاق"}
};

let anybikeHeaderUser=null;
let anybikeHeaderTimer=null;

async function loadPublicHeader(){
  const holder=document.getElementById("publicHeader");
  if(!holder) return;

  try{
    const response=await fetch("/public-header.html?v=11000",{cache:"no-store"});
    if(!response.ok) throw new Error("Header request failed: "+response.status);
    holder.innerHTML=await response.text();
    await setupPublicHeader();
  }catch(error){
    console.error("Public header could not be loaded",error);
  }
}

async function setupPublicHeader(){
  const account=document.querySelector(".public-account");
  const accountButton=document.getElementById("phAccountButton");
  const notificationButton=document.getElementById("phNotificationsV3");
  const notificationPopoverV3=document.getElementById("notificationPopoverV3");

  document.getElementById("mobileMenuButton")?.addEventListener("click",()=>document.body.classList.add("mobile-menu-open"));
  document.getElementById("mobileMenuClose")?.addEventListener("click",closeMobileMenu);
  document.getElementById("mobileDrawerBackdrop")?.addEventListener("click",closeMobileMenu);
  document.getElementById("notificationCloseButtonV3")?.addEventListener("click",()=>notificationPopoverV3?.classList.remove("open"));

  accountButton?.addEventListener("click",event=>{
    event.preventDefault();
    event.stopPropagation();
    account?.classList.toggle("menu-open");
    notificationPopoverV3?.classList.remove("open");
  });

  notificationButton?.addEventListener("click",event=>{
    event.preventDefault();
    event.stopPropagation();
    notificationPopoverV3?.classList.toggle("open");
    account?.classList.remove("menu-open");
  });

  document.addEventListener("click",event=>{
    if(account && !account.contains(event.target)) account.classList.remove("menu-open");
    if(notificationPopoverV3 && notificationButton && !notificationPopoverV3.contains(event.target) && !notificationButton.contains(event.target)){
      notificationPopoverV3.classList.remove("open");
    }
  });

  let language=normaliseLanguage(localStorage.getItem("anybikeLanguage")||"en");
  let currency=normaliseCurrency(localStorage.getItem("anybikeCurrency")||"GBP");
  let user=null;

  try{
    if(typeof sb!=="undefined" && sb?.auth){
      const session=await sb.auth.getSession();
      user=session?.data?.session?.user||null;
      if(!user){
        const result=await sb.auth.getUser();
        user=result?.data?.user||null;
      }
    }
  }catch(error){
    console.warn("Header login check failed",error);
  }

  anybikeHeaderUser=user;

  const loggedOut=document.getElementById("loggedOutMenu");
  const loggedIn=document.getElementById("loggedInMenu");
  const mobileLoggedOut=document.getElementById("mobileLoggedOutMenu");
  const mobileLoggedIn=document.getElementById("mobileLoggedInMenu");

  loggedOut?.classList.toggle("hidden",Boolean(user));
  loggedIn?.classList.toggle("hidden",!user);
  mobileLoggedOut?.classList.toggle("hidden",Boolean(user));
  mobileLoggedIn?.classList.toggle("hidden",!user);

  document.getElementById("phLogout")?.addEventListener("click",logoutCustomer);
  document.getElementById("phMobileLogout")?.addEventListener("click",logoutCustomer);

  const languageSelect=document.getElementById("phLanguage");
  const currencySelect=document.getElementById("phCurrency");

  if(languageSelect){
    languageSelect.value=language;
    languageSelect.addEventListener("change",()=>{
      language=normaliseLanguage(languageSelect.value);
      localStorage.setItem("anybikeLanguage",language);
      applyHeaderLanguage(language);
    });
  }

  if(currencySelect){
    currencySelect.value=currency;
    currencySelect.addEventListener("change",()=>{
      currency=normaliseCurrency(currencySelect.value);
      localStorage.setItem("anybikeCurrency",currency);
      applyHeaderCurrency(currency);
    });
  }

  setActivePublicNav();
  applyHeaderLanguage(language);
  applyHeaderCurrency(currency);
  updateHeaderTimes();
  setInterval(updateHeaderTimes,30000);

  if(user){
    await loadCustomerNotifications(user);
    if(anybikeHeaderTimer) clearInterval(anybikeHeaderTimer);
    anybikeHeaderTimer=setInterval(()=>loadCustomerNotifications(user),60000);
  }else{
    updateHeaderBadges(0);
    renderNotificationList([]);
  }

  window.dispatchEvent(new CustomEvent("anybikePublicHeaderReady",{detail:{user:user||null}}));
}

async function loadCustomerNotifications(user){
  if(typeof sb==="undefined" || !user){
    updateHeaderBadges(0);
    renderNotificationList([]);
    return;
  }

  const {data,error}=await sb
    .from("customer_notifications")
    .select("id,title,message,icon,type,link,is_read,created_at")
    .eq("customer_id",user.id)
    .eq("is_read",false)
    .order("created_at",{ascending:false});

  if(error){
    console.warn("Customer notifications unavailable",error.message);
    updateHeaderBadges(0);
    renderNotificationList([]);
    return;
  }

  const rows=data||[];
  updateHeaderBadges(rows.length);
  renderNotificationList(rows);
}

function updateHeaderBadges(total){
  total=Number(total)||0;

  const messageCount=document.getElementById("phMessagesV3Count");
  const notificationCount=document.getElementById("phNotificationsV3Count");
  const messageLink=document.getElementById("phMessagesV3");
  const notificationButton=document.getElementById("phNotificationsV3");

  [messageCount,notificationCount].forEach(badge=>{
    if(!badge) return;
    badge.textContent=total;
    badge.style.display=total>0?"inline-flex":"none";
  });

  messageLink?.setAttribute("aria-label","Messages "+total);
  notificationButton?.setAttribute("aria-label","Notifications "+total);
}

function renderNotificationList(rows){
  const list=document.getElementById("notificationListV3");
  if(!list) return;

  const language=normaliseLanguage(localStorage.getItem("anybikeLanguage")||"en");
  const text=ANYBIKE_HEADER_TEXT[language]||ANYBIKE_HEADER_TEXT.en;

  if(!rows.length){
    list.innerHTML="<p>"+escapeHtml(text.noNotifications)+"</p>";
    return;
  }

  list.innerHTML=rows.slice(0,12).map(row=>`
    <a class="notification-item"
       href="${escapeHtml(row.link||"/customer-dashboard.html#messages")}"
       onclick="markNotificationRead('${escapeHtml(row.id)}')">
      <span class="notification-icon">${escapeHtml(row.icon||"🔔")}</span>
      <span class="notification-copy">
        <strong>${escapeHtml(row.title||"AnyBike notification")}</strong>
        <small>${escapeHtml(row.message||"")}</small>
      </span>
    </a>
  `).join("");
}

async function markNotificationRead(id){
  if(!id || typeof sb==="undefined" || !anybikeHeaderUser) return;

  try{
    await sb
      .from("customer_notifications")
      .update({is_read:true})
      .eq("id",id)
      .eq("customer_id",anybikeHeaderUser.id);
  }catch(error){
    console.warn("Notification could not be marked read",error);
  }
}

function closeMobileMenu(){document.body.classList.remove("mobile-menu-open")}

async function logoutCustomer(event){
  event?.preventDefault();
  try{
    if(typeof sb!=="undefined" && sb?.auth) await sb.auth.signOut();
  }catch(error){
    console.warn("Logout failed",error);
  }
  location.href="/customer-register.html";
}

function setActivePublicNav(){
  const path=location.pathname;
  let page="";

  if(path==="/" || path.endsWith("/index.html")) page="home";
  else if(path.includes("available-stock")||path.includes("bike-details")) page="stock";
  else if(path.includes("buy-motorcycles")||path.includes("bulk-buying-request")) page="buy";
  else if(path.includes("sell-your-motorcycle")) page="sell";
  else if(path.includes("export-services")) page="export";
  else if(path.includes("anybike-connect")) page="connect";

  document.querySelectorAll(".public-nav a[data-page]").forEach(link=>{
    link.classList.toggle("active",link.dataset.page===page);
  });
}

function normaliseLanguage(value){return ANYBIKE_HEADER_TEXT[value]?value:"en"}
function normaliseCurrency(value){return ANYBIKE_HEADER_RATES[value]?value:"GBP"}

function updateHeaderTimes(){
  const now=new Date();
  const local=now.toLocaleString([],{
    weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"
  });
  const uk=now.toLocaleString("en-GB",{
    timeZone:"Europe/London",weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"
  });

  const localEl=document.getElementById("phLocalTime");
  const ukEl=document.getElementById("phUkTime");
  if(localEl) localEl.textContent="Local "+local;
  if(ukEl) ukEl.textContent="UK "+uk;
}

function applyHeaderCurrency(currency){
  currency=normaliseCurrency(currency);
  window.anybikeCurrency=currency;
  localStorage.setItem("anybikeCurrency",currency);

  const rate=ANYBIKE_HEADER_RATES[currency]||1;
  document.querySelectorAll("[data-price-gbp]").forEach(el=>{
    const raw=Number(el.dataset.priceGbp);
    if(Number.isFinite(raw)){
      el.textContent=(raw*rate).toLocaleString("en-GB",{
        style:"currency",currency:currency,maximumFractionDigits:0
      });
    }
  });

  window.dispatchEvent(new CustomEvent("anybikeCurrencyChanged",{detail:{currency}}));
}

function applyHeaderLanguage(language){
  language=normaliseLanguage(language);
  const text=ANYBIKE_HEADER_TEXT[language]||ANYBIKE_HEADER_TEXT.en;

  document.documentElement.lang=language;
  document.documentElement.dir=language==="ar"?"rtl":"ltr";

  Object.entries(text).forEach(([key,value])=>{
    document.querySelectorAll(`[data-i18n="${key}"]`).forEach(el=>el.textContent=value);
  });

  window.dispatchEvent(new CustomEvent("anybikeLanguageChanged",{detail:{language}}));
}

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,char=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
}