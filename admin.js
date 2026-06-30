function loadAdminShell(){
  fetch("admin-sidebar.html")
    .then(function(res){
      return res.text();
    })
    .then(function(html){
      var sidebar = document.getElementById("adminSidebar");
      if(sidebar){
        sidebar.innerHTML = html;
      }

      var currentPage = window.location.pathname.split("/").pop() || "admin-dashboard.html";

      document.querySelectorAll(".admin-menu a").forEach(function(link){
        if(link.getAttribute("href") === currentPage){
          link.classList.add("active");
        }
      });
    });

  fetch("admin-topbar.html")
    .then(function(res){
      return res.text();
    })
    .then(function(html){
      var topbar = document.getElementById("adminTopbar");
      if(topbar){
        topbar.innerHTML = html;
      }

      setupAdminSearch();
    });
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

  const panel = document.getElementById("adminNotificationPanel");

  if(!panel){
    return;
  }

  panel.classList.toggle("open");

}

document.addEventListener("click",function(e){

  const panel = document.getElementById("adminNotificationPanel");
  const bell = document.querySelector(".admin-bell");

  if(!panel || !bell){
    return;
  }

  if(
      !panel.contains(e.target) &&
      !bell.contains(e.target)
  ){
      panel.classList.remove("open");
  }

});
