ChatGPT Plus



Welcome back, Andy.

I've picked up from the latest saved state, including the pause points and architecture decisions.

Where we are now
Over the last few days we've achieved some important milestones.

✅ Security
Admin authentication is now working.

Direct access to admin-dashboard.html while logged out has been blocked.

Automatic login issue was resolved.

Admin display name changed from Andy Gifford to AG Admin (although we later agreed the greeting should simply be "Good Evening Andy").

✅ Shared Admin Shell
The common admin framework is now in place.

Shared sidebar

Shared top bar

Shared search

Notification system

Common admin.js

Versioned JS loading

This means future admin pages are much easier to maintain.

✅ Bike Sales HQ
Architecture is now fixed.

Bike Sales HQ is the owner of:

Lead Status

Deal workflow

Bike communications

Deal calculator

Seller information

Message Centre is now purely communications.

That avoids duplicate data.

✅ Lead Status Pipeline
The agreed pipeline is locked:

New Lead

Contact Made

Information Needed

Research / Availability

Proposal Sent

Negotiating

Waiting Customer

Confirmed

Payment / Deposit

Operations

Shipping

Completed

Save For Later

Lost

Closed

Internal work is handled by workflow checklists—not by adding more lead statuses.

✅ Operations Workflow
The Operations checklist architecture has been agreed.

Examples:

Purchase agreed

Seller verified

Deposit received

Collection booked

Bike received

Inspection

Documents

Ready for Shipping

Those are independent tasks rather than lead statuses.

✅ Customer Website
Completed or largely complete:

Registration

Login

Customer dashboard

Watchlist

Saved searches

Bike enquiries

Two-way messaging

Recently viewed

Bike details

Available stock

Yesterday's work
We also agreed several important future features.

Customer registration
After registration:

redirect customer to homepage

Admin notifications
When somebody registers:

Admin should receive a notification.

Message Centre
When a new customer registers:

Admin should be able to

welcome them

send first message

request more information

Public Website
We also agreed that after the admin/backend is stable we'll completely modernise the public website.

That includes:

Home page redesign

Better retail bike pages

Better navigation

Better menus

Better search

Better filtering

Future Commercial Ideas (saved)
These were all saved to the roadmap.

Brand advertising pages

Yamaha dealer advertising

Manufacturer advertising

County advertising

Country advertising

Bike-specific advertising

Sold bike archive

Automatic social media publishing

Pinterest publishing

Facebook

Instagram

Global buyer network

The key principle remains:

Build an extremely reliable backend first. Marketing and growth come afterwards.

Current Highest Priority
The biggest remaining piece is creating a proper Admin login system that everything can rely on.

Once that is complete we can safely protect:

Admin Dashboard

Bike Sales HQ

Message Centre

Customers

Stock

Reports

Future Project Plan

After that
The roadmap is:

Finish secure admin authentication

Registration notifications

Admin welcome messaging

Retail page/menu audit

Public website redesign

Continue expanding the AnyBike operating system (notifications, workflows, reporting, AI assistance, logistics, global buying network, etc.)

I also remember your longer-term vision, which I think is becoming much clearer:

AnyBike isn't just a motorcycle website. It's an operating system for buying, selling, exporting and managing motorcycles worldwide. Everything we're building now—the CRM, workflows, messaging, logistics, reporting and dashboards—is laying the foundation for that.

I'm ready to continue from exactly this point.


let go

Excellent. I think we're at the point where we should stop adding new features for a moment and make the foundations rock solid.

Phase 1 – Finish the Admin Security (today)
The fact that you could previously open admin-dashboard.html without logging in showed that the admin area wasn't properly protected. We've fixed the first part, but we should now protect every admin page in the same way.

These pages should all require an authenticated admin session:

admin-dashboard.html

admin-enquiries.html

admin-customers.html

admin-stock.html

admin-messages.html

admin-settings.html

and any future admin pages.

That way there is only one place that handles authentication.

Phase 2 – Proper Admin Identity
Instead of displaying an email address or a generic account name, we'll use the admin profile.

For example:

Good Afternoon Andy

Administrator
Later we can add:

profile photo

role

online status

last login

department

without changing the authentication system.

Phase 3 – New Customer Notifications
As soon as somebody registers:

🔔 notification appears

Customer count updates

Customer appears in Customers

Welcome message can be sent

Admin can request extra information

This links registration directly into your CRM rather than it being a separate process.

Phase 4 – Complete the Customer Area
We'll make sure everything is joined up:

Dashboard

Messages

Watchlist

Saved searches

Recently viewed

Profile

Notifications

Phase 5 – Modernise the Public Site
Only once the backend is stable.

That includes:

New home page

Better bike adverts

Faster search

Better filters

Better mobile experience

Cleaner navigation

Improved SEO

One thing I'd like us to improve next
When I looked at how the admin side has evolved, I noticed we've started accumulating a lot of separate pages. As AnyBike grows, staff will spend more time switching between them.

I think we should make the platform feel like a proper business application by introducing a consistent workspace:

Notifications open the relevant record directly.

Customer details slide in rather than taking you to another page.

Bike information stays visible while replying to messages.

Returning to a list restores the same filters and scroll position.

Most work happens in one place instead of bouncing between pages.

That matches the design principles we've already agreed and will make the system much faster to use day to day.

My recommendation
Let's work on registration notifications and automatic customer onboarding next.

It gives you an immediate business benefit:

A customer registers.

Admin is notified instantly.

The customer appears in the Customers list.

You can send a welcome message from the Message Centre.

That starts building the relationship from the very first interaction.

I think that's the best next step because it ties together the authentication, customer database, notifications, and messaging systems you've already built.


lets fix the login issues and make sure every page is secure

