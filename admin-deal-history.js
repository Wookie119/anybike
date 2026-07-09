async function addDealTimelineEvent(enquiryId, eventType, title, details, createdBy){
  if(!enquiryId){ return; }

  await sb
    .from("deal_timeline")
    .insert({
      enquiry_id: Number(enquiryId),
      event_type: eventType || "Update",
      title: title || "Deal updated",
      details: details || "",
      created_by: createdBy || "AnyBike Admin"
    });
}

async function loadDealTimeline(enquiryId){
  const box = document.getElementById("timeline-" + enquiryId);
  if(!box){ return; }

  box.innerHTML = "<p style='color:#aaa;'>Loading timeline...</p>";

  const { data, error } = await sb
    .from("deal_timeline")
    .select("*")
    .eq("enquiry_id", Number(enquiryId))
    .order("created_at", { ascending:false });

  if(error){
    box.innerHTML = "<p style='color:#ff7676;'>Timeline failed to load.</p>";
    return;
  }

  if(!data || !data.length){
    box.innerHTML = "<p style='color:#aaa;'>No timeline events yet.</p>";
    return;
  }

  box.innerHTML = data.map(function(event){
    return `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <strong>${escapeAdminHtml(event.title || "Update")}</strong>
          <div>${escapeAdminHtml(event.details || "")}</div>
          <small>
            ${escapeAdminHtml(event.created_by || "AnyBike Admin")}
            ·
            ${new Date(event.created_at).toLocaleString("en-GB")}
          </small>
        </div>
      </div>
    `;
  }).join("");
}