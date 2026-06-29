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
    holder.innerHTML = "";
    return;
  }

  holder.innerHTML = await headerRes.text();

  setupPublicHeader();
}

async function setupPublicHeader(){
  const loggedOutMenu = document.getElementById("loggedOutMenu");
  const loggedInMenu = document.getElementById("loggedInMenu");
  const logoutLink = document.getElementById("phLogout");
  const languageSelect = document.getElementById("phLanguage");
  const currencySelect = document.getElementById("phCurrency");

  let savedLanguage = localStorage.getItem("anybikeLanguage") || "en";
  let savedCurrency = localStorage.getItem("anybikeCurrency") || "GBP";

  if(languageSelect){
    languageSelect.value = savedLanguage;
  }

  if(currencySelect){
    currencySelect.value = savedCurrency;
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

    loadCustomerMessageCounts(user.id);
  } else {
    if(loggedOutMenu){
      loggedOutMenu.classList.remove("hidden");
    }

    if(loggedInMenu){
      loggedInMenu.classList.add("hidden");
    }

    setHeaderCounts(0,0);
  }

  if(logoutLink){
    logoutLink.onclick = async function(e){
      e.preventDefault();

      if(typeof sb !== "undefined"){
        await sb.auth.signOut();
      }

      window.location.href = "/customer-register.html";
    };
  }

  if(languageSelect){
    languageSelect.onchange = function(){
      localStorage.setItem("anybikeLanguage", languageSelect.value);
      applyHeaderLanguage(languageSelect.value);
    };
  }

  if(currencySelect){
    currencySelect.onchange = function(){
      localStorage.setItem("anybikeCurrency", currencySelect.value);
      applyHeaderCurrency(currencySelect.value);
    };
  }

  applyHeaderLanguage(savedLanguage);
  applyHeaderCurrency(savedCurrency);
  updateHeaderTimes();
  setInterval(updateHeaderTimes, 30000);
}

async function loadCustomerMessageCounts(userId){
  if(typeof sb === "undefined"){
    setHeaderCounts(0,0);
    return;
  }

  const { data: enquiries } = await sb
    .from("bike_enquiries")
    .select("id")
    .eq("customer_id", userId);

  if(!enquiries || enquiries.length === 0){
    setHeaderCounts(0,0);
    return;
  }

  const enquiryIds = enquiries.map(e => e.id);

  const { count } = await sb
    .from("enquiry_messages")
    .select("id", { count:"exact", head:true })
    .in("enquiry_id", enquiryIds)
    .eq("sender", "AnyBike");

  setHeaderCounts(count || 0,count || 0);
}

function setHeaderCounts(messages,notifications){
  const messagesEl = document.getElementById("phMessages");
  const notificationsEl = document.getElementById("phNotifications");

  if(messagesEl){
    messagesEl.textContent = "Messages " + messages;
    messagesEl.classList.toggle("has-messages", messages > 0);
  }

  if(notificationsEl){
    notificationsEl.textContent = "Notifications " + notifications;
    notificationsEl.classList.toggle("has-messages", notifications > 0);
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
