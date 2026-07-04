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
        setupAdminSearch();

        setTimeout(function(){
          loadMessageCentreNotifications();
        },300);
      }

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

async function loadMessageCentreNotifications(){
  if(typeof supabase === "undefined"){
    return;
  }

  const SUPABASE_URL = "https://tuehtnezhdnkqbbhttgp.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK";
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const {data, error} = await sb
    .from("message_centre_threads")
    .select("id, customer_name, customer_email, country, source_type, subject, status, bike_make, bike_model, bike_year, last_message, last_message_at, last_sender, related_enquiry_id")
    .in("status", ["New", "Needs Reply"])
    .order("last_message_at", {ascending:false});

  if(error){
    console.log("Notification thread load failed", error.message);
    return;
  }

  const threads = (data || []).filter(function(t){
    return String(t.last_sender || "").toLowerCase().includes("customer");
  });

  const count = threads.length;

  document.querySelectorAll("#adminNotificationCount, .admin-bell-count").forEach(function(badge){
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
    badge.style.alignItems = "center";
    badge.style.justifyContent = "center";
  });

  var notificationHtml = "";

  if(count){

    notificationHtml = threads.slice(0,8).map(function(t){

      const customer = t.customer_name || t.customer_email || "Customer";

      const bike = [t.bike_year, t.bike_make, t.bike_model]
        .filter(Boolean)
        .join(" ") || t.subject || t.source_type || "Message";

      const preview = (t.last_message || "").substring(0,70);
      const country = t.country || "";
      const when = t.last_message_at ? timeAgo(t.last_message_at) : "";
      const initial = customer.charAt(0).toUpperCase();
      const dot = t.status === "New" ? "🔴" : "🟢";

      const link = t.related_enquiry_id
        ? "admin-enquiries.html?open=" + encodeURIComponent(t.related_enquiry_id) + "&focus=messages"
        : "admin-message-centre.html?thread=" + encodeURIComponent(t.id);

   return `
<a class="admin-notification-item" href="${link}">

  <div class="notify-avatar">
    ${initial}
  </div>

  <div class="notify-content">

    <div class="notify-top">
      <strong>${customer}</strong>
      <span>${dot}</span>
    </div>

    <div class="notify-bike">
      🏍 ${bike}
    </div>

    <div class="notify-preview">
      ${preview}
    </div>

    <div class="notify-footer">
      <span>${country}</span>
      <span>${when}</span>
    </div>

    <button
      type="button"
      class="notify-clear"
      onclick="event.preventDefault();event.stopPropagation();markThreadHandled(event,'${t.id}')">
      Clear
    </button>

  </div>

</a>
`;

    }).join("");

  }else{

    notificationHtml = `
      <div class="admin-notification-item">
        <strong>No admin actions waiting</strong>
        <small>New messages and enquiries will appear here.</small>
      </div>
    `;

  }

  document.querySelectorAll("#adminNotificationList, .admin-notification-list").forEach(function(list){
    list.innerHTML = notificationHtml;
  });
}
async function markThreadHandled(e, threadId){

  e.preventDefault();
  e.stopPropagation();

  if(typeof supabase === "undefined"){
    return;
  }

  const SUPABASE_URL = "https://tuehtnezhdnkqbbhttgp.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK";
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  loadMessageCentreNotifications();

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

loadAdminShell();

setInterval(loadMessageCentreNotifications, 60000);