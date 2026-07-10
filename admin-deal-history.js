/*
  AnyBike Deal Activity
  File: admin-deal-history.js

  Combines saved deal timeline events with customer/staff messages.
  Requires the shared Supabase client `sb` and escapeAdminHtml().
*/

async function addDealTimelineEvent(enquiryId, eventType, title, details, createdBy, metadata){
  if(!enquiryId){ return null; }

  const payload = {
    enquiry_id: Number(enquiryId),
    event_type: eventType || "Update",
    title: title || "Deal updated",
    details: details || "",
    created_by: createdBy || "AnyBike Admin"
  };

  if(metadata && typeof metadata === "object"){
    payload.metadata = metadata;
  }

  const result = await sb
    .from("deal_timeline")
    .insert(payload)
    .select()
    .single();

  if(result.error){
    console.warn("Deal Activity insert failed:", result.error);
    return null;
  }

  return result.data || null;
}

function dealActivityType(value){
  const type = String(value || "Update").toLowerCase();
  if(type.includes("message") || type.includes("customer") || type.includes("reply")) return "message";
  if(type.includes("status")) return "status";
  if(type.includes("workflow") || type.includes("operation") || type.includes("shipping")) return "workflow";
  if(type.includes("deal") || type.includes("calculator") || type.includes("profit") || type.includes("price")) return "deal";
  if(type.includes("document") || type.includes("file") || type.includes("photo")) return "document";
  if(type.includes("note")) return "note";
  return "update";
}

function dealActivityIcon(type){
  const icons = {
    message:"💬",
    status:"🔄",
    workflow:"📦",
    deal:"💷",
    document:"📄",
    note:"📝",
    update:"•"
  };
  return icons[type] || icons.update;
}

function dealActivityDateLabel(value){
  const date = new Date(value);
  if(isNaN(date.getTime())) return "Earlier";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const key = date.toDateString();
  if(key === today.toDateString()) return "Today";
  if(key === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-GB", {
    day:"numeric",
    month:"long",
    year:"numeric"
  });
}

function dealActivityTime(value){
  const date = new Date(value);
  if(isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
}

function dealActivityTarget(type, enquiryId){
  if(type === "message") return "conversation-" + enquiryId;
  if(type === "workflow") return "workflow-panel-" + enquiryId;
  if(type === "deal") return "deal-panel-" + enquiryId;
  if(type === "document") return "documents-panel-" + enquiryId;
  return "";
}

function openDealActivityTarget(enquiryId, targetId, item){
  if(item){
    item.classList.toggle("expanded");
  }

  if(!targetId){ return; }

  const target = document.getElementById(targetId);
  if(!target){ return; }

  if(target.tagName === "DETAILS"){
    target.open = true;
  }else{
    const panel = target.closest("details");
    if(panel){ panel.open = true; }
  }

  setTimeout(function(){
    target.scrollIntoView({ behavior:"smooth", block:"center" });
  }, 80);
}

function filterDealActivity(enquiryId, filter, button){
  const box = document.getElementById("timeline-" + enquiryId);
  if(!box){ return; }

  box.querySelectorAll(".deal-activity-item").forEach(function(item){
    const type = item.getAttribute("data-activity-type") || "update";
    item.style.display = filter === "all" || type === filter ? "grid" : "none";
  });

  const toolbar = document.getElementById("timeline-filters-" + enquiryId);
  if(toolbar){
    toolbar.querySelectorAll("button").forEach(function(btn){ btn.classList.remove("active"); });
  }
  if(button){ button.classList.add("active"); }
}

function renderDealActivityItems(enquiryId, items){
  if(!items.length){
    return '<div class="workflow-empty"><strong>No Deal Activity yet.</strong><div>Messages, workflow changes, deal saves and other significant actions will appear here automatically.</div></div>';
  }

  const groups = {};
  items.forEach(function(item){
    const label = dealActivityDateLabel(item.created_at);
    if(!groups[label]) groups[label] = [];
    groups[label].push(item);
  });

  return Object.keys(groups).map(function(label){
    const events = groups[label].map(function(item){
      const type = dealActivityType(item.event_type);
      const targetId = dealActivityTarget(type, enquiryId);
      const details = escapeAdminHtml(item.details || "");
      const preview = details.length > 180 ? details.slice(0,180) + "…" : details;

      return `
        <article class="deal-activity-item activity-${type}" data-activity-type="${type}"
          onclick="openDealActivityTarget(${Number(enquiryId)}, '${targetId}', this)">
          <div class="deal-activity-time">${dealActivityTime(item.created_at)}</div>
          <div class="deal-activity-icon">${dealActivityIcon(type)}</div>
          <div class="deal-activity-content">
            <div class="deal-activity-heading">
              <strong>${escapeAdminHtml(item.title || "Update")}</strong>
              <span>${escapeAdminHtml(item.created_by || "AnyBike Admin")}</span>
            </div>
            ${preview ? `<div class="deal-activity-preview">${preview}</div>` : ""}
            ${details ? `<div class="deal-activity-full">${details}</div>` : ""}
            <small>${targetId ? "Click to expand and open related section" : "Click to expand details"}</small>
          </div>
          <div class="deal-activity-arrow">⌄</div>
        </article>
      `;
    }).join("");

    return `<section class="deal-activity-day"><h4>${label}</h4>${events}</section>`;
  }).join("");
}

async function loadDealTimeline(enquiryId){
  const box = document.getElementById("timeline-" + enquiryId);
  const count = document.getElementById("timeline-count-" + enquiryId);
  if(!box){ return; }

  box.innerHTML = "<p style='color:#aaa;'>Loading Deal Activity...</p>";

  const results = await Promise.all([
    sb.from("deal_timeline")
      .select("*")
      .eq("enquiry_id", Number(enquiryId))
      .order("created_at", { ascending:false }),
    sb.from("enquiry_messages")
      .select("id,enquiry_id,sender,message,created_at")
      .eq("enquiry_id", Number(enquiryId))
      .order("created_at", { ascending:false })
  ]);

  const timelineResult = results[0];
  const messageResult = results[1];

  if(timelineResult.error){
    console.warn("Deal Activity timeline load failed:", timelineResult.error);
  }
  if(messageResult.error){
    console.warn("Deal Activity message load failed:", messageResult.error);
  }

  const timelineItems = (timelineResult.data || []).map(function(event){
    return {
      id:"timeline-" + event.id,
      event_type:event.event_type || "Update",
      title:event.title || "Deal updated",
      details:event.details || "",
      created_by:event.created_by || "AnyBike Admin",
      created_at:event.created_at
    };
  });

  const messageItems = (messageResult.data || []).map(function(message){
    const sender = String(message.sender || "");
    const customer = sender.toLowerCase().includes("customer");
    return {
      id:"message-" + message.id,
      event_type:"Message",
      title:customer ? "Customer replied" : "AnyBike message sent",
      details:message.message || "",
      created_by:sender || (customer ? "Customer" : "AnyBike"),
      created_at:message.created_at
    };
  });

  const seen = new Set();
  const allItems = timelineItems.concat(messageItems)
    .filter(function(item){
      const key = [item.event_type,item.title,item.details,item.created_at].join("|");
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(function(a,b){ return new Date(b.created_at) - new Date(a.created_at); });

  if(count){
    count.textContent = allItems.length + (allItems.length === 1 ? " Event" : " Events");
  }

  box.innerHTML = renderDealActivityItems(enquiryId, allItems);
}