/* ==========================================================================
   AnyBike
   admin-checklists.js
   Version 8.3
   Documents Required + Motorcycle Preparation
   ========================================================================== */

(function(){

"use strict";

const CHECKLIST_USER = "Andy Gifford";

const DOCUMENT_ITEMS = [

{ key:"v5c_registration", name:"V5C Registration Certificate (Logbook)" },
{ key:"v5c4_export", name:"V5C/4 Notification of Permanent Export" },
{ key:"purchase_invoice", name:"Purchase Invoice / Bill of Sale" },
{ key:"commercial_invoice", name:"Commercial Invoice" },
{ key:"seller_identity", name:"Seller Identity Verified" },
{ key:"gb_eori", name:"GB EORI Number" },
{ key:"cds_export", name:"CDS Export Declaration" },
{ key:"shipping_booking", name:"Shipping Booking Confirmation" },
{ key:"marine_insurance", name:"Marine Insurance Certificate" },
{ key:"bill_of_lading", name:"Bill of Lading" },
{ key:"nova_certificate", name:"NOVA Certificate" },
{ key:"destination_documents", name:"Destination Import Documents" }

];

const PREPARATION_ITEMS = [

{ key:"starts_runs", name:"Motorcycle Starts & Runs" },
{ key:"keys", name:"Keys / Spare Keys Received" },
{ key:"v5_present", name:"V5 Present With Motorcycle" },
{ key:"service_history", name:"Service History Included" },
{ key:"owners_manual", name:"Owner's Manual Included" },
{ key:"battery", name:"Battery Disconnected" },
{ key:"fuel", name:"Fuel Removed / Reduced" },
{ key:"alarm", name:"Alarm / Immobiliser Disabled" },
{ key:"photos", name:"Motorcycle Photographed" },
{ key:"condition", name:"Condition Report Completed" },
{ key:"accessories", name:"Accessories Removed / Secured" },
{ key:"parts", name:"Loose Parts Boxed & Labelled" },
{ key:"vin", name:"VIN Verified" },
{ key:"engine", name:"Engine Number Verified" },
{ key:"labels", name:"Shipping Labels Attached" }

];

function getClient(){

    if(window.sb){
        return window.sb;
    }

    if(typeof sb!=="undefined"){
        return sb;
    }

    throw new Error("Supabase client not found");

}

function escapeHtml(text){

    return String(text || "")

        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}

function getProgress(rows){

    const required =
        rows.filter(r=>r.status!=="not_required");

    const complete =
        required.filter(r=>r.status==="complete");

    return{

        required:required.length,

        complete:complete.length,

        waiting:
            required.length-complete.length,

        percent:
            required.length
            ?Math.round(
                complete.length/
                required.length*100
             )
            :100

    };

}
/* ==========================================================
   CREATE DEFAULT ROWS
========================================================== */

async function ensureChecklistRows(enquiryId){

    const client = getClient();

    const { data:existing, error } =
        await client
        .from("deal_checklists")
        .select("category,item_key")
        .eq("enquiry_id", enquiryId);

    if(error){
        throw error;
    }

    const current = new Set();

    (existing || []).forEach(function(row){

        current.add(
            row.category + "::" + row.item_key
        );

    });

    const rows = [];

    DOCUMENT_ITEMS.forEach(function(item){

        const key =
            "documents::" + item.key;

        if(!current.has(key)){

            rows.push({

                enquiry_id:enquiryId,
                category:"documents",

                item_key:item.key,
                item_name:item.name,

                status:"waiting"

            });

        }

    });

    PREPARATION_ITEMS.forEach(function(item){

        const key =
            "preparation::" + item.key;

        if(!current.has(key)){

            rows.push({

                enquiry_id:enquiryId,
                category:"preparation",

                item_key:item.key,
                item_name:item.name,

                status:"waiting"

            });

        }

    });

    if(rows.length){

        const result =
            await client
            .from("deal_checklists")
            .insert(rows);

        if(result.error){
            throw result.error;
        }

    }

}

/* ==========================================================
   LOAD DOCUMENTS
========================================================== */

async function loadDocumentChecklist(enquiryId){

    await ensureChecklistRows(enquiryId);

    const client = getClient();

    const result =
        await client
        .from("deal_checklists")
        .select("*")
        .eq("enquiry_id", enquiryId)
        .eq("category","documents");

    if(result.error){

        console.error(result.error);

        return;

    }

    renderDocumentChecklist(

        enquiryId,

        result.data || []

    );

}

/* ==========================================================
   LOAD PREPARATION
========================================================== */

async function loadPreparationChecklist(enquiryId){

    await ensureChecklistRows(enquiryId);

    const client = getClient();

    const result =
        await client
        .from("deal_checklists")
        .select("*")
        .eq("enquiry_id", enquiryId)
        .eq("category","preparation");

    if(result.error){

        console.error(result.error);

        return;

    }

    renderPreparationChecklist(

        enquiryId,

        result.data || []

    );

}
/* ==========================================================
   SHARED ITEM BUTTON
========================================================== */

function checklistButton(row, status, label){

    const active =
        row.status === status
            ? " active-" + status.replace("_","-")
            : "";

    return `
        <button
            type="button"
            class="checklist-state-button${active}"
            onclick="
                setDealChecklistStatus(
                    ${Number(row.id)},
                    ${Number(row.enquiry_id)},
                    '${status}'
                );
                return false;
            ">
            ${label}
        </button>
    `;

}

/* ==========================================================
   SHARED ROW RENDERER
========================================================== */

function renderChecklistRows(rows){

    return rows.map(function(row){

        let meta = "Waiting";

        if(row.status === "complete"){

            meta = row.completed_by
                ? "Completed by " + row.completed_by
                : "Complete";

        }

        if(row.status === "not_required"){

            meta = "Not required for this deal";

        }

        return `
            <div
                class="checklist-row status-${escapeHtml(row.status || "waiting")}">

                <div class="checklist-item-copy">

                    <strong>
                        ${escapeHtml(row.item_name)}
                    </strong>

                    <small>
                        ${escapeHtml(meta)}
                    </small>

                </div>

                <div class="checklist-state-buttons">

                    ${checklistButton(
                        row,
                        "waiting",
                        "⏳ Waiting"
                    )}

                    ${checklistButton(
                        row,
                        "complete",
                        "✅ Complete"
                    )}

                    ${checklistButton(
                        row,
                        "not_required",
                        "🚫 Not Required"
                    )}

                </div>

            </div>
        `;

    }).join("");

}

/* ==========================================================
   DOCUMENTS PANEL RENDER
========================================================== */

function renderDocumentChecklist(
    enquiryId,
    rows
){

    const host =
        document.getElementById(
            "deal-checklist-documents-" +
            enquiryId
        );

    if(!host){
        return;
    }

    host.innerHTML =
        renderChecklistRows(rows);

    const progress =
        getProgress(rows);

    const badge =
        document.getElementById(
            "deal-checklist-documents-count-" +
            enquiryId
        );

    const summary =
        document.getElementById(
            "deal-checklist-documents-summary-" +
            enquiryId
        );

    const meta =
        document.getElementById(
            "deal-checklist-documents-meta-" +
            enquiryId
        );

    const bar =
        document.getElementById(
            "deal-checklist-documents-progress-" +
            enquiryId
        );

    if(badge){

        badge.classList.remove(
            "badge-green",
            "badge-orange",
            "badge-grey"
        );

        if(progress.waiting === 0){

            badge.textContent = "Complete";
            badge.classList.add("badge-green");

        }else{

            badge.textContent =
                progress.complete +
                " / " +
                progress.required;

            badge.classList.add("badge-orange");

        }

    }

    if(summary){

        summary.textContent =
            progress.complete +
            " / " +
            progress.required;

    }

    if(meta){

        const notRequired =
            rows.filter(function(row){
                return row.status === "not_required";
            }).length;

        meta.textContent =
            progress.waiting +
            " waiting • " +
            notRequired +
            " not required";

    }

    if(bar){

        bar.style.width =
            progress.percent + "%";

    }

}

/* ==========================================================
   MOTORCYCLE PREPARATION PANEL RENDER
========================================================== */

function renderPreparationChecklist(
    enquiryId,
    rows
){

    const host =
        document.getElementById(
            "deal-checklist-preparation-" +
            enquiryId
        );

    if(!host){
        return;
    }

    host.innerHTML =
        renderChecklistRows(rows);

    const progress =
        getProgress(rows);

    const badge =
        document.getElementById(
            "deal-checklist-preparation-count-" +
            enquiryId
        );

    const summary =
        document.getElementById(
            "deal-checklist-preparation-summary-" +
            enquiryId
        );

    const meta =
        document.getElementById(
            "deal-checklist-preparation-meta-" +
            enquiryId
        );

    const bar =
        document.getElementById(
            "deal-checklist-preparation-progress-" +
            enquiryId
        );

    if(badge){

        badge.classList.remove(
            "badge-green",
            "badge-orange",
            "badge-grey"
        );

        if(progress.waiting === 0){

            badge.textContent = "Complete";
            badge.classList.add("badge-green");

        }else{

            badge.textContent =
                progress.complete +
                " / " +
                progress.required;

            badge.classList.add("badge-orange");

        }

    }

    if(summary){

        summary.textContent =
            progress.complete +
            " / " +
            progress.required;

    }

    if(meta){

        const notRequired =
            rows.filter(function(row){
                return row.status === "not_required";
            }).length;

        meta.textContent =
            progress.waiting +
            " waiting • " +
            notRequired +
            " not required";

    }

    if(bar){

        bar.style.width =
            progress.percent + "%";

    }

}
/* ==========================================================
   SHARED ITEM BUTTON
========================================================== */

function checklistButton(row, status, label){

    const active =
        row.status === status
            ? " active-" + status.replace("_","-")
            : "";

    return `
        <button
            type="button"
            class="checklist-state-button${active}"
            onclick="
                setDealChecklistStatus(
                    ${Number(row.id)},
                    ${Number(row.enquiry_id)},
                    '${status}'
                );
                return false;
            ">
            ${label}
        </button>
    `;

}

/* ==========================================================
   SHARED ROW RENDERER
========================================================== */

function renderChecklistRows(rows){

    return rows.map(function(row){

        let meta = "Waiting";

        if(row.status === "complete"){

            meta = row.completed_by
                ? "Completed by " + row.completed_by
                : "Complete";

        }

        if(row.status === "not_required"){

            meta = "Not required for this deal";

        }

        return `
            <div
                class="checklist-row status-${escapeHtml(row.status || "waiting")}">

                <div class="checklist-item-copy">

                    <strong>
                        ${escapeHtml(row.item_name)}
                    </strong>

                    <small>
                        ${escapeHtml(meta)}
                    </small>

                </div>

                <div class="checklist-state-buttons">

                    ${checklistButton(
                        row,
                        "waiting",
                        "⏳ Waiting"
                    )}

                    ${checklistButton(
                        row,
                        "complete",
                        "✅ Complete"
                    )}

                    ${checklistButton(
                        row,
                        "not_required",
                        "🚫 Not Required"
                    )}

                </div>

            </div>
        `;

    }).join("");

}

/* ==========================================================
   DOCUMENTS PANEL RENDER
========================================================== */

function renderDocumentChecklist(
    enquiryId,
    rows
){

    const host =
        document.getElementById(
            "deal-checklist-documents-" +
            enquiryId
        );

    if(!host){
        return;
    }

    host.innerHTML =
        renderChecklistRows(rows);

    const progress =
        getProgress(rows);

    const badge =
        document.getElementById(
            "deal-checklist-documents-count-" +
            enquiryId
        );

    const summary =
        document.getElementById(
            "deal-checklist-documents-summary-" +
            enquiryId
        );

    const meta =
        document.getElementById(
            "deal-checklist-documents-meta-" +
            enquiryId
        );

    const bar =
        document.getElementById(
            "deal-checklist-documents-progress-" +
            enquiryId
        );

    if(badge){

        badge.classList.remove(
            "badge-green",
            "badge-orange",
            "badge-grey"
        );

        if(progress.waiting === 0){

            badge.textContent = "Complete";
            badge.classList.add("badge-green");

        }else{

            badge.textContent =
                progress.complete +
                " / " +
                progress.required;

            badge.classList.add("badge-orange");

        }

    }

    if(summary){

        summary.textContent =
            progress.complete +
            " / " +
            progress.required;

    }

    if(meta){

        const notRequired =
            rows.filter(function(row){
                return row.status === "not_required";
            }).length;

        meta.textContent =
            progress.waiting +
            " waiting • " +
            notRequired +
            " not required";

    }

    if(bar){

        bar.style.width =
            progress.percent + "%";

    }

}

/* ==========================================================
   MOTORCYCLE PREPARATION PANEL RENDER
========================================================== */

function renderPreparationChecklist(
    enquiryId,
    rows
){

    const host =
        document.getElementById(
            "deal-checklist-preparation-" +
            enquiryId
        );

    if(!host){
        return;
    }

    host.innerHTML =
        renderChecklistRows(rows);

    const progress =
        getProgress(rows);

    const badge =
        document.getElementById(
            "deal-checklist-preparation-count-" +
            enquiryId
        );

    const summary =
        document.getElementById(
            "deal-checklist-preparation-summary-" +
            enquiryId
        );

    const meta =
        document.getElementById(
            "deal-checklist-preparation-meta-" +
            enquiryId
        );

    const bar =
        document.getElementById(
            "deal-checklist-preparation-progress-" +
            enquiryId
        );

    if(badge){

        badge.classList.remove(
            "badge-green",
            "badge-orange",
            "badge-grey"
        );

        if(progress.waiting === 0){

            badge.textContent = "Complete";
            badge.classList.add("badge-green");

        }else{

            badge.textContent =
                progress.complete +
                " / " +
                progress.required;

            badge.classList.add("badge-orange");

        }

    }

    if(summary){

        summary.textContent =
            progress.complete +
            " / " +
            progress.required;

    }

    if(meta){

        const notRequired =
            rows.filter(function(row){
                return row.status === "not_required";
            }).length;

        meta.textContent =
            progress.waiting +
            " waiting • " +
            notRequired +
            " not required";

    }

    if(bar){

        bar.style.width =
            progress.percent + "%";

    }

}
