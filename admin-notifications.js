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
        },300);
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

  search.addEventListener("keydown",function(e){

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


/*
  ADMIN NOTIFICATION CUTOVER
  --------------------------
  Everything created BEFORE this repair timestamp is historical and is
  automatically marked read in admin_notifications.

  Only notifications created AFTER this timestamp may appear in the bell.

  This changes ONLY admin_notifications.is_read.
  It does NOT:
  - close Message Centre threads
  - change buyer status
  - change lead/deal status
  - alter instant/live messaging
*/
var ANYBIKE_ADMIN_NOTIFICATION_CUTOVER =
  "2026-09-16T12:55:00.000Z";

var anybikeAdminNotificationRefreshTimer = null;
var anybikeAdminHistoricalCleanupDone = false;


async function clearHistoricalSharedAdminNotifications(){

  if(anybikeAdminHistoricalCleanupDone){
    return true;
  }

  if(!window.sb){
    return false;
  }

  try{

    var result = await window.sb
      .from("admin_notifications")
      .update({
        is_read:true
      })
      .eq("is_read",false)
      .lt("created_at",ANYBIKE_ADMIN_NOTIFICATION_CUTOVER);

    if(result.error){
      throw result.error;
    }

    anybikeAdminHistoricalCleanupDone = true;
    return true;

  }catch(err){

    console.warn(
      "Historical admin notification cleanup failed:",
      err
    );

    return false;
  }
}


async function loadSharedAdminNotifications(){

  if(!window.sb){
    return;
  }

  var countEl =
    document.getElementById("adminNotificationCount");

  var listEl =
    document.getElementById("adminNotificationList");

  var statusEl =
    document.getElementById("adminNotificationStatus");

  if(!countEl || !listEl){
    return;
  }

  /*
    First clear every pre-cutover unread record from the database.
  */
  await clearHistoricalSharedAdminNotifications();

  /*
    Then load only genuinely new post-cutover unread notifications.
  */
  var result = await window.sb
    .from("admin_notifications")
    .select("*")
    .eq("is_read",false)
    .gte("created_at",ANYBIKE_ADMIN_NOTIFICATION_CUTOVER)
    .order("created_at",{ascending:false})
    .limit(50);

  if(result.error){

    console.warn(
      "Admin notifications failed:",
      result.error.message
    );

    if(statusEl){
      statusEl.textContent = "Error";
    }

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
      unique.set(key,n);
    }
  });

  notifications = Array.from(unique.values());

  updateSharedAdminNotificationBadge(
    notifications.length
  );

  if(!notifications.length){

    listEl.innerHTML =
      '<div class="admin-notification-item">' +
        '<div>' +
          '<strong>No notifications</strong><br>' +
          '<small>New admin alerts will appear here.</small>' +
        '</div>' +
      '</div>';

    if(statusEl){
      statusEl.textContent = "Live";
    }

    return;
  }

  listEl.innerHTML =
    notifications.map(function(n){

      var title =
        n.title ||
        n.type ||
        "Admin notification";

      var message =
        n.message ||
        n.body ||
        "";

      var created =
        n.created_at
          ? new Date(n.created_at)
              .toLocaleString("en-GB")
          : "";

      var link =
        adminNotificationUrl(n);

      var id =
        String(n.id || "");

      return '' +

        '<div class="admin-notification-item" ' +
             'style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;">' +

          '<a href="' +
            escapeSharedAdminHtml(link) +
            '" ' +
            'style="display:block;min-width:0;flex:1;color:inherit;text-decoration:none;" ' +
            'onclick="markSharedAdminNotificationRead(\'' +
              escapeSharedAdminHtml(id) +
            '\')">' +

            '<div>' +
              '<strong>' +
                escapeSharedAdminHtml(title) +
              '</strong><br>' +

              '<small>' +
                escapeSharedAdminHtml(
                  message.slice(0,120)
                ) +
              '</small><br>' +

              '<small>' +
                escapeSharedAdminHtml(created) +
              '</small>' +
            '</div>' +

          '</a>' +

          '<button type="button" ' +
            'class="notify-clear" ' +
            'style="flex:0 0 auto;" ' +
            'onclick="clearSharedAdminNotification(event,\'' +
              escapeSharedAdminHtml(id) +
            '\')">' +
            'Clear' +
          '</button>' +

        '</div>';
    }).join("");

  if(statusEl){

    statusEl.textContent =
      notifications.length +
      " waiting";
  }
}


function updateSharedAdminNotificationBadge(count){

  document
    .querySelectorAll(
      "#adminNotificationCount, .admin-bell-count"
    )
    .forEach(function(countEl){

      countEl.textContent =
        String(count || 0);

      countEl.style.display =
        count > 0
          ? "flex"
          : "none";
    });

  var statusEl =
    document.getElementById(
      "adminNotificationStatus"
    );

  if(statusEl){

    statusEl.textContent =
      count > 0
        ? count + " waiting"
        : "Live";
  }
}


function adminNotificationUrl(n){

  var enquiryId =
    n.enquiry_id ||
    n.bike_enquiry_id ||
    n.related_enquiry_id ||
    n.enquiryId;

  if(enquiryId){

    return (
      "admin-enquiries.html?open=" +
      encodeURIComponent(enquiryId) +
      "&focus=messages"
    );
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

    var result = await window.sb
      .from("admin_notifications")
      .update({
        is_read:true
      })
      .eq("id",id);

    if(result.error){

      console.warn(
        "Notification read update failed:",
        result.error.message
      );
    }

  }catch(err){

    console.warn(
      "Notification read failed",
      err
    );
  }
}


async function clearSharedAdminNotification(event,id){

  if(event){
    event.preventDefault();
    event.stopPropagation();
  }

  if(!window.sb || !id){
    return;
  }

  var clickedButton =
    event && event.currentTarget
      ? event.currentTarget
      : null;

  if(clickedButton){
    clickedButton.disabled = true;
    clickedButton.textContent = "Clearing...";
  }

  try{

    var result = await window.sb
      .from("admin_notifications")
      .update({
        is_read:true
      })
      .eq("id",id);

    if(result.error){
      throw result.error;
    }

    await loadSharedAdminNotifications();

  }catch(err){

    console.warn(
      "Admin notification clear failed",
      err
    );

    if(clickedButton){
      clickedButton.disabled = false;
      clickedButton.textContent = "Clear";
    }
  }
}


async function clearAllSharedAdminNotifications(){

  if(!window.sb){
    return;
  }

  try{

    var result = await window.sb
      .from("admin_notifications")
      .update({
        is_read:true
      })
      .eq("is_read",false);

    if(result.error){
      throw result.error;
    }

    await loadSharedAdminNotifications();

  }catch(err){

    console.warn(
      "Could not clear all admin notifications",
      err
    );
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

  var panel =
    document.getElementById(
      "adminNotificationPanel"
    );

  if(panel){
    panel.classList.toggle("open");
  }
}


document.addEventListener(
  "click",
  function(e){

    var panel =
      document.getElementById(
        "adminNotificationPanel"
      );

    var bell =
      document.querySelector(
        ".admin-bell"
      );

    if(!panel || !bell){
      return;
    }

    if(
      !panel.contains(e.target) &&
      !bell.contains(e.target)
    ){
      panel.classList.remove("open");
    }
  }
);


document.addEventListener(
  "DOMContentLoaded",
  function(){

    loadAdminShell();

    if(anybikeAdminNotificationRefreshTimer){

      clearInterval(
        anybikeAdminNotificationRefreshTimer
      );
    }

    anybikeAdminNotificationRefreshTimer =
      setInterval(
        function(){
          loadSharedAdminNotifications();
        },
        60000
      );
  }
);
