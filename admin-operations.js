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
      .ab-move-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.08);background:#0c0c0c}
      .ab-move-actions small{color:#999;line-height:1.4}
      .ab-move-actions div{display:flex;gap:8px}
      .ab-move-secondary{border:1px solid #555!important;background:#171717!important}
      .ab-move-warning{margin:0 14px 12px;padding:10px 11px;border:1px solid rgba(255,181,71,.3);border-radius:8px;background:#211707;color:#ffd18a;font-size:11px;line-height:1.4}
      .ab-move-booked{margin:0 16px 14px;padding:12px 14px;border:1px solid rgba(47,141,85,.4);border-radius:10px;background:#102719;color:#9cf0b5}
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
              <div class="ab-date-wrap">
                <input id="ab-ops-ready-${id}" type="date" value="${esc(readyDate)}">
                <button type="button" class="ab-date-open" onclick="openAnyBikeReadyCalendar(${id});return false;" title="Open calendar">📅</button>
              </div>
              <div class="ab-date-shortcuts">
                <button type="button" onclick="setAnyBikeReadyDate(${id},0);return false;">Today</button>
                <button type="button" onclick="setAnyBikeReadyDate(${id},1);return false;">Tomorrow</button>
              </div>
            </div>
            <div class="ab-ops-field">
              <label>Seller / Collection Notes</label>
              <textarea id="ab-ops-notes-${id}" placeholder="Opening hours, notice required, collection instructions...">${esc(row.seller_ready_notes||"")}</textarea>
            </div>
            <button type="button" class="ab-ops-button" id="ab-ops-save-${id}" onclick="saveAnyBikeSellerReady(${id},${Number(dealId)});return false;">${confirmed ? "Update Ready Date" : "Confirm Seller & Ready Date"}</button>
          </div>

          ${confirmed ? (booked
            ? `<div class="ab-move-booked"><strong>Move Motorcycles:</strong> ${esc(row.move_tracking_no ? "Booked · Tracking "+row.move_tracking_no : "Booked")}</div>`
            : `<div id="ab-move-booking-${id}" class="ab-move"><div class="ab-ops-loading">Loading Move booking details…</div></div>`) : ""}
          <div class="ab-ops-next">
            <span><strong>Next:</strong> ${confirmed ? (booked ? "Move collection is linked to this motorcycle." : "Review and complete the Move Motorcycles booking.") : "Contact the seller, confirm AnyBike is proceeding and obtain the Ready Date."}</span>
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
    const moveInstructions=data.move_special_instructions||"";
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

        <div class="ab-move-section">Collection from seller — internal operational information</div>
        <div class="ab-move-field"><label>Seller / Sender Name *</label><input id="ab-move-sender-name-${id}" value="${esc(sender.name||"")}"></div>
        <div class="ab-move-field"><label>Contact Name</label><input id="ab-move-sender-contact-${id}" value="${esc(sender.contact_name||"")}"></div>
        <div class="ab-move-field"><label>Street Address *</label><input id="ab-move-sender-street-${id}" value="${esc(sender.street_address||"")}" placeholder="${esc(sender.location_hint||"")}"></div>
        <div class="ab-move-field"><label>City *</label><input id="ab-move-sender-city-${id}" value="${esc(sender.city||"")}"></div>
        <div class="ab-move-field"><label>County / State</label><input id="ab-move-sender-state-${id}" value="${esc(sender.state||"")}"></div>
        <div class="ab-move-field"><label>Postcode *</label><input id="ab-move-sender-postcode-${id}" value="${esc(sender.postcode||"")}"></div>
        <div class="ab-move-field"><label>Country</label><input id="ab-move-sender-country-${id}" value="${esc(sender.country||"United Kingdom")}"></div>
        <div class="ab-move-field"><label>Seller Contact Phone</label><input id="ab-move-sender-phone-${id}" value="${esc(sender.contact_phone||"")}"></div>
        <div class="ab-move-field"><label>Seller Email</label><input id="ab-move-sender-email-${id}" type="email" value="${esc(sender.email||"")}"></div>

        <div class="ab-move-section">Deliver to buyer's shipper / freight forwarder</div>
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

        <div class="ab-move-section">Mandatory Move shipment fields</div>
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
        <div class="ab-move-field" style="grid-column:1/-1"><label>Special Instructions *</label><textarea id="ab-move-instructions-${id}" placeholder="Special Instructions">${esc(moveInstructions)}</textarea></div>
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
      <div class="ab-move-warning"><strong>SMS note:</strong> AnyBike saves this preference now. The supplied Move shipment API documentation does not expose the exact SMS/mobile field, so the booking integration will not guess one or overwrite seller/shipper contact details.</div>
      <div class="ab-move-actions">
        <small>Required fields must be complete before a live Move booking is created. Seller identity remains internal to AnyBike/Move.</small>
        <div>
          <button type="button" class="ab-ops-button ab-move-secondary" onclick="saveAnyBikeMoveDraft(${id});return false;">Save Draft</button>
          <button type="button" class="ab-ops-button" onclick="bookAnyBikeMoveShipment(${id});return false;">Book with Move</button>
        </div>
      </div>
    `;
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
        await loadMoveBooking(id,true);
        alert("Move booking draft saved.");
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
    const required=[
      ["Seller / Sender Name",fieldValue("ab-move-sender-name-"+id)],
      ["Seller Street Address",fieldValue("ab-move-sender-street-"+id)],
      ["Seller City",fieldValue("ab-move-sender-city-"+id)],
      ["Seller Postcode",fieldValue("ab-move-sender-postcode-"+id)],
      ["Shipper / Receiver Name",fieldValue("ab-move-receiver-name-"+id)],
      ["Receiver Street Address",fieldValue("ab-move-receiver-street-"+id)],
      ["Receiver City",fieldValue("ab-move-receiver-city-"+id)],
      ["Receiver Postcode",fieldValue("ab-move-receiver-postcode-"+id)],
      ["Sales Price",fieldValue("ab-move-sales-price-"+id)],
      ["Price Agreed with Move Motorcycles",fieldValue("ab-move-price-"+id)],
      ["Contact at name Dealer?",fieldValue("ab-move-contact-at-"+id)],
      ["Special Instructions",fieldValue("ab-move-instructions-"+id)]
    ];
    const missing=required.filter(function(item){ return !item[1]; }).map(function(item){ return item[0]; });
    if(missing.length){
      alert("Complete these Move booking fields first:\n\n"+missing.join("\n"));
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
      alert("Move booking created.\n\nTracking: "+(payload.tracking_no||"Not returned")+"\nReference: "+(payload.reference_no||"")+"\n\nThe motorcycle is now marked Booked with Move.");
      if(typeof renderAdminDealQueue==="function") renderAdminDealQueue();
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
  window.openAnyBikeReadyCalendar=openReadyCalendar;
  window.setAnyBikeReadyDate=setReadyDate;
  window.updateAnyBikeMoveSmsPreview=updateSmsPreview;
  window.saveAnyBikeMoveDraft=saveMoveDraft;
  window.bookAnyBikeMoveShipment=bookMoveShipment;

})();