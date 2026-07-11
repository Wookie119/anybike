document.addEventListener("DOMContentLoaded", loadPublicHeader);

async function loadPublicHeader(){
  const holder = document.getElementById("publicHeader");
  if(!holder) return;

  const headerRes = await fetch("/public-header.html", { cache:"no-store" });
  if(!headerRes.ok) return;

  holder.innerHTML = await headerRes.text();
  setupPublicHeader();
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

  let savedLanguage = localStorage.getItem("anybikeLanguage") || "en";
  let savedCurrency = localStorage.getItem("anybikeCurrency") || "GBP";
  let user = null;

  if(typeof sb !== "undefined"){
    const result = await sb.auth.getUser();
    user = result.data.user;

    if(user){
      const { data:profile } = await sb
        .from("customer_profiles")
        .select("preferred_language,preferred_currency")
        .eq("id", user.id)
        .maybeSingle();

      if(profile?.preferred_language){
        savedLanguage = profile.preferred_language;
        localStorage.setItem("anybikeLanguage", savedLanguage);
      }

      if(profile?.preferred_currency){
        savedCurrency = profile.preferred_currency;
        localStorage.setItem("anybikeCurrency", savedCurrency);
      }
    }
  }

  if(languageSelect){
    languageSelect.value = savedLanguage;
    languageSelect.addEventListener("change", () => {
      localStorage.setItem("anybikeLanguage", languageSelect.value);
      saveHeaderPreference("preferred_language", languageSelect.value);
      applyHeaderLanguage(languageSelect.value);
    });
  }

  if(currencySelect){
    currencySelect.value = savedCurrency;
    currencySelect.addEventListener("change", () => {
      localStorage.setItem("anybikeCurrency", currencySelect.value);
      saveHeaderPreference("preferred_currency", currencySelect.value);
      applyHeaderCurrency(currencySelect.value);
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

function closeMobileMenu(){
  document.body.classList.remove("mobile-menu-open");
}

async function logoutCustomer(e){
  e.preventDefault();
  if(typeof sb !== "undefined") await sb.auth.signOut();
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
  if(typeof sb === "undefined") return;

  const { data:{ user } } = await sb.auth.getUser();
  if(!user) return;

  const updateData = {};
  updateData[field] = value;

  await sb.from("customer_profiles").update(updateData).eq("id", user.id);
}

async function loadCustomerMessageCounts(userId){
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
}

async function loadCustomerNotifications(userId){
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

  if(error){
    setNotificationCount(0);
    renderNotificationList([]);
    return;
  }

  const items = data || [];
  setNotificationCount(items.filter(n => !n.is_read).length);
  renderNotificationList(items);
}

function renderNotificationList(items){
  const list = document.getElementById("notificationList");
  if(!list) return;

  if(!items?.length){
    list.innerHTML = "<p>No notifications yet.</p>";
    return;
  }

  list.innerHTML = items.map(n => `
    <a href="${escapeHtml(n.link || "#")}" class="notification-item ${n.is_read ? "read" : "unread"}">
      <span class="notification-icon">${n.icon || "🔔"}</span>
      <span class="notification-copy">
        <strong>${escapeHtml(n.title || "Notification")}</strong>
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
  window.anybikeCurrency = currency;
  window.dispatchEvent(new CustomEvent("anybikeCurrencyChanged", { detail:{ currency } }));
}

function applyHeaderLanguage(language){
  window.anybikeLanguage = language;
  window.dispatchEvent(new CustomEvent("anybikeLanguageChanged", { detail:{ language } }));
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);
}