Worked for 57s
Yes. We’ll do this one safe step at a time and test each change.

Step 1 — Replace admin.js
Yesterday’s secure version already contains the missing login guard. It:

checks for a Supabase session;

allows only sales@anybike.co.uk;

redirects logged-out visitors to admin-login.html;

remembers the originally requested admin page;

signs out unauthorised accounts;

only starts the shared admin shell after access is approved. 


The current live admin.js does not contain that protection. 


Open this saved secure version:


admin-secure.js.txt
Document
Do this now
Open your local admin.js.

Delete everything in it.

Copy the complete contents of admin-secure.js.txt into it.

Save it as exactly:

admin.js
Change the version reference on admin-dashboard.html to:

<script src="admin.js?v=12000"></script>
Commit and push both files.

Do not change every admin page yet. First we test the dashboard with this secure shared file.

Test after deployment
Open https://www.anybike.co.uk/admin-dashboard.html.

While logged in, it should open normally.

Click Logout.

Paste https://www.anybike.co.uk/admin-dashboard.html directly into the address bar.

It must redirect to:

https://www.anybike.co.uk/admin-login.html
Tell me what happens after that test, and we’ll secure the complete admin page list next.


/*
AnyBike
File: admin.js
Version: 11.0
Date: 13 July 2026

Changes
✓ Preserves existing admin sidebar and topbar loading
✓ Preserves single-bike and Message Centre notifications
✓ Adds Global Buyer Network notifications to the admin bell
✓ Combines message and bulk-buyer alerts into one live notification list
✓ Adds clickable bulk-buyer links to the correct CRM record
✓ Adds per-browser Clear handling for bulk-buyer alerts
✓ Keeps existing thread Clear behaviour
✓ Refreshes notifications every 60 seconds
*/

const ANYBIKE_ADMIN_EMAILS = [
"sales@anybike.co.uk"
];

let anybikeAdminSupabase = null;
let anybikeAdminUser = null;

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

function isAllowedAdminEmail(email){
const value = String(email || "").trim().toLowerCase();

return ANYBIKE_ADMIN_EMAILS.some(function(adminEmail){
return adminEmail.toLowerCase() === value;
});
}

async function requireAdminSession(){
const client = getAdminSupabaseClient();

if(!client){
console.error("Supabase client is unavailable on this admin page.");
window.location.replace("/admin-login.html?error=supabase");
return false;
}

const sessionResult = await client.auth.getSession();
const user = sessionResult?.data?.session?.user || null;

if(!user){
const returnUrl =
window.location.pathname +
window.location.search +
window.location.hash;

window.location.replace(
  "/admin-login.html?return=" + encodeURIComponent(returnUrl)
);

return false;
}

if(!isAllowedAdminEmail(user.email)){
await client.auth.signOut();

window.location.replace(
  "/admin-login.html?error=not-authorized"
);

return false;
}

anybikeAdminUser = user;
return true;
}

async function setupAdminIdentity(){
const nameEl = document.getElementById("adminProfileName");
const emailEl = document.getElementById("adminProfileEmail");

if(!anybikeAdminUser){
return;
}

const displayName =
anybikeAdminUser.user_metadata?.full_name ||
anybikeAdminUser.user_metadata?.name ||
"Andy Gifford";

if(nameEl){
nameEl.textContent = displayName;
}

if(emailEl){
emailEl.textContent = anybikeAdminUser.email || "";
emailEl.title = anybikeAdminUser.email || "";
}
}

async function adminLogout(){
const client = getAdminSupabaseClient();

try{
if(client){
await client.auth.signOut();
}
}catch(error){
console.warn("Admin logout failed",error);
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
.replaceAll("&","&")
.replaceAll("<","<")
.replaceAll(">",">")
.replaceAll('"',""")
.replaceAll("'","'");
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
.order("last_message_at", {ascending})
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
<a class="admin-notification-item" href="${link}" style="display:flex;gap:12px;align-items:flex-start;" onclick="markBulkBuyerNotificationOpened('${escapeNotificationHtml(row.id)}')">

<div class="notify-avatar" style="width:38px;height:38px;min-width:38px;border-radius:50%;background:#ed1c24;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;line-height:1;"> ${initial} </div>

<div class="notify-content" style="min-width:0;flex:1;"> <div class="notify-top" style="display:flex;justify-content:space-between;gap:10px;"> <strong>${title}</strong> <span>🆕</span> </div>

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

</a> `; }

  const bikeLink = row.relatedEnquiryId
    ? "admin-enquiries.html?open=" + encodeURIComponent(row.relatedEnquiryId) + "&focus=messages"
    : "admin-message-centre.html?thread=" + encodeURIComponent(row.id);

  const dot = row.status === "New" ? "🔴" : "🟢";

  return `
<a class="admin-notification-item" href="${bikeLink}" style="display:flex;gap:12px;align-items:flex-start;">

<div class="notify-avatar" style="width:38px;height:38px;min-width:38px;border-radius:50%;background:#ed1c24;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;line-height:1;"> ${initial} </div>

<div class="notify-content" style="min-width:0;flex:1;"> <div class="notify-top" style="display:flex;justify-content:space-between;gap:10px;"> <strong>${title}</strong> <span>${dot}</span> </div>

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

</a> `; }).join(""); }else{ notificationHtml = ` <div class="admin-notification-item"> <strong>No admin actions waiting</strong> <small>New messages and Global Buyer requests will appear here.</small> </div> `; }

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

async function initialiseAdmin(){
const allowed = await requireAdminSession();

if(!allowed){
return;
}

loadAdminShell();
loadAdminNotifications();
setInterval(loadAdminNotifications,60000);
}

initialiseAdmin();