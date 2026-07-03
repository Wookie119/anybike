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
        if(link.getAttribute("href") === currentPage){
          link.classList.add("active");
        }
      });

    });

fetch("admin-topbar.html?v=4000")
    .then(function(res){
      return res.text();
    })
    .then(function(html){

      var topbar = document.getElementById("adminTopbar");

      if(topbar){
        topbar.innerHTML = html;

        // Wait until the topbar exists, then load the notification bell
        setTimeout(function(){
          loadMessageCentreNotifications();
        },100);
      }

      setupAdminSearch();

    });

}

function setupAdminFolders(){
  document.addEventListener("click", function(e){
    const button = e.target.closest(".menu-folder");

    if(!button){
      return;
    }

    toggleAdminFolder(button.getAttribute("data-target"));
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
async function loadMessageCentreNotifications(){
  if(typeof supabase === "undefined"){
    return;
  }

  const SUPABASE_URL = "https://tuehtnezhdnkqbbhttgp.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK";
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const {data, error} = await sb
    .from("message_centre_threads")
.select("id, customer_name, country, source_type, bike_make, bike_model, last_message, last_message_at, last_sender, status")
    .eq("last_sender", "Customer")
    .order("last_message_at", {ascending:false});

  if(error){
    console.log("Notification load failed", error.message);
    return;
  }

  const count = data ? data.length : 0;

  document.querySelectorAll("#adminNotificationCount, #notificationCount, .notification-count, .admin-notification-count, .admin-bell-count")
    .forEach(function(badge){
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-block" : "none";
    });

  document.querySelectorAll("#adminNotificationPanel, #notificationPanel, #adminNotificationList")
  .forEach(function(panel){

    panel.innerHTML = count
      ? data.slice(0,8).map(function(n){

          const bike = [n.bike_make, n.bike_model].filter(Boolean).join(" ");
          const customer = n.customer_name || "Customer reply";
          const preview = n.last_message || "";
          const country = n.country || "";
          const link = "admin-message-centre.html?thread=" + encodeURIComponent(n.id);

          return `
            <a href="${link}" style="display:block;padding:10px;border-bottom:1px solid rgba(255,255,255,.12);color:#fff;text-decoration:none;">
              <strong>💬 ${customer}</strong><br>
              <small>${country} ${bike}</small><br>
              <span>${preview}</span>
            </a>
          `;

        }).join("")
      : `<div style="padding:12px;color:#aaa;">No new customer replies.</div>`;

  });

}


loadAdminShell();


setInterval(loadMessageCentreNotifications, 60000);
