async function loadPublicHeader(){
  const holder = document.getElementById("publicHeader");

  if(!holder){
    return;
  }

  const headerRes = await fetch("/public-header.html");
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

  const { data: { user } } = await sb.auth.getUser();

  if(user){
    if(loggedOutMenu){
      loggedOutMenu.classList.add("hidden");
    }

    if(loggedInMenu){
      loggedInMenu.classList.remove("hidden");
    }

    const { data: profile } = await sb
      .from("customer_profiles")
      .select("preferred_language,preferred_currency")
      .eq("id", user.id)
      .maybeSingle();

    if(profile){
      if(profile.preferred_language && languageSelect){
        savedLanguage = profile.preferred_language;
        languageSelect.value = savedLanguage;
        localStorage.setItem("anybikeLanguage", savedLanguage);
      }

      if(profile.preferred_currency && currencySelect){
        savedCurrency = profile.preferred_currency;
        currencySelect.value = savedCurrency;
        localStorage.setItem("anybikeCurrency", savedCurrency);
      }
    }

    loadCustomerMessageCounts(user.id);

  } else {
    if(loggedOutMenu){
      loggedOutMenu.classList.remove("hidden");
    }

    if(loggedInMenu){
      loggedInMenu.classList.add("hidden");
    }

    setMessageCount(0);
  }

  if(logoutLink){
    logoutLink.onclick = async function(e){
      e.preventDefault();
      await sb.auth.signOut();
      window.location.href = "/customer-register.html";
    };
  }

  if(languageSelect){
    languageSelect.onchange = function(){
      localStorage.setItem("anybikeLanguage", languageSelect.value);
      saveHeaderPreference("preferred_language", languageSelect.value);
      applyHeaderLanguage(languageSelect.value);
    };
  }

  if(currencySelect){
    currencySelect.onchange = function(){
      localStorage.setItem("anybikeCurrency", currencySelect.value);
      saveHeaderPreference("preferred_currency", currencySelect.value);
      applyHeaderCurrency(currencySelect.value);
    };
  }

  applyHeaderLanguage(savedLanguage);
  applyHeaderCurrency(savedCurrency);
  updateHeaderTimes();
  setInterval(updateHeaderTimes, 30000);
}

async function saveHeaderPreference(field, value){
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

  const event = new CustomEvent("anybikeCurrencyChanged", {
    detail:{
      currency:currency
    }
  });

  window.dispatchEvent(event);
}

function applyHeaderLanguage(language){
  window.anybikeLanguage = language;

  const event = new CustomEvent("anybikeLanguageChanged", {
    detail:{
      language:language
    }
  });

  window.dispatchEvent(event);
}

loadPublicHeader();
