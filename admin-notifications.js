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
