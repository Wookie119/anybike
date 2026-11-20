(()=>{"use strict";const $=x=>document.getElementById(x);let db;let test=1;async function call(action){const buttons=[...document.querySelectorAll("#movetest button,#movetest select")];buttons.forEach(x=>x.disabled=true);$("result").textContent="Connecting…";try{const {data,error}=await db.functions.invoke("move-anybike-booking-test",{body:{action,test,...(action==="submit"?{confirmation:test===2?"SUBMIT SECOND TEST":"SUBMIT HON125R"}:{})}});if(error)throw error;$("result").textContent=JSON.stringify(data,null,2);if(data.submission||data.shipment_id||data.error&&action==="submit")$("submit").dataset.locked="yes"}catch(e){$("result").textContent=String(e.message||e)+" — if a submission was attempted, check Move before retrying.";if(action==="submit")$("submit").dataset.locked="yes"}finally{buttons.forEach(x=>x.disabled=false);if($("submit").dataset.locked)$("submit").disabled=true}}let n=0;const timer=setInterval(async()=>{if(document.documentElement.classList.contains("admin-auth-pending")){if(++n>300)clearInterval(timer);return}clearInterval(timer);try{db=getAdminSupabaseClient();const {data,error}=await db.rpc("anybike_is_admin");if(error||data!==true)throw Error("Admin only");$("movetest").hidden=false;
$("test3-preview").onclick=()=>{
 const senderEmail=$("test3-sender-email").value.trim(),receiverEmail=$("test3-receiver-email").value.trim(),readyDate=$("test3-ready-date").value;
 const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&!v.toLowerCase().endsWith(".invalid");
 const problems=[];
 if(!validEmail(senderEmail))problems.push("Enter the sender's genuine test email address.");
 if(!validEmail(receiverEmail))problems.push("Enter the receiver's genuine test email address.");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(readyDate))problems.push("Choose the motorcycle ready date.");
 const fields={
  sender_name:"James Mitchell",sender_phone:"07772024763",sender_email:senderEmail,
  sender_street_address:"[COLLECTION ADDRESS REQUIRED]",sender_city:"[CITY REQUIRED]",sender_code:"[POSTCODE REQUIRED]",sender_country:"United Kingdom",
  receiver_name:"Daniel Carter",receiver_phone:"07949574299",receiver_email:receiverEmail,
  receiver_street_address:"[DELIVERY ADDRESS REQUIRED]",receiver_city:"[CITY REQUIRED]",receiver_code:"[POSTCODE REQUIRED]",receiver_country:"United Kingdom",
  "pname[]":"Honda Forza 125","pquantity[]":"1",
  "custom_field[11548]":"Honda","custom_field[11549]":"Forza 125","custom_field[11550]":"HON125R","custom_field[11556]":"180",
  "custom_field[11557]":"TEST 3 — DO NOT DISPATCH OR INVOICE. Agreed transport price GBP 180 including VAT. Invoice payer: RECEIVER. Move Admin to check price and manually enter Freight Charge.",
  ready_date:readyDate,
  instructions:"TEST 3 — DO NOT DISPATCH OR INVOICE. READY DATE "+readyDate+". Invoice payer RECEIVER. Motorcycle payment must be confirmed with seller before loading."
 };
 const output=problems.length?"NOT READY FOR LIVE TEST:\n- "+problems.join("\n- ")+"\n\n":"";
 $("test3-output").textContent=output+"Preview of documented Move API form fields (NOT SUBMITTED):\n"+JSON.stringify(fields,null,2)+"\n\nNo payer/charges API fields sent: Move Admin enters the freight charge and confirms invoice payer.";
};const selector=document.createElement("select");selector.setAttribute("aria-label","Test booking");selector.style.cssText="display:block;background:#303030;color:white;padding:10px;border:1px solid #666;margin:12px 0";selector.innerHTML='<option value="1">Test 1 — existing shipment (115977)</option><option value="2">Test 2 — existing shipment (115978; reconcile)</option>';$("movetest").insertBefore(selector,$("check"));selector.onchange=()=>{test=Number(selector.value);call("status")};$("check").onclick=()=>call("check");$("status").onclick=()=>call("status");$("submit").dataset.locked="yes";$("submit").disabled=true;$("submit").title="Both existing test shipments have already been created; do not submit again.";await call("status")}catch(e){$("gate").textContent=e.message}},100)})();