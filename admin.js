/*
AnyBike
File: admin.js
Version: 12.2
Date: 15 July 2026

Security
✓ Hides admin content until the Supabase admin session is verified
✓ Keeps browser back/forward cached admin pages hidden after logout
✓ Rechecks the session on pageshow, focus and visibility changes
✓ Preserves sidebar, topbar, search and notifications
✓ Removes authorised email addresses from browser code
✓ Checks the protected Supabase admin_users table by authenticated user ID
*/

(function protectAdminPageImmediately(){
  document.documentElement.classList.add("admin-auth-pending");

  const style=document.createElement("style");
  style.id="anybike-admin-auth-guard";
  style.textContent=`
    html.admin-auth-pending body{
      visibility:hidden !important;
      pointer-events:none !important;
    }
  `;

  (document.head || document.documentElement).appendChild(style);
})();


let anybikeAdminSupabase = null;
let anybikeAdminUser = null;
let anybikeAdminRecord = null;

function getAdminSupabaseClient(){
if(anybikeAdminSupabase){
return anybikeAdminSupabase;
}

if(typeof supabase === "undefined"){
return null;
}

const SUPABASE_URL = "https://tuehtnezhdnkqbbhttgp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK";

anybikeAdminSupabase = supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);

return anybikeAdminSupabase;
}


async function requireAdminSession(){
  const client=getAdminSupabaseClient();

  document.documentElement.classList.add("admin-auth-pending");

  if(!client){
    console.error("Supabase client is unavailable on this admin page.");

    window.location.replace(
      "/admin-login.html?error=supabase"
    );

    return false;
  }

  try{
    const {
      data,
      error
    }=await client.auth.getSession();

    if(error){
      console.warn("Admin session check failed",error.message);
    }

    const user=data?.session?.user || null;

    if(!user){
      const returnUrl=
        window.location.pathname +
        window.location.search +
        window.location.hash;

      window.location.replace(
        "/admin-login.html?return=" +
        encodeURIComponent(returnUrl)
      );

      return false;
    }

    const {
      data:adminRecord,
      error:adminError
    }=await client
      .from("admin_users")
      .select("user_id,full_name,role,department,active")
      .eq("user_id",user.id)
      .eq("active",true)
      .maybeSingle();

    if(adminError){
      console.warn("Admin authorisation check failed",adminError.message);

      await client.auth.signOut({
        scope:"local"
      });

      window.location.replace(
        "/admin-login.html?error=admin-check"
      );

      return false;
    }

    if(!adminRecord){
      await client.auth.signOut({
        scope:"local"
      });

      window.location.replace(
        "/admin-login.html?error=not-authorized"
      );

      return false;
    }

    anybikeAdminUser=user;
    anybikeAdminRecord=adminRecord;

    document.documentElement.classList.remove("admin-auth-pending");

    return true;

  }catch(error){
    console.warn("Admin session check failed",error);

    const returnUrl=
      window.location.pathname +
      window.location.search +
      window.location.hash;

    window.location.replace(
      "/admin-login.html?return=" +
      encodeURIComponent(returnUrl)
    );

    return false;
  }
}

async function setupAdminIdentity(){
const nameEl = document.getElementById("adminProfileName");
const emailEl = document.getElementById("adminProfileEmail");

if(!anybikeAdminUser){
return;
}

const displayName =
anybikeAdminRecord?.full_name ||
anybikeAdminUser.user_metadata?.full_name ||
anybikeAdminUser.user_metadata?.name ||
"AnyBike Admin";

if(nameEl){
nameEl.textContent = displayName;
}

if(emailEl){
emailEl.textContent = anybikeAdminUser.email || "";
emailEl.title = anybikeAdminUser.email || "";
}
}

async function adminLogout(){
  const client=getAdminSupabaseClient();

  /*
    Hide the current document before it enters the browser's
    back/forward cache. If restored later, the cached snapshot
    remains hidden until requireAdminSession() succeeds.
  */
  document.documentElement.classList.add("admin-auth-pending");

  try{
    if(client){
      await client.auth.signOut({
        scope:"local"
      });
    }
  }catch(error){
    console.warn("Admin logout failed",error);
  }

  anybikeAdminUser=null;
  anybikeAdminRecord=null;

  try{
    sessionStorage.removeItem("anybike_admin_authenticated");
  }catch(error){
    // Storage may be unavailable in private browsing.
  }

  window.location.replace("/admin-login.html");
}

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
    setupAdminIdentity();

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
return getAdminSupabaseClient();
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
  admin-notifications.js is the single source of truth for the shared
  admin bell.

  This admin.js file keeps authentication, admin_users verification,
  sidebar/topbar loading, search, identity and session rechecks intact.

  It must NOT independently rebuild the bell from:
  - message_centre_threads
  - global_buyer_network

  That duplicate behaviour was causing historical business records to
  overwrite the real notification count.
*/

async function loadAdminNotifications(){
  if(typeof window.loadSharedAdminNotifications === "function"){
    return window.loadSharedAdminNotifications();
  }
}

function updateAdminNotificationBadge(){
  /* Compatibility no-op. Owned by admin-notifications.js. */
}

function renderAdminNotificationList(){
  /* Compatibility no-op. Owned by admin-notifications.js. */
}

function markBulkBuyerNotificationOpened(){
  /*
    Compatibility no-op.
    Opening a bell notification must not change Global Buyer workflow state.
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
    Compatibility no-op.
    Clearing a notification must never close a Message Centre thread.
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
  return loadAdminNotifications();
}

let anybikeAdminInitialised=false;
let anybikeAdminRecheckRunning=false;
let anybikeAdminNotificationTimer=null;

async function recheckAdminSession(){
  if(anybikeAdminRecheckRunning){
    return false;
  }

  anybikeAdminRecheckRunning=true;

  try{
    return await requireAdminSession();
  }finally{
    anybikeAdminRecheckRunning=false;
  }
}

async function initialiseAdmin(){
  const allowed=await recheckAdminSession();

  if(!allowed){
    return;
  }

  if(!anybikeAdminInitialised){
    anybikeAdminInitialised=true;

    loadAdminShell();
    loadAdminNotifications();

    anybikeAdminNotificationTimer=setInterval(
      loadAdminNotifications,
      60000
    );
  }
}

/*
  Mark the document hidden before the browser stores it in
  back/forward cache. A valid session will reveal it again.
*/
window.addEventListener("pagehide",function(){
  document.documentElement.classList.add("admin-auth-pending");
});

window.addEventListener("pageshow",async function(){
  document.documentElement.classList.add("admin-auth-pending");

  const allowed=await recheckAdminSession();

  if(allowed && !anybikeAdminInitialised){
    initialiseAdmin();
  }
});

window.addEventListener("focus",async function(){
  if(document.visibilityState !== "visible"){
    return;
  }

  await recheckAdminSession();
});

document.addEventListener("visibilitychange",async function(){
  if(document.visibilityState !== "visible"){
    return;
  }

  await recheckAdminSession();
});

initialiseAdmin();
