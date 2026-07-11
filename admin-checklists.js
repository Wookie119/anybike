/* ==========================================================================
   AnyBike — admin-checklists.js
   Documentation & Motorcycle Preparation v8.2.1
   ========================================================================== */

(function(){
  "use strict";

  const CHECKLIST_USER = "Andy Gifford";

  const CHECKLIST_DEFINITIONS = {
    documents: [
      { key:"v5c_registration", name:"V5C Registration Certificate (Logbook)" },
      { key:"v5c4_permanent_export", name:"V5C/4 Notification of Permanent Export Slip" },
      { key:"purchase_invoice", name:"Purchase Invoice / Bill of Sale" },
      { key:"commercial_invoice", name:"Commercial Invoice" },
      { key:"seller_identity", name:"Seller Identity Verified" },
      { key:"gb_eori", name:"GB EORI Number Confirmed" },
      { key:"cds_export_declaration", name:"CDS Export Declaration" },
      { key:"shipping_booking", name:"Shipping Booking Confirmation / Dock Receipt" },
      { key:"marine_insurance", name:"Marine Insurance Certificate" },
      { key:"bill_of_lading", name:"Bill of Lading" },
      { key:"nova_certificate", name:"NOVA Certificate" },
      { key:"destination_documents", name:"Destination-Specific Import Documents" }
    ],

    preparation: [
      { key:"starts_and_runs", name:"Motorcycle Starts & Runs" },
      { key:"keys_received", name:"Keys / Spare Keys Received" },
      { key:"v5_with_motorcycle", name:"V5C Present With Motorcycle" },
      { key:"service_history", name:"Service History Included" },
      { key:"owners_manual", name:"Owner's Manual Included" },
      { key:"battery_disconnected", name:"Battery Disconnected" },
      { key:"fuel_removed", name:"Fuel Removed / Reduced for Shipping" },
      { key:"alarm_disabled", name:"Alarm / Immobiliser Disabled" },
      { key:"motorcycle_photographed", name:"Motorcycle Photographed Before Shipping" },
      { key:"condition_report", name:"Condition Report Completed" },
      { key:"accessories_secured", name:"Accessories Removed or Secured" },
      { key:"loose_parts_labelled", name:"Loose Parts Boxed & Labelled" },
      { key:"vin_verified", name:"VIN / Frame Number Verified" },
      { key:"engine_number_verified", name:"Engine Number Verified" },
      { key:"shipping_labels", name:"Shipping Labels Attached" }
    ]
  };

  function getClient(){
    if(typeof window.sb !== "undefined"){
      return window.sb;
    }

    if(typeof sb !== "undefined"){
      return sb;
    }

    throw new Error("Supabase client 'sb' was not found.");
  }

  function numberValue(value){
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function escapeHtml(value){
    if(typeof window.escapeAdminHtml === "function"){
      return window.escapeAdminHtml(value);
    }

    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function element(id){
    return document.getElementById(id);
  }

  function statusBox(enquiryId){
    return element("deal-checklist-status-" + numberValue(enquiryId));
  }

  function setStatus(enquiryId, message, type){
    const box = statusBox(enquiryId);

    if(!box){
      return;
    }

    box.textContent = String(message || "");
    box.className = "checklist-status";

    if(message){
      box.classList.add("show");
    }

    if(type === "success"){
      box.classList.add("success");
    }

    if(type === "error"){
      box.classList.add("error");
    }
  }

  function allDefinitions(){
    const rows = [];

    Object.keys(CHECKLIST_DEFINITIONS).forEach(function(category){
      CHECKLIST_DEFINITIONS[category].forEach(function(item){
        rows.push({
          category:category,
          item_key:item.key,
          item_name:item.name
        });
      });
    });

    return rows;
  }

  async function ensureChecklistRows(enquiryId){
    const id = numberValue(enquiryId);
    const client = getClient();

    const existingResult = await client
      .from("deal_checklists")
      .select("category,item_key")
      .eq("enquiry_id", id);

    if(existingResult.error){
      throw existingResult.error;
    }

    const existingKeys = new Set(
      (existingResult.data || []).map(function(row){
        return row.category + "::" + row.item_key;
      })
    );

    const missingRows = allDefinitions()
      .filter(function(item){
        return !existingKeys.has(item.category + "::" + item.item_key);
      })
      .map(function(item){
        return {
          enquiry_id:id,
          category:item.category,
          item_key:item.item_key,
          item_name:item.item_name,
          status:"waiting"
        };
      });

    if(!missingRows.length){
      return;
    }

    const insertResult = await client
      .from("deal_checklists")
      .insert(missingRows);

    if(insertResult.error){
      throw insertResult.error;
    }
  }

  function sortRows(rows, category){
    const order = CHECKLIST_DEFINITIONS[category] || [];
    const positions = new Map();

    order.forEach(function(item, index){
      positions.set(item.key, index);
    });

    return rows.slice().sort(function(a,b){
      return (positions.get(a.item_key) ?? 999) -
             (positions.get(b.item_key) ?? 999);
    });
  }

  function sectionProgress(rows){
    const applicable = rows.filter(function(row){
      return row.status !== "not_required";
    });

    const complete = applicable.filter(function(row){
      return row.status === "complete";
    });

    const waiting = applicable.length - complete.length;
    const percent = applicable.length
      ? Math.round((complete.length / applicable.length) * 100)
      : 100;

    return {
      applicable:applicable.length,
      complete:complete.length,
      waiting:waiting,
      notRequired:rows.length - applicable.length,
      percent:percent
    };
  }

  function stateButton(row, state, label){
    const activeClass =
      row.status === state
        ? " active-" + state.replace("_","-")
        : "";

    return `
      <button
        type="button"
        class="checklist-state-button${activeClass}"
        onclick="setDealChecklistStatus(
          ${numberValue(row.id)},
          ${numberValue(row.enquiry_id)},
          '${state}'
        );return false;">
        ${label}
      </button>
    `;
  }
    function renderRows(enquiryId, category, rows){
    const host = element(
      "deal-checklist-" + numberValue(enquiryId) + "-" + category
    );

    if(!host){
      return;
    }

    host.innerHTML = sortRows(rows, category).map(function(row){

      const status = String(row.status || "waiting");

      let meta = "Waiting";

      if(status === "complete"){
        meta = row.completed_by
          ? "Completed by " + row.completed_by
          : "Complete";
      }
      else if(status === "not_required"){
        meta = "Not required for this deal";
      }

      return `
        <div class="checklist-row status-${escapeHtml(status)}">

          <div class="checklist-item-copy">
            <strong>${escapeHtml(row.item_name)}</strong>
            <small>${escapeHtml(meta)}</small>
          </div>

          <div class="checklist-state-buttons">

            ${stateButton(row,"waiting","⏳ Waiting")}

            ${stateButton(row,"complete","✅ Complete")}

            ${stateButton(row,"not_required","🚫 Not Required")}

          </div>

        </div>
      `;

    }).join("");

  }

  function updateProgress(enquiryId, documentRows, preparationRows){

    const documents = sectionProgress(documentRows);
    const preparation = sectionProgress(preparationRows);

    function setText(id,value){

      const el = element(id);

      if(el){
        el.textContent = value;
      }

    }

    function setWidth(id,value){

      const el = element(id);

      if(el){
        el.style.width = value + "%";
      }

    }

    setText(
      "deal-checklist-documents-count-" + enquiryId,
      documents.complete + " / " + documents.applicable
    );

    setText(
      "deal-checklist-preparation-count-" + enquiryId,
      preparation.complete + " / " + preparation.applicable
    );

    setText(
      "deal-checklist-documents-meta-" + enquiryId,
      documents.waiting +
      " waiting • " +
      documents.notRequired +
      " not required"
    );

    setText(
      "deal-checklist-preparation-meta-" + enquiryId,
      preparation.waiting +
      " waiting • " +
      preparation.notRequired +
      " not required"
    );

    setWidth(
      "deal-checklist-documents-progress-" + enquiryId,
      documents.percent
    );

    setWidth(
      "deal-checklist-preparation-progress-" + enquiryId,
      preparation.percent
    );

    const badge =
      element("deal-checklist-count-" + enquiryId);

    if(badge){

      badge.classList.remove(
        "badge-green",
        "badge-orange",
        "badge-grey"
      );

      const waiting =
        documents.waiting +
        preparation.waiting;

      const totalComplete =
        documents.complete +
        preparation.complete;

      const totalRequired =
        documents.applicable +
        preparation.applicable;

      if(waiting === 0){

        badge.textContent = "Complete";
        badge.classList.add("badge-green");

      }
      else{

        badge.textContent =
          totalComplete +
          " / " +
          totalRequired;

        badge.classList.add("badge-orange");

      }

    }

  }

  async function loadDealChecklists(enquiryId){

    try{

      await ensureChecklistRows(enquiryId);

      const client = getClient();

      const result = await client
        .from("deal_checklists")
        .select("*")
        .eq("enquiry_id", enquiryId);

      if(result.error){
        throw result.error;
      }

      const rows = result.data || [];

      const documentRows =
        rows.filter(function(r){
          return r.category === "documents";
        });

      const preparationRows =
        rows.filter(function(r){
          return r.category === "preparation";
        });

      renderRows(
        enquiryId,
        "documents",
        documentRows
      );

      renderRows(
        enquiryId,
        "preparation",
        preparationRows
      );

      updateProgress(
        enquiryId,
        documentRows,
        preparationRows
      );

    }
    catch(error){

      console.error(error);

      setStatus(
        enquiryId,
        "Unable to load checklist.",
        "error"
      );

    }

  }
    async function setDealChecklistStatus(rowId, enquiryId, status){

    const validStatuses = [
      "waiting",
      "complete",
      "not_required"
    ];

    if(!validStatuses.includes(status)){
      return;
    }

    const id = numberValue(enquiryId);

    setStatus(
      id,
      "Saving checklist…",
      ""
    );

    try{

      const client = getClient();

      const result = await client
        .from("deal_checklists")
        .update({
          status:status,

          completed_by:
            status === "complete"
              ? CHECKLIST_USER
              : null,

          completed_at:
            status === "complete"
              ? new Date().toISOString()
              : null
        })
        .eq("id", numberValue(rowId))
        .eq("enquiry_id", id);

      if(result.error){
        throw result.error;
      }

      await loadDealChecklists(id);

      setStatus(
        id,

        status === "complete"
          ? "Item marked complete."
          : status === "not_required"
            ? "Item marked not required."
            : "Item returned to waiting.",

        "success"
      );

      if(
        typeof window.loadDealTimeline === "function"
      ){
        window.loadDealTimeline(id);
      }

    }
    catch(error){

      console.error(
        "Checklist item could not be saved:",
        error
      );

      setStatus(
        id,
        "Checklist item could not be saved: " +
          (error.message || "Unknown error"),
        "error"
      );

    }

  }

  window.loadDealChecklists =
    loadDealChecklists;

  window.setDealChecklistStatus =
    setDealChecklistStatus;

})();