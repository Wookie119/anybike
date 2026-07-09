const OPERATIONS_TASKS = [
  "Purchase agreed",
  "Seller details verified",
  "Deposit received",
  "Collection booked",
  "Bike received",
  "Inspection completed",
  "Documents uploaded",
  "Ready for Shipping"
];

function getOperationsChecklist(enquiry){
  return enquiry.operations_checklist || {};
}

function getOperationsProgress(enquiry){
  const data = getOperationsChecklist(enquiry);
  let done = 0;

  OPERATIONS_TASKS.forEach(function(task){
    if(data[task] === true){
      done++;
    }
  });

  return {
    done: done,
    total: OPERATIONS_TASKS.length
  };
}

function renderOperationsWorkflow(enquiry){
  const currentStatus = String(enquiry.lead_status || enquiry.status || "").trim();

  if(currentStatus !== "Operations"){
    return "";
  }

  const data = getOperationsChecklist(enquiry);
  const progress = getOperationsProgress(enquiry);

  let html = `
    <div class="workflow-box">
      <div class="workflow-head">
        <strong>Operations (${progress.done}/${progress.total})</strong>
        <span>Internal workflow</span>
      </div>

      <div class="workflow-list">
  `;

  OPERATIONS_TASKS.forEach(function(task){
    const checked = data[task] === true ? "checked" : "";

    html += `
      <label class="workflow-item">
        <input
          type="checkbox"
          ${checked}
          onchange="toggleOperationsTask(${enquiry.id}, '${task.replace(/'/g, "\\'")}', this.checked)"
        >
        <span>${task}</span>
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
    .update({
      operations_checklist: current
    })
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