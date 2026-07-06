function loadAdminShell(){

  var sidebar = document.getElementById("adminSidebar");
  var topbar = document.getElementById("adminTopbar");

  if(sidebar){
    fetch("admin-sidebar.html")
      .then(function(res){
        return res.text();
      })
      .then(function(html){
        sidebar.innerHTML = html;

        var currentPage = window.location.pathname.split("/").pop() || "admin-dashboard.html";

        document.querySelectorAll(".admin-menu a").forEach(function(link){
          if(link.getAttribute("href") === currentPage){
            link.classList.add("active");
          }
        });
      })
      .catch(function(){
        sidebar.innerHTML =
          '<aside class="admin-sidebar">' +
            '<div style="font-weight:900;color:#fff;margin-bottom:16px;">AnyBike Admin</div>' +
            '<nav class="admin-menu">' +
              '<a href="admin-dashboard.html"><span class="menu-icon">🏠</span><span class="menu-text">Dashboard</span></a>' +
              '<a href="admin-enquiries.html"><span class="menu-icon">💬</span><span class="menu-text">Bike Sales</span></a>' +
              '<a href="admin-customers.html"><span class="menu-icon">👥</span><span class="menu-text">Customers</span></a>' +
              '<a href="admin-stock.html"><span class="menu-icon">🏍️</span><span class="menu-text">Stock</span></a>' +
            '</nav>' +
          '</aside>';
      });
  }

 if(topbar){
  fetch("admin-topbar.html")
    .then(function(res){
      return res.text();
    })
    .then(function(html){
      topbar.innerHTML = html;
      setupAdminSearch();

      setTimeout(function(){
        loadSharedAdminNotifications();
      }, 300);
    })
    .catch(function(){
      topbar.innerHTML = "";
    });
}
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
async function loadSharedAdminNotifications(){

  if(!window.sb){
    return;
  }

  var countEl = document.getElementById("adminNotificationCount");
  var listEl = document.getElementById("adminNotificationList");
  var statusEl = document.getElementById("adminNotificationStatus");

  if(!countEl || !listEl){
    return;
  }

  var result = await window.sb
    .from("admin_notifications")
    .select("*")
    .eq("is_read", false)
    .order("created_at", { ascending:false })
    .limit(20);

  if(result.error){
    console.warn("Admin notifications failed:", result.error.message);
    if(statusEl){ statusEl.textContent = "Error"; }
    return;
  }

  var notifications = result.data || [];
  var unique = new Map();

  notifications.forEach(function(n){
    var key =
      String(n.enquiry_id || "") + "|" +
      String(n.bike_enquiry_id || "") + "|" +
      String(n.related_enquiry_id || "") + "|" +
      String(n.link || "") + "|" +
      String(n.title || "") + "|" +
      String(n.message || "");

    if(!unique.has(key)){
      unique.set(key, n);
    }
  });

  notifications = Array.from(unique.values());

  if(!notifications.length){
    countEl.style.display = "none";
    countEl.textContent = "0";

    listEl.innerHTML =
      '<div class="admin-notification-item">' +
        '<div>' +
          '<strong>No notifications</strong><br>' +
          '<small>Admin alerts will appear here.</small>' +
        '</div>' +
      '</div>';

    if(statusEl){ statusEl.textContent = "Live"; }
    return;
  }

  countEl.style.display = "flex";
  countEl.textContent = notifications.length;

  listEl.innerHTML = notifications.map(function(n){
    var title = n.title || n.type || "Admin notification";
    var message = n.message || n.body || "";
    var created = n.created_at ? new Date(n.created_at).toLocaleString("en-GB") : "";
    var link = adminNotificationUrl(n);

    return '' +
      '<a class="admin-notification-item" href="' + escapeSharedAdminHtml(link) + '" onclick="markSharedAdminNotificationRead(\'' + escapeSharedAdminHtml(n.id) + '\')">' +
        '<div>' +
          '<strong>' + escapeSharedAdminHtml(title) + '</strong><br>' +
          '<small>' + escapeSharedAdminHtml(message.slice(0,120)) + '</small><br>' +
          '<small>' + escapeSharedAdminHtml(created) + '</small>' +
        '</div>' +
      '</a>';
  }).join("");

  if(statusEl){ statusEl.textContent = "Live"; }
}

function adminNotificationUrl(n){

  var enquiryId =
    n.enquiry_id ||
    n.bike_enquiry_id ||
    n.related_enquiry_id ||
    n.enquiryId;

  if(enquiryId){
    return "admin-enquiries.html?open=" + encodeURIComponent(enquiryId) + "&focus=messages";
  }

  if(n.link){
    return n.link;
  }

  return "admin-dashboard.html";
}

async function markSharedAdminNotificationRead(id){

  if(!window.sb || !id){
    return;
  }

  try{
    await window.sb
      .from("admin_notifications")
      .update({ is_read:true })
      .eq("id", id);
  }catch(err){
    console.warn("Notification read failed", err);
  }
}

function escapeSharedAdminHtml(value){
  return String(value || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
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

document.addEventListener("DOMContentLoaded", function(){
  loadAdminShell();
});
