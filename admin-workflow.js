const OPERATIONS_TASKS = [
  { name:"Purchase agreed", icon:"🤝" },
  { name:"Seller details verified", icon:"🧾" },
  { name:"Deposit received", icon:"💰" },
  { name:"Collection booked", icon:"🚚" },
  { name:"Bike received", icon:"🏍️" },
  { name:"Inspection completed", icon:"🔎" },
  { name:"Documents uploaded", icon:"📄" },
  { name:"Ready for Shipping", icon:"🚢" }
];

function getOperationsChecklist(enquiry){
  return enquiry.operations_checklist || {};
}

function getOperationsProgress(enquiry){
  const data = getOperationsChecklist(enquiry);
  let done = 0;

  OPERATIONS_TASKS.forEach(function(task){
    if(data[task.name] === true){ done++; }
  });

  return { done:done, total:OPERATIONS_TASKS.length };
}

function renderOperationsWorkflow(enquiry){
  const currentStatus = String(enquiry.lead_status || enquiry.status || "").trim();
  if(currentStatus !== "Operations"){ return ""; }

  const data = getOperationsChecklist(enquiry);
  const progress = getOperationsProgress(enquiry);
  const percent = Math.round((progress.done / progress.total) * 100);

  let html = `
    <div class="workflow-box">
      <div class="workflow-head">
        <div>
          <strong>📦 Operations (${progress.done}/${progress.total})</strong>
          <div class="workflow-percent">${percent}% complete</div>
        </div>
        <span>Internal workflow</span>
      </div>

      <div class="workflow-progress">
        <div style="width:${percent}%"></div>
      </div>

      <div class="workflow-list">
  `;

  OPERATIONS_TASKS.forEach(function(task){
    const checked = data[task.name] === true ? "checked" : "";
    const doneClass = data[task.name] === true ? " task-done" : "";

    html += `
      <label class="workflow-item${doneClass}">
        <input
          type="checkbox"
          ${checked}
          onchange="toggleOperationsTask(${enquiry.id}, '${task.name.replace(/'/g, "\\'")}', this.checked)"
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

async function toggleOperationsTask(enquiryId, taskName, isDone){
  const enquiry = allEnquiries.find(function(item){
    return Number(item.id) === Number(enquiryId);
  });

  if(!enquiry){
    alert("Enquiry not found.");
    return;
  }

  const current = enquiry.operations_checklist || {};
  current[taskName] = isDone;

  const { error } = await sb
    .from("bike_enquiries")
    .update({ operations_checklist: current })
    .eq("id", enquiryId);

  if(error){
    alert("Could not save Operations task.");
    console.error(error);
    return;
  }

  enquiry.operations_checklist = current;

  if(typeof filterEnquiries === "function"){
    filterEnquiries(currentFilter || "all");
  }
}