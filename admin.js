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


/*
  Keep staff/admin authentication separate from customer authentication.
  Both areas use the same Supabase project and therefore Supabase's default
  browser storage key would otherwise be shared. An admin page could then see
  a customer session as its own and sign it out as "not authorised".
*/
const ANYBIKE_ADMIN_AUTH_STORAGE_KEY = "anybike-admin-auth";

(function isolateAnyBikeAdminAuthStorage(){
  if(typeof supabase === "undefined" || supabase.__anybikeAdminAuthIsolated){
    return;
  }

  const originalCreateClient = supabase.createClient.bind(supabase);

  supabase.createClient = function(url,key,options){
    const nextOptions = Object.assign({},options || {});
    nextOptions.auth = Object.assign({},nextOptions.auth || {},{
      storageKey:ANYBIKE_ADMIN_AUTH_STORAGE_KEY,
      persistSession:true,
      autoRefreshToken:true,
      detectSessionInUrl:true
    });
    return originalCreateClient(url,key,nextOptions);
  };

  supabase.__anybikeAdminAuthIsolated = true;
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
const dropdownNameEl = document.getElementById("adminProfileDropdownName");
const dropdownRoleEl = document.getElementById("adminProfileDropdownRole");

if(!anybikeAdminUser){
return;
}

const displayName =
anybikeAdminRecord?.full_name ||
anybikeAdminUser.user_metadata?.full_name ||
anybikeAdminUser.user_metadata?.name ||
"AnyBike Admin";

const displayRole =
anybikeAdminRecord?.role ||
anybikeAdminRecord?.department ||
"Administrator";

if(nameEl){
nameEl.textContent = displayName;
}

if(dropdownNameEl){
dropdownNameEl.textContent = displayName;
}

if(dropdownRoleEl){
dropdownRoleEl.textContent = displayRole;
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

function ensureFreshAdminShellCss(){
  var existing=document.getElementById("anybike-admin-shell-refresh");
  if(existing){ return; }

  var link=document.createElement("link");
  link.id="anybike-admin-shell-refresh";
  link.rel="stylesheet";
  link.href="admin-shell.css?v=202610071152";
  document.head.appendChild(link);
}

function loadAdminShell(){

ensureFreshAdminShellCss();

Promise.all([
  fetch("admin-sidebar.html?v=202610071152",{cache:"no-store"}).then(function(res){ return res.text(); }),
  fetch("admin-topbar.html?v=202610071152",{cache:"no-store"}).then(function(res){ return res.text(); })
])
.then(function(parts){
  var sidebarHtml=parts[0];
  var topbarHtml=parts[1];

  var sidebar=document.getElementById("adminSidebar");
  var topbar=document.getElementById("adminTopbar");

  if(sidebar){
    sidebar.innerHTML=sidebarHtml;
  }

  if(topbar){
    topbar.innerHTML=topbarHtml;
  }

  /*
    Both shared fragments now exist before anything is moved.
    This prevents the search/profile row appearing below the department menu.
  */
  var headerSearchSlot=document.getElementById("adminHeaderSearchSlot");
  var headerActionsSlot=document.getElementById("adminHeaderActionsSlot");
  var loadedSearch=topbar?.querySelector(".admin-search");
  var loadedActions=topbar?.querySelector(".admin-actions");
  var loadedNotifications=topbar?.querySelector(".admin-notification-panel");

  if(headerSearchSlot && loadedSearch){
    headerSearchSlot.appendChild(loadedSearch);
  }

  if(headerActionsSlot && loadedActions){
    headerActionsSlot.appendChild(loadedActions);
  }

  if(headerActionsSlot && loadedNotifications){
    headerActionsSlot.appendChild(loadedNotifications);
  }

  setupAdminFolders();
  setupAdminSearch();
  setupAdminIdentity();

  var currentPage=window.location.pathname.split("/").pop() || "admin-dashboard.html";

  document.querySelectorAll(".admin-menu a, .submenu a").forEach(function(link){
    var href=String(link.getAttribute("href") || "").split("?")[0];

    if(href===currentPage){
      link.classList.add("active");

      var submenu=link.closest(".submenu");
      if(submenu){
        var button=document.querySelector('.menu-folder[data-target="'+submenu.id+'"]');
        if(button){
          button.classList.add("active-parent");
        }
      }
    }
  });

  setTimeout(function(){
    anybikeRefreshAdminBellV2();
    anybikeEnsureAdminNextAction();
  },300);
})
.catch(function(error){
  console.log("Admin shell load failed",error);
});
}

/*
  ANYBIKE NEXT ACTION STANDARD
  ----------------------------
  Every operational admin page must show one clear next action near the top.
  Page-specific workflows can call window.AnyBikeNextAction.set(...) to replace
  the shared fallback with authoritative workflow state.

  The shared fallback means a newly-created admin page does not silently ship
  without guidance.
*/
const ANYBIKE_ADMIN_NEXT_ACTION_DEFAULTS={
  "admin-dashboard.html":{title:"Work the highest-priority item",text:"Start with the first genuine item in Your Next Actions. Completing the real task should remove it automatically.",waitingFor:"AnyBike",label:"OPEN NEXT ACTION →",href:"admin-dashboard.html#next-actions"},
  "admin-enquiries.html":{title:"Open the sale that needs attention",text:"Continue the Motorcycle Sales transaction whose current stage is waiting for an AnyBike action.",waitingFor:"AnyBike",label:"GO TO SALES WORK →"},
  "admin-message-centre.html":{title:"Reply to the next message that needs attention",text:"Open the oldest genuine customer or supplier conversation that is waiting for a response.",waitingFor:"AnyBike",label:"OPEN MESSAGES →"},
  "admin-customers.html":{title:"Review the customer who needs attention",text:"Open the customer with the most urgent genuine setup, request or purchase action.",waitingFor:"AnyBike",label:"OPEN CUSTOMER WORK →"},
  "admin-ai-matching.html":{title:"Review buyer responses",text:"Progress motorcycles the buyer has selected and remove any options AnyBike does not want to pursue.",waitingFor:"AnyBike",label:"OPEN BUYER RESPONSES →",href:"admin-ai-matching.html#interested-matches-queue"},
  "admin-global-buyer-network.html":{title:"Review the active buyer request",text:"Open an active buyer requirement and progress the sourcing work that is waiting.",waitingFor:"AnyBike",label:"OPEN BUYER REQUESTS →"},
  "admin-operations.html":{title:"Complete the next operations action",text:"Work the collection, custody, storage or handover item that is currently waiting for AnyBike.",waitingFor:"AnyBike",label:"OPEN OPERATIONS WORK →"},
  "admin-logistics.html":{title:"Complete the next logistics action",text:"Progress the collection, delivery or shipper action that is currently waiting.",waitingFor:"AnyBike",label:"OPEN LOGISTICS WORK →"},
  "admin-accounts.html":{title:"Complete the next finance action",text:"Review payments, balances and documents that require verification or allocation.",waitingFor:"AnyBike",label:"OPEN FINANCE WORK →"},
  "admin-vmoto.html":{title:"Review the next VMoto action",text:"Check new VMoto enquiries and any retail stock or fulfilment action waiting for AnyBike.",waitingFor:"AnyBike",label:"OPEN VMOTO WORK →"},
  "admin-stock.html":{title:"Review stock needing attention",text:"Open the motorcycle record that needs the next stock, pricing or status action.",waitingFor:"AnyBike",label:"OPEN STOCK WORK →"},
  "admin-market-intelligence.html":{title:"Review genuine buyer demand",text:"Use current market activity to identify the next sourcing or market action worth taking.",waitingFor:"AnyBike",label:"REVIEW MARKET ACTIVITY →"},
  "admin-international-shipping.html":{title:"Maintain international shipping intelligence",text:"Add or update destination ports and international shippers by country so AnyBike can build a reliable private shipping knowledge base.",waitingFor:"AnyBike",label:"OPEN SHIPPING DIRECTORY →",href:"admin-international-shipping.html"},
  "admin-motorcycle-requests.html":{title:"Review the next motorcycle request",text:"Open an unfulfilled buyer request and continue sourcing or customer follow-up.",waitingFor:"AnyBike",label:"OPEN REQUESTS →"},
  "admin-motorcycle-360.html":{title:"Review this motorcycle record",text:"Complete the next missing stock, custody, document or commercial action for this motorcycle.",waitingFor:"AnyBike",label:"CONTINUE →"},
  "admin-live-visitors.html":{title:"Review visitors showing genuine intent",text:"Focus on visitors whose activity creates a real customer or sourcing follow-up.",waitingFor:"AnyBike",label:"REVIEW VISITORS →"},
  "admin-tasks.html":{title:"Complete the next open task",text:"Work the oldest or highest-priority genuine task before creating more work.",waitingFor:"AnyBike",label:"OPEN TASKS →"},
  "admin-project-plan.html":{title:"Review the next project item",text:"Continue the highest-priority open platform task and keep its status current.",waitingFor:"AnyBike",label:"OPEN PROJECT WORK →"},
  "admin-process-hq.html":{title:"Review the next process item",text:"Check process exceptions, learning points and outstanding operating decisions.",waitingFor:"AnyBike",label:"OPEN PROCESS WORK →"}
};

function anybikeAdminHasOwnNextAction(){
  if(document.querySelector("#nextActionPanel,[data-anybike-next-action],.next-action,#purchaseNextActionsPanel,#customerNeedsAttention")) return true;
  return [...document.querySelectorAll("h1,h2,h3,strong,.eyebrow")]
    .some(el=>/your next action/i.test(String(el.textContent||"")));
}

function anybikeAdminNextActionContainer(){
  return document.querySelector(".admin-page-content,.content,main") || null;
}

function anybikeInstallAdminNextActionStyles(){
  if(document.getElementById("anybike-next-action-shared-style")) return;
  const style=document.createElement("style");
  style.id="anybike-next-action-shared-style";
  style.textContent=`
    .anybike-shared-next-action{margin:0 0 18px;padding:18px 20px;border:2px solid #ed1c24;border-radius:16px;background:linear-gradient(135deg,rgba(237,28,36,.16),#111 58%);color:#fff;box-shadow:0 0 0 1px rgba(237,28,36,.08)}
    .anybike-shared-next-action .abna-kicker{color:#ed1c24;font-size:12px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}
    .anybike-shared-next-action h2{margin:4px 0 6px;font-size:24px;line-height:1.15}
    .anybike-shared-next-action p{margin:0;color:#d6d6d6;line-height:1.5}
    .anybike-shared-next-action .abna-bottom{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:12px}
    .anybike-shared-next-action .abna-waiting{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:7px 10px;background:#0b0b0b;font-size:12px;font-weight:900}
    .anybike-shared-next-action .abna-btn{border:1px solid #ed1c24;border-radius:10px;background:#ed1c24;color:#fff;padding:10px 14px;font-weight:950;cursor:pointer;text-decoration:none}
  `;
  document.head.appendChild(style);
}

function anybikeAdminDefaultNextAction(){
  const page=String(location.pathname.split("/").pop()||"admin-dashboard.html").toLowerCase();
  return ANYBIKE_ADMIN_NEXT_ACTION_DEFAULTS[page] || {
    title:"Complete the next outstanding action",
    text:"Review this workspace and complete the next genuine task before moving on.",
    waitingFor:"AnyBike",
    label:"START HERE →"
  };
}

function anybikeRenderAdminNextAction(config){
  const container=anybikeAdminNextActionContainer();
  if(!container) return null;
  anybikeInstallAdminNextActionStyles();

  let card=document.getElementById("anybikeSharedNextAction");
  if(!card){
    card=document.createElement("section");
    card.id="anybikeSharedNextAction";
    card.className="anybike-shared-next-action";
    card.dataset.anybikeNextAction="shared";
    const first=container.firstElementChild;
    if(first && (first.id==="adminTopbar" || first.id==="adminSidebar")){
      first.insertAdjacentElement("afterend",card);
    }else{
      container.insertBefore(card,first || null);
    }
  }

  const cfg=Object.assign({},anybikeAdminDefaultNextAction(),config||{});
  card.innerHTML=
    '<div class="abna-kicker">Your next action</div>'+
    '<h2>'+escapeNotificationHtml(cfg.title||"Continue")+'</h2>'+
    '<p>'+escapeNotificationHtml(cfg.text||"")+'</p>'+
    '<div class="abna-bottom">'+
      '<span class="abna-waiting">Waiting for: '+escapeNotificationHtml(cfg.waitingFor||"AnyBike")+'</span>'+
      '<button type="button" class="abna-btn" id="anybikeSharedNextActionButton">'+escapeNotificationHtml(cfg.label||"PROCEED →")+'</button>'+
    '</div>';

  const button=document.getElementById("anybikeSharedNextActionButton");
  if(button){
    button.onclick=function(){
      if(typeof cfg.onClick==="function"){cfg.onClick();return;}
      if(cfg.href){location.href=cfg.href;return;}
      if(cfg.selector){
        const target=document.querySelector(cfg.selector);
        if(target){target.scrollIntoView({behavior:"smooth",block:"center"});target.focus?.();return;}
      }
      const target=[...container.querySelectorAll("button:not(:disabled),a.btn,input:not([type=hidden]),select,textarea")]
        .find(el=>!card.contains(el));
      if(target){target.scrollIntoView({behavior:"smooth",block:"center"});target.focus?.();}
    };
  }
  return card;
}

function anybikeEnsureAdminNextAction(){
  if(/admin-login\.html$/i.test(location.pathname)) return;
  if(/admin-message-centre\.html$/i.test(location.pathname)) return;
  if(anybikeAdminHasOwnNextAction()) return;
  anybikeRenderAdminNextAction();
}

window.AnyBikeNextAction={
  set:function(config){return anybikeRenderAdminNextAction(config||{});},
  ensure:anybikeEnsureAdminNextAction,
  hide:function(){document.getElementById("anybikeSharedNextAction")?.remove();}
};

function setupAdminFolders(){
document.querySelectorAll(".menu-folder").forEach(function(button){
button.onclick = function(e){
e.preventDefault();
e.stopPropagation();
toggleAdminFolder(button.getAttribute("data-target"));
};
});

document.querySelectorAll(".submenu a").forEach(function(link){
link.addEventListener("click",function(){
document.querySelectorAll(".submenu").forEach(function(item){ item.classList.remove("open"); });
});
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

if(q.includes("match") || q.includes("recommended") || q.includes("potential")){
  location.href = "admin-ai-matching.html";
  return;
}

if(q.includes("advert") || q.includes("scanner") || q.includes("scan")){
  location.href = "admin-used-bike-scanner.html";
  return;
}

if(q.includes("source") || q.includes("sourcing")){
  location.href = "admin-live-source-hub.html";
  return;
}

if(q.includes("buyer") || q.includes("bulk") || q.includes("global")){
  location.href = "admin-global-buyer-network.html";
  return;
}

if(q.includes("underwrite") || q.includes("seller")){
  location.href = "admin-seller-underwrites.html";
  return;
}

if(q.includes("vmoto") || q.includes("electric retail") || q.includes("new motorcycle")){
  location.href = "admin-vmoto.html";
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

if(q.includes("process") || q.includes("procedure") || q.includes("manual") || q.includes("continuity")){
  location.href = "admin-process-hq.html";
  return;
}

// Treat unrecognised text as a customer/person search, not a page shortcut.
location.href = "admin-customers.html?search=" + encodeURIComponent(String(search.value || "").trim());
});
}

function toggleAdminNotifications(){
var panel = document.getElementById("adminNotificationPanel");

if(panel){
panel.classList.toggle("open");
}
}

let anybikeAdminBellHoverCloseTimer=null;
function anybikeOpenAdminBellFromHover(){
  const panel=document.getElementById("adminNotificationPanel");
  if(anybikeAdminBellHoverCloseTimer){
    clearTimeout(anybikeAdminBellHoverCloseTimer);
    anybikeAdminBellHoverCloseTimer=null;
  }
  if(panel)panel.classList.add("open");
}
function anybikeScheduleAdminBellHoverClose(){
  if(anybikeAdminBellHoverCloseTimer)clearTimeout(anybikeAdminBellHoverCloseTimer);
  anybikeAdminBellHoverCloseTimer=setTimeout(function(){
    const panel=document.getElementById("adminNotificationPanel");
    if(panel)panel.classList.remove("open");
  },260);
}
document.addEventListener("mouseover",function(event){
  const bell=event.target.closest?.(".admin-bell");
  const panel=event.target.closest?.("#adminNotificationPanel");
  if(bell||panel)anybikeOpenAdminBellFromHover();
});
document.addEventListener("mouseout",function(event){
  const fromBell=event.target.closest?.(".admin-bell");
  const fromPanel=event.target.closest?.("#adminNotificationPanel");
  if(!fromBell&&!fromPanel)return;
  const next=event.relatedTarget;
  if(next?.closest?.(".admin-bell")||next?.closest?.("#adminNotificationPanel"))return;
  anybikeScheduleAdminBellHoverClose();
});

document.addEventListener("click", function(e){
var panel = document.getElementById("adminNotificationPanel");
var bell = document.querySelector(".admin-bell");

if(panel && bell && !panel.contains(e.target) && !bell.contains(e.target)){
panel.classList.remove("open");
}

if(!e.target.closest(".menu-group")){
document.querySelectorAll(".submenu").forEach(function(item){
item.classList.remove("open");
});
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
  SHARED ADMIN BELL V2
  --------------------
  Unique function names are deliberate.
  Some older admin pages still declare their own loadAdminNotifications()
  function after admin.js has loaded. Those page-local declarations can
  overwrite the shared compatibility function.

  These V2 functions cannot be overridden by those legacy page functions.
  They read ONLY public.admin_notifications using the authenticated client
  already verified by admin.js.
*/

async function anybikeRefreshAdminBellV2(){
  const client=getAdminSupabaseClient();

  if(!client){
    return;
  }

  const countEl=document.getElementById("adminNotificationCount");
  const listEl=document.getElementById("adminNotificationList");
  const statusEl=document.getElementById("adminNotificationStatus");

  if(!countEl || !listEl){
    return;
  }

  try{
    try{
      await client.rpc("admin_cleanup_orphaned_deal_notifications_v1");
    }catch(cleanupError){
      console.warn("Orphaned deal notification cleanup failed",cleanupError);
    }

    const {data,error}=await client
      .from("admin_notifications")
      .select("id,title,message,type,link,is_read,created_at")
      .eq("is_read",false)
      .order("created_at",{ascending:false})
      .limit(50);

    if(error){
      throw error;
    }

    const rows=data || [];

    countEl.textContent=String(rows.length);
    countEl.style.display=rows.length ? "flex" : "none";

    document.querySelectorAll(".admin-bell-count").forEach(function(badge){
      badge.textContent=String(rows.length);
      badge.style.display=rows.length ? "flex" : "none";
    });

    if(statusEl){
      statusEl.textContent=rows.length ? rows.length + " waiting" : "Live";
    }

    if(!rows.length){
      listEl.innerHTML=
        '<div class="admin-notification-item">' +
          '<div>' +
            '<strong>No notifications</strong><br>' +
            '<small>New admin alerts will appear here.</small>' +
          '</div>' +
        '</div>';
      return;
    }

    listEl.innerHTML=rows.map(function(n){
      const id=String(n.id || "");
      const title=escapeNotificationHtml(n.title || n.type || "Admin notification");
      const message=escapeNotificationHtml(String(n.message || "").slice(0,140));
      const created=n.created_at
        ? escapeNotificationHtml(new Date(n.created_at).toLocaleString("en-GB"))
        : "";
      let rawLink=String(n.link || "admin-dashboard.html");
      if(/Buyer interested/i.test(String(n.title||"")) && /admin-enquiries\.html\?deal=\d+/i.test(rawLink)){
        try{
          const parsed=new URL(rawLink,window.location.origin);
          if(parsed.searchParams.get("candidate") && !parsed.searchParams.get("action")){
            parsed.searchParams.set("action","availability");
          }
          rawLink=parsed.pathname+parsed.search;
        }catch(_error){}
      }
      const link=escapeNotificationHtml(rawLink);
      const actionLabel=/admin-enquiries\.html\?deal=/i.test(rawLink)
        ? "OPEN DEAL 360 →"
        : (/admin-accounts\.html/i.test(rawLink) ? "OPEN ACCOUNTS →" : "OPEN NEXT ACTION →");

      return (
        '<div class="admin-notification-item" ' +
          'style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;">' +
          '<a href="' + link + '" ' +
            'style="display:block;min-width:0;flex:1;color:inherit;text-decoration:none;" ' +
            'onclick="return anybikeOpenAdminNotificationV2(event,\'' + escapeNotificationHtml(id) + '\',this.href)">' +
            '<div>' +
              '<strong>' + title + '</strong><br>' +
              '<small>' + message + '</small><br>' +
              '<small>' + created + '</small>' +
              (rawLink && rawLink!=="admin-dashboard.html"
                ? '<div style="margin-top:10px"><span style="display:inline-block;background:#ed1c24;color:#fff;padding:8px 12px;border-radius:9px;font-weight:900;font-size:12px">' + actionLabel + '</span></div>'
                : '') +
            '</div>' +
          '</a>' +
          '<button type="button" class="notify-clear" ' +
            'onclick="anybikeClearAdminNotificationV2(event,\'' + escapeNotificationHtml(id) + '\')">' +
            'Clear' +
          '</button>' +
        '</div>'
      );
    }).join("");

  }catch(error){
    console.warn("Shared admin bell refresh failed",error);

    if(statusEl){
      statusEl.textContent="Error";
    }
  }
}


function anybikeOpenAdminNotificationV2(event,id,target){
  event?.preventDefault?.();

  const client=getAdminSupabaseClient();
  if(client && id){
    client
      .from("admin_notifications")
      .update({is_read:true})
      .eq("id",id)
      .then(function(result){
        if(result?.error)console.warn("Admin notification read update failed",result.error);
      })
      .catch(function(error){
        console.warn("Admin notification read update failed",error);
      });
  }

  if(target){
    window.location.assign(target);
  }

  return false;
}


async function anybikeClearAdminNotificationV2(event,id){
  event?.preventDefault?.();
  event?.stopPropagation?.();

  const client=getAdminSupabaseClient();

  if(!client || !id){
    return;
  }

  try{
    const {error}=await client
      .from("admin_notifications")
      .update({is_read:true})
      .eq("id",id);

    if(error){
      throw error;
    }

    await anybikeRefreshAdminBellV2();

  }catch(error){
    console.warn("Admin notification clear failed",error);
  }
}


window.anybikeRefreshAdminBellV2=anybikeRefreshAdminBellV2;
window.anybikeOpenAdminNotificationV2=anybikeOpenAdminNotificationV2;
window.anybikeClearAdminNotificationV2=anybikeClearAdminNotificationV2;


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

    anybikeAdminNotificationTimer=setInterval(
      anybikeRefreshAdminBellV2,
      5000
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
  await anybikeRefreshAdminBellV2();
});

document.addEventListener("visibilitychange",async function(){
  if(document.visibilityState !== "visible"){
    return;
  }

  await recheckAdminSession();
  await anybikeRefreshAdminBellV2();
});

initialiseAdmin();


/* =========================================================
   ANYBIKE GBP INPUT DISPLAY
   Standard rule: every GBP money field displays as £1,234.56
   while preserving raw numeric values for existing calculations.
   ========================================================= */
(function anyBikeStartGbpInputDisplay(){
  if(window.__anybikeGbpInputDisplayStarted) return;
  window.__anybikeGbpInputDisplayStarted=true;

  const nativeValue=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
  if(!nativeValue || !nativeValue.get || !nativeValue.set) return;

  function normaliseMoney(value){
    const cleaned=String(value??"").replace(/[^0-9.-]/g,"");
    if(cleaned==="" || cleaned==="-" || cleaned===".") return "";
    const n=Number(cleaned);
    return Number.isFinite(n) ? String(n) : "";
  }

  function formatMoney(value){
    const raw=normaliseMoney(value);
    if(raw==="") return "";
    const n=Number(raw);
    return n.toLocaleString("en-GB",{
      style:"currency",
      currency:"GBP",
      minimumFractionDigits:2,
      maximumFractionDigits:2
    });
  }

  function moneyContext(input){
    const label=input.closest("label");
    const labelledBy=String(input.getAttribute("aria-labelledby")||"")
      .split(/\s+/)
      .filter(Boolean)
      .map(id=>document.getElementById(id)?.textContent||"")
      .join(" ");
    const nearby=[
      input.id,
      input.name,
      input.placeholder,
      input.getAttribute("aria-label"),
      labelledBy,
      label?.textContent||"",
      input.previousElementSibling?.textContent||""
    ].filter(Boolean).join(" ").toLowerCase();

    if(input.dataset.currency==="GBP" || input.dataset.currency==="gbp") return true;
    if(/[£]|\bgbp\b/.test(nearby)) return true;

    const moneyWord=/(price|fee|cost|amount|deposit|balance|charge|payment|customer total|quote|offer value|sale value)/.test(nearby);
    const nonMoney=/(percent|percentage|mileage|miles|max miles|year|quantity|qty|engine|cc|phone|mobile|postcode)/.test(nearby);
    return moneyWord && !nonMoney;
  }

  function enhance(input){
    if(!(input instanceof HTMLInputElement)) return;
    if(input.dataset.anybikeGbpEnhanced==="1" || input.dataset.anybikeNoGbp==="1") return;
    if(input.type==="hidden" || input.type==="checkbox" || input.type==="radio" || input.type==="date" || input.type==="datetime-local") return;
    if(!moneyContext(input)) return;

    const initial=nativeValue.get.call(input);
    input.dataset.anybikeGbpEnhanced="1";
    input.dataset.anybikeOriginalType=input.type||"text";
    input.dataset.anybikeGbpRaw=normaliseMoney(initial);
    if(input.type==="number") input.type="text";
    input.inputMode="decimal";
    input.autocomplete=input.autocomplete||"off";

    Object.defineProperty(input,"value",{
      configurable:true,
      get:function(){
        if(document.activeElement===this){
          return normaliseMoney(nativeValue.get.call(this));
        }
        return this.dataset.anybikeGbpRaw ?? normaliseMoney(nativeValue.get.call(this));
      },
      set:function(value){
        const raw=normaliseMoney(value);
        this.dataset.anybikeGbpRaw=raw;
        nativeValue.set.call(this,document.activeElement===this ? raw : formatMoney(raw));
      }
    });

    nativeValue.set.call(input,formatMoney(input.dataset.anybikeGbpRaw));

    input.addEventListener("focus",function(){
      const raw=this.dataset.anybikeGbpRaw ?? normaliseMoney(nativeValue.get.call(this));
      nativeValue.set.call(this,raw);
      try{ this.select(); }catch(_error){}
    });

    input.addEventListener("input",function(){
      this.dataset.anybikeGbpRaw=normaliseMoney(nativeValue.get.call(this));
    });

    input.addEventListener("blur",function(){
      const raw=normaliseMoney(nativeValue.get.call(this));
      this.dataset.anybikeGbpRaw=raw;
      nativeValue.set.call(this,formatMoney(raw));
    });

    input.addEventListener("change",function(){
      this.dataset.anybikeGbpRaw=normaliseMoney(nativeValue.get.call(this));
      if(document.activeElement!==this){
        nativeValue.set.call(this,formatMoney(this.dataset.anybikeGbpRaw));
      }
    });
  }

  function scan(root){
    if(root instanceof HTMLInputElement) enhance(root);
    root?.querySelectorAll?.("input").forEach(enhance);
  }

  function rawForSubmission(form){
    const fields=Array.from((form||document).querySelectorAll?.('input[data-anybike-gbp-enhanced="1"]')||[]);
    const restore=[];
    fields.forEach(function(input){
      restore.push([input,nativeValue.get.call(input)]);
      nativeValue.set.call(input,input.dataset.anybikeGbpRaw||"");
    });
    requestAnimationFrame(function(){
      restore.forEach(function(pair){
        const input=pair[0];
        if(document.activeElement!==input){
          nativeValue.set.call(input,formatMoney(input.dataset.anybikeGbpRaw||""));
        }
      });
    });
  }

  document.addEventListener("submit",function(event){
    rawForSubmission(event.target);
  },true);

  const start=function(){
    scan(document);
    const observer=new MutationObserver(function(records){
      records.forEach(function(record){
        record.addedNodes.forEach(function(node){
          if(node.nodeType===1) scan(node);
        });
      });
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  };

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
