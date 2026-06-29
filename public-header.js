document.addEventListener("DOMContentLoaded", function(){
  loadPublicHeader();
});

async function loadPublicHeader(){
  const holder = document.getElementById("publicHeader");

  if(!holder){
    return;
  }

  const headerRes = await fetch("/public-header.html");

  if(!headerRes.ok){
    return;
  }

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

  if(mobileMenuButton){
    mobileMenuButton.onclick = function(){
      document.body.classList.add("mobile-menu-open");
    };
  }

  if(mobileMenuClose){
    mobileMenuClose.onclick = closeMobileMenu;
  }

  if(mobileDrawerBackdrop){
    mobileDrawerBackdrop.onclick = closeMobileMenu;
  }

  if(accountButton && publicAccount){
    accountButton.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();
      publicAccount.classList.toggle("menu-open");

      if(notificationPopover){
        notificationPopover.classList.remove("open");
      }
    };
  }

  if(notificationButton && notificationPopover){
    notificationButton.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();
      notificationPopover.classList.toggle("open");

      if(publicAccount){
        publicAccount.classList.remove("menu-open");
      }
    };
  }

  document.addEventListener("click", function(e){
    if(publicAccount && !publicAccount.contains(e.target)){
      publicAccount.classList.remove("menu-open");
    }

    if(notificationPopover && notificationButton && !notificationPopover.contains(e.target) && !notificationButton.contains(e.target)){
      notificationPopover.classList.remove("open");
    }
  });

  let savedLanguage = localStorage.getItem("anybikeLanguage") || "en";
  let savedCurrency = localStorage.getItem("anybikeCurrency") || "GBP";

  if(languageSelect){
    languageSelect.value = savedLanguage;
    languageSelect.onchange = function(){
      localStorage.setItem("anybikeLanguage", languageSelect.value);
      saveHeaderPreference("preferred_language", languageSelect.value);
      applyHeaderLanguage(languageSelect.value);
    };
  }

  if(currencySelect){
    currencySelect.value = savedCurrency;
    currencySelect.onchange = function(){
      localStorage.setItem("anybikeCurrency", currencySelect.value);
      saveHeaderPreference("preferred_currency", currencySelect.value);
      applyHeaderCurrency(currencySelect.value);
    };
  }

  let user = null;

  if(typeof sb !== "undefined"){
    const result = await sb.auth.getUser();
    user = result.data.user;
  }

  if(user){
    if(loggedOutMenu){
      loggedOutMenu.classList.add("hidden");
    }

    if(loggedInMenu){
      loggedInMenu.classList.remove("hidden");
    }

    if(mobileLoggedOutMenu){
      mobileLoggedOutMenu.classList.add("hidden");
    }

    if(mobileLoggedInMenu){
      mobileLoggedInMenu.classList.remove("hidden");
    }

    loadCustomerMessageCounts(user.id);
    loadCustomerNotifications(user.id);

  } else {
    if(loggedOutMenu){
      loggedOutMenu.classList.remove("hidden");
    }

    if(loggedInMenu){
      loggedInMenu.classList.add("hidden");
    }

    if(mobileLoggedOutMenu){
      mobileLoggedOutMenu.classList.remove("hidden");
    }

    if(mobileLoggedInMenu){
      mobileLoggedInMenu.classList.add("hidden");
    }

    setMessageCount(0);
    setNotificationCount(0);
    renderNotificationList([]);
  }

  if(logoutLink){
    logoutLink.onclick = logoutCustomer;
  }

  if(mobileLogoutLink){
    mobileLogoutLink.onclick = logoutCustomer;
  }

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

  if(typeof sb !== "undefined"){
    await sb.auth.signOut();
  }

  window.location.href = "/customer-register.html";
}

