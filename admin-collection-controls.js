/* AnyBike — Collection & Supplier Payment controls. Isolated from messaging/notifications. */
(function(){
  "use strict";
  const cache=new Map(), loading=new Set(), saving=new Set();

  function sb(){ if(window.sb) return window.sb; throw new Error("Supabase client unavailable."); }
  function esc(v){ return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
  function field(id){ const e=document.getElementById(id); return String(e&&e.value||"").trim(); }
  function money(v){ return "£"+Number(v||0).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function dt(v){ if(!v)return "Not recorded"; const d=new Date(v); return isNaN(d.getTime())?String(v):d.toLocaleString("en-GB"); }

  function addStyle(){
    if(document.getElementById("ab-collection-css"))return;
    const s=document.createElement("style"); s.id="ab-collection-css";
    s.textContent=".ab-collection{margin:0 16px 14px;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:#101010;overflow:hidden}.ab-collection-head{padding:13px 14px;border-bottom:1px solid rgba(255,255,255,.08)}.ab-collection-head span{display:block;color:#ed1c24;font-size:10px;font-weight:950;text-transform:uppercase}.ab-collection-head h5{margin:4px 0 0;color:#fff;font-size:15px}.ab-collection-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;padding:12px 14px}.ab-collection-step{border:1px solid #333;border-radius:9px;background:#0b0b0b;padding:9px}.ab-collection-step span{display:block;color:#9299a3;font-size:9px;font-weight:900;text-transform:uppercase}.ab-collection-step strong{display:block;margin-top:4px;color:#fff;font-size:11px}.ab-collection-step.done{border-color:#2f8d55;background:#102719}.ab-collection-step.warn{border-color:#9a6b17;background:#211707}.ab-collection-body{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px 14px}.ab-collection-card{border:1px solid rgba(255,255,255,.09);border-radius:9px;background:#0b0b0b;padding:12px}.ab-collection-card h6{margin:0 0 9px;color:#fff;font-size:12px}.ab-collection-actions{display:flex;gap:7px;flex-wrap:wrap}.ab-collection-note{width:100%;box-sizing:border-box;margin:8px 0;border:1px solid #353535;border-radius:8px;background:#070707;color:#fff;padding:9px 10px;min-height:62px;resize:vertical}.ab-collection-paygrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ab-collection-field label{display:block;margin-bottom:4px;color:#9aa3ae;font-size:9px;font-weight:900;text-transform:uppercase}.ab-collection-field input,.ab-collection-field textarea{width:100%;box-sizing:border-box;border:1px solid #353535;border-radius:7px;background:#070707;color:#fff;padding:8px 9px}.ab-collection-field textarea{min-height:58px;resize:vertical}.ab-collection-foot{padding:11px 14px;border-top:1px solid rgba(255,255,255,.08);color:#aaa;font-size:11px;line-height:1.45}.ab-pay-ready{color:#8ff0b0;font-weight:900}.ab-pay-blocked{color:#ffd18a;font-weight:900}@media(max-width:1100px){.ab-collection-steps{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.ab-collection-steps,.ab-collection-body,.ab-collection-paygrid{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }

  function hostFor(id){
    let h=document.getElementById("ab-collection-control-"+id);
    if(h)return h;
    const ready=document.getElementById("ab-ops-ready-"+id);
    const bike=ready&&ready.closest(".ab-ops-bike");
    if(!bike)return null;
    h=document.createElement("div"); h.id="ab-collection-control-"+id; h.className="ab-collection";
    const next=bike.querySelector(".ab-ops-next");
    bike.insertBefore(h,next||null);
    return h;
  }

  function button(label,action,id,disabled,secondary){
    return '<button type="button" class="ab-ops-button'+(secondary?' ab-move-secondary':'')+'" '+(disabled?'disabled ':'')+'onclick="updateAnyBikeCollectionControl('+id+',\''+action+'\');return false;">'+label+'</button>';
  }

  function render(id,d){
    const h=hostFor(id); if(!h)return;
    const eta=!!d.driver_eta_received_at, arrived=!!d.driver_arrived_at;
    const visual=String(d.visual_check_status||"pending"), passed=visual==="passed", discrepancy=visual==="discrepancy";
    const authorised=!!d.supplier_payment_authorised_at;
    const balance=Number(d.supplier_balance_gbp||0), paid=Number(d.supplier_total_paid_gbp||0), cleared=balance<=0.005;
    const collected=String(d.collection_status||"")==="collected", secured=!!d.motorcycle_secured;

    let html='<div class="ab-collection-head"><span>Collection & Supplier Payment</span><h5>Driver-on-site controls</h5></div>';
    html+='<div class="ab-collection-steps">';
    html+='<div class="ab-collection-step '+(eta?'done':'')+'"><span>1 · Driver ETA</span><strong>'+esc(eta?dt(d.driver_eta_received_at):"Waiting")+'</strong></div>';
    html+='<div class="ab-collection-step '+(arrived?'done':'')+'"><span>2 · Driver Arrived</span><strong>'+esc(arrived?dt(d.driver_arrived_at):"Waiting")+'</strong></div>';
    html+='<div class="ab-collection-step '+(passed?'done':(discrepancy?'warn':''))+'"><span>3 · Visual Check</span><strong>'+esc(passed?"Passed":(discrepancy?"Discrepancy":"Pending"))+'</strong></div>';
    html+='<div class="ab-collection-step '+(authorised?'done':'')+'"><span>4 · Payment</span><strong>'+esc(authorised?"Authorised":"Not authorised")+'</strong></div>';
    html+='<div class="ab-collection-step '+(cleared?'done':'')+'"><span>5 · Supplier Balance</span><strong>'+esc(cleared?"Paid in full":money(balance)+" due")+'</strong></div>';
    html+='<div class="ab-collection-step '+(collected&&secured?'done':'')+'"><span>6 · Motorcycle</span><strong>'+esc(collected&&secured?"Collected & secured":"Not collected")+'</strong></div></div>';

    html+='<div class="ab-collection-body"><div class="ab-collection-card"><h6>Driver arrival & visual check</h6><div class="ab-collection-actions">';
    html+=button("Record Driver ETA","eta_received",id,eta,true)+button("Driver Arrived","driver_arrived",id,arrived,true);
    html+='</div><textarea id="ab-collection-notes-'+id+'" class="ab-collection-note" placeholder="Visual discrepancy or check notes…">'+esc(d.visual_check_notes||"")+'</textarea><div class="ab-collection-actions">';
    html+=button("Visual Check Passed","visual_passed",id,!arrived,false)+button("Record Discrepancy","visual_discrepancy",id,!arrived,true);
    html+='</div>'+(discrepancy?'<div class="ab-pay-blocked" style="margin-top:9px">Payment is blocked until the discrepancy is resolved and the visual check is passed.</div>':'')+'</div>';

    html+='<div class="ab-collection-card"><h6>Supplier payment control</h6><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px">';
    html+='<div class="ab-ops-metric"><span>Seller Price</span><strong>'+esc(money(d.seller_price_gbp))+'</strong></div>';
    html+='<div class="ab-ops-metric"><span>Paid</span><strong>'+esc(money(paid))+'</strong></div>';
    html+='<div class="ab-ops-metric"><span>Balance</span><strong>'+esc(money(balance))+'</strong></div></div><div class="ab-collection-actions">';
    html+=button("Authorise Supplier Payment","authorise_supplier_payment",id,!arrived||!passed||authorised,false);
    html+='</div><div style="margin-top:9px" class="'+(authorised?'ab-pay-ready':'ab-pay-blocked')+'">'+(authorised?'Payment may now be recorded against the supplier ledger.':'Driver must be on site and the visual check must pass before payment is authorised.')+'</div></div>';

    if(authorised&&!cleared){
      html+='<div class="ab-collection-card" style="grid-column:1/-1"><h6>Record supplier payment</h6><div class="ab-collection-paygrid">';
      html+='<div class="ab-collection-field"><label>Amount *</label><input id="ab-pay-amount-'+id+'" type="number" min="0.01" step="0.01" value="'+esc(balance.toFixed(2))+'"></div>';
      html+='<div class="ab-collection-field"><label>Payment Method</label><input id="ab-pay-method-'+id+'" value="Bank Transfer"></div>';
      html+='<div class="ab-collection-field"><label>Payment Reference</label><input id="ab-pay-reference-'+id+'" value="'+esc(d.deal_number||"")+'"></div>';
      html+='<div class="ab-collection-field"><label>Payee Name</label><input id="ab-pay-payee-'+id+'" value="'+esc(d.payee_name||"")+'"></div>';
      html+='<div class="ab-collection-field"><label>Bank Account Name</label><input id="ab-pay-account-name-'+id+'" value="'+esc(d.bank_account_name||"")+'"></div>';
      html+='<div class="ab-collection-field"><label>Account Number</label><input id="ab-pay-account-number-'+id+'" value="'+esc(d.bank_account_number||"")+'"></div>';
      html+='<div class="ab-collection-field"><label>Sort Code</label><input id="ab-pay-sort-code-'+id+'" value="'+esc(d.bank_sort_code||"")+'"></div>';
      html+='<div class="ab-collection-field"><label>International / Bank Notes</label><input id="ab-pay-bank-notes-'+id+'" value="'+esc(d.bank_international_notes||"")+'"></div>';
      html+='<div class="ab-collection-field" style="grid-column:1/-1"><label>Payment Notes</label><textarea id="ab-pay-notes-'+id+'" placeholder="Optional internal notes"></textarea></div></div>';
      html+='<div class="ab-collection-actions" style="margin-top:10px"><button type="button" class="ab-ops-button" onclick="recordAnyBikeCollectionSupplierPayment('+id+');return false;">Record Supplier Payment</button></div>';
      html+='<div class="ab-collection-foot" style="padding:9px 0 0;border:0">This records a payment in AnyBike\'s supplier ledger. It does <strong>not</strong> initiate a bank transfer.</div></div>';
    }

    html+='<div class="ab-collection-card" style="grid-column:1/-1"><h6>Collection completion</h6><div class="ab-collection-actions">';
    html+=button("Mark Motorcycle Collected & Secured","mark_collected",id,!arrived||!passed||!authorised||!cleared||collected,false);
    html+='</div><div style="margin-top:9px;color:#aaa;font-size:11px">'+(collected&&secured?'Motorcycle collected at '+esc(dt(d.collection_actual_at))+' and secured to AnyBike.':'Collection can only complete after driver arrival, passed visual check, supplier payment authorisation and a zero supplier balance.')+'</div></div></div>';
    html+='<div class="ab-collection-foot">Supplier money is kept separate from customer payments. A payment recorded here is an internal ledger record only; actual bank payment must be made through AnyBike\'s authorised banking process.</div>';
    h.innerHTML=html;
  }

  async function load(id,force){
    id=Number(id); const k=String(id); if(!id)return;
    const h=hostFor(id); if(!h)return;
    if(!force&&cache.has(k)){render(id,cache.get(k));return;}
    if(loading.has(k))return; loading.add(k); h.innerHTML='<div class="ab-ops-loading">Loading Collection & Supplier Payment controls…</div>';
    try{ const r=await sb().rpc("admin_get_collection_control_v1",{p_deal_motorcycle_id:id}); if(r.error)throw r.error; cache.set(k,r.data||{}); render(id,r.data||{}); }
    catch(e){ console.error(e); h.innerHTML='<div class="ab-ops-error">Collection controls could not be loaded: '+esc(e.message||e)+'</div>'; }
    finally{ loading.delete(k); }
  }

  async function update(id,action){
    id=Number(id); const k=String(id); if(saving.has(k))return;
    const notes=field("ab-collection-notes-"+id);
    if(action==="visual_discrepancy"&&!notes){alert("Describe the discrepancy before recording it.");return;}
    const prompts={eta_received:"Record that the Move driver has given AnyBike an ETA?",driver_arrived:"Confirm the driver is now on site with the seller?",visual_passed:"Confirm the motorcycle has passed the agreed visual/basic collection check?",visual_discrepancy:"Record this discrepancy and block supplier payment until it is resolved?",authorise_supplier_payment:"Authorise supplier payment now?\n\nThis does not send money. It unlocks the supplier payment recording stage.",mark_collected:"Mark the motorcycle Collected and Secured?\n\nThis confirms supplier balance is zero and the driver has taken custody."};
    if(!confirm(prompts[action]||"Save this collection update?"))return;
    saving.add(k);
    try{ const r=await sb().rpc("admin_update_collection_control_v1",{p_deal_motorcycle_id:id,p_action:action,p_notes:notes||null}); if(r.error)throw r.error; cache.set(k,r.data||{}); render(id,r.data||{}); }
    catch(e){ console.error(e); alert("Collection control could not be updated.\n\n"+(e.message||e)); }
    finally{ saving.delete(k); }
  }

  async function recordPayment(id){
    id=Number(id); const amount=Number(field("ab-pay-amount-"+id)||0); if(!(amount>0)){alert("Enter the supplier payment amount.");return;}
    if(!confirm("Record "+money(amount)+" as PAID to the supplier?\n\nThis writes a real supplier-payment ledger entry in AnyBike. It does NOT send a bank transfer."))return;
    try{
      const r=await sb().rpc("admin_record_collection_supplier_payment_v1",{p_deal_motorcycle_id:id,p_amount_gbp:amount,p_payment_method:field("ab-pay-method-"+id)||"Bank Transfer",p_payment_reference:field("ab-pay-reference-"+id)||null,p_notes:field("ab-pay-notes-"+id)||null,p_payee_name:field("ab-pay-payee-"+id)||null,p_bank_account_name:field("ab-pay-account-name-"+id)||null,p_bank_account_number:field("ab-pay-account-number-"+id)||null,p_bank_sort_code:field("ab-pay-sort-code-"+id)||null,p_bank_international_notes:field("ab-pay-bank-notes-"+id)||null});
      if(r.error)throw r.error; const d=r.data&&r.data.collection_control; cache.delete(String(id)); if(d){cache.set(String(id),d);render(id,d);}else await load(id,true); alert("Supplier payment recorded in AnyBike.\n\nNo bank transfer was initiated by this action.");
    }catch(e){console.error(e);alert("Supplier payment could not be recorded.\n\n"+(e.message||e));}
  }

  function scan(){
    document.querySelectorAll('input[id^="ab-ops-ready-"]').forEach(function(el){
      const id=Number(el.id.replace("ab-ops-ready-",""));
      if(id) load(id,false);
    });
  }

  addStyle();
  window.updateAnyBikeCollectionControl=update;
  window.recordAnyBikeCollectionSupplierPayment=recordPayment;
  const mo=new MutationObserver(function(){scan();});
  if(document.body)mo.observe(document.body,{childList:true,subtree:true});
  setTimeout(scan,100);
})();
