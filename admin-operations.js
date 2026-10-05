/* ==========================================================================
   AnyBike — Deal 360 Operations
   Purchase & Collection foundation
   --------------------------------------------------------------------------
   Intentionally isolated from Message Centre, instant messaging, header bell
   and customer notification read-state code.
   ========================================================================== */
(function(){
  "use strict";

  const operationsCache = new Map();
  const operationsLoading = new Set();
  const operationsSaving = new Set();
  const moveBookingCache = new Map();
  const moveBookingLoading = new Set();
  const moveBookingSaving = new Set();
  const collectionSaving = new Set();

  function client(){
    if(typeof window.sb !== "undefined") return window.sb;
    if(typeof sb !== "undefined") return sb;
    throw new Error("Supabase client is unavailable.");
  }

  function esc(value){
    if(typeof window.escapeAdminHtml === "function"){
      return window.escapeAdminHtml(value == null ? "" : value);
    }
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function niceDate(value){
    if(!value) return "Not set";
    const d = new Date(value + (String(value).length === 10 ? "T12:00:00" : ""));
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("en-GB");
  }

  function niceDateTime(value){
    if(!value) return "Not recorded";
    const d=new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("en-GB");
  }

  function gbp(value){
    const n=Number(value||0);
    return "£"+n.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function motorcycleTitle(row){
    return [row.bike_year,row.make,row.model,row.variant].filter(Boolean).join(" ") || "Motorcycle";
  }

  function statusLabel(value){
    return String(value || "")
      .replace(/_/g," ")
      .replace(/\b\w/g,function(c){ return c.toUpperCase(); });
  }

  function sellerNameFor(row){
    const id=String(row.deal_motorcycle_id || "");
    const display=(typeof adminDealSellerDisplay !== "undefined" && adminDealSellerDisplay && adminDealSellerDisplay.get)
      ? (adminDealSellerDisplay.get(id) || {})
      : {};
    const confirmation=(typeof adminDealSellerConfirmations !== "undefined" && adminDealSellerConfirmations && adminDealSellerConfirmations.get)
      ? (adminDealSellerConfirmations.get(id) || {})
      : {};
    return row.seller_name ||
      display.seller_name ||
      confirmation.seller_business_name ||
      confirmation.seller_name ||
      confirmation.dealer_name ||
      confirmation.source_name ||
      confirmation.seller_contact_name ||
      "Seller / supplier";
  }

  function sellerPhoneFor(row){
    const id=String(row.deal_motorcycle_id || "");
    const display=(typeof adminDealSellerDisplay !== "undefined" && adminDealSellerDisplay && adminDealSellerDisplay.get)
      ? (adminDealSellerDisplay.get(id) || {})
      : {};
    const confirmation=(typeof adminDealSellerConfirmations !== "undefined" && adminDealSellerConfirmations && adminDealSellerConfirmations.get)
      ? (adminDealSellerConfirmations.get(id) || {})
      : {};
    return row.seller_phone ||
      display.seller_phone ||
      confirmation.seller_phone ||
      confirmation.seller_contact_phone ||
      "";
  }

  function style(){
    if(document.getElementById("anybike-operations-css")) return;
    const el=document.createElement("style");
    el.id="anybike-operations-css";
    el.textContent=`
      .ab-ops{display:grid;gap:12px}
      .ab-ops-bike{border:1px solid rgba(255,255,255,.11);border-top:3px solid #ed1c24;border-radius:12px;background:#0d0d0d;overflow:hidden}
      .ab-ops-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px;background:linear-gradient(90deg,#171717,#0d0d0d);border-bottom:1px solid rgba(255,255,255,.08)}
      .ab-ops-head span{display:block;color:#ed1c24;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.07em}
      .ab-ops-head h4{margin:4px 0 0;color:#fff;font-size:17px}
      .ab-ops-state{padding:6px 10px;border-radius:999px;border:1px solid #555;background:#1b1b1b;color:#ddd;font-size:11px;font-weight:900;white-space:nowrap}
      .ab-ops-state.ready{border-color:#2f8d55;background:#102719;color:#8ff0b0}
      .ab-ops-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:12px 16px}
      .ab-ops-metric{padding:10px 11px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:#111}
      .ab-ops-metric span{display:block;color:#8f9bab;font-size:10px;font-weight:900;text-transform:uppercase}
      .ab-ops-metric strong{display:block;margin-top:5px;color:#fff;font-size:13px}
      .ab-ops-ready{display:grid;grid-template-columns:minmax(160px,.7fr) minmax(260px,1.3fr) auto;gap:10px;align-items:end;padding:4px 16px 14px}
      .ab-ops-field label{display:block;margin-bottom:5px;color:#9aa3ae;font-size:10px;font-weight:900;text-transform:uppercase}
      .ab-ops-field input,.ab-ops-field textarea{width:100%;box-sizing:border-box;border:1px solid #353535;border-radius:8px;background:#0a0a0a;color:#fff;padding:10px 11px;font:inherit}
      .ab-ops-field textarea{min-height:42px;resize:vertical}
      .ab-date-wrap{display:grid;grid-template-columns:1fr auto;gap:6px}
      .ab-date-open{border:1px solid #444;border-radius:8px;background:#171717;color:#fff;padding:0 12px;font-size:17px;cursor:pointer}
      .ab-date-shortcuts{display:flex;gap:6px;margin-top:6px}
      .ab-date-shortcuts button{border:1px solid #3a3a3a;border-radius:7px;background:#151515;color:#ddd;padding:5px 8px;font-size:10px;font-weight:900;cursor:pointer}
      .ab-move{margin:0 16px 14px;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:#101010;overflow:hidden}
      .ab-move-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
      .ab-move-head span{display:block;color:#ed1c24;font-size:10px;font-weight:950;text-transform:uppercase}
      .ab-move-head h5{margin:4px 0 0;color:#fff;font-size:15px}
      .ab-move-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:14px}
      .ab-move-section{grid-column:1/-1;color:#fff;font-size:12px;font-weight:950;border-bottom:1px solid rgba(255,255,255,.08);padding:3px 0 7px}
      .ab-move-field label{display:block;margin-bottom:5px;color:#9aa3ae;font-size:10px;font-weight:900;text-transform:uppercase}
      .ab-move-field input,.ab-move-field select,.ab-move-field textarea{width:100%;box-sizing:border-box;border:1px solid #353535;border-radius:8px;background:#090909;color:#fff;padding:9px 10px;font:inherit}
      .ab-move-field textarea{min-height:76px;resize:vertical}
      .ab-move-field.required-state{padding:8px;border:1px solid transparent;border-radius:10px;transition:border-color .15s ease,background .15s ease}
      .ab-move-field.required-state.needs-attention{border-color:rgba(237,28,36,.8);background:rgba(237,28,36,.075)}
      .ab-move-field.required-state.needs-attention label{color:#ff8a8f}
      .ab-move-field.required-state.needs-attention input,.ab-move-field.required-state.needs-attention textarea,.ab-move-field.required-state.needs-attention select{border-color:#ed1c24}
      .ab-move-field.required-state.complete{border-color:rgba(47,141,85,.6);background:rgba(47,141,85,.08)}
      .ab-move-field.required-state.complete label{color:#8ff0b0}
      .ab-move-field.required-state.complete input,.ab-move-field.required-state.complete textarea,.ab-move-field.required-state.complete select{border-color:#2f8d55}
      .ab-move-section.section-needs-attention{color:#ff8a8f;border-bottom-color:rgba(237,28,36,.55)}
      .ab-move-section.section-complete{color:#8ff0b0;border-bottom-color:rgba(47,141,85,.5)}
      .ab-move-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.08);background:#0c0c0c}
      .ab-move-actions small{color:#999;line-height:1.4}
      .ab-move-actions div{display:flex;gap:8px}
      .ab-move-secondary{border:1px solid #555!important;background:#171717!important}
      .ab-move-warning{margin:0 14px 12px;padding:10px 11px;border:1px solid rgba(255,181,71,.3);border-radius:8px;background:#211707;color:#ffd18a;font-size:11px;line-height:1.4}
      .ab-move-warning.ab-move-ready{border-color:rgba(47,141,85,.5);background:#102719;color:#9cf0b5}
      .ab-move-booked{margin:0 16px 14px;padding:12px 14px;border:1px solid rgba(47,141,85,.4);border-radius:10px;background:#102719;color:#9cf0b5}
      .ab-collect-items{grid-column:1/-1;display:grid;gap:8px}
      .ab-collect-item-row{display:grid;grid-template-columns:86px 150px minmax(220px,1fr) auto;gap:8px;align-items:center;padding:8px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:#0b0b0b}
      .ab-collect-item-row input,.ab-collect-item-row select{width:100%;box-sizing:border-box;border:1px solid #353535;border-radius:7px;background:#070707;color:#fff;padding:8px}
      .ab-collect-item-empty{padding:10px;border:1px dashed rgba(255,255,255,.15);border-radius:8px;color:#999}
      .ab-ops-progress{margin:0 16px 14px;padding:12px 14px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:#0d0d0d}
      .ab-ops-progress-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px}
      .ab-ops-progress-head span{color:#888;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
      .ab-ops-progress-head strong{color:#fff;font-size:11px}
      .ab-ops-progress-track{height:7px;background:#262626;border-radius:999px;overflow:hidden}
      .ab-ops-progress-fill{height:100%;background:linear-gradient(90deg,#ed1c24,#ff555b);border-radius:inherit}
      .ab-ops-progress-steps{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
      .ab-ops-progress-step{padding:5px 7px;border:1px solid rgba(255,255,255,.10);border-radius:999px;color:#666;font-size:9px;font-weight:950}
      .ab-ops-progress-step.done{border-color:rgba(47,141,85,.48);background:rgba(47,141,85,.10);color:#9cf0b5}
      .ab-ops-progress-step.current{border-color:rgba(255,181,71,.45);background:rgba(255,181,71,.08);color:#ffd18a}
      .ab-ops-next-action{margin-top:9px;color:#bbb;font-size:11px;line-height:1.45}
      .ab-ops-next-action strong{color:#fff}
      .ab-ops-button{min-height:39px;border:0;border-radius:8px;background:#ed1c24;color:#fff;padding:10px 14px;font-weight:900;cursor:pointer}
      .ab-ops-button:disabled{opacity:.45;cursor:not-allowed}
      .ab-ops-next{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 16px;border-top:1px solid rgba(255,255,255,.08);background:#101010;color:#aaa;font-size:12px}
      .ab-ops-next strong{color:#fff}
      .ab-ops-private{color:#ff9ca0;font-weight:800}
      .ab-ops-loading,.ab-ops-empty,.ab-ops-error{padding:14px;border:1px dashed rgba(255,255,255,.18);border-radius:10px;color:#aaa;background:#0c0c0c}
      .ab-ops-error{color:#ff8f94;border-color:rgba(237,28,36,.35)}
      .ab-collect{margin:0 16px 14px;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:#101010;overflow:hidden}
      .ab-collect-head{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
      .ab-collect-head span{display:block;color:#ed1c24;font-size:10px;font-weight:950;text-transform:uppercase}
      .ab-collect-head h5{margin:4px 0 0;color:#fff;font-size:15px}
      .ab-collect-steps{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px;padding:12px 14px}
      .ab-collect-step{padding:9px;border:1px solid #333;border-radius:8px;background:#0a0a0a}
      .ab-collect-step span{display:block;color:#8f9bab;font-size:9px;font-weight:900;text-transform:uppercase}
      .ab-collect-step strong{display:block;margin-top:4px;color:#fff;font-size:11px}
      .ab-collect-step.done{border-color:#2f8d55;background:#102719}
      .ab-collect-step.warn{border-color:#9a6b17;background:#211707}
      .ab-collect-body{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px 14px}
      .ab-collect-card{padding:11px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:#0b0b0b}
      .ab-collect-card h6{margin:0 0 8px;color:#fff;font-size:12px}
      .ab-collect-actions{display:flex;gap:7px;flex-wrap:wrap}
      .ab-collect-note{width:100%;box-sizing:border-box;margin:8px 0;border:1px solid #353535;border-radius:8px;background:#070707;color:#fff;padding:9px;min-height:58px;resize:vertical}
      .ab-collect-money{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:9px}
      .ab-collect-pay{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
      .ab-collect-pay label{display:block;margin-bottom:4px;color:#9aa3ae;font-size:9px;font-weight:900;text-transform:uppercase}
      .ab-collect-pay input{width:100%;box-sizing:border-box;border:1px solid #353535;border-radius:7px;background:#070707;color:#fff;padding:8px}
      .ab-collect-status{margin-top:8px;color:#aaa;font-size:11px;line-height:1.4}
      .ab-collect-status.good{color:#8ff0b0;font-weight:800}
      .ab-collect-status.warn{color:#ffd18a;font-weight:800}
      @media(max-width:1100px){.ab-collect-steps{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:950px){.ab-ops-grid{grid-template-columns:1fr 1fr}.ab-ops-ready{grid-template-columns:1fr}}
      @media(max-width:560px){.ab-ops-grid{grid-template-columns:1fr}.ab-ops-head,.ab-ops-next{flex-direction:column;align-items:flex-start}.ab-collect-steps,.ab-collect-body,.ab-collect-pay{grid-template-columns:1fr}}
    `;
    document.head.appendChild(el);
  }

  function collectionPanel(row,dealId){
    const id=Number(row.deal_motorcycle_id);
    const eta=!!row.driver_eta_received_at;
    const arrived=!!row.driver_arrived_at;
    const visual=String(row.visual_check_status||"pending");
    const passed=visual==="passed";
    const discrepancy=visual==="discrepancy";
    const authorised=!!row.supplier_payment_authorised_at;
    const paid=Number(row.supplier_total_paid_gbp||0);
    const balance=Number(row.supplier_balance_gbp||0);
    const cleared=balance<=0.005;
    const paymentRequested=!!row.seller_payment_requested_at;
    const sellerConfirmedPaid=!!row.seller_payment_received_confirmed_at;
    const photosConfirmed=!!row.condition_photos_confirmed_at;
    const custodyExpected=Number(row.custody_expected_count||0);
    const custodyReceived=Number(row.custody_received_count||0);
    const custodyComplete=custodyExpected>0 && custodyReceived>=custodyExpected;
    const collected=String(row.collection_status||"")==="collected";
    const secured=!!row.motorcycle_secured_at || collected;
    const driverWorkflow=paymentRequested || sellerConfirmedPaid || photosConfirmed || collected;
    const collectionReady=!!row.collection_ready_for_move;
    const collectionMissing=Array.isArray(row.collection_missing_fields)?row.collection_missing_fields.filter(Boolean):[];
    const booked=!!row.move_shipment_id || ["booked","driver_assigned","collected"].includes(String(row.collection_status||""));

    if(collected){
      return `
        <div class="ab-collect">
          <div class="ab-collect-head"><span>Collection complete</span><h5>Move driver collection completed</h5></div>
          <div class="ab-collect-steps">
            <div class="ab-collect-step ${eta?"done":""}"><span>1 · Driver ETA</span><strong>${esc(eta?niceDateTime(row.driver_eta_received_at):"Waiting")}</strong></div>
            <div class="ab-collect-step ${arrived?"done":""}"><span>2 · Driver Arrived</span><strong>${esc(arrived?niceDateTime(row.driver_arrived_at):"Waiting")}</strong></div>
            <div class="ab-collect-step ${passed?"done":""}"><span>3 · Visual Check</span><strong>${esc(passed?"Passed":visual||"Pending")}</strong></div>
            <div class="ab-collect-step ${custodyComplete?"done":""}"><span>4 · Handover</span><strong>${esc(custodyComplete?"Complete":(custodyExpected?custodyReceived+"/"+custodyExpected:"Pending"))}</strong></div>
            <div class="ab-collect-step ${photosConfirmed?"done":""}"><span>5 · Photos</span><strong>${esc(photosConfirmed?"Saved":"Pending")}</strong></div>
            <div class="ab-collect-step ${sellerConfirmedPaid?"done":""}"><span>6 · Seller Payment</span><strong>${esc(sellerConfirmedPaid?"Confirmed received":"Pending")}</strong></div>
            <div class="ab-collect-step done"><span>7 · Motorcycle</span><strong>Collected & secured</strong></div>
          </div>
          <div style="padding:0 14px 14px">
            <div class="ab-collect-money">
              <div class="ab-ops-metric"><span>Collected</span><strong>${esc(niceDateTime(row.collection_actual_at))}</strong></div>
              <div class="ab-ops-metric"><span>Seller Price</span><strong>${esc(gbp(row.seller_price_gbp))}</strong></div>
              <div class="ab-ops-metric"><span>Seller Paid</span><strong>${esc(gbp(paid))}</strong></div>
              <div class="ab-ops-metric"><span>Balance</span><strong>${esc(gbp(balance))}</strong></div>
            </div>
            <div class="ab-collect-actions" style="margin-top:10px">
              <button type="button" class="ab-ops-button" onclick="viewAnyBikeCollectionReport(${id});return false;">View Collection Report</button>
            </div>
            <div id="ab-collection-report-${id}" class="ab-collect-status" style="display:none;margin-top:10px"></div>
          </div>
        </div>
      `;
    }

    return `
      <div class="ab-collect">
        <div class="ab-collect-head"><span>Collection & Supplier Payment</span><h5>Driver-on-site controls</h5></div>
        <div class="ab-collect-steps">
          <div class="ab-collect-step ${eta?"done":""}"><span>1 · Driver ETA</span><strong>${esc(eta?niceDateTime(row.driver_eta_received_at):"Waiting")}</strong></div>
          <div class="ab-collect-step ${arrived?"done":""}"><span>2 · Driver Arrived</span><strong>${esc(arrived?niceDateTime(row.driver_arrived_at):"Waiting")}</strong></div>
          <div class="ab-collect-step ${passed?"done":(discrepancy?"warn":"")}"><span>3 · Visual Check</span><strong>${esc(passed?"Passed":(discrepancy?"Discrepancy":"Pending"))}</strong></div>
          <div class="ab-collect-step ${custodyComplete?"done":""}"><span>4 · Handover</span><strong>${esc(custodyComplete?"Complete":(custodyExpected?custodyReceived+"/"+custodyExpected:"Pending"))}</strong></div>
          <div class="ab-collect-step ${photosConfirmed?"done":""}"><span>5 · Photos</span><strong>${esc(photosConfirmed?"Saved":"Pending")}</strong></div>
          <div class="ab-collect-step ${sellerConfirmedPaid?"done":(paymentRequested?"warn":"")}"><span>6 · Seller Payment</span><strong>${esc(sellerConfirmedPaid?"Seller confirmed received":(paymentRequested?"Requested":"Pending"))}</strong></div>
          <div class="ab-collect-step ${collected&&secured?"done":""}"><span>7 · Motorcycle</span><strong>${esc(collected&&secured?"Collected & secured":"Not collected")}</strong></div>
        </div>
        <div class="ab-collect-body">
          <div class="ab-collect-card">
            <h6>Move driver progress</h6>
            <div class="ab-collect-status ${arrived||passed||discrepancy?"good":"warn"}">
              These statuses are updated automatically from the Move driver collection form. Admin should not duplicate the driver's arrival or visual-check actions here.
            </div>
            <div class="ab-collect-money" style="margin-top:10px">
              <div class="ab-ops-metric"><span>ETA / On My Way</span><strong>${esc(eta?niceDateTime(row.driver_eta_received_at):"Waiting")}</strong></div>
              <div class="ab-ops-metric"><span>Driver Arrived</span><strong>${esc(arrived?niceDateTime(row.driver_arrived_at):"Waiting")}</strong></div>
              <div class="ab-ops-metric"><span>Visual Check</span><strong>${esc(passed?"Passed":(discrepancy?"Discrepancy":"Pending"))}</strong></div>
            </div>
            ${row.visual_check_notes?'<div class="ab-collect-status">Driver notes: '+esc(row.visual_check_notes)+'</div>':""}
            ${discrepancy?'<div class="ab-collect-status warn">Supplier payment remains blocked until the discrepancy is resolved on the driver workflow.</div>':""}
          </div>

          <div class="ab-collect-card">
            <h6>Seller payment / accounting</h6>
            <div class="ab-collect-money">
              <div class="ab-ops-metric"><span>Seller Price</span><strong>${esc(gbp(row.seller_price_gbp))}</strong></div>
              <div class="ab-ops-metric"><span>Accounting Ledger Paid</span><strong>${esc(gbp(paid))}</strong></div>
              <div class="ab-ops-metric"><span>Ledger Balance</span><strong>${esc(gbp(balance))}</strong></div>
            </div>
            ${driverWorkflow?`
              <div class="ab-collect-status ${sellerConfirmedPaid?"good":"warn"}">${sellerConfirmedPaid
                ?"Seller confirmed payment received on the driver collection workflow"+(row.seller_payment_received_confirmed_at?" · "+esc(niceDateTime(row.seller_payment_received_confirmed_at)):"")+"."
                :(paymentRequested?"Seller payment has been requested and is awaiting seller confirmation.":"Seller payment confirmation is pending.")}</div>
              ${sellerConfirmedPaid&&!cleared?`<div class="ab-collect-status warn">Accounting reconciliation required: the supplier payment ledger still shows ${esc(gbp(balance))} outstanding. This does not undo the completed collection; record/reconcile the actual supplier payment separately.</div>`:""}
            `:`
              <div class="ab-collect-actions">
                <button type="button" class="ab-ops-button" ${(!arrived||!passed||authorised)?"disabled":""} onclick="updateAnyBikeCollectionStep(${id},${Number(dealId)},'authorise_supplier_payment');return false;">Authorise Supplier Payment</button>
              </div>
              <div class="ab-collect-status ${authorised?"good":"warn"}">${authorised?"Payment is authorised. Record it only after the bank transfer has actually been made.":"Driver must be on site and the visual check must pass before payment can be authorised."}</div>
              ${authorised&&!cleared?`
                <div class="ab-collect-pay">
                  <div><label>Amount paid *</label><input id="ab-collect-pay-amount-${id}" type="number" min="0.01" step="0.01" value="${esc(balance.toFixed(2))}"></div>
                  <div><label>Payment reference</label><input id="ab-collect-pay-ref-${id}" value="${esc(row.deal_number||"")}"></div>
                </div>
                <div class="ab-collect-actions" style="margin-top:9px">
                  <button type="button" class="ab-ops-button" onclick="recordAnyBikeCollectionPayment(${id},${Number(dealId)});return false;">Record Supplier Payment</button>
                </div>
                <div class="ab-collect-status">This records the payment in AnyBike only. It does not initiate a bank transfer.</div>
              `:""}
            `}
          </div>

          <div class="ab-collect-card" style="grid-column:1/-1">
            <h6>Collection completion</h6>
            <div class="ab-collect-actions">
              <button type="button" class="ab-ops-button" ${(driverWorkflow||!arrived||!passed||!authorised||!cleared||collected)?"disabled":""} onclick="updateAnyBikeCollectionStep(${id},${Number(dealId)},'mark_collected');return false;">Mark Motorcycle Collected & Secured</button>
            </div>
            <div class="ab-collect-status">${collected&&secured
              ?"Motorcycle collected "+esc(niceDateTime(row.collection_actual_at))+" and secured to AnyBike."
              :(driverWorkflow
                ?"Driver workflow controls final collection after handover, condition photos and seller payment confirmation."
                :"Requires driver arrival, passed visual check, payment authorisation and a zero supplier balance.")}</div><div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.09)"><h6>Incoming Collection Job</h6><div class="ab-collect-status ${collected||booked||collectionReady?"good":"warn"}">${collected
              ?"Collection is complete and linked back to this AnyBike purchase."
              :(booked
                ?"Move booking / incoming collection job is live. Driver progress will update this section automatically."
                :(collectionReady
                  ?"Collection details are complete. This motorcycle is ready to send to Move Motorcycles."
                  :"Collection is NOT ready for Move yet. Missing: "+esc(collectionMissing.join(", ")||"required collection details")+"."))}</div>${collected?"":'<div class="ab-collect-actions" style="margin-top:8px">'+(booked?'':'<button type="button" class="ab-ops-button" '+(collectionReady?'':'disabled title="Complete the collection-readiness items first"')+' onclick="sendAnyBikeCollectionToMove('+id+','+Number(dealId)+');return false;">'+(collectionReady?'Send to Incoming Collection Jobs':'Waiting for Collection Details')+'</button>')+'<a class="ab-ops-button ab-move-secondary" href="admin-logistics.html#pay-on-site" style="text-decoration:none">Open Logistics HQ</a></div>'}</div>
            ${collected?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.09)">
              <h6>Driver Collection Report</h6>
              <div class="ab-collect-actions">
                <button type="button" class="ab-ops-button" onclick="viewAnyBikeCollectionReport(${id});return false;">View Collection Report</button>
              </div>
              <div id="ab-collection-report-${id}" class="ab-collect-status" style="display:none;margin-top:10px"></div>
            </div>`:""}
          </div>
        </div>
      </div>
    `;
  }

  function renderRows(dealId,rows){
    const host=document.getElementById("anybike-operations-"+dealId);
    if(!host) return;

    if(!rows.length){
      host.innerHTML='<div class="ab-ops-empty">No selected motorcycle is available for Operations on this Deal yet.</div>';
      return;
    }

    host.innerHTML='<div class="ab-ops">'+rows.map(function(row){
      const id=Number(row.deal_motorcycle_id);
      const confirmed=String(row.purchase_status||"")==="proceeding_confirmed";
      const readyDate=row.seller_ready_date || "";
      const booked=!!row.move_shipment_id || ["booked","driver_assigned","collected"].includes(String(row.collection_status||""));
      const collected=String(row.collection_status||"")==="collected";
      const moveStatus=collected ? "Collected" : (row.raw_move_status || (booked ? row.collection_status : "Not booked"));
      const storage=row.storage_status || "not_started";
      const seller=sellerNameFor(row);
      const phone=sellerPhoneFor(row);

      const atDepot=!!row.depot_arrived_at || ["at_depot","in_storage","stored"].includes(String(row.depot_status||"").toLowerCase()) || ["free","chargeable","paused","stopped"].includes(String(storage).toLowerCase());
      const delivered=!!row.delivered_to_shipper_at || ["delivered","completed","handed_over"].includes(String(row.delivery_status||"").toLowerCase()) || !!row.operations_complete;
      const operationsStages=[
        ["Seller confirmed",confirmed],
        ["Move booked",booked],
        ["Collected",collected],
        ["Depot / storage",atDepot],
        ["Delivered",delivered]
      ];
      const completedStages=operationsStages.filter(function(item){return !!item[1];}).length;
      const operationsPercent=Math.round((completedStages/operationsStages.length)*100);
      let operationsCurrent=operationsStages.findIndex(function(item){return !item[1];});
      if(operationsCurrent<0) operationsCurrent=operationsStages.length-1;
      const operationsStepsHtml=operationsStages.map(function(item,index){
        const cls=item[1]?"done":(index===operationsCurrent?"current":"");
        return '<span class="ab-ops-progress-step '+cls+'">'+(item[1]?'✓ ':'')+esc(item[0])+'</span>';
      }).join("");

      let operationsNext="Review the motorcycle operations record.";
      let nextActionTitle="Review Purchase & Collection";
      let nextActionCopy="Review the current operations position for this motorcycle.";
      let nextActionButton=`<button type="button" class="ab-ops-button" onclick="document.getElementById('ab-ops-ready-${id}')?.scrollIntoView({behavior:'smooth',block:'center'});return false;">REVIEW OPERATIONS →</button>`;

      if(!confirmed){
        operationsNext="Contact the seller, confirm AnyBike is proceeding and obtain the Ready Date.";
        nextActionTitle="Confirm the seller and Ready Date";
        nextActionCopy="Record the genuine seller-side commitment and the earliest date the motorcycle can be collected.";
        nextActionButton=`<button type="button" class="ab-ops-button" onclick="document.getElementById('ab-ops-ready-${id}')?.scrollIntoView({behavior:'smooth',block:'center'});return false;">CONFIRM SELLER →</button>`;
      }else if(!booked){
        operationsNext="Complete the collection details and book Move Motorcycles.";
        nextActionTitle="Book the motorcycle with Move Motorcycles";
        nextActionCopy="Seller commitment is confirmed. Complete any remaining Move booking fields and create the live collection booking.";
        nextActionButton=`<button type="button" class="ab-ops-button" onclick="continueAnyBikeMoveBooking(${id});return false;">CONTINUE MOVE BOOKING →</button>`;
      }else if(!collected){
        operationsNext="Track the Move collection and complete the driver handover workflow.";
        nextActionTitle="Follow the live Move collection";
        nextActionCopy="Driver ETA, arrival, visual check, custody, photos and seller-payment confirmation should flow back automatically from the Move collection workflow.";
        nextActionButton=`<a class="ab-ops-button" href="admin-logistics.html?motorcycle=${id}#pay-on-site" style="text-decoration:none">OPEN COLLECTION WORKFLOW →</a>`;
      }else if(!atDepot){
        operationsNext="Motorcycle collected. Confirm depot arrival / custody and storage status.";
        nextActionTitle="Confirm depot custody";
        nextActionCopy="The motorcycle is collected. Continue in Logistics HQ to confirm depot arrival, custody and storage.";
        nextActionButton=`<a class="ab-ops-button" href="admin-logistics.html?motorcycle=${id}#custody-storage" style="text-decoration:none">OPEN CUSTODY & STORAGE →</a>`;
      }else if(!delivered){
        operationsNext="Motorcycle is in UK custody. Complete the final handover / delivery to the buyer's shipper.";
        nextActionTitle="Complete shipper handover";
        nextActionCopy="The motorcycle is in UK custody. Continue to the final delivery and handover controls.";
        nextActionButton=`<a class="ab-ops-button" href="admin-logistics.html?motorcycle=${id}#custody-storage" style="text-decoration:none">OPEN HANDOVER CONTROLS →</a>`;
      }else{
        operationsNext="Operations complete. Finalise the invoice and close the sale when all commercial records are complete.";
        nextActionTitle="Finalise the commercial records";
        nextActionCopy="Operations are complete. Continue to Accounts & Documents for the remaining invoice and close-out controls.";
        nextActionButton=`<a class="ab-ops-button" href="admin-accounts.html?deal=${Number(dealId)}" style="text-decoration:none">OPEN ACCOUNTS & DOCUMENTS →</a>`;
      }

      return `
        <section class="ab-ops-bike">
          <div class="ab-ops-head">
            <div>
              <span>Purchase & Collection</span>
              <h4>${esc(motorcycleTitle(row))}</h4>
            </div>
            <div class="ab-ops-state ${confirmed ? "ready" : ""}">${confirmed ? "Seller proceeding confirmed" : "Seller confirmation required"}</div>
          </div>

          <div class="ab-ops-progress">
            <div class="ab-ops-progress-head"><span>Operations Progress</span><strong>${completedStages} / ${operationsStages.length} stages · ${operationsPercent}%</strong></div>
            <div class="ab-ops-progress-track"><div class="ab-ops-progress-fill" style="width:${operationsPercent}%"></div></div>
            <div class="ab-ops-progress-steps">${operationsStepsHtml}</div>
            <div class="ab-ops-next-action"><strong>Current stage:</strong> ${esc(operationsNext)}</div>
          </div>

          <div class="ab-ops-grid">
            <div class="ab-ops-metric"><span>Seller</span><strong>${esc(seller)}</strong></div>
            <div class="ab-ops-metric"><span>Ready Date</span><strong>${esc(niceDate(readyDate))}</strong></div>
            <div class="ab-ops-metric"><span>Move</span><strong>${esc(row.move_tracking_no ? row.move_tracking_no+" · "+statusLabel(moveStatus) : statusLabel(moveStatus))}</strong></div>
            <div class="ab-ops-metric"><span>Storage</span><strong>${esc(statusLabel(storage))}</strong></div>
          </div>

          <div class="ab-ops-ready">
            <div class="ab-ops-field">
              <label>Seller Ready Date *</label>
              <div class="ab-date-wrap">
                <input id="ab-ops-ready-${id}" type="date" value="${esc(readyDate)}" ${collected?"disabled":""}>
                <button type="button" class="ab-date-open" ${collected?"disabled":""} onclick="openAnyBikeReadyCalendar(${id});return false;" title="${collected?"Collection complete":"Open calendar"}">📅</button>
              </div>
              <div class="ab-date-shortcuts">
                <button type="button" ${collected?"disabled":""} onclick="setAnyBikeReadyDate(${id},0);return false;">Today</button>
                <button type="button" ${collected?"disabled":""} onclick="setAnyBikeReadyDate(${id},1);return false;">Tomorrow</button>
              </div>
            </div>
            <div class="ab-ops-field">
              <label>Seller / Collection Notes</label>
              <textarea id="ab-ops-notes-${id}" ${collected?"disabled":""} placeholder="Opening hours, notice required, collection instructions...">${esc(row.seller_ready_notes||"")}</textarea>
            </div>
            <button type="button" class="ab-ops-button" id="ab-ops-save-${id}" ${collected?"disabled":""} onclick="saveAnyBikeSellerReady(${id},${Number(dealId)});return false;">${collected ? "Collection Complete" : (confirmed ? "Update Ready Date" : "Confirm Seller & Ready Date")}</button>
          </div>

          ${confirmed ? (booked
            ? `<div class="ab-move-booked"><strong>Move Motorcycles:</strong> ${esc(collected ? ("Collected"+(row.collection_actual_at?" · "+niceDateTime(row.collection_actual_at):"")) : (row.move_tracking_no ? "Booked · Tracking "+row.move_tracking_no : "Booked"))}</div>`
            : `<div id="ab-move-booking-${id}" class="ab-move"><div class="ab-ops-loading">Loading Move booking details…</div></div>`) : ""}
          ${confirmed ? collectionPanel(row,dealId) : ""}
          <div class="deal-section-next-action" style="margin:0;border-radius:0">
            <div>
              <div class="eyebrow">Your next action</div>
              <strong>${esc(nextActionTitle)}</strong>
              <span>${esc(nextActionCopy)}</span>
            </div>
            ${nextActionButton}
          </div>
          <div class="ab-ops-next">
            <span><strong>Current operations status:</strong> ${esc(delivered ? "Delivered / handover complete" : atDepot ? "At depot / storage" : collected ? "Collected" : booked ? "Booked with Move" : confirmed ? "Seller confirmed" : "Seller confirmation required")}</span>
            <span class="ab-ops-private">${phone ? "Seller contact held internally" : "Seller details remain internal"}</span>
          </div>
        </section>
      `;
    }).join("");

    rows.forEach(function(row){
      const confirmed=String(row.purchase_status||"")==="proceeding_confirmed";
      const booked=!!row.move_shipment_id || ["booked","driver_assigned","collected"].includes(String(row.collection_status||""));
      if(confirmed && !booked){
        setTimeout(function(){ loadMoveBooking(row.deal_motorcycle_id,false); },0);
      }
    });
  }


  function renderDeliveryRows(dealId,rows){
    const host=document.getElementById("anybike-delivery-status-"+dealId);
    if(!host) return;

    if(!rows.length){
      host.innerHTML='<div class="ab-ops-empty">No selected motorcycle is available for delivery yet.</div>';
      return;
    }

    host.innerHTML='<div class="ab-ops">'+rows.map(function(row,index){
      const id=Number(row.deal_motorcycle_id);
      const collected=String(row.collection_status||"")==="collected";
      const atDepot=!!row.depot_arrived_at || ["at_depot","in_storage","stored"].includes(String(row.depot_status||"").toLowerCase()) || ["free","chargeable","paused","stopped"].includes(String(row.storage_status||"").toLowerCase());
      const delivered=!!row.delivered_to_shipper_at || ["delivered","completed","handed_over"].includes(String(row.delivery_status||"").toLowerCase()) || !!row.operations_complete;
      const title=motorcycleTitle(row);
      const stages=[
        ["Collected",collected],
        ["Depot / storage",atDepot],
        ["Delivery / handover",delivered]
      ];
      const completeCount=stages.filter(function(s){return s[1];}).length;
      const percent=Math.round((completeCount/stages.length)*100);
      const firstOpen=Math.max(0,stages.findIndex(function(s){return !s[1];}));
      const stageHtml=stages.map(function(s,i){
        const cls=s[1]?"done":(!delivered && i===firstOpen?"current":"");
        return '<span class="ab-ops-progress-step '+cls+'">'+(s[1]?'✓ ':'')+esc(s[0])+'</span>';
      }).join("");

      let next="Collection must be completed before delivery starts.";
      if(collected&&!atDepot) next="Confirm depot arrival / custody and storage.";
      else if(atDepot&&!delivered) next="Arrange and complete final delivery / handover to the buyer's shipper.";
      else if(delivered) next="Delivery / handover complete. Finalise invoice and close the sale.";

      return '<section class="ab-ops-bike">'+
        '<div class="ab-ops-head"><div><span>Delivery & Handover</span><h4>'+esc(title)+'</h4></div><div class="ab-ops-state '+(delivered?'ready':'')+'">'+esc(delivered?'Delivered':atDepot?'At depot / storage':collected?'Collected':'Waiting for collection')+'</div></div>'+
        '<div class="ab-ops-progress"><div class="ab-ops-progress-head"><span>Delivery progress</span><strong>'+completeCount+' / '+stages.length+' stages · '+percent+'%</strong></div>'+
        '<div class="ab-ops-progress-track"><div class="ab-ops-progress-fill" style="width:'+percent+'%"></div></div>'+
        '<div class="ab-ops-progress-steps">'+stageHtml+'</div><div class="ab-ops-next-action"><strong>Next:</strong> '+esc(next)+'</div></div>'+
        '<div class="ab-ops-grid">'+
          '<div class="ab-ops-metric"><span>Collection</span><strong>'+esc(statusLabel(row.collection_status||"Not collected"))+'</strong></div>'+
          '<div class="ab-ops-metric"><span>Depot</span><strong>'+esc(row.depot_arrived_at?niceDateTime(row.depot_arrived_at):statusLabel(row.depot_status||"Pending"))+'</strong></div>'+
          '<div class="ab-ops-metric"><span>Storage</span><strong>'+esc(statusLabel(row.storage_status||"Not started"))+'</strong></div>'+
          '<div class="ab-ops-metric"><span>Delivery</span><strong>'+esc(row.delivered_to_shipper_at?("Delivered · "+niceDateTime(row.delivered_to_shipper_at)):statusLabel(row.delivery_status||"Pending"))+'</strong></div>'+
        '</div>'+
        '<div class="ab-ops-next"><span><strong>Motorcycle '+(index+1)+':</strong> '+esc(next)+'</span><a class="ab-ops-button ab-move-secondary" href="admin-logistics.html?motorcycle='+id+'#custody-storage" style="text-decoration:none">Open Handover Controls →</a></div>'+
      '</section>';
    }).join("");
  }

  async function loadDelivery(dealId,force){
    const key=String(dealId||"");
    const host=document.getElementById("anybike-delivery-status-"+key);
    if(!key || !host) return;

    try{
      let rows=operationsCache.get(key);
      if(force || !rows){
        const result=await client().rpc("admin_get_deal_operations_v4",{p_deal_id:Number(key)});
        if(result.error) throw result.error;
        rows=result.data||[];
        operationsCache.set(key,rows);
      }
      renderDeliveryRows(key,rows||[]);
    }catch(error){
      console.error("Delivery status could not be loaded:",error);
      host.innerHTML='<div class="ab-ops-error">Delivery status could not be loaded: '+esc(error.message||error)+'</div>';
    }
  }

  function renderDeliveryPanel(deal){
    const dealId=String(deal && deal.deal_id || "");
    if(!dealId) return "";
    setTimeout(function(){ loadDelivery(dealId,false); },0);
    return '<div id="anybike-delivery-status-'+esc(dealId)+'"><div class="ab-ops-loading">Loading Delivery &amp; Handover…</div></div>';
  }

  function fieldValue(id){
    const el=document.getElementById(id);
    return String(el && el.value || "").trim();
  }

  function openReadyCalendar(id){
    const input=document.getElementById("ab-ops-ready-"+Number(id));
    if(!input) return;
    if(typeof input.showPicker==="function") input.showPicker();
    else input.focus();
  }

  function setReadyDate(id,offsetDays){
    const input=document.getElementById("ab-ops-ready-"+Number(id));
    if(!input) return;
    const d=new Date();
    d.setDate(d.getDate()+Number(offsetDays||0));
    const pad=n=>String(n).padStart(2,"0");
    input.value=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  }

  function updateSmsPreview(id){
    const type=fieldValue("ab-move-sms-type-"+id) || "anybike";
    const customer=fieldValue("ab-move-customer-mobile-"+id);
    const mobile=type==="customer" ? customer : (type==="none" ? "" : "+447949574299");
    const out=document.getElementById("ab-move-sms-mobile-"+id);
    if(out) out.value=mobile;
  }

  function moveBookingChecklist(id,data){
    const purchaseStatus=String(data?.purchase_status||"");
    const readyDate=String(data?.ready_date||"").trim();
    return [
      {label:"Seller proceeding confirmation",group:"seller",value:purchaseStatus==="proceeding_confirmed",selector:null},
      {label:"Ready From date",group:"seller",value:!!readyDate,selector:null},
      {label:"Seller / sender name",group:"seller",value:fieldValue("ab-move-sender-name-"+id),selector:"ab-move-sender-name-"},
      {label:"Collection street address",group:"seller",value:fieldValue("ab-move-sender-street-"+id),selector:"ab-move-sender-street-"},
      {label:"Collection town / city",group:"seller",value:fieldValue("ab-move-sender-city-"+id),selector:"ab-move-sender-city-"},
      {label:"Collection postcode",group:"seller",value:fieldValue("ab-move-sender-postcode-"+id),selector:"ab-move-sender-postcode-"},
      {label:"Collection country",group:"seller",value:fieldValue("ab-move-sender-country-"+id),selector:"ab-move-sender-country-"},
      {label:"Collection contact name",group:"seller",value:fieldValue("ab-move-sender-contact-"+id),selector:"ab-move-sender-contact-"},
      {label:"Collection contact phone",group:"seller",value:fieldValue("ab-move-sender-phone-"+id),selector:"ab-move-sender-phone-"},
      {label:"Shipper / receiver name",group:"receiver",value:fieldValue("ab-move-receiver-name-"+id),selector:"ab-move-receiver-name-"},
      {label:"Receiver street address",group:"receiver",value:fieldValue("ab-move-receiver-street-"+id),selector:"ab-move-receiver-street-"},
      {label:"Receiver town / city",group:"receiver",value:fieldValue("ab-move-receiver-city-"+id),selector:"ab-move-receiver-city-"},
      {label:"Receiver postcode",group:"receiver",value:fieldValue("ab-move-receiver-postcode-"+id),selector:"ab-move-receiver-postcode-"},
      {label:"Sales price",group:"mandatory",value:fieldValue("ab-move-sales-price-"+id),selector:"ab-move-sales-price-"},
      {label:"Price agreed with Move Motorcycles",group:"mandatory",value:fieldValue("ab-move-price-"+id),selector:"ab-move-price-"},
      {label:"Contact at dealer",group:"mandatory",value:fieldValue("ab-move-contact-at-"+id),selector:"ab-move-contact-at-"},
      {label:"Access / handover instructions",group:"mandatory",value:fieldValue("ab-move-instructions-"+id),selector:"ab-move-instructions-"}
    ];
  }

  function updateMoveBookingFieldStates(id,data){
    const checklist=moveBookingChecklist(id,data||moveBookingCache.get(String(id))||{});
    checklist.forEach(function(item){
      if(!item.selector) return;
      const input=document.getElementById(item.selector+id);
      const wrap=input&&input.closest(".ab-move-field");
      if(!wrap) return;
      const complete=!!String(item.value||"").trim();
      wrap.classList.add("required-state");
      wrap.classList.toggle("complete",complete);
      wrap.classList.toggle("needs-attention",!complete);
    });

    ["seller","receiver","mandatory"].forEach(function(group){
      const section=document.getElementById("ab-move-section-"+group+"-"+id);
      if(!section) return;
      const groupItems=checklist.filter(function(item){return item.group===group;});
      const done=groupItems.every(function(item){return !!item.value;});
      section.classList.toggle("section-complete",done);
      section.classList.toggle("section-needs-attention",!done);
    });
    return checklist;
  }

  function updateMoveCollectionReadiness(id,data){
    const checklist=updateMoveBookingFieldStates(id,data||moveBookingCache.get(String(id))||{});
    const missing=checklist.filter(function(item){return !item.value;});
    const state={ready:missing.length===0,missing:missing.map(function(item){return item.label;}),items:checklist};
    const box=document.getElementById("ab-move-readiness-"+id);
    const book=document.getElementById("ab-move-book-"+id);
    if(box){
      box.className="ab-move-warning"+(state.ready?" ab-move-ready":"");
      box.innerHTML=state.ready
        ? "<strong>Ready for Move:</strong> every required booking field is complete."
        : "<strong>Move booking incomplete:</strong> "+esc(state.missing.join(", "));
    }
    if(book){
      book.disabled=!state.ready;
      book.title=state.ready?"Ready to create the Move booking":"Complete the red booking fields first";
      book.textContent=state.ready ? "Book with Move" : "Complete red fields first";
    }

    const nextTitle=document.getElementById("ab-move-next-title-"+id);
    const nextCopy=document.getElementById("ab-move-next-copy-"+id);
    const nextButton=document.getElementById("ab-move-next-button-"+id);
    const dataRow=data||moveBookingCache.get(String(id))||{};
    const booked=!!(dataRow.move && (dataRow.move.move_shipment_id || dataRow.move.tracking_no || dataRow.move.booked_at));

    if(booked){
      if(nextTitle) nextTitle.textContent="Prepare the Move driver collection";
      if(nextCopy) nextCopy.textContent="The Move booking is live. Continue to the driver-on-site collection controls and driver collection form.";
      if(nextButton){
        nextButton.textContent="OPEN DRIVER COLLECTION →";
        nextButton.onclick=function(){
          const target=document.getElementById("ab-ops-collection-controls-"+id) ||
            document.querySelector('[data-deal-motorcycle-id="'+id+'"] .ab-ops-collection');
          if(target) target.scrollIntoView({behavior:"smooth",block:"start"});
          else window.scrollBy({top:650,behavior:"smooth"});
          return false;
        };
      }
    }else if(state.ready){
      if(nextTitle) nextTitle.textContent="Book with Move Motorcycles";
      if(nextCopy) nextCopy.textContent="Every required field is complete. Create the live Move booking now.";
      if(nextButton){
        nextButton.textContent="BOOK WITH MOVE →";
        nextButton.onclick=function(){ bookMoveShipment(id); return false; };
      }
    }else{
      if(nextTitle) nextTitle.textContent="Complete the Move booking";
      if(nextCopy) nextCopy.textContent="Finish the remaining red booking fields above.";
      if(nextButton){
        nextButton.textContent="CONTINUE →";
        nextButton.onclick=function(){ continueMoveBooking(id); return false; };
      }
    }
    return state;
  }

  function moveCollectionItemsText(items){
    const rows=Array.isArray(items)?items.filter(function(item){
      return String(item?.custody_status||"")!=="not_applicable" && String(item?.description||"").trim();
    }):[];
    if(!rows.length) return "";
    return rows.map(function(item){
      const qty=Math.max(1,Number(item.expected_quantity||1));
      return "- "+qty+" x "+String(item.description||"").trim();
    }).join("\n");
  }

  function mergeMoveCollectionInstructions(existing,items){
    const start="[COLLECTION ITEMS]";
    const end="[/COLLECTION ITEMS]";
    let manual=String(existing||"");
    const s=manual.indexOf(start);
    const e=manual.indexOf(end);
    if(s>=0 && e>=s){
      manual=(manual.slice(0,s)+manual.slice(e+end.length)).trim();
    }
    const itemText=moveCollectionItemsText(items);
    const block=itemText ? start+"\n"+itemText+"\n"+end : "";
    return [block,manual].filter(Boolean).join("\n\n");
  }

  function renderMoveCollectionItems(id,items){
    const rows=Array.isArray(items)?items:[];
    const itemTypes=[
      ["key","Keys"],
      ["v5c","V5C / registration document"],
      ["service_history","Service history"],
      ["manual","Owner manual / handbook"],
      ["mot_document","MOT document"],
      ["accessory","Accessory / spare item"],
      ["other","Other"]
    ];
    const existing=rows.length ? rows.map(function(item){
      return '<div class="ab-collect-item-row">'+
        '<input id="ab-collect-item-qty-'+item.id+'" type="number" min="1" step="1" value="'+Math.max(1,Number(item.expected_quantity||1))+'" aria-label="Quantity">'+
        '<select id="ab-collect-item-type-'+item.id+'">'+itemTypes.map(function(t){return '<option value="'+t[0]+'" '+(String(item.item_type||"")==t[0]?'selected':'')+'>'+t[1]+'</option>';}).join("")+'</select>'+
        '<input id="ab-collect-item-desc-'+item.id+'" value="'+esc(item.description||"")+'" aria-label="Collection item description">'+
        '<div style="display:flex;gap:6px">'+
          '<button type="button" class="ab-ops-button ab-move-secondary" onclick="saveAnyBikeCollectionItem('+id+','+item.id+');return false;">Save</button>'+
          '<button type="button" class="ab-ops-button ab-move-secondary" onclick="removeAnyBikeCollectionItem('+id+','+item.id+');return false;">Remove</button>'+
        '</div>'+
      '</div>';
    }).join("") : '<div class="ab-collect-item-empty">No collection items recorded yet. Add everything Move must collect with the motorcycle.</div>';

    return existing+
      '<div class="ab-collect-item-row">'+
        '<input id="ab-collect-item-new-qty-'+id+'" type="number" min="1" step="1" value="1" aria-label="New item quantity">'+
        '<select id="ab-collect-item-new-type-'+id+'">'+itemTypes.map(function(t){return '<option value="'+t[0]+'">'+t[1]+'</option>';}).join("")+'</select>'+
        '<input id="ab-collect-item-new-desc-'+id+'" placeholder="e.g. COC, spare tyre, top box, 2nd key..." aria-label="New collection item description">'+
        '<button type="button" class="ab-ops-button" onclick="saveAnyBikeCollectionItem('+id+',null);return false;">Add Item</button>'+
      '</div>';
  }

  async function saveCollectionItem(dealMotorcycleId,itemId){
    const id=Number(dealMotorcycleId);
    const suffix=itemId==null ? "new-"+id : String(itemId);
    const qtyEl=document.getElementById("ab-collect-item-"+suffix+"-qty") || document.getElementById("ab-collect-item-new-qty-"+id);
    const typeEl=document.getElementById("ab-collect-item-"+suffix+"-type") || document.getElementById("ab-collect-item-new-type-"+id);
    const descEl=document.getElementById("ab-collect-item-"+suffix+"-desc") || document.getElementById("ab-collect-item-new-desc-"+id);
    const description=String(descEl&&descEl.value||"").trim();
    if(!description){
      alert("Enter the item Move needs to collect.");
      if(descEl) descEl.focus();
      return;
    }
    try{
      const result=await client().rpc("admin_save_collection_item_v1",{
        p_deal_motorcycle_id:id,
        p_item_type:String(typeEl&&typeEl.value||"other"),
        p_description:description,
        p_expected_quantity:Math.max(1,Number(qtyEl&&qtyEl.value||1)),
        p_item_id:itemId==null?null:Number(itemId)
      });
      if(result.error) throw result.error;
      moveBookingCache.delete(String(id));
      await loadMoveBooking(id,true);
      setTimeout(function(){
        const section=document.getElementById("ab-move-collection-items-"+id);
        if(section) section.scrollIntoView({behavior:"smooth",block:"center"});
      },120);
    }catch(error){
      alert("Collection item could not be saved.\n\n"+(error.message||error));
    }
  }

  async function removeCollectionItem(dealMotorcycleId,itemId){
    if(!window.confirm("Remove this item from the Move collection checklist?")) return;
    try{
      const result=await client().rpc("admin_remove_collection_item_v1",{p_item_id:Number(itemId)});
      if(result.error) throw result.error;
      moveBookingCache.delete(String(dealMotorcycleId));
      await loadMoveBooking(dealMotorcycleId,true);
    }catch(error){
      alert("Collection item could not be removed.\n\n"+(error.message||error));
    }
  }

  function renderMoveBooking(id,data){
    const host=document.getElementById("ab-move-booking-"+id);
    if(!host) return;
    const sender=data.sender||{};
    const receiver=data.receiver||{};
    const motorcycle=data.motorcycle||{};
    const move=data.move||{};
    const customerMobile=data.customer_mobile||"";
    const smsType=data.sms_recipient_type||"anybike";
    const smsMobile=data.sms_mobile || (smsType==="customer"?customerMobile:"+447949574299");
    const movePrice=data.move_price_agreed_gbp == null ? "" : String(data.move_price_agreed_gbp);
    const salesPrice=motorcycle.sales_price_gbp == null ? "" : String(motorcycle.sales_price_gbp);
    const collectionItems=Array.isArray(data.collection_items)?data.collection_items:[];
    const moveInstructions=mergeMoveCollectionInstructions(data.move_special_instructions||"",collectionItems);
    const moveContactAt=data.move_contact_at_name||sender.contact_name||"";

    host.innerHTML=`
      <div class="ab-move-head">
        <div><span>Move Motorcycles</span><h5>Book UK Collection & Delivery</h5></div>
        <div class="ab-ops-state">${esc(move.raw_status||"Draft")}</div>
      </div>
      <div class="ab-move-grid">
        <div class="ab-move-section">Motorcycle details sent to Move</div>
        <div class="ab-move-field"><label>Make *</label><input value="${esc(motorcycle.make||"")}" readonly></div>
        <div class="ab-move-field"><label>Model *</label><input value="${esc(motorcycle.model||"")}" readonly></div>
        <div class="ab-move-field"><label>Registration *</label><input value="${esc(motorcycle.registration||"")}" readonly></div>
        <div class="ab-move-field"><label>Variant</label><input value="${esc(motorcycle.variant||"")}" readonly></div>

        <div class="ab-move-section" id="ab-move-section-seller-${id}">Collection from seller — internal operational information</div>
        <div class="ab-move-field"><label>Seller / Sender Name *</label><input id="ab-move-sender-name-${id}" value="${esc(sender.name||"")}"></div>
        <div class="ab-move-field"><label>Contact Name *</label><input id="ab-move-sender-contact-${id}" value="${esc(sender.contact_name||"")}"></div>
        <div class="ab-move-field"><label>Street Address *</label><input id="ab-move-sender-street-${id}" value="${esc(sender.street_address||"")}" placeholder="${esc(sender.location_hint||"")}"></div>
        <div class="ab-move-field"><label>City *</label><input id="ab-move-sender-city-${id}" value="${esc(sender.city||"")}"></div>
        <div class="ab-move-field"><label>County / State</label><input id="ab-move-sender-state-${id}" value="${esc(sender.state||"")}"></div>
        <div class="ab-move-field"><label>Postcode *</label><input id="ab-move-sender-postcode-${id}" value="${esc(sender.postcode||"")}"></div>
        <div class="ab-move-field"><label>Country *</label><input id="ab-move-sender-country-${id}" value="${esc(sender.country||"United Kingdom")}"></div>
        <div class="ab-move-field"><label>Seller Mobile *</label><input id="ab-move-sender-phone-${id}" value="${esc(sender.contact_mobile||"")}" placeholder="Mobile number required by Move"></div>
        <div class="ab-move-field"><label>Seller Landline</label><input value="${esc(sender.landline||"")}" readonly></div>
        <div class="ab-move-field"><label>Seller Email</label><input id="ab-move-sender-email-${id}" type="email" value="${esc(sender.email||"")}"></div>

        <div class="ab-move-section" id="ab-move-section-receiver-${id}">Deliver to buyer's shipper / freight forwarder</div>
        <div class="ab-move-field"><label>Shipper / Receiver Name *</label><input id="ab-move-receiver-name-${id}" value="${esc(receiver.name||"")}"></div>
        <div class="ab-move-field"><label>Contact Name</label><input id="ab-move-receiver-contact-${id}" value="${esc(receiver.contact_name||"")}"></div>
        <div class="ab-move-field"><label>Street Address *</label><input id="ab-move-receiver-street-${id}" value="${esc(receiver.street_address||"")}" placeholder="${esc(receiver.handover_point||"")}"></div>
        <div class="ab-move-field"><label>City *</label><input id="ab-move-receiver-city-${id}" value="${esc(receiver.city||"")}"></div>
        <div class="ab-move-field"><label>County / State</label><input id="ab-move-receiver-state-${id}" value="${esc(receiver.state||"")}"></div>
        <div class="ab-move-field"><label>Postcode *</label><input id="ab-move-receiver-postcode-${id}" value="${esc(receiver.postcode||"")}"></div>
        <div class="ab-move-field"><label>Country</label><input id="ab-move-receiver-country-${id}" value="${esc(receiver.country||"United Kingdom")}"></div>
        <div class="ab-move-field"><label>Receiver Contact Phone</label><input id="ab-move-receiver-phone-${id}" value="${esc(receiver.contact_phone||"")}"></div>
        <div class="ab-move-field"><label>Receiver Email</label><input id="ab-move-receiver-email-${id}" type="email" value="${esc(receiver.email||"")}"></div>

        <div class="ab-move-section">Move account</div>
        <div class="ab-move-field"><label>Account Name</label><input value="AnyBike" readonly></div>
        <div class="ab-move-field"><label>Account Number</label><input value="13882" readonly></div>

        <div class="ab-move-section" id="ab-move-collection-items-${id}">Items Move must collect with the motorcycle</div>
        <div class="ab-collect-items">
          ${renderMoveCollectionItems(id,collectionItems)}
        </div>

        <div class="ab-move-section" id="ab-move-section-mandatory-${id}">Mandatory Move shipment fields</div>
        <div class="ab-move-field"><label>Vehicle Ready Date *</label><input value="${esc(data.ready_date||"")}" readonly></div>
        <div class="ab-move-field"><label>Shipping Mode *</label><input value="Up to 7 Working days from ready date" readonly></div>
        <div class="ab-move-field"><label>Vehicle Type *</label><input value="Motorcycle or Scooter" readonly></div>
        <div class="ab-move-field"><label>Currency *</label><input value="GBP" readonly></div>
        <div class="ab-move-field"><label>Shipment Payer *</label><input value="Sender" readonly></div>
        <div class="ab-move-field"><label>Sales Price (£) *</label><input id="ab-move-sales-price-${id}" value="${esc(salesPrice)}" readonly></div>
        <div class="ab-move-field"><label>Price Agreed with Move Motorcycles (£) *</label><input id="ab-move-price-${id}" type="number" min="0" step="0.01" value="${esc(movePrice)}" placeholder="0.00"></div>
        <div class="ab-move-field"><label>Buyer needs to pay for the bike — call</label><input value="Anybike 07949574299" readonly></div>
        <div class="ab-move-field"><label>Complete V5 required from seller</label><input value="Yes — buyer is trade" readonly></div>
        <div class="ab-move-field"><label>Contact at name Dealer? *</label><input id="ab-move-contact-at-${id}" value="${esc(moveContactAt)}"></div>
        <div class="ab-move-field" style="grid-column:1/-1"><label>Special Instructions *</label><textarea id="ab-move-instructions-${id}" placeholder="Collection items are inserted automatically. Add any other instructions below.">${esc(moveInstructions)}</textarea><div style="margin-top:5px;color:#8f9bab;font-size:10px">The collection-item list above is automatically carried into these Move instructions and into the driver custody checklist.</div></div>
        <div class="ab-move-field"><label>Move Customer Reference</label><input value="${esc(data.deal_number||"")}" readonly></div>

        <div class="ab-move-section">Move booking notification preference</div>
        <input type="hidden" id="ab-move-customer-mobile-${id}" value="${esc(customerMobile)}">
        <div class="ab-move-field"><label>SMS Recipient</label>
          <select id="ab-move-sms-type-${id}" onchange="updateAnyBikeMoveSmsPreview(${id})">
            <option value="anybike" ${smsType==="anybike"?"selected":""}>AnyBike Mobile</option>
            <option value="customer" ${smsType==="customer"?"selected":""} ${customerMobile?"":"disabled"}>Customer Mobile</option>
            <option value="none" ${smsType==="none"?"selected":""}>None</option>
          </select>
        </div>
        <div class="ab-move-field"><label>Selected Mobile</label><input id="ab-move-sms-mobile-${id}" value="${esc(smsMobile)}" readonly></div>
      </div>
      <div id="ab-move-readiness-${id}" class="ab-move-warning"></div>
      <div class="ab-move-warning"><strong>SMS note:</strong> AnyBike saves this preference now. The supplied Move shipment API documentation does not expose the exact SMS/mobile field, so the booking integration will not guess one or overwrite seller/shipper contact details.</div>
      <div class="ab-move-actions">
        <small>Seller collection details saved here are also retained against the dealer for future purchases. Move requires a mobile number; landlines are kept for reference only.</small>
        <div>
          <button type="button" class="ab-ops-button ab-move-secondary" onclick="saveAnyBikeMoveDraft(${id});return false;">Save Draft</button>
          <button type="button" class="ab-ops-button" id="ab-move-book-${id}" onclick="bookAnyBikeMoveShipment(${id});return false;">Book with Move</button>
        </div>
      </div>
      <div class="deal-section-next-action" id="ab-move-next-action-${id}" style="margin:14px 0 0">
        <div>
          <div class="eyebrow">Your next action</div>
          <strong id="ab-move-next-title-${id}">Complete the Move booking</strong>
          <span id="ab-move-next-copy-${id}">Finish any missing seller collection details above, then book the motorcycle with Move Motorcycles.</span>
        </div>
        <button type="button" id="ab-move-next-button-${id}" onclick="continueAnyBikeMoveBooking(${id});return false;">CONTINUE →</button>
      </div>
    `;
    [
      "ab-move-sender-name-","ab-move-sender-street-","ab-move-sender-city-",
      "ab-move-sender-postcode-","ab-move-sender-country-","ab-move-sender-contact-",
      "ab-move-sender-phone-","ab-move-receiver-name-","ab-move-receiver-street-",
      "ab-move-receiver-city-","ab-move-receiver-postcode-","ab-move-price-",
      "ab-move-contact-at-","ab-move-instructions-"
    ].forEach(function(prefix){
      const el=document.getElementById(prefix+id);
      if(el) el.addEventListener("input",function(){ updateMoveCollectionReadiness(id,data); });
    });
    updateMoveCollectionReadiness(id,data);
  }

  function continueMoveBooking(id){
    const numericId=Number(id);
    const data=moveBookingCache.get(String(numericId))||{};
    const state=updateMoveCollectionReadiness(numericId,data);

    const firstMissing=(state.items||[]).find(function(item){return !item.value && item.selector;});
    if(firstMissing){
      const target=document.getElementById(firstMissing.selector+numericId);
      const wrap=target&&target.closest(".ab-move-field");
      if(wrap) wrap.scrollIntoView({behavior:"smooth",block:"center"});
      else if(target) target.scrollIntoView({behavior:"smooth",block:"center"});
      setTimeout(function(){ if(target&&typeof target.focus==="function") target.focus(); },220);
      return;
    }

    if(!state.ready){
      const panel=document.getElementById("ab-move-booking-"+numericId);
      if(panel) panel.scrollIntoView({behavior:"smooth",block:"start"});
      return;
    }

    const book=document.getElementById("ab-move-book-"+numericId);
    if(book){
      book.scrollIntoView({behavior:"smooth",block:"center"});
      setTimeout(function(){ book.focus(); },220);
    }
  }

  async function loadMoveBooking(dealMotorcycleId,force){
    const id=Number(dealMotorcycleId);
    const key=String(id);
    if(!force && moveBookingCache.has(key)){
      renderMoveBooking(id,moveBookingCache.get(key));
      return;
    }
    if(moveBookingLoading.has(key)) return;
    moveBookingLoading.add(key);
    try{
      const result=await client().rpc("admin_get_move_booking_v1",{p_deal_motorcycle_id:id});
      if(result.error) throw result.error;
      moveBookingCache.set(key,result.data||{});
      renderMoveBooking(id,result.data||{});
    }catch(error){
      console.error("Move booking details could not be loaded:",error);
      const host=document.getElementById("ab-move-booking-"+id);
      if(host) host.innerHTML='<div class="ab-ops-error">Move booking details could not be loaded: '+esc(error.message||error)+'</div>';
    }finally{
      moveBookingLoading.delete(key);
    }
  }

  function moveDraftArgs(id){
    const smsType=fieldValue("ab-move-sms-type-"+id)||"anybike";
    const customerMobile=fieldValue("ab-move-customer-mobile-"+id);
    const smsMobile=smsType==="customer"?customerMobile:(smsType==="none"?"":"+447949574299");
    return {
      p_deal_motorcycle_id:Number(id),
      p_sender_name:fieldValue("ab-move-sender-name-"+id),
      p_sender_street_address:fieldValue("ab-move-sender-street-"+id),
      p_sender_city:fieldValue("ab-move-sender-city-"+id),
      p_sender_state:fieldValue("ab-move-sender-state-"+id),
      p_sender_country:fieldValue("ab-move-sender-country-"+id)||"United Kingdom",
      p_sender_postcode:fieldValue("ab-move-sender-postcode-"+id),
      p_sender_contact_name:fieldValue("ab-move-sender-contact-"+id),
      p_sender_contact_phone:fieldValue("ab-move-sender-phone-"+id),
      p_sender_email:fieldValue("ab-move-sender-email-"+id),
      p_receiver_name:fieldValue("ab-move-receiver-name-"+id),
      p_receiver_street_address:fieldValue("ab-move-receiver-street-"+id),
      p_receiver_city:fieldValue("ab-move-receiver-city-"+id),
      p_receiver_state:fieldValue("ab-move-receiver-state-"+id),
      p_receiver_country:fieldValue("ab-move-receiver-country-"+id)||"United Kingdom",
      p_receiver_postcode:fieldValue("ab-move-receiver-postcode-"+id),
      p_receiver_contact_name:fieldValue("ab-move-receiver-contact-"+id),
      p_receiver_contact_phone:fieldValue("ab-move-receiver-phone-"+id),
      p_receiver_email:fieldValue("ab-move-receiver-email-"+id),
      p_sms_recipient_type:smsType,
      p_sms_mobile:smsMobile,
      p_move_price_agreed_gbp:fieldValue("ab-move-price-"+id)==="" ? null : Number(fieldValue("ab-move-price-"+id)),
      p_move_special_instructions:fieldValue("ab-move-instructions-"+id),
      p_move_contact_at_name:fieldValue("ab-move-contact-at-"+id)
    };
  }

  async function saveMoveDraft(id,quiet){
    const key=String(id);
    if(moveBookingSaving.has(key)) return false;
    moveBookingSaving.add(key);
    try{
      const result=await client().rpc("admin_save_move_booking_draft_v1",moveDraftArgs(id));
      if(result.error) throw result.error;
      moveBookingCache.delete(key);
      if(!quiet){
        const dealId=Number(result.data?.deal_id||0);
        if(dealId){
          operationsCache.delete(String(dealId));
          await loadDeal(dealId,true);
        }else{
          await loadMoveBooking(id,true);
        }
        alert("Move booking draft saved.\n\nCollection readiness has been rechecked.");
      }
      return true;
    }catch(error){
      console.error("Move booking draft could not be saved:",error);
      alert("Move booking draft could not be saved.\n\n"+(error.message||error));
      return false;
    }finally{
      moveBookingSaving.delete(key);
    }
  }

  async function bookMoveShipment(id){
    const readiness=updateMoveCollectionReadiness(id);
    if(!readiness.ready){
      alert("This Move booking is not ready yet.\n\nComplete the red fields:\n"+readiness.missing.join("\n"));
      continueMoveBooking(id);
      return;
    }
    if(!window.confirm("Create the live Move Motorcycles booking now?\n\nThis sends the collection and receiver details to Move and should return a Move shipment/tracking number. It does NOT pay the seller.")) return;
    const saved=await saveMoveDraft(id,true);
    if(!saved) return;
    try{
      const result=await client().functions.invoke("book-move-shipment",{body:{deal_motorcycle_id:Number(id)}});
      if(result.error){
        let detailedMessage="";
        try{
          const ctx=result.error.context;
          if(ctx){
            const response=typeof ctx.clone==="function" ? ctx.clone() : ctx;
            const body=await response.json();
            if(body){
              detailedMessage=body.error||"";
              if(body.code) detailedMessage+=(detailedMessage?"\n":"")+body.code;
              if(Array.isArray(body.missing_fields)&&body.missing_fields.length){
                detailedMessage+=(detailedMessage?"\n\n":"")+"Missing:\n"+body.missing_fields.join("\n");
              }
              if(body.move_response){
                const mr=typeof body.move_response==="string" ? body.move_response : JSON.stringify(body.move_response,null,2);
                detailedMessage+=(detailedMessage?"\n\n":"")+"Move response:\n"+mr;
              }
            }
          }
        }catch(_detailError){}
        throw new Error(detailedMessage||result.error.message||"Move Edge Function failed.");
      }
      const payload=result.data||{};
      if(payload.error){
        let extra="";
        if(payload.stage) extra+="\n\nStage: "+payload.stage;
        if(payload.code) extra+="\nCode: "+payload.code;
        if(payload.move_status) extra+="\nMove HTTP status: "+payload.move_status;
        if(payload.missing_fields&&payload.missing_fields.length) extra+="\n\nMissing:\n"+payload.missing_fields.join("\n");
        if(payload.detail) extra+="\n\nDetail:\n"+payload.detail;
        if(payload.move_response){
          const mr=typeof payload.move_response==="string" ? payload.move_response : JSON.stringify(payload.move_response,null,2);
          extra+="\n\nMove response:\n"+mr;
        }
        throw new Error(payload.error+extra);
      }
      moveBookingCache.delete(String(id));
      operationsCache.clear();

      let inboundMessage="";
      try{
        const inbound=await client().rpc("admin_send_anybike_collection_to_move_v1",{p_deal_motorcycle_id:Number(id)});
        if(inbound.error)throw inbound.error;
        inboundMessage="\n\nIncoming Collection Job: "+(inbound.data?.job_number||"created")+" ✓";
      }catch(inboundError){
        console.warn("Move booking succeeded but Incoming Collection Job was not created:",inboundError);
        inboundMessage="\n\nMove booking succeeded, but the Incoming Collection Job needs to be sent from the Collection panel.";
      }

      alert("Move booking created.\n\nTracking: "+(payload.tracking_no||"Not returned")+"\nReference: "+(payload.reference_no||"")+"\n\nThe motorcycle is now marked Booked with Move."+inboundMessage);

      const bookedData=moveBookingCache.get(String(id))||{};
      const bookedDealId=Number(bookedData.deal_id||0);
      if(bookedDealId){
        operationsCache.delete(String(bookedDealId));
        await loadDeal(bookedDealId,true);
      }else{
        await loadMoveBooking(id,true);
      }

      setTimeout(function(){
        const driverSection=document.getElementById("ab-ops-collection-controls-"+id) ||
          document.querySelector('[data-deal-motorcycle-id="'+id+'"] .ab-ops-collection');
        if(driverSection) driverSection.scrollIntoView({behavior:"smooth",block:"start"});
      },260);
    }catch(error){
      console.error("Move booking failed:",error);
      alert("Move booking was not created.\n\n"+(error.message||error));
    }
  }

  async function loadDeal(dealId,force){
    const key=String(dealId);
    style();

    if(!force && operationsCache.has(key)){
      renderRows(key,operationsCache.get(key));
      return;
    }
    if(operationsLoading.has(key)) return;

    const host=document.getElementById("anybike-operations-"+key);
    if(host) host.innerHTML='<div class="ab-ops-loading">Loading Purchase & Collection…</div>';

    operationsLoading.add(key);
    try{
      const result=await client().rpc("admin_get_deal_operations_v4",{p_deal_id:Number(dealId)});
      if(result.error) throw result.error;
      const rows=result.data || [];
      operationsCache.set(key,rows);
      renderRows(key,rows);
      if(force && typeof window.invalidateFinalInvoiceReadiness==="function"){
        window.invalidateFinalInvoiceReadiness(key);
      }
    }catch(error){
      console.error("Deal Operations could not be loaded:",error);
      if(host) host.innerHTML='<div class="ab-ops-error">Purchase & Collection could not be loaded: '+esc(error.message||error)+'</div>';
    }finally{
      operationsLoading.delete(key);
    }
  }

  function renderPanel(deal){
    const dealId=String(deal && deal.deal_id || "");
    if(!dealId) return "";
    setTimeout(function(){ loadDeal(dealId,false); },0);
    return '<div id="anybike-operations-'+esc(dealId)+'"><div class="ab-ops-loading">Loading Purchase & Collection…</div></div>';
  }

  async function saveSellerReady(dealMotorcycleId,dealId){
    const motorcycleId=Number(dealMotorcycleId);
    const key=String(motorcycleId);
    if(!Number.isFinite(motorcycleId) || operationsSaving.has(key)) return;

    const readyInput=document.getElementById("ab-ops-ready-"+motorcycleId);
    const notesInput=document.getElementById("ab-ops-notes-"+motorcycleId);
    const button=document.getElementById("ab-ops-save-"+motorcycleId);
    const readyDate=String(readyInput && readyInput.value || "").trim();

    if(!readyDate){
      alert("Enter the seller Ready Date before confirming the purchase is proceeding.");
      if(readyInput) readyInput.focus();
      return;
    }

    if(!window.confirm(
      "Confirm AnyBike is proceeding with this purchase?\n\n"+
      "Seller Ready Date: "+niceDate(readyDate)+"\n\n"+
      "This records the seller confirmation and makes the motorcycle ready for the Move Motorcycles booking stage. It does NOT pay the seller or create the Move booking."
    )) return;

    operationsSaving.add(key);
    if(button){ button.disabled=true; button.textContent="Saving…"; }

    try{
      const result=await client().rpc("admin_save_seller_ready_v1",{
        p_deal_motorcycle_id:motorcycleId,
        p_ready_date:readyDate,
        p_notes:String(notesInput && notesInput.value || "").trim() || null
      });
      if(result.error) throw result.error;

      operationsCache.delete(String(dealId));
      await loadDeal(dealId,true);

      alert("Seller proceeding confirmed and Ready Date saved.\n\nNext: Complete the Move booking.");
      setTimeout(function(){
        const movePanel=document.getElementById("ab-move-booking-"+motorcycleId);
        if(movePanel){
          movePanel.scrollIntoView({behavior:"smooth",block:"start"});
        }
      },260);
    }catch(error){
      console.error("Seller Ready Date could not be saved:",error);
      alert("Seller Ready Date could not be saved.\n\n"+(error.message||error));
    }finally{
      operationsSaving.delete(key);
      if(button){ button.disabled=false; }
    }
  }

  async function updateCollectionStep(dealMotorcycleId,dealId,action){
    const id=Number(dealMotorcycleId);
    const key=String(id);
    if(collectionSaving.has(key)) return;
    const notes=fieldValue("ab-collect-notes-"+id);
    if(action==="visual_discrepancy" && !notes){
      alert("Describe the discrepancy before recording it.");
      return;
    }
    const prompts={
      eta_received:"Record that the Move driver has given AnyBike an ETA?",
      driver_arrived:"Confirm the driver is now on site with the seller?",
      visual_passed:"Confirm the motorcycle has passed the visual/basic collection check?",
      visual_discrepancy:"Record this discrepancy and block supplier payment until it is resolved?",
      authorise_supplier_payment:"Authorise supplier payment now?\n\nThis does not send money.",
      mark_collected:"Mark the motorcycle Collected & Secured?\n\nThis confirms the supplier balance is zero and the driver has taken custody."
    };
    if(!window.confirm(prompts[action]||"Save this collection update?")) return;

    collectionSaving.add(key);
    try{
      const result=await client().rpc("admin_update_collection_control_v1",{
        p_deal_motorcycle_id:id,
        p_action:action,
        p_notes:notes||null
      });
      if(result.error) throw result.error;
      operationsCache.delete(String(dealId));
      await loadDeal(dealId,true);
    }catch(error){
      console.error("Collection update failed:",error);
      alert("Collection update could not be saved.\n\n"+(error.message||error));
    }finally{
      collectionSaving.delete(key);
    }
  }

  async function recordCollectionPayment(dealMotorcycleId,dealId){
    const id=Number(dealMotorcycleId);
    const key=String(id);
    if(collectionSaving.has(key)) return;
    const amount=Number(fieldValue("ab-collect-pay-amount-"+id)||0);
    const reference=fieldValue("ab-collect-pay-ref-"+id);
    if(!(amount>0)){
      alert("Enter the supplier payment amount.");
      return;
    }
    if(!window.confirm("Record "+gbp(amount)+" as PAID to the supplier?\n\nOnly continue if the bank transfer has actually been made.\n\nThis action does not send money.")) return;

    collectionSaving.add(key);
    try{
      const result=await client().rpc("admin_record_collection_supplier_payment_v1",{
        p_deal_motorcycle_id:id,
        p_amount_gbp:amount,
        p_payment_method:"Bank Transfer",
        p_payment_reference:reference||null,
        p_notes:null,
        p_payee_name:null,
        p_bank_account_name:null,
        p_bank_account_number:null,
        p_bank_sort_code:null,
        p_bank_international_notes:null
      });
      if(result.error) throw result.error;
      operationsCache.delete(String(dealId));
      await loadDeal(dealId,true);
      alert("Supplier payment recorded in AnyBike.\n\nNo bank transfer was initiated by this action.");
    }catch(error){
      console.error("Supplier payment record failed:",error);
      alert("Supplier payment could not be recorded.\n\n"+(error.message||error));
    }finally{
      collectionSaving.delete(key);
    }
  }

  function collectionReportAdminHtml(report){
    const photos=Array.isArray(report?.photos)?report.photos:[];
    const custody=Array.isArray(report?.custody)?report.custody:[];
    const collection=report?.collection||{};
    const driver=report?.driver||{};
    const internal=report?.internal||{};
    const photoHtml=photos.length
      ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin-top:10px">'+photos.map(function(p){
          return '<a href="'+esc(p.url||"#")+'" target="_blank" rel="noopener" style="display:block;text-decoration:none"><img src="'+esc(p.url||"")+'" alt="'+esc(p.caption||"Collection photo")+'" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;border:1px solid #333"><div style="color:#ddd;font-size:10px;margin-top:4px">'+esc(p.caption||p.slot||"Photo")+'</div></a>';
        }).join("")+'</div>'
      : '<div style="color:#888;margin-top:8px">No collection photos found.</div>';

    const custodyHtml=custody.length
      ? '<div style="margin-top:10px">'+custody.map(function(x){
          const ok=["collected_from_seller","at_depot","with_delivery_driver","delivered_to_shipper","not_applicable"].includes(String(x.status||""));
          return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06)"><span>'+esc(x.description||x.item_type||"Item")+'</span><strong style="color:'+(ok?"#7ee2a8":"#ffb2b2")+'">'+esc(x.status==="not_applicable"?"N/A":ok?"Collected":x.status||"Expected")+'</strong></div>';
        }).join("")+'</div>'
      : '<div style="color:#888;margin-top:8px">No handover items recorded.</div>';

    return '<div style="padding:12px;border:1px solid #333;border-radius:10px;background:#090909">'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px">'+
        '<div><span style="display:block;color:#888;font-size:9px;text-transform:uppercase">Status</span><strong>'+esc(String(collection.status||"").toLowerCase()==="collected"?"Collected":collection.status||"-")+'</strong></div>'+
        '<div><span style="display:block;color:#888;font-size:9px;text-transform:uppercase">Collected</span><strong>'+esc(niceDateTime(collection.collected_at)||"-")+'</strong></div>'+
        '<div><span style="display:block;color:#888;font-size:9px;text-transform:uppercase">Driver</span><strong>'+esc(driver.name||"-")+'</strong></div>'+
        '<div><span style="display:block;color:#888;font-size:9px;text-transform:uppercase">Arrived</span><strong>'+esc(niceDateTime(internal.arrived_at)||"-")+'</strong></div>'+
        '<div><span style="display:block;color:#888;font-size:9px;text-transform:uppercase">Buyer SMS</span><strong>'+esc(driver.collection_sms_sent_at?"Sent "+niceDateTime(driver.collection_sms_sent_at):(driver.collection_sms_status||"Not sent"))+'</strong></div>'+
      '</div>'+
      (internal.visual_check_notes?'<div style="margin-top:10px"><span style="display:block;color:#888;font-size:9px;text-transform:uppercase">Driver notes</span><div style="margin-top:3px;color:#fff">'+esc(internal.visual_check_notes)+'</div></div>':"")+
      '<div style="margin-top:12px"><strong>Handover checklist</strong>'+custodyHtml+'</div>'+
      '<div style="margin-top:12px"><strong>Collection photos</strong>'+photoHtml+'</div>'+
    '</div>';
  }

  async function viewCollectionReport(dealMotorcycleId){
    const id=Number(dealMotorcycleId);
    const box=document.getElementById("ab-collection-report-"+id);
    if(!box) return;
    box.style.display="block";
    box.innerHTML='Loading driver collection report…';
    try{
      const result=await client().functions.invoke("collection-report",{body:{deal_motorcycle_id:id}});
      if(result.error) throw result.error;
      if(!result.data?.success) throw new Error(result.data?.error||"Collection report could not be loaded.");
      box.innerHTML=collectionReportAdminHtml(result.data)+'<div class="ab-collect-actions" style="margin-top:10px"><button type="button" class="ab-ops-button ab-move-secondary" onclick="closeAnyBikeCollectionReport('+id+');return false;">Close Collection Report</button></div>';
    }catch(error){
      box.innerHTML='<span style="color:#ff9e9e">Collection report could not be loaded: '+esc(error.message||error)+'</span>';
    }
  }

  function closeCollectionReport(dealMotorcycleId){
    const box=document.getElementById("ab-collection-report-"+Number(dealMotorcycleId));
    if(box){box.style.display="none";box.innerHTML="";}
  }

  async function sendAnyBikeCollectionToMove(dealMotorcycleId,dealId){
    const id=Number(dealMotorcycleId);
    if(!id)return;
    if(!window.confirm("Send this AnyBike collection to Logistics HQ?\n\nIt will create one linked Incoming Collection Job using the current Move collection details."))return;
    try{
      const result=await client().rpc("admin_send_anybike_collection_to_move_v1",{p_deal_motorcycle_id:id});
      if(result.error)throw result.error;
      const data=result.data||{};
      operationsCache.delete(String(dealId));
      await loadDeal(dealId,true);
      alert(data.already_exists
        ? "This collection is already in Logistics HQ as "+(data.job_number||"a Move job")+"."
        : "Collection sent to Logistics HQ as "+(data.job_number||"a Move job")+".");
    }catch(error){
      console.error("AnyBike collection could not be sent to Logistics HQ:",error);
      alert("Collection could not be sent to Logistics HQ.\n\n"+(error.message||error));
    }
  }

  async function createDriverCollectionLink(dealMotorcycleId){
    const id=Number(dealMotorcycleId);
    try{
      const result=await client().rpc("admin_create_move_driver_collection_link_v2",{
        p_deal_motorcycle_id:id,
        p_driver_name:fieldValue("ab-driver-name-"+id)||null,
        p_driver_mobile:fieldValue("ab-driver-mobile-"+id)||null,
        p_buyer_mobile:fieldValue("ab-buyer-mobile-"+id)||null,
        p_send_collection_report_sms:!!document.getElementById("ab-special-sms-"+id)?.checked,
        p_expires_hours:72
      });
      if(result.error) throw result.error;
      const path=result.data&&result.data.path;
      if(!path) throw new Error("Driver link was not returned.");
      const url=new URL(path,window.location.origin).href;
      const box=document.getElementById("ab-driver-result-"+id);
      const input=document.getElementById("ab-driver-url-"+id);
      const open=document.getElementById("ab-driver-open-"+id);
      if(input) input.value=url;
      if(open) open.href=url;
      if(box) box.style.display="flex";
      const buyerMobile=result.data&&result.data.buyer_mobile;
      const buyerInput=document.getElementById("ab-buyer-mobile-"+id);
      if(buyerInput && buyerMobile && !buyerInput.value) buyerInput.value=buyerMobile;
    }catch(error){
      alert("Driver link could not be created.\n\n"+(error.message||error));
    }
  }

  async function copyDriverLink(id){
    const input=document.getElementById("ab-driver-url-"+Number(id));
    if(!input||!input.value) return;
    try{
      await navigator.clipboard.writeText(input.value);
      alert("Driver collection link copied.");
    }catch(_error){
      input.select();
      document.execCommand("copy");
      alert("Driver collection link copied.");
    }
  }
  window.renderAnyBikeOperationsPanel=renderPanel;
  window.renderAnyBikeDeliveryStatusPanel=renderDeliveryPanel;
  window.loadAnyBikeDeliveryStatusPanel=loadDelivery;
  window.loadAnyBikeOperationsPanel=loadDeal;
  window.saveAnyBikeSellerReady=saveSellerReady;
  window.openAnyBikeReadyCalendar=openReadyCalendar;
  window.setAnyBikeReadyDate=setReadyDate;
  window.updateAnyBikeMoveSmsPreview=updateSmsPreview;
  window.updateAnyBikeMoveCollectionReadiness=updateMoveCollectionReadiness;
  window.continueAnyBikeMoveBooking=continueMoveBooking;
  window.saveAnyBikeCollectionItem=saveCollectionItem;
  window.removeAnyBikeCollectionItem=removeCollectionItem;
  window.saveAnyBikeMoveDraft=saveMoveDraft;
  window.bookAnyBikeMoveShipment=bookMoveShipment;
  window.updateAnyBikeCollectionStep=updateCollectionStep;
  window.recordAnyBikeCollectionPayment=recordCollectionPayment;
  window.sendAnyBikeCollectionToMove=sendAnyBikeCollectionToMove;
  window.createAnyBikeDriverCollectionLink=createDriverCollectionLink;
  window.copyAnyBikeDriverLink=copyDriverLink;
  window.viewAnyBikeCollectionReport=viewCollectionReport;
  window.closeAnyBikeCollectionReport=closeCollectionReport;
  document.querySelectorAll('[id^="anybike-operations-"]').forEach(function(host){
    const dealId=String(host.id.replace("anybike-operations-","")).trim();
    if(dealId){ loadDeal(dealId,false); }
  });

})();