function setActivePublicNav(){
  const path = window.location.pathname;
  const hash = window.location.hash;
  const links = document.querySelectorAll(".public-nav a[data-page]");

  links.forEach(link => link.classList.remove("active"));

  if(path === "/" || path.endsWith("/index.html")){
    if(hash === "#export-services"){
      markActive("export");
      return;
    }

    if(hash === "#contact"){
      markActive("contact");
      return;
    }

    markActive("home");
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

  function markActive(page){
    const active = document.querySelector('.public-nav a[data-page="' + page + '"]');

    if(active){
      active.classList.add("active");
    }
  }
}

async function saveHeaderPreference(field, value){
  if(typeof sb === "undefined"){
    return;
  }

  const { data: { user } } = await sb.auth.getUser();

  if(!user){
    return;
  }

  const updateData = {};
  updateData[field] = value;

  await sb
    .from("customer_profiles")
    .update(updateData)
    .eq("id", user.id);
}

async function loadCustomerMessageCounts(userId){
  if(typeof sb === "undefined"){
    setMessageCount(0);
    return;
  }

  const { data: enquiries } = await sb
    .from("bike_enquiries")
    .select("id")
    .eq("customer_id", userId);

  if(!enquiries || enquiries.length === 0){
    setMessageCount(0);
    return;
  }

  const enquiryIds = enquiries.map(e => e.id);

  const { count } = await sb
    .from("enquiry_messages")
    .select("id", { count:"exact", head:true })
    .in("enquiry_id", enquiryIds)
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
    .select("id,title,message,icon,link,is_read,created_at")
    .eq("customer_id", userId)
    .order("created_at", { ascending:false })
    .limit(6);

  if(error || !data){
    setNotificationCount(0);
    renderNotificationList([]);
    return;
  }

  const unread = data.filter(n => !n.is_read).length;

  setNotificationCount(unread);
  renderNotificationList(data);
}

function renderNotificationList(items){
  const list = document.getElementById("notificationList");

  if(!list){
    return;
  }

  if(!items || items.length === 0){
    list.innerHTML = "<p>No notifications yet.</p>";
    return;
  }

  list.innerHTML = items.map(n => {
    const icon = n.icon || "🔔";
    const title = escapeHtml(n.title || "Notification");
    const message = escapeHtml(n.message || "");
    const link = n.link || "#";
    const readClass = n.is_read ? "read" : "unread";

    return `
      <a href="${link}" class="notification-item ${readClass}">
        <span class="notification-icon">${icon}</span>
        <span class="notification-copy">
          <strong>${title}</strong>
          <small>${message}</small>
        </span>
      </a>
    `;
  }).join("");
}

function setMessageCount(total){
  const messagesEl = document.getElementById("phMessages");

  if(!messagesEl){
    return;
  }

  messagesEl.textContent = "Messages " + total;

  if(total > 0){
    messagesEl.classList.add("has-messages");
  } else {
    messagesEl.classList.remove("has-messages");
  }
}

function setNotificationCount(total){
  const notificationsEl = document.getElementById("phNotifications");

  if(!notificationsEl){
    return;
  }

  notificationsEl.textContent = "Notifications " + total;

  if(total > 0){
    notificationsEl.classList.add("has-notifications");
  } else {
    notificationsEl.classList.remove("has-notifications");
  }
}

function updateHeaderTimes(){
  const localEl = document.getElementById("phLocalTime");
  const ukEl = document.getElementById("phUkTime");

  const localTime = new Date().toLocaleString([], {
    weekday:"short",
    day:"2-digit",
    month:"short",
    hour:"2-digit",
    minute:"2-digit"
  });

  const ukTime = new Date().toLocaleString("en-GB", {
    timeZone:"Europe/London",
    weekday:"short",
    day:"2-digit",
    month:"short",
    hour:"2-digit",
    minute:"2-digit"
  });

  if(localEl){
    localEl.textContent = "Local " + localTime;
  }

  if(ukEl){
    ukEl.textContent = "UK " + ukTime;
  }
}

function applyHeaderCurrency(currency){
  window.anybikeCurrency = currency;

  window.dispatchEvent(new CustomEvent("anybikeCurrencyChanged", {
    detail:{
      currency:currency
    }
  }));
}

function applyHeaderLanguage(language){
  window.anybikeLanguage = language;

  window.dispatchEvent(new CustomEvent("anybikeLanguageChanged", {
    detail:{
      language:language
    }
  }));
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, function(char){
    return {
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[char];
  });
}
