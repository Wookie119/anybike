(()=>{"use strict";const $=x=>document.getElementById(x);let db;let test3Ready=false,test3Locked=true,test3Fields=null;
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
 $("test3-result").textContent="Checking existing Move shipment 115984…";
 try{
  const {data,error}=await db.functions.invoke("move-anybike-test3",{body:{action:"status"}});
  if(error)throw error;
  $("test3-result").textContent=JSON.stringify(data,null,2);
  const tracking=data?.move?.tracking_no||data?.tracking_no||"115984";
  const ready=data?.move?.ready_date;
  $("test3-output").textContent="EXISTING TEST BOOKING "+tracking+" — DO NOT DISPATCH OR INVOICE.\n"+
   (ready?"Move ready-date API value: "+ready:"Motorcycle ready date 25/12/2026 not confirmed in Move's scheduling fields.")+
   "\nThis page cannot submit another booking.";
 }catch(e){
  $("test3-result").textContent="Status check failed: "+String(e.message||e);
 }
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
 const {fields,issues}=buildTest3();
 $("test3-output").textContent=(issues.length?"Saved fields need checking:\n- "+issues.join("\n- ")+"\n\n":"SAVED TEST 3 DETAILS — EXISTING SHIPMENT 115984.\n\n")+
 "Test 3 fields originally submitted:\n"+JSON.stringify(fields,null,2)+
 "\n\nThe ready date was supplied, but Move's Booking Date still showed the creation date. No new booking can be created from this page.";
};
$("test3-status").onclick=test3Status;
async function checkTest4(){
 $("test4-result").textContent="Checking Test 4…";
 try{
  const {data,error}=await db.functions.invoke("move-anybike-test4",{body:{action:"status"}});
  if(error)throw error;
  if(data?.submission){
   $("test4-submit").disabled=true;
   $("test4-result").textContent="Test 4 already attempted. Do not submit again.\n"+JSON.stringify(data,null,2);
  }else{
   $("test4-submit").disabled=false;
   $("test4-result").textContent="Ready for ONE new booking. Saved Test 3 fields will be reused, with booking date 25/12/2026.\n"+JSON.stringify(data,null,2);
  }
 }catch(e){
  $("test4-submit").disabled=true;
  $("test4-result").textContent="Unable to check previous Test 4 submissions. Booking locked. "+String(e.message||e);
 }
}
$("test4-submit").disabled=true;
$("test4-status").onclick=checkTest4;
$("test4-submit").onclick=async()=>{
 if($("test4-submit").disabled)return;
 if(!window.confirm("Create ONE additional REAL Move test shipment with BOOKING DATE 25/12/2026, using saved Test 3 details? Do not dispatch or invoice."))return;
 $("test4-submit").disabled=true;
 $("test4-result").textContent="Submitting ONE booking; no automatic retries…";
 try{
  const {data,error}=await db.functions.invoke("move-anybike-test4",{body:{action:"submit",confirmation:"CREATE ONE TEST 4 SHIPMENT"}});
  if(error)throw error;
  $("test4-result").textContent=JSON.stringify(data,null,2)+"\nCheck the new Move booking record for Booking Date 25/12/2026. Do not dispatch or invoice.";
 }catch(e){
  $("test4-result").textContent="Submission result uncertain. DO NOT retry. Inspect Move shipments first. "+String(e.message||e);
 }
};
await checkTest4();

await test3Status();try{await loadTest3Draft();}catch(e){$("test3-result").textContent=String(e.message||e)+" — details not overwritten.";}
for(const id of Object.values(draftInputIds)){
 $(id).addEventListener("change",async()=>{try{await saveTest3Draft();}catch(e){$("test3-result").textContent="Could not save Test 3 draft: "+String(e.message||e);}});
}
}catch(e){$("gate").textContent=e.message}},100)})();