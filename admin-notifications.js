/*
  AnyBike Admin Notifications
  Single source of truth for the shared admin bell.

  Rules:
  - Reads only admin_notifications.
  - Does not read Global Buyer pipeline rows directly.
  - Does not read Message Centre thread statuses directly.
  - Clear only marks admin_notifications.is_read = true.
  - Never closes a Message Centre thread.
  - Never changes a buyer/deal/lead status.
  - Does not alter instant/live messaging.
*/

var ANYBIKE_ADMIN_NOTIFICATION_RESET_KEY =
  "anybike_admin_notifications_reset_20260916_v1";

var anybikeAdminNotificationRefreshTimer = null;
var anybikeAdminNotificationResetRunning = false;


async function initialiseAdminNotificationReset(){

  if(!window.sb){
    return false;
  }

  /*
    One-time clean reset for the existing stale notification backlog.
    After this succeeds, future notifications behave normally.
  */
  try{
    if(
      localStorage.getItem(
        ANYBIKE_ADMIN_NOTIFICATION_RESET_KEY
      ) === "done"
    ){
      return true;
    }
  }catch(error){
    /* Continue even if localStorage is unavailable. */
  }

  if(anybikeAdminNotificationResetRunning){
    return false;
  }

  anybikeAdminNotificationResetRunning = true;

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

    try{
      localStorage.setItem(
        ANYBIKE_ADMIN_NOTIFICATION_RESET_KEY,
        "done"
      );
    }catch(error){
      /* Database reset already succeeded. */
    }

    return true;

  }catch(error){

    console.warn(
      "Initial admin notification reset failed:",
      error
    );

    return false;

  }finally{
    anybikeAdminNotificationResetRunning = false;
  }
}


async function loadSharedAdminNotifications(){

  if(!window.sb){
    return;
  }

  var countEl =
    document.getElementById(
      "adminNotificationCount"
    );

  var listEl =
    document.getElementById(
      "adminNotificationList"
    );

  var statusEl =
    document.getElementById(
      "adminNotificationStatus"
    );

  if(!countEl || !listEl){
    return;
  }

  await initialiseAdminNotificationReset();

  var result = await window.sb
    .from("admin_notifications")
    .select("*")
    .eq("is_read",false)
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

  notifications =
    Array.from(unique.values());

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
            'onclick="markSharedAdminNotificationRead(event,\'' +
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
    .forEach(function(badge){

      badge.textContent =
        String(count || 0);

      badge.style.display =
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


async function markSharedAdminNotificationRead(
  event,
  id
){

  if(event){
    event.preventDefault();
  }

  if(!window.sb || !id){
    return;
  }

  var target =
    event &&
    event.currentTarget &&
    event.currentTarget.getAttribute
      ? event.currentTarget.getAttribute(
          "href"
        )
      : "";

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

  }catch(error){

    console.warn(
      "Notification read update failed:",
      error
    );
  }

  if(target){
    window.location.href = target;
  }
}


async function clearSharedAdminNotification(
  event,
  id
){

  if(event){
    event.preventDefault();
    event.stopPropagation();
  }

  if(!window.sb || !id){
    return;
  }

  var button =
    event && event.currentTarget
      ? event.currentTarget
      : null;

  if(button){
    button.disabled = true;
    button.textContent = "Clearing...";
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

  }catch(error){

    console.warn(
      "Admin notification clear failed:",
      error
    );

    if(button){
      button.disabled = false;
      button.textContent = "Clear";
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

  }catch(error){

    console.warn(
      "Could not clear all admin notifications:",
      error
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
  function(event){

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
      !panel.contains(event.target) &&
      !bell.contains(event.target)
    ){
      panel.classList.remove("open");
    }
  }
);


document.addEventListener(
  "DOMContentLoaded",
  function(){

    /*
      admin.js owns loading the shared sidebar/topbar.
      This file owns the notification data only.
    */
    setTimeout(function(){
      loadSharedAdminNotifications();
    },500);

    if(anybikeAdminNotificationRefreshTimer){
      clearInterval(
        anybikeAdminNotificationRefreshTimer
      );
    }

    anybikeAdminNotificationRefreshTimer =
      setInterval(
        loadSharedAdminNotifications,
        60000
      );
  }
);
