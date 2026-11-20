(()=>{"use strict";const $=x=>document.getElementById(x);let db;let test=1;async function call(action){const buttons=[...document.querySelectorAll("#movetest > button,#movetest > select")];buttons.forEach(x=>x.disabled=true);$("result").textContent="Connecting…";try{const {data,error}=await db.functions.invoke("move-anybike-booking-test",{body:{action,test,...(action==="submit"?{confirmation:test===2?"SUBMIT SECOND TEST":"SUBMIT HON125R"}:{})}});if(error)throw error;$("result").textContent=JSON.stringify(data,null,2);if(data.submission||data.shipment_id||data.error&&action==="submit")$("submit").dataset.locked="yes"}catch(e){$("result").textContent=String(e.message||e)+" — if a submission was attempted, check Move before retrying.";if(action==="submit")$("submit").dataset.locked="yes"}finally{buttons.forEach(x=>x.disabled=false);if($("submit").dataset.locked)$("submit").disabled=true}}let test3Ready=false,test3Locked=false,test3Fields=null;
function buildTest3(){
 const get=id=>$(id).value.trim();
 const senderEmail=get("test3-sender-email"),receiverEmail=get("test3-receiver-email"),readyDate=get("test3-ready-date");
 const senderStreet=get("test3-sender-street"),senderCity=get("test3-sender-city"),senderCode=get("test3-sender-code").toUpperCase();
 const receiverStreet=get("test3-receiver-street"),receiverCity=get("test3-receiver-city"),receiverCode=get("test3-receiver-code").toUpperCase();
 const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&!v.toLowerCase().endsWith(".invalid");
 const validPostcode=v=>/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(v);
 const issues=[];
 if(!validEmail(senderEmail))issues.push("Sender email required for account and invoicing.");
 if(!validEmail(receiverEmail))issues.push("Receiver email required for account and invoicing.");
 if(!senderStreet)issues.push("Enter the full collection street address.");
 if(!senderCity)issues.push("Enter the collection town or city.");
 if(!validPostcode(senderCode)||senderCode.replace(/\s/g,"")!=="OX447RW")issues.push("Collection postcode must be OX44 7RW.");
 if(!receiverStreet)issues.push("Enter the full delivery street address.");
 if(!receiverCity)issues.push("Enter the delivery town or city.");
 if(!validPostcode(receiverCode)||receiverCode.replace(/\s/g,"")!=="TW135EL")issues.push("Delivery postcode must be TW13 5EL.");
 const parsed=readyDate?new Date(readyDate+"T12:00:00Z"):null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(readyDate)||!parsed||Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==readyDate)issues.push("Choose a valid motorcycle ready date.");
 const booking={sender_email:senderEmail,receiver_email:receiverEmail,
 sender_street_address:senderStreet,sender_city:senderCity,sender_code:senderCode,
 receiver_street_address:receiverStreet,receiver_city:receiverCity,receiver_code:receiverCode,ready_date:readyDate};
 const fields={
  sender_name:"James Mitchell",sender_phone:"07772024763",sender_email:senderEmail,
  sender_street_address:senderStreet,sender_city:senderCity,sender_code:senderCode,sender_country:"United Kingdom",
  receiver_name:"Daniel Carter",receiver_phone:"07949574299",receiver_email:receiverEmail,
  receiver_street_address:receiverStreet,receiver_city:receiverCity,receiver_code:receiverCode,receiver_country:"United Kingdom",
  "pname[]":"Honda Forza 125","pquantity[]":"1",
  "custom_field[11548]":"Honda","custom_field[11549]":"Forza 125","custom_field[11550]":"HON125R","custom_field[11556]":"180",
  "custom_field[11557]":"TEST 3 — DO NOT DISPATCH OR INVOICE. AGREED PRICE £180 incl VAT. Receiver is invoice payer. Move Admin must manually set Freight Charge and invoice payer. READY DATE "+readyDate,
  ready_date:readyDate,
  instructions:"API TEST 3 ONLY — DO NOT DISPATCH OR INVOICE. Receiver pays transport £180 including VAT. Move Admin review freight charge. READY DATE "+readyDate
 };
 return {booking,fields,issues};
}
async function test3Status(){
 try{
  const {data,error}=await db.functions.invoke("move-anybike-test3",{body:{action:"status"}});
  if(error)throw error;
  if(data.submission){test3Locked=true;$("test3-submit").disabled=true;}else{$("test3-submit").disabled=!test3Ready||test3Locked;}
  $("test3-result").textContent=JSON.stringify(data,null,2);
  if(data?.submission){
   const tracking=data?.move?.tracking_no||data?.tracking_no||"115984";
   const ready=data?.move?.ready_date;
   const statusText="TEST 3 ALREADY SUBMITTED — Move shipment "+tracking+".\n"+
    (ready?"Ready date returned by Move: "+ready:"READY DATE NOT CONFIRMED IN MOVE — input was 25/12/2026.")+
    "\nDo not create another booking. Use Check Test 3 submission status for read-only verification.";
   $("test3-output").textContent=statusText;
  }
 }catch(e){$("test3-result").textContent="Could not check Test 3 status. Submission disabled. "+String(e.message||e);test3Locked=true;$("test3-submit").disabled=true;}
}
const draftInputIds={
 sender_email:"test3-sender-email",receiver_email:"test3-receiver-email",
 sender_street_address:"test3-sender-street",sender_city:"test3-sender-city",sender_code:"test3-sender-code",
 receiver_street_address:"test3-receiver-street",receiver_city:"test3-receiver-city",receiver_code:"test3-receiver-code",ready_date:"test3-ready-date"
};
async function loadTest3Draft(){
 const {data,error}=await db.functions.invoke("move-anybike-test3",{body:{action:"draft"}});
 if(error||!data?.success)throw Error("Could not load saved Test 3 details");
 for(const [field,id] of Object.entries(draftInputIds)){
  if(typeof data.draft?.[field]==="string" && !$(id).value.trim())$(id).value=data.draft[field];
 }
 $("test3-preview").click();
}
async function saveTest3Draft(){
 const booking=buildTest3().booking;
 const {data,error}=await db.functions.invoke("move-anybike-test3",{body:{action:"save_draft",booking}});
 if(error||!data?.saved)throw Error("Draft save did not complete");
}
let n=0;const timer=setInterval(async()=>{if(document.documentElement.classList.contains("admin-auth-pending")){if(++n>300)clearInterval(timer);return}clearInterval(timer);try{db=getAdminSupabaseClient();const {data,error}=await db.rpc("anybike_is_admin");if(error||data!==true)throw Error("Admin only");$("movetest").hidden=false;
$("test3-preview").onclick=()=>{
 const {booking,fields,issues}=buildTest3();
 test3Fields=issues.length?null:booking;test3Ready=!issues.length;
 $("test3-submit").disabled=!test3Ready||test3Locked;
 if(test3Locked){$("test3-output").textContent="TEST 3 ALREADY SUBMITTED — tracking 115984. Read-only status check available. Ready-date mapping is still unresolved.";return;}
 $("test3-output").textContent=(issues.length?("NOT READY FOR LIVE TEST:"+String.fromCharCode(10)+"- "+issues.join(String.fromCharCode(10)+"- ")+String.fromCharCode(10,10)):("ALL REQUIRED PREVIEW FIELDS COMPLETED — NOT SUBMITTED."+String.fromCharCode(10,10)))+"Preview of documented Move API form fields:"+String.fromCharCode(10)+JSON.stringify(fields,null,2)+String.fromCharCode(10,10)+"Move Admin must manually enter Freight Charge and check payer. Move uses text notifications, not email booking confirmations.";
};
$("test3-status").onclick=test3Status;
$("test3-submit").onclick=async()=>{
 if(!test3Ready||test3Locked||!test3Fields)return;
 const b=buildTest3();
 if(b.issues.length||JSON.stringify(b.booking)!==JSON.stringify(test3Fields)){test3Ready=false;$("test3-submit").disabled=true;$("test3-result").textContent="Details changed. Preview again before submitting.";return;}
 const message="Confirm ONE test shipment will be created in Move. Move staff must not dispatch or invoice it. Continue?";
 if(!window.confirm(message))return;
 const typed="CREATE ONE TEST 3 SHIPMENT";
 test3Locked=true;$("test3-submit").disabled=true;$("test3-result").textContent="Submitting Test 3 once. Do not refresh or retry.";
 try{
  const {data,error}=await db.functions.invoke("move-anybike-test3",{body:{action:"submit",booking:b.booking,confirmation:typed}});
  if(error)throw error;
  $("test3-result").textContent=JSON.stringify(data,null,2);
 }catch(e){$("test3-result").textContent="Submission outcome uncertain. Check Move before doing anything else. "+String(e.message||e);}
};
const selector=document.createElement("select");selector.setAttribute("aria-label","Test booking");selector.style.cssText="display:block;background:#303030;color:white;padding:10px;border:1px solid #666;margin:12px 0";selector.innerHTML='<option value="1">Test 1 — existing shipment (115977)</option><option value="2">Test 2 — existing shipment (115978; reconcile)</option>';$("movetest").insertBefore(selector,$("check"));selector.onchange=()=>{test=Number(selector.value);call("status")};$("check").onclick=()=>call("check");$("status").onclick=()=>call("status");$("submit").dataset.locked="yes";$("submit").disabled=true;$("submit").title="Both existing test shipments have already been created; do not submit again.";await call("status");await test3Status();try{await loadTest3Draft();}catch(e){$("test3-result").textContent=String(e.message||e)+" — details not overwritten.";}
for(const id of Object.values(draftInputIds)){
 $(id).addEventListener("change",async()=>{try{await saveTest3Draft();}catch(e){$("test3-result").textContent="Could not save Test 3 draft: "+String(e.message||e);}});
}
}catch(e){$("gate").textContent=e.message}},100)})();