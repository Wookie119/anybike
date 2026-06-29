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
  const loginLink = document.getElementById("phLogin");
  const dashboardLink = document.getElementById("phDashboard");
  const logoutLink = document.getElementById("phLogout");
  const customerName = document.getElementById("phCustomerName");
  const languageSelect = document.getElementById("phLanguage");
  const currencySelect = document.getElementById("phCurrency");

  const { data: { user } } = await sb.auth.getUser();

  if(user){
    loginLink.classList.add("hidden");
    dashboardLink.classList.remove("hidden");
    logoutLink.classList.remove("hidden");

    customerName.textContent = user.email || "Customer";

    const { data: profile } = await sb
      .from("customer_profiles")
      .select("full_name,email,preferred_language,preferred_currency")
      .eq("id", user.id)
      .maybeSingle();

    if(profile){
      customerName.textContent = profile.full_name || profile.email || user.email || "Customer";

      if(profile.preferred_language){
        languageSelect.value = profile.preferred_language;
      }

      if(profile.preferred_currency){
        currencySelect.value = profile.preferred_currency;
      }
    }

    loadCustomerMessageCounts(user.id);

  } else {
    loginLink.classList.remove("hidden");
    dashboardLink.classList.add("hidden");
    logoutLink.classList.add("hidden");
    customerName.textContent = "Guest";
  }

  logoutLink.onclick = async function(e){
    e.preventDefault();
    await sb.auth.signOut();
    window.location.href = "/customer-register.html";
  };

  languageSelect.onchange = function(){
    saveHeaderPreference("preferred_language", languageSelect.value);
  };

  currencySelect.onchange = function(){
    saveHeaderPreference("preferred_currency", currencySelect.value);
  };

  updateHeaderTimes();
  setInterval(updateHeaderTimes, 30000);
}

async function saveHeaderPreference(field, value){
  const { data: { user } } = await sb.auth.getUser();

  if(!user){
    localStorage.setItem(field, value);
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
  const messagesEl = document.getElementById("phMessages");
  const notificationsEl = document.getElementById("phNotifications");

  const { data: enquiries } = await sb
    .from("bike_enquiries")
    .select("id")
    .eq("customer_id", userId);

  if(!enquiries || enquiries.length === 0){
    messagesEl.textContent = "Messages 0";
    notificationsEl.textContent = "Notifications 0";
    return;
  }

  const enquiryIds = enquiries.map(e => e.id);

  const { count } = await sb
    .from("enquiry_messages")
    .select("id", { count:"exact", head:true })
    .in("enquiry_id", enquiryIds)
    .eq("sender", "AnyBike");

  const total = count || 0;

  messagesEl.textContent = "Messages " + total;
  notificationsEl.textContent = "Notifications " + total;
}

function updateHeaderTimes(){
  const localEl = document.getElementById("phLocalTime");
  const ukEl = document.getElementById("phUkTime");

  const localTime = new Date().toLocaleString([], {
    weekday:"short",
    hour:"2-digit",
    minute:"2-digit"
  });

  const ukTime = new Date().toLocaleString("en-GB", {
    timeZone:"Europe/London",
    weekday:"short",
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

loadPublicHeader();
