/*
AnyBike
File: admin.js
Version: 10.1
Date: 13 July 2026

Changes
--------
✓ Preserves existing admin sidebar and topbar loading
✓ Preserves single-bike and Message Centre notifications
✓ Adds Global Buyer Network notifications to the admin bell
✓ Combines message and bulk-buyer alerts into one live notification list
✓ Adds clickable bulk-buyer links to the correct CRM record
✓ Adds per-browser Clear handling for bulk-buyer alerts
✓ Keeps existing thread Clear behaviour
✓ Refreshes notifications every 60 seconds
*/

function loadAdminShell(){

  fetch("admin-sidebar.html?v=4000")
    .then(function(res){
      return res.text();
    })
    .then(function(html){

      var sidebar = document.getElementById("adminSidebar");

      if(sidebar){
        sidebar.innerHTML = html;
        setupAdminFolders();
      }

      var currentPage = window.location.pathname.split("/").pop() || "admin-dashboard.html";

      document.querySelectorAll(".admin-menu a, .submenu a").forEach(function(link){
        var href = String(link.getAttribute("href") || "").split("?")[0];

        if(href === currentPage){
          link.classList.add("active");
        }
      });

    })
    .catch(function(error){
      console.log("Admin sidebar load failed", error);
    });

  fetch("admin-topbar.html?v=4000")
    .then(function(res){
      return res.text();
    })
    .then(function(html){

      var topbar = document.getElementById("adminTopbar");

      if(topbar){
        topbar.innerHTML = html;
        setupAdminSearch();

        setTimeout(function(){
          loadAdminNotifications();
        },300);
      }

    })
    .catch(function(error){
      console.log("Admin topbar load failed", error);
    });

}

function setupAdminFolders(){
  document.querySelectorAll(".menu-folder").forEach(function(button){
    button.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();
      toggleAdminFolder(button.getAttribute("data-target"));
    };
  });
}

function toggleAdminFolder(id){
  var menu = document.getElementById(id);

  if(!menu){
    return;
  }

  document.querySelectorAll(".submenu").forEach(function(item){
    if(item.id !== id){
      item.classList.remove("open");
    }
  });

  menu.classList.toggle("open");
}

function setupAdminSearch(){
  var search = document.getElementById("adminGlobalSearch");

  if(!search){
    return;
  }

  search.addEventListener("keydown", function(e){
    if(e.key !== "Enter"){
      return;
    }

    var q = String(search.value || "").trim().toLowerCase();

    if(!q){
      return;
    }

    if(q.includes("message") || q.includes("inbox") || q.includes("reply")){
      location.href = "admin-message-centre.html";
      return;
    }

    if(q.includes("buyer") || q.includes("bulk") || q.includes("global")){
      location.href = "admin-global-buyer-network.html";
      return;
    }

    if(q.includes("stock") || q.includes("bike") || q.includes("motorcycle")){
      location.href = "admin-stock.html";
      return;
    }

    if(q.includes("customer") || q.includes("member") || q.includes("profile")){
      location.href = "admin-customers.html";
      return;
    }

    if(q.includes("ship") || q.includes("logistic") || q.includes("container")){
      location.href = "admin-logistics.html";
      return;
    }

    if(q.includes("market") || q.includes("intelligence") || q.includes("country")){
      location.href = "admin-market-intelligence.html";
      return;
    }

    location.href = "admin-enquiries.html";
  });
}

function toggleAdminNotifications(){
  var panel = document.getElementById("adminNotificationPanel");

  if(panel){
    panel.classList.toggle("open");
  }
}

document.addEventListener("click", function(e){
  var panel = document.getElementById("adminNotificationPanel");
  var bell = document.querySelector(".admin-bell");

  if(!panel || !bell){
    return;
  }

  if(!panel.contains(e.target) && !bell.contains(e.target)){
    panel.classList.remove("open");
  }
});

function createAdminSupabaseClient(){
  if(typeof supabase === "undefined"){
    return null;
  }

  const SUPABASE_URL = "https://tuehtnezhdnkqbbhttgp.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK";

  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function escapeNotificationHtml(value){
  return String(value || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getClearedBulkBuyerIds(){
  try{
    const raw = localStorage.getItem("anybike_cleared_bulk_buyer_notifications");
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.map(String) : [];
  }catch(error){
    return [];
  }
}

function saveClearedBulkBuyerIds(ids){
  try{
    const clean = Array.from(new Set((ids || []).map(String))).slice(-500);
    localStorage.setItem(
      "anybike_cleared_bulk_buyer_notifications",
      JSON.stringify(clean)
    );
  }catch(error){
    console.log("Could not save cleared bulk-buyer notifications", error);
  }
}

function isNewBulkBuyerStatus(status){
  const value = String(status || "").trim().toLowerCase();

  return !value ||
    value === "new" ||
    value === "new potential buyer" ||
    value === "new buyer registered";
}

async function loadAdminNotifications(){
  const sb = createAdminSupabaseClient();

  if(!sb){
    return;
  }

  const results = await Promise.all([
    sb
      .from("message_centre_threads")
      .select("id, customer_name, customer_email, country, source_type, subject, status, bike_make, bike_model, bike_year, last_message, last_message_at, last_sender, related_enquiry_id")
      .in("status", ["New", "Needs Reply"])
      .order("last_message_at", {ascending:false})
      .limit(100),

    sb
      .from("global_buyer_network")
      .select("id, business_name, contact_name, email, country, status, lead_source, created_at, internal_notes")
      .order("created_at", {ascending:false})
      .limit(100)
  ]);

  const threadResult = results[0];
  const buyerResult = results[1];

  if(threadResult.error){
    console.log("Notification thread load failed", threadResult.error.message);
  }

  if(buyerResult.error){
    console.log("Global buyer notification load failed", buyerResult.error.message);
  }

  const notificationRows = [];

  if(!threadResult.error){
    const uniqueMap = new Map();

    (threadResult.data || []).forEach(function(t){
      const sender = String(t.last_sender || "").toLowerCase();

      if(!sender.includes("customer")){
        return;
      }

      const key = t.related_enquiry_id
        ? "enquiry-" + String(t.related_enquiry_id)
        : "thread-" + String(t.id);

      if(!uniqueMap.has(key)){
        uniqueMap.set(key, t);
      }
    });

    Array.from(uniqueMap.values()).forEach(function(t){
      notificationRows.push({
        type:"message",
        id:String(t.id),
        sortDate:t.last_message_at || "",
        title:t.customer_name || t.customer_email || "Customer",
        subtitle:[t.bike_year, t.bike_make, t.bike_model]
          .filter(Boolean)
          .join(" ") || t.subject || t.source_type || "Message",
        preview:t.last_message || "",
        country:t.country || "",
        status:t.status || "",
        relatedEnquiryId:t.related_enquiry_id || null
      });
    });
  }

  if(!buyerResult.error){
    const clearedBuyerIds = getClearedBulkBuyerIds();

    (buyerResult.data || []).forEach(function(b){
      if(!isNewBulkBuyerStatus(b.status)){
        return;
      }

      if(clearedBuyerIds.includes(String(b.id))){
        return;
      }

      notificationRows.push({
        type:"bulk-buyer",
        id:String(b.id),
        sortDate:b.created_at || "",
        title:b.business_name || b.contact_name || b.email || "New bulk buyer",
        subtitle:"Global Buyer Network request",
        preview:b.contact_name
          ? "New request from " + b.contact_name
          : "A new bulk motorcycle request has arrived.",
        country:b.country || "",
        status:b.status || "New Buyer Registered",
        relatedEnquiryId:null
      });
    });
  }

  notificationRows.sort(function(a,b){
    return new Date(b.sortDate || 0) - new Date(a.sortDate || 0);
  });

  updateAdminNotificationBadge(notificationRows.length);
  renderAdminNotificationList(notificationRows);
}

function updateAdminNotificationBadge(count){
  document.querySelectorAll("#adminNotificationCount, .admin-bell-count").forEach(function(badge){
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
    badge.style.alignItems = "center";
    badge.style.justifyContent = "center";
  });

  const status = document.getElementById("adminNotificationStatus");

  if(status){
    status.textContent = count > 0 ? count + " waiting" : "Live";
  }
}

function renderAdminNotificationList(rows){
  let notificationHtml = "";

  if(rows.length){
    notificationHtml = rows.slice(0,12).map(function(row){
      const title = escapeNotificationHtml(row.title);
      const subtitle = escapeNotificationHtml(row.subtitle);
      const preview = escapeNotificationHtml(String(row.preview || "").substring(0,90));
      const country = escapeNotificationHtml(row.country || "");
      const when = row.sortDate ? timeAgo(row.sortDate) : "";
      const initial = escapeNotificationHtml(String(row.title || "?").charAt(0).toUpperCase());

      if(row.type === "bulk-buyer"){
        const link = "admin-global-buyer-network.html?buyer=" + encodeURIComponent(row.id);

        return `
<a class="admin-notification-item"
   href="${link}"
   style="display:flex;gap:12px;align-items:flex-start;"
   onclick="markBulkBuyerNotificationOpened('${escapeNotificationHtml(row.id)}')">

  <div class="notify-avatar"
       style="width:38px;height:38px;min-width:38px;border-radius:50%;background:#ed1c24;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;line-height:1;">
    ${initial}
  </div>

  <div class="notify-content" style="min-width:0;flex:1;">
    <div class="notify-top" style="display:flex;justify-content:space-between;gap:10px;">
      <strong>${title}</strong>
      <span>🆕</span>
    </div>

    <div class="notify-bike">🌍 ${subtitle}</div>
    <div class="notify-preview">${preview}</div>

    <div class="notify-footer" style="display:flex;justify-content:space-between;gap:12px;margin-top:5px;">
      <span>${country}</span>
      <span>${escapeNotificationHtml(when)}</span>
    </div>

    <button
      type="button"
      class="notify-clear"
      onclick="event.preventDefault();event.stopPropagation();clearBulkBuyerNotification('${escapeNotificationHtml(row.id)}')">
      Clear
    </button>
  </div>

</a>
`;
      }

      const bikeLink = row.relatedEnquiryId
        ? "admin-enquiries.html?open=" + encodeURIComponent(row.relatedEnquiryId) + "&focus=messages"
        : "admin-message-centre.html?thread=" + encodeURIComponent(row.id);

      const dot = row.status === "New" ? "🔴" : "🟢";

      return `
<a class="admin-notification-item"
   href="${bikeLink}"
   style="display:flex;gap:12px;align-items:flex-start;">

  <div class="notify-avatar"
       style="width:38px;height:38px;min-width:38px;border-radius:50%;background:#ed1c24;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;line-height:1;">
    ${initial}
  </div>

  <div class="notify-content" style="min-width:0;flex:1;">
    <div class="notify-top" style="display:flex;justify-content:space-between;gap:10px;">
      <strong>${title}</strong>
      <span>${dot}</span>
    </div>

    <div class="notify-bike">🏍 ${subtitle}</div>
    <div class="notify-preview">${preview}</div>

    <div class="notify-footer" style="display:flex;justify-content:space-between;gap:12px;margin-top:5px;">
      <span>${country}</span>
      <span>${escapeNotificationHtml(when)}</span>
    </div>

    <button
      type="button"
      class="notify-clear"
      onclick="event.preventDefault();event.stopPropagation();markThreadHandled(event,'${escapeNotificationHtml(row.id)}')">
      Clear
    </button>
  </div>

</a>
`;
    }).join("");
  }else{
    notificationHtml = `
      <div class="admin-notification-item">
        <strong>No admin actions waiting</strong>
        <small>New messages and Global Buyer requests will appear here.</small>
      </div>
    `;
  }

  document.querySelectorAll("#adminNotificationList, .admin-notification-list").forEach(function(list){
    list.innerHTML = notificationHtml;
  });
}

function markBulkBuyerNotificationOpened(buyerId){
  const ids = getClearedBulkBuyerIds();

  if(!ids.includes(String(buyerId))){
    ids.push(String(buyerId));
    saveClearedBulkBuyerIds(ids);
  }
}

function clearBulkBuyerNotification(buyerId){
  markBulkBuyerNotificationOpened(buyerId);
  loadAdminNotifications();
}

async function markThreadHandled(e, threadId){

  e.preventDefault();
  e.stopPropagation();

  const sb = createAdminSupabaseClient();

  if(!sb){
    return;
  }

  const { error } = await sb
    .from("message_centre_threads")
    .update({
      status: "Closed"
    })
    .eq("id", threadId);

  if(error){
    console.log(error);
    return;
  }

  loadAdminNotifications();
}

function timeAgo(date){
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

  if(seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if(minutes < 60) return minutes + " min ago";

  const hours = Math.floor(minutes / 60);
  if(hours < 24) return hours + " hrs ago";

  const days = Math.floor(hours / 24);
  return days + " days ago";
}

/* Backwards-compatible name retained for pages that still call it directly. */
function loadMessageCentreNotifications(){
  return loadAdminNotifications();
}

loadAdminShell();

setInterval(loadAdminNotifications, 60000);