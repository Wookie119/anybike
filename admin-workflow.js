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
  }
};

function getWorkflowConfig(status){
  return ANYBIKE_WORKFLOWS[String(status || "").trim()] || null;
}

function getWorkflowData(enquiry, workflow){
  return enquiry[workflow.column] || {};
}

function getWorkflowProgress(enquiry, workflow){
  const data = getWorkflowData(enquiry, workflow);
  let done = 0;

  workflow.tasks.forEach(function(task){
    if(data[task.name] === true){
      done++;
    }
  });

  return {
    done: done,
    total: workflow.tasks.length,
    percent: Math.round((done / workflow.tasks.length) * 100)
  };
}

function renderWorkflow(enquiry){
  const status = String(enquiry.lead_status || enquiry.status || "").trim();
  const workflow = getWorkflowConfig(status);

  if(!workflow){
    return "";
  }

  const data = getWorkflowData(enquiry, workflow);
  const progress = getWorkflowProgress(enquiry, workflow);

  let html = `
    <div class="workflow-box">
      <div class="workflow-head">
        <div>
          <strong>${workflow.icon} ${status} (${progress.done}/${progress.total})</strong>
          <div class="workflow-percent">${progress.percent}% complete</div>
        </div>
        <span>Internal workflow</span>
      </div>

      <div class="workflow-progress">
        <div style="width:${progress.percent}%"></div>
      </div>

      <div class="workflow-list">
  `;

  workflow.tasks.forEach(function(task){
    const checked = data[task.name] === true ? "checked" : "";
    const doneClass = data[task.name] === true ? " task-done" : "";

    html += `
      <label class="workflow-item${doneClass}">
        <input
          type="checkbox"
          ${checked}
          onchange="toggleWorkflowTask(${enquiry.id}, '${status.replace(/'/g, "\\'")}', '${task.name.replace(/'/g, "\\'")}', this.checked)"
        >
        <span class="task-icon">${task.icon}</span>
        <span>${task.name}</span>
      </label>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

function renderOperationsWorkflow(enquiry){
  return renderWorkflow(enquiry);
}

async function toggleWorkflowTask(enquiryId, status, taskName, isDone){
  const enquiry = allEnquiries.find(function(item){
    return Number(item.id) === Number(enquiryId);
  });

  if(!enquiry){
    alert("Enquiry not found.");
    return;
  }

  const workflow = getWorkflowConfig(status);

  if(!workflow){
    alert("Workflow not found.");
    return;
  }

  const current = enquiry[workflow.column] || {};
  current[taskName] = isDone;

  const updateData = {};
  updateData[workflow.column] = current;

  const { error } = await sb
    .from("bike_enquiries")
    .update(updateData)
    .eq("id", enquiryId);

  if(error){
    alert("Could not save workflow task.");
    console.error(error);
    return;
  }

  enquiry[workflow.column] = current;

  if(typeof filterEnquiries === "function"){
    filterEnquiries(currentFilter || "all");
  }
}