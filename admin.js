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
          if(typeof window.loadSharedAdminNotifications === "function"){
            window.loadSharedAdminNotifications();
          }
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

/*
  ADMIN NOTIFICATION OWNERSHIP
  ----------------------------
  Notifications are owned by admin-notifications.js.

  admin.js must not independently rebuild the bell from Message Centre
  threads or Global Buyer records. Keeping one owner prevents old business
  records from overwriting the real notification badge.
*/

async function loadAdminNotifications(){
  if(typeof window.loadSharedAdminNotifications === "function"){
    return window.loadSharedAdminNotifications();
  }
}

function updateAdminNotificationBadge(){
  /*
    Retained only for backwards compatibility with older admin pages.
    Badge rendering is owned by admin-notifications.js.
  */
}

function renderAdminNotificationList(){
  /*
    Retained only for backwards compatibility with older admin pages.
    Notification list rendering is owned by admin-notifications.js.
  */
}

function markBulkBuyerNotificationOpened(){
  /*
    Legacy no-op. Opening/clearing a notification must not alter
    Global Buyer business status.
  */
}

function clearBulkBuyerNotification(){
  if(typeof window.loadSharedAdminNotifications === "function"){
    return window.loadSharedAdminNotifications();
  }
}

async function markThreadHandled(event){
  event?.preventDefault?.();
  event?.stopPropagation?.();

  /*
    Legacy no-op. A notification Clear action must never close a
    Message Centre thread.
  */
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
  if(typeof window.loadSharedAdminNotifications === "function"){
    return window.loadSharedAdminNotifications();
  }
}

loadAdminShell();

setInterval(function(){
  if(typeof window.loadSharedAdminNotifications === "function"){
    window.loadSharedAdminNotifications();
  }
},60000);
