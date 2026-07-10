/*
  AnyBike Deal Workflow
  File: admin-workflow.js

  Keeps Operations and Shipping checklist history visible after a deal
  moves to Completed, Closed, Lost, Save For Later, or another Lead Status.

  Active workflow:
    Operations -> editable Operations checklist
    Shipping   -> read-only Operations history + editable Shipping checklist

  Non-active / final statuses:
    Any saved Operations and Shipping checklists remain visible as read-only history.
*/

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

  if(value && typeof value === "object"){
    return value;
  }

  if(typeof value === "string" && value.trim()){
    try{
      const parsed = JSON.parse(value);

      return parsed && typeof parsed === "object"
        ? parsed
        : {};
    }catch(err){
      return {};
    }
  }

  return {};
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
    percent: workflow.tasks.length
      ? Math.round((done / workflow.tasks.length) * 100)
      : 0
  };
}

function hasWorkflowHistory(enquiry, workflow){
  const data = getWorkflowData(enquiry, workflow);

  return workflow.tasks.some(function(task){
    return Object.prototype.hasOwnProperty.call(data, task.name);
  });
}

function renderWorkflowSection(enquiry, workflowName, editable){
  const workflow = ANYBIKE_WORKFLOWS[workflowName];

  if(!workflow){
    return "";
  }

  const data = getWorkflowData(enquiry, workflow);
  const progress = getWorkflowProgress(enquiry, workflow);

  const modeLabel = editable
    ? "Active internal workflow"
    : "Saved workflow history";

  let html = `
<div
  class="workflow-box${editable ? "" : " workflow-history-box"}"
  style="${editable ? "" : "margin-bottom:14px;border-color:rgba(255,255,255,.16);"}"
>
  <div class="workflow-head">
    <div>
      <strong>
        ${workflow.icon} ${workflowName}
        (${progress.done}/${progress.total})
      </strong>

      <div class="workflow-percent">
        ${progress.percent}% complete
      </div>
    </div>

    <div>${modeLabel}</div>
  </div>

  <div class="workflow-progress">
    <div style="width:${progress.percent}%"></div>
  </div>

  <div class="workflow-list">
`;

  workflow.tasks.forEach(function(task){
    const completed = data[task.name] === true;

    const checked = completed
      ? "checked"
      : "";

    const doneClass = completed
      ? " task-done"
      : "";

    const disabled = editable
      ? ""
      : "disabled";

    const changeHandler = editable
      ? `onchange="toggleWorkflowTask(
          ${Number(enquiry.id)},
          '${workflow.column}',
          '${task.name.replace(/'/g, "\\'")}',
          this.checked
        )"`
      : "";

    html += `
<label
  class="workflow-item${doneClass}"
  style="${editable ? "" : "cursor:default;"}"
>
  <input
    type="checkbox"
    ${checked}
    ${disabled}
    ${changeHandler}
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

function renderWorkflow(enquiry){
  const status = String(
    enquiry &&
    (enquiry.lead_status || enquiry.status) ||
    ""
  ).trim();

  const operationsWorkflow = ANYBIKE_WORKFLOWS.Operations;
  const shippingWorkflow = ANYBIKE_WORKFLOWS.Shipping;

  const hasOperations = hasWorkflowHistory(
    enquiry,
    operationsWorkflow
  );

  const hasShipping = hasWorkflowHistory(
    enquiry,
    shippingWorkflow
  );

  /*
    Operations is the active editable workflow.
  */
  if(status === "Operations"){
    let html = renderWorkflowSection(
      enquiry,
      "Operations",
      true
    );

    if(hasShipping){
      html += renderWorkflowSection(
        enquiry,
        "Shipping",
        false
      );
    }

    return html;
  }

  /*
    Shipping remains editable.

    Operations is retained above it as read-only history.
  */
  if(status === "Shipping"){
    let html = "";

    if(hasOperations){
      html += renderWorkflowSection(
        enquiry,
        "Operations",
        false
      );
    }

    html += renderWorkflowSection(
      enquiry,
      "Shipping",
      true
    );

    return html;
  }

  /*
    Completed, Closed, Lost, Save For Later
    and all other statuses:

    preserve any workflow data as read-only history.
  */
  let historyHtml = "";

  if(hasOperations){
    historyHtml += renderWorkflowSection(
      enquiry,
      "Operations",
      false
    );
  }

  if(hasShipping){
    historyHtml += renderWorkflowSection(
      enquiry,
      "Shipping",
      false
    );
  }

  if(historyHtml){
    return `
<div
  class="workflow-empty"
  style="margin-bottom:14px;"
>
  <strong>Workflow history</strong>

  <div>
    This deal is currently ${status || "outside an active workflow"}.
    Saved Operations and Shipping progress remains available below.
  </div>
</div>

${historyHtml}
`;
  }

  return `
<div class="workflow-empty">
  <strong>No workflow history yet.</strong>

  <div>
    Move the Lead Status to Operations or Shipping
    to start the appropriate checklist.
  </div>
</div>
`;
}

function renderOperationsWorkflow(enquiry){
  return renderWorkflow(enquiry);
}

async function addWorkflowDealHistory(
  enquiryId,
  taskName,
  checked
){
  const actionText = checked
    ? "completed"
    : "reopened";

  const details =
    taskName + " was " + actionText + ".";

  if(typeof addDealTimelineEvent === "function"){
    await addDealTimelineEvent(
      enquiryId,
      "Workflow",
      checked
        ? "Workflow task completed"
        : "Workflow task reopened",
      details,
      "Andy Gifford"
    );

    return;
  }

  console.warn(
    "addDealTimelineEvent is unavailable; " +
    "workflow event was not added to Deal Activity."
  );
}

async function toggleWorkflowTask(
  enquiryId,
  column,
  taskName,
  checked
){
  const enquiry = allEnquiries.find(function(item){
    return Number(item.id) === Number(enquiryId);
  });

  if(!enquiry){
    return;
  }

  const current = Object.assign(
    {},
    enquiry[column] || {}
  );

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

  await addWorkflowDealHistory(
    enquiryId,
    taskName,
    checked
  );

  if(typeof reloadKeepingDealOpen === "function"){
    await reloadKeepingDealOpen(enquiryId);
  }else if(typeof loadEnquiries === "function"){
    await loadEnquiries();
  }
}