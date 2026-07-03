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

  const {data: messages, error: msgError} = await sb
    .from("enquiry_messages")
    .select("id,enquiry_id,sender,message,created_at")
    .order("created_at", {ascending:false});

  if(msgError){
    console.log("Notification message load failed", msgError.message);
    return;
  }

  const latestByEnquiry = {};

  (messages || []).forEach(function(m){
    if(!latestByEnquiry[m.enquiry_id]){
      latestByEnquiry[m.enquiry_id] = m;
    }
  });

  const customerReplies = Object.values(latestByEnquiry).filter(function(m){
    return String(m.sender || "").toLowerCase().includes("customer");
  });

  const enquiryIds = customerReplies.map(function(m){
    return m.enquiry_id;
  });

  let enquiryMap = {};

  if(enquiryIds.length){
    const {data: enquiries, error: enquiryError} = await sb
      .from("bike_enquiries")
      .select(`
        id,
        customer_name,
        customer_email,
        destination_country,
        customer_city,
        customer_region,
        bike_id,
        available_stock (
          make,
          model,
          year
        )
      `)
      .in("id", enquiryIds);

    if(!enquiryError){
      (enquiries || []).forEach(function(e){
        enquiryMap[String(e.id)] = e;
      });
    }
  }

  const count = customerReplies.length;

  document
    .querySelectorAll("#adminNotificationCount, #notificationCount, .notification-count, .admin-notification-count, .admin-bell-count")
    .forEach(function(badge){
      badge.textContent = count;
badge.style.display = count > 0 ? "flex" : "none";
badge.style.alignItems = "center";
badge.style.justifyContent = "center";
    });

  document
    .querySelectorAll("#adminNotificationPanel, #notificationPanel, #adminNotificationList, #adminNotificationDropdown")
    .forEach(function(panel){

      panel.innerHTML = count
        ? customerReplies.slice(0,8).map(function(n){

            const enquiry = enquiryMap[String(n.enquiry_id)] || {};
            const stock = enquiry.available_stock || {};

            const customer = enquiry.customer_name || enquiry.customer_email || "Customer reply";
            const country = enquiry.destination_country || enquiry.customer_country || "";
            const bike = [stock.year, stock.make, stock.model].filter(Boolean).join(" ") || "Bike enquiry";
            const preview = n.message || "";
            const time = n.created_at ? new Date(n.created_at).toLocaleString("en-GB") : "";
            const link = "admin-enquiries.html?open=" + encodeURIComponent(n.enquiry_id) + "&focus=messages";

            return `
              <a href="${link}" style="display:block;padding:10px;border-bottom:1px solid rgba(255,255,255,.12);color:#fff;text-decoration:none;">
                <strong>💬 ${customer}</strong><br>
                <small>${country} ${bike}</small><br>
                <span>${preview}</span><br>
                <em style="font-size:11px;color:#888;">${time}</em>
              </a>
            `;

          }).join("")
        : `<div style="padding:12px;color:#aaa;">No customer replies waiting.</div>`;

    });
}



loadAdminShell();


setInterval(loadMessageCentreNotifications, 60000);
