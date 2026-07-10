const ANYBIKE_WORKFLOWS = {
  Operations: {
    icon: "📦",
    column: "operations_checklist",
    tasks: [
      { name:"Purchase agreed", icon:"🤝" },
      { name:"Seller details verified", icon:"🧾" },
      { name:"Deposit received", icon:"💰" },
      { name:"Collection booked", icon:"🚚" },
      { name:"Bike received", icon:"🏍️" },
      { name:"Inspection completed", icon:"🔎" },
      { name:"Documents uploaded", icon:"📄" },
      { name:"Ready for Shipping", icon:"🚢" }
    ]
  },

  Shipping: {
    icon: "🚢",
    column: "shipping_checklist",
    tasks: [
      { name:"Shipping company booked", icon:"📅" },
      { name:"Collection confirmed", icon:"🚚" },
      { name:"Export documents prepared", icon:"📄" },
      { name:"Customs paperwork checked", icon:"🛃" },
      { name:"Delivered to Port / Shipping Agent", icon:"🏗️" },
      { name:"Loaded / Handed Over", icon:"📦" },
      { name:"Vessel Departed", icon:"🌊" }
    ]
  }
};

function getWorkflow(status){
  status = String(status || "").trim();
  return ANYBIKE_WORKFLOWS[status] || null;
}

function getWorkflowData(enquiry, workflow){
  const value = enquiry && workflow ? enquiry[workflow.column] : null;
  return value && typeof value === "object" ? value : {};
}

function getWorkflowProgress(enquiry, workflow){
  const data = getWorkflowData(enquiry, workflow);
  let done = 0;

  workflow.tasks.forEach(function(task){
    if(data[task.name] === true){ done++; }
  });

  return {
    done:done,
    total:workflow.tasks.length,
    percent:workflow.tasks.length ? Math.round((done / workflow.tasks.length) * 100) : 0
  };
}

function renderWorkflow(enquiry){
  const workflow = getWorkflow(enquiry.lead_status || enquiry.status);
  if(!workflow){
    return '<div class="workflow-empty"><strong>No active internal workflow.</strong><div>Move the Lead Status to Operations or Shipping to start the appropriate checklist.</div></div>';
  }

  const data = getWorkflowData(enquiry, workflow);
  const progress = getWorkflowProgress(enquiry, workflow);

  let html = `
<div class="workflow-box">
  <div class="workflow-head">
    <div>
      <strong>${workflow.icon} ${enquiry.lead_status || enquiry.status} (${progress.done}/${progress.total})</strong>
      <div class="workflow-percent">${progress.percent}% complete</div>
    </div>
    <div>Internal workflow</div>
  </div>
  <div class="workflow-progress"><div style="width:${progress.percent}%"></div></div>
  <div class="workflow-list">`;

  workflow.tasks.forEach(function(task){
    const checked = data[task.name] === true ? "checked" : "";
    const doneClass = data[task.name] === true ? " task-done" : "";

    html += `
<label class="workflow-item${doneClass}">
  <input type="checkbox" ${checked}
    onchange="toggleWorkflowTask(${enquiry.id}, '${workflow.column}', '${task.name.replace(/'/g,"\\'")}', this.checked)">
  <span class="task-icon">${task.icon}</span>
  <span>${task.name}</span>
</label>`;
  });

  html += "</div></div>";
  return html;
}

function renderOperationsWorkflow(enquiry){
  return renderWorkflow(enquiry);
}

async function addWorkflowDealHistory(enquiryId, taskName, checked){
  const actionText = checked ? "completed" : "reopened";
  const details = taskName + " was " + actionText + ".";

  if(typeof addDealTimelineEvent === "function"){
    await addDealTimelineEvent(
      enquiryId,
      "Workflow",
      checked ? "Workflow task completed" : "Workflow task reopened",
      details,
      "Andy Gifford"
    );
    return;
  }

  console.warn("addDealTimelineEvent is unavailable; workflow event was not added to Deal Activity.");
}

async function toggleWorkflowTask(enquiryId, column, taskName, checked){
  const enquiry = allEnquiries.find(function(item){
    return Number(item.id) === Number(enquiryId);
  });

  if(!enquiry){ return; }

  const current = Object.assign({}, enquiry[column] || {});
  current[taskName] = checked;

  const update = {};
  update[column] = current;

  const result = await sb
    .from("bike_enquiries")
    .update(update)
    .eq("id", enquiryId)
    .select("id," + column)
    .single();

  if(result.error){
    alert(result.error.message);
    return;
  }

  enquiry[column] = current;
  await addWorkflowDealHistory(enquiryId, taskName, checked);

  if(typeof reloadKeepingDealOpen === "function"){
    await reloadKeepingDealOpen(enquiryId);
  }else if(typeof loadEnquiries === "function"){
    await loadEnquiries();
  }
}