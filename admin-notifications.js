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


/*
  Use the authenticated Supabase client already owned by admin.js.

  Important:
  - admin.js exposes getAdminSupabaseClient()
  - page-level `const sb` is NOT window.sb
  - therefore admin notifications must not depend on window.sb
*/
function getSharedAdminNotificationClient(){

  if(typeof getAdminSupabaseClient === "function"){
    return getAdminSupabaseClient();
  }

  if(typeof createAdminSupabaseClient === "function"){
    return createAdminSupabaseClient();
  }

  if(typeof sb !== "undefined" && sb){
    return sb;
  }

  return null;
}


async function initialiseAdminNotificationReset(){

  // Safety: never mass-mark unread admin notifications as read on page load.
  return true;

  var client = getSharedAdminNotificationClient();

  if(!client){
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

    var result = await client
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

  var client = getSharedAdminNotificationClient();

  if(!client){
    console.warn("Admin notification client is unavailable.");
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

  var result = await client
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

      var id =
        String(n.id || "");

      var link =
        appendAdminNotificationReadId(
          adminNotificationUrl(n),
          id
        );

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
              (link && link!=="admin-dashboard.html"
                ? '<div style="margin-top:10px"><span style="display:inline-block;background:#ed1c24;color:#fff;padding:8px 12px;border-radius:9px;font-weight:900;font-size:12px">OPEN NEXT ACTION →</span></div>'
                : '') +
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


function appendAdminNotificationReadId(url,id){
  if(!url || !id) return url || "admin-dashboard.html";
  try{
    var parsed=new URL(url,window.location.origin);
    parsed.searchParams.set("notification_read",String(id));
    return parsed.pathname+parsed.search+parsed.hash;
  }catch(error){
    var join=String(url).includes("?")?"&":"?";
    return String(url)+join+"notification_read="+encodeURIComponent(id);
  }
}

async function consumeAdminNotificationReadParam(){
  try{
    var params=new URLSearchParams(window.location.search);
    var id=params.get("notification_read");
    if(!id)return;

    var client=getSharedAdminNotificationClient();
    if(!client)return;

    client
      .from("admin_notifications")
      .update({is_read:true})
      .eq("id",id)
      .then(function(result){
        if(result && result.error){
          console.warn("Notification read update failed:",result.error);
          return;
        }

        params.delete("notification_read");
        var clean=window.location.pathname+
          (params.toString()?"?"+params.toString():"")+
          window.location.hash;
        window.history.replaceState(null,"",clean);
      })
      .catch(function(error){
        console.warn("Notification read update failed:",error);
      });
  }catch(error){
    console.warn("Notification read parameter could not be handled:",error);
  }
}

function adminNotificationUrl(n){

  /*
    Explicit notification actions always win.
    Payment alerts should open Accounts HQ; Deal alerts should open Deal 360.
    Only fall back to a generic enquiry/message route when no action link exists.
  */
  if(n && n.link){
    return n.link;
  }

  var message=String((n && (n.message || n.body)) || "");
  var paymentAction=message.match(/\/admin-accounts\.html\?payment_advice=\d+/i);
  if(paymentAction){
    return paymentAction[0];
  }

  var dealAction=message.match(/\/admin-enquiries\.html\?deal=\d+(?:&[^\s]+)?/i);
  if(dealAction){
    return dealAction[0];
  }

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

  return "admin-dashboard.html";
}


function markSharedAdminNotificationRead(
  event,
  id
){
  /*
    Navigation must be immediate. The destination page consumes
    ?notification_read=<id> and clears the alert there, so opening a
    notification never waits on a database round-trip first.
  */
  return true;
}


async function clearSharedAdminNotification(
  event,
  id
){

  if(event){
    event.preventDefault();
    event.stopPropagation();
  }

  var client = getSharedAdminNotificationClient();

  if(!client || !id){
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

    var result = await client
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

  var client = getSharedAdminNotificationClient();

  if(!client){
    return;
  }

  try{

    var result = await client
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



function enableAdminNotificationHover(){
  var bell=document.querySelector(".admin-bell");
  var panel=document.getElementById("adminNotificationPanel");
  if(!bell || !panel || bell.dataset.hoverNotifications==="1") return;

  bell.dataset.hoverNotifications="1";
  var closeTimer=null;

  function cancelClose(){
    if(closeTimer){
      clearTimeout(closeTimer);
      closeTimer=null;
    }
  }

  function openPanel(){
    cancelClose();
    panel.classList.add("open");
  }

  function scheduleClose(){
    cancelClose();
    closeTimer=setTimeout(function(){
      panel.classList.remove("open");
    },220);
  }

  bell.addEventListener("mouseenter",openPanel);
  bell.addEventListener("mouseleave",scheduleClose);
  panel.addEventListener("mouseenter",cancelClose);
  panel.addEventListener("mouseleave",scheduleClose);
}

document.addEventListener(
  "DOMContentLoaded",
  function(){

    /*
      admin.js owns loading the shared sidebar/topbar.
      This file owns the notification data only.
    */
    consumeAdminNotificationReadParam();

    setTimeout(function(){
      loadSharedAdminNotifications();
      enableAdminNotificationHover();
    },500);

    if(anybikeAdminNotificationRefreshTimer){
      clearInterval(
        anybikeAdminNotificationRefreshTimer
      );
    }

    anybikeAdminNotificationRefreshTimer =
      setInterval(
        loadSharedAdminNotifications,
        5000
      );
  }
);
