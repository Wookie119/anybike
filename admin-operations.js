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
    const display=(window.adminDealSellerDisplay && window.adminDealSellerDisplay.get)
      ? (window.adminDealSellerDisplay.get(id) || {})
      : {};
    const confirmation=(window.adminDealSellerConfirmations && window.adminDealSellerConfirmations.get)
      ? (window.adminDealSellerConfirmations.get(id) || {})
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
    const display=(window.adminDealSellerDisplay && window.adminDealSellerDisplay.get)
      ? (window.adminDealSellerDisplay.get(id) || {})
      : {};
    const confirmation=(window.adminDealSellerConfirmations && window.adminDealSellerConfirmations.get)
      ? (window.adminDealSellerConfirmations.get(id) || {})
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
      .ab-ops-button{min-height:39px;border:0;border-radius:8px;background:#ed1c24;color:#fff;padding:10px 14px;font-weight:900;cursor:pointer}
      .ab-ops-button:disabled{opacity:.45;cursor:not-allowed}
      .ab-ops-next{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 16px;border-top:1px solid rgba(255,255,255,.08);background:#101010;color:#aaa;font-size:12px}
      .ab-ops-next strong{color:#fff}
      .ab-ops-private{color:#ff9ca0;font-weight:800}
      .ab-ops-loading,.ab-ops-empty,.ab-ops-error{padding:14px;border:1px dashed rgba(255,255,255,.18);border-radius:10px;color:#aaa;background:#0c0c0c}
      .ab-ops-error{color:#ff8f94;border-color:rgba(237,28,36,.35)}
      @media(max-width:950px){.ab-ops-grid{grid-template-columns:1fr 1fr}.ab-ops-ready{grid-template-columns:1fr}}
      @media(max-width:560px){.ab-ops-grid{grid-template-columns:1fr}.ab-ops-head,.ab-ops-next{flex-direction:column;align-items:flex-start}}
    `;
    document.head.appendChild(el);
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
      const moveStatus=row.raw_move_status || (booked ? row.collection_status : "Not booked");
      const storage=row.storage_status || "not_started";
      const seller=sellerNameFor(row);
      const phone=sellerPhoneFor(row);

      return `
        <section class="ab-ops-bike">
          <div class="ab-ops-head">
            <div>
              <span>Purchase & Collection</span>
              <h4>${esc(motorcycleTitle(row))}</h4>
            </div>
            <div class="ab-ops-state ${confirmed ? "ready" : ""}">${confirmed ? "Seller proceeding confirmed" : "Seller confirmation required"}</div>
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
              <input id="ab-ops-ready-${id}" type="date" value="${esc(readyDate)}">
            </div>
            <div class="ab-ops-field">
              <label>Seller / Collection Notes</label>
              <textarea id="ab-ops-notes-${id}" placeholder="Opening hours, notice required, collection instructions...">${esc(row.seller_ready_notes||"")}</textarea>
            </div>
            <button type="button" class="ab-ops-button" id="ab-ops-save-${id}" onclick="saveAnyBikeSellerReady(${id},${Number(dealId)});return false;">${confirmed ? "Update Ready Date" : "Confirm Seller & Ready Date"}</button>
          </div>

          <div class="ab-ops-next">
            <span><strong>Next:</strong> ${confirmed ? (booked ? "Move collection is linked to this motorcycle." : "Ready to build the Move Motorcycles booking.") : "Contact the seller, confirm AnyBike is proceeding and obtain the Ready Date."}</span>
            <span class="ab-ops-private">${phone ? "Seller contact held internally" : "Seller details remain internal"}</span>
          </div>
        </section>
      `;
    }).join("");
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
      const result=await client().rpc("admin_get_deal_operations_v1",{p_deal_id:Number(dealId)});
      if(result.error) throw result.error;
      const rows=result.data || [];
      operationsCache.set(key,rows);
      renderRows(key,rows);
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

      alert("Seller proceeding confirmed and Ready Date saved.\n\nNext: Book collection with Move Motorcycles.");
    }catch(error){
      console.error("Seller Ready Date could not be saved:",error);
      alert("Seller Ready Date could not be saved.\n\n"+(error.message||error));
    }finally{
      operationsSaving.delete(key);
      if(button){ button.disabled=false; }
    }
  }

  window.renderAnyBikeOperationsPanel=renderPanel;
  window.loadAnyBikeOperationsPanel=loadDeal;
  window.saveAnyBikeSellerReady=saveSellerReady;
})();