async function loadAdminNotifications(){
  if(typeof sb === "undefined"){
    return;
  }

  const countEl = document.getElementById("adminNotificationCount");
  const listEl = document.getElementById("adminNotificationList");
  const statusEl = document.getElementById("adminNotificationStatus");

  if(!countEl || !listEl){
    return;
  }

  const { data, error } = await sb
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending:false })
    .limit(20);

  if(error){
    console.error("Admin notifications error:", error);
    if(statusEl){
      statusEl.textContent = "Error";
    }
    return;
  }

  const rows = data || [];
  const unread = rows.filter(n => !n.read_at);

  countEl.textContent = unread.length;

  if(unread.length === 0){
    countEl.style.display = "none";
  }else{
    countEl.style.display = "flex";
  }

  if(rows.length === 0){
    listEl.innerHTML =
      '<div class="admin-notification-item">' +
        '<strong>No notifications yet</strong>' +
        '<small>Admin alerts will appear here.</small>' +
      '</div>';
    return;
  }

  listEl.innerHTML = rows.map(n => {
    const title = n.title || "Admin notification";
    const body = n.body || "";
    const link = n.link_url || "admin-dashboard.html";
    const created = n.created_at ? new Date(n.created_at).toLocaleString("en-GB") : "";
    const unreadClass = n.read_at ? "" : " unread";

    return '' +
      '<a class="admin-notification-item' + unreadClass + '" href="' + link + '">' +
        '<strong>' + escapeAdminHtml(title) + '</strong>' +
        '<small>' + escapeAdminHtml(body) + '</small><br>' +
        '<small>' + escapeAdminHtml(created) + '</small>' +
      '</a>';
  }).join("");

  if(statusEl){
    statusEl.textContent = "Live";
  }
}

function escapeAdminHtml(value){
  return String(value || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
