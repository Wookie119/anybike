import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const base="https://app.movemotorcycles.co.uk/api";
const key="forza125-complete-contacts-test-3-20261120";
const headers={"Access-Control-Allow-Origin":"https://www.anybike.co.uk","Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const answer=(o:unknown,status=200)=>new Response(JSON.stringify(o),{status,headers});
const str=(v:unknown)=>typeof v==="string"?v.trim():"";
const validEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=254;
const postcode=(v:string)=>/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(v.toUpperCase());
const date=(v:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+"T12:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return answer({error:"POST required"},405);
 try{
  const auth=req.headers.get("Authorization")||"";
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,role=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const user=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:u,error:ue}=await user.auth.getUser();
  if(ue||!u?.user)return answer({error:"Admin sign-in required"},401);
  const {data:allowed,error:ae}=await user.rpc("anybike_is_admin");
  if(ae||allowed!==true)return answer({error:"Admin only"},403);
  const db=createClient(url,role);
  const body=await req.json();
  if(!["status","check","submit","draft","save_draft"].includes(body?.action))return answer({error:"Invalid action"},400);
  // Private, admin-only persisted Test 3 form. Never embed customer emails in public JavaScript.
  const draftFields=["sender_email","receiver_email","sender_street_address","sender_city","sender_code","receiver_street_address","receiver_city","receiver_code","ready_date"];
  if(body.action==="draft"){
   const {data:d,error:e}=await db.from("anybike_move_test_drafts").select("booking_data").eq("test_key",key).maybeSingle();
   if(e)return answer({error:"Could not retrieve saved draft"},503);
   return answer({success:true,draft:d?.booking_data||{}});
  }
  if(body.action==="save_draft"){
   const input=body.booking;
   if(!input||typeof input!=="object"||Array.isArray(input))return answer({error:"Draft object required"},422);
   const clean:Record<string,string>={};
   for(const name of draftFields){
    const value=str(input[name]);
    if(value.length>254)return answer({error:"Draft field too long: "+name},422);
    clean[name]=value;
   }
   const {error:e}=await db.from("anybike_move_test_drafts").upsert({test_key:key,booking_data:clean,updated_by:u.user.id,updated_at:new Date().toISOString()},{onConflict:"test_key"});
   if(e)return answer({error:"Draft not saved"},503);
   return answer({success:true,saved:true});
  }
  const {data:existing,error:readError}=await db.from("anybike_move_test_submissions").select("state,external_shipment_id").eq("test_key",key).maybeSingle();
  if(readError)return answer({error:"Unable to verify duplicate guard"},503);
  if(body.action==="status"){
   if(!existing)return answer({success:true,test:3,submission:null,submit_enabled:true,verification:"not_submitted",ready_date_mapping:"unverified"});
   if(!existing.external_shipment_id){
    // Test 3 reached Move (tracking 115984), but its create response timed out or was not parsed.
    // Reconcile by read-only lookup; never create another shipment here.
    try{
     const email=Deno.env.get("MOVE_CUSTOMER_EMAIL")||"",password=Deno.env.get("MOVE_CUSTOMER_PASSWORD")||"";
     if(email.toLowerCase()!=="sales@anybike.co.uk"||!password)throw Error("credentials");
     const lr=await fetch(base+"/account/login",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(12000)});
     const ld=await lr.json();
     if(!lr.ok||ld?.status!=="success"||typeof ld.access_token!=="string")throw Error("login");
     const rr=await fetch(base+"/shipment/tracking/115984",{headers:{Authorization:"Bearer "+ld.access_token,Accept:"application/json"},signal:AbortSignal.timeout(12000)});
     const jd=await rr.json(), sh=jd?.data?.shipment, shipmentId=Number(sh?.id);
     if(!rr.ok||jd?.status!=="success"||String(sh?.tracking_no)!=="115984"||!Number.isSafeInteger(shipmentId)||shipmentId<=0)throw Error("tracking verification");
     const sender=String(sh?.sender_name??sh?.sender?.name??"").toLowerCase().trim();
     const receiver=String(sh?.receiver_name??sh?.receiver?.name??"").toLowerCase().trim();
     if(sender && sender!=="james mitchell")throw Error("sender mismatch");
     if(receiver && receiver!=="daniel carter")throw Error("receiver mismatch");
     const {data:updated,error:upError}=await db.from("anybike_move_test_submissions").update({state:"confirmed",external_shipment_id:shipmentId}).eq("test_key",key).eq("state","review_required").is("external_shipment_id",null).select("state,external_shipment_id").maybeSingle();
     if(upError||!updated)throw Error("guard reconciliation");
     return answer({success:true,test:3,submission:updated,submit_enabled:false,tracking_no:"115984",
      verification:"existing_move_shipment_reconciled",move_ready_date:sh.ready_date??sh.vehicle_ready_date??null,
      submitted_ready_date:"2026-12-25",ready_date_verified:sh.ready_date==="2026-12-25"||sh.vehicle_ready_date==="2026-12-25",
      scheduling_mapping:"NOT VERIFIED — Move booking date shown in admin is 2026-11-20; do not dispatch based on it.",
      action:"No new booking needed. Confirm supported scheduling/booking date field with Move."});
    }catch{
     return answer({success:true,test:3,submission:existing,submit_enabled:false,verification:"read_only_reconciliation_unavailable",tracking_no:"115984",ready_date_mapping:"unverified"});
    }
   }
   const id=Number(existing.external_shipment_id);
   if(!Number.isSafeInteger(id)||id<=0)return answer({success:true,test:3,submission:existing,submit_enabled:false,verification:"invalid_internal_id"});
   try{
    const email=Deno.env.get("MOVE_CUSTOMER_EMAIL")||"",password=Deno.env.get("MOVE_CUSTOMER_PASSWORD")||"";
    if(email.toLowerCase()!=="sales@anybike.co.uk"||!password)throw Error("credentials");
    const login=await fetch(base+"/account/login",{
     method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},
     body:JSON.stringify({email,password}),signal:AbortSignal.timeout(12000)
    });
    const ld=await login.json();
    if(!login.ok||ld?.status!=="success"||typeof ld.access_token!=="string")throw Error("login");
    const read=await fetch(base+"/shipment/id/"+id,{
     headers:{Authorization:"Bearer "+ld.access_token,Accept:"application/json"},
     signal:AbortSignal.timeout(12000)
    });
    const j=await read.json(),sh=j?.data?.shipment;
    if(!read.ok||j?.status!=="success"||Number(sh?.id)!==id)
     return answer({success:true,test:3,submission:existing,submit_enabled:false,verification:"move_readback_failed"});
    // Only fields actually documented in response and returned by Logxa are reported.
    // Never infer that an absent field was successfully stored in Move.
    const info:Record<string,unknown>={
     shipment_id:id,
     tracking_no:sh.tracking_no??null,
     status:sh.status??null,
     charges:Array.isArray(sh.charges)?sh.charges:[],
     payer:sh.payer??null,
     ready_date:sh.ready_date??sh.vehicle_ready_date??null,
     source_fields:{
      sender_email:sh.sender_email??sh.sender?.email??null,
      receiver_email:sh.receiver_email??sh.receiver?.email??null,
      sender_phone:sh.sender_phone??sh.sender?.phone??null,
      receiver_phone:sh.receiver_phone??sh.receiver?.phone??null
     }
    };
    return answer({success:true,test:3,submission:existing,submit_enabled:false,verification:"move_readback_confirmed",move:info,
      note:"Null means the customer readback did not expose a value, not necessarily that Move did not save it. Confirm in the Move portal."});
   }catch{
    return answer({success:true,test:3,submission:existing,submit_enabled:false,verification:"move_readback_unavailable",note:"Do not retry submission; inspect Move portal."});
   }
  }
  if(existing)return answer({success:true,test:3,submission:existing,submit_enabled:false,message:"Already attempted: do not submit again. Check Move portal."});
  const b=body?.booking||{};
  const fields=["sender_email","receiver_email","sender_street_address","sender_city","sender_code","receiver_street_address","receiver_city","receiver_code","ready_date"];
  const v:Record<string,string>={};
  for(const f of fields)v[f]=str(b[f]);
  const errors:string[]=[];
  if(!validEmail(v.sender_email))errors.push("Sender email required");
  if(!validEmail(v.receiver_email))errors.push("Receiver email required");
  for(const f of ["sender_street_address","sender_city","receiver_street_address","receiver_city"])if(!v[f]||v[f].length>180)errors.push(f+" required (max 180)");
  if(!postcode(v.sender_code)||v.sender_code.replace(/\s/g,"").toUpperCase()!=="OX447RW")errors.push("Collection postcode must be OX44 7RW");
  if(!postcode(v.receiver_code)||v.receiver_code.replace(/\s/g,"").toUpperCase()!=="TW135EL")errors.push("Delivery postcode must be TW13 5EL");
  if(!date(v.ready_date))errors.push("Valid ready date required");
  if(errors.length)return answer({error:"Invalid test fields",details:errors},422);
  const dryRun={...v,sender_name:"James Mitchell",sender_phone:"07772024763",receiver_name:"Daniel Carter",receiver_phone:"07949574299",product:"Honda Forza 125",registration:"HON125R",agreed_price:"180",payer_note:"Receiver pays — Move admin to enter freight charge manually"};
  if(body.action==="check")return answer({success:true,test:3,fields:dryRun,verified:false,warning:"Dry run only, no Move shipment submitted"});
  // Critical transport scheduling date: reject new shipments unless this tenant's
  // real destination field has been verified by Move. Sending an unknown ready_date
  // parameter or instructions-only is NOT safe for dispatch scheduling.
  const confirmedReadyField=str(Deno.env.get("MOVE_VERIFIED_READY_DATE_FIELD"));
  if(!confirmedReadyField)return answer({error:"Move Booking Date mapping not verified. No shipment will be created.",ready_date:v.ready_date,required_action:"Confirm the exact parameter for Move Booking Date; configure MOVE_VERIFIED_READY_DATE_FIELD only after verifying readback."},422);
  if(!/^(booking_date|custom_field\[\d+\])$/.test(confirmedReadyField))return answer({error:"Ready-date configuration invalid; supported field id must be verified by Move."},503);
  if(body.confirmation!=="CREATE ONE TEST 3 SHIPMENT")return answer({error:"Explicit Test 3 confirmation required"},400);
  const {error:guard}=await db.from("anybike_move_test_submissions").insert({test_key:key,state:"submitting",requested_by:u.user.id});
  if(guard)return answer({error:"A prior or concurrent submission may exist. Check status; do not retry."},409);
  // A submission attempt is now permanently guarded, including on timeout.
  try{
   const email=Deno.env.get("MOVE_CUSTOMER_EMAIL")||"",password=Deno.env.get("MOVE_CUSTOMER_PASSWORD")||"";
   if(email.toLowerCase()!=="sales@anybike.co.uk"||!password)throw Error("Move test customer credentials missing");
   const login=await fetch(base+"/account/login",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(15000)});
   const ld=await login.json();if(!login.ok||ld?.status!=="success"||typeof ld.access_token!=="string")throw Error("Move login failed");
   const bearer={Authorization:"Bearer "+ld.access_token,Accept:"application/json"};
   const acc=await fetch(base+"/account",{headers:bearer,signal:AbortSignal.timeout(15000)});
   const identity=await acc.json();
   if(!acc.ok||identity?.status!=="success"||String(identity?.data?.user?.email||"").toLowerCase()!==email.toLowerCase()||String(identity?.data?.user?.role).toLowerCase()!=="customer")throw Error("Move account identity mismatch");
   const form=new FormData();
   const data:Record<string,string>={
    sender_name:"James Mitchell",sender_phone:"07772024763",sender_email:v.sender_email,sender_street_address:v.sender_street_address,sender_city:v.sender_city,sender_code:v.sender_code,sender_country:"United Kingdom",
    receiver_name:"Daniel Carter",receiver_phone:"07949574299",receiver_email:v.receiver_email,receiver_street_address:v.receiver_street_address,receiver_city:v.receiver_city,receiver_code:v.receiver_code,receiver_country:"United Kingdom",
    "pname[]":"Honda Forza 125","pquantity[]":"1",
    type:"Motorcycle or Scooter",mode:"Up to 7 Working days from ready date",
    "custom_field[11548]":"Honda","custom_field[11549]":"Forza 125","custom_field[11550]":"HON125R","custom_field[11556]":"180",
    "custom_field[11557]":"TEST 3 — DO NOT DISPATCH OR INVOICE. AGREED PRICE £180 incl VAT. Receiver is invoice payer. Move Admin must manually set Freight Charge and invoice payer. READY DATE "+v.ready_date,
    instructions:"API TEST 3 ONLY — DO NOT DISPATCH OR INVOICE. Receiver pays transport £180 including VAT. Move Admin review freight charge. READY DATE "+v.ready_date
   };
   // Send the source motorcycle ready date as the Move Booking Date only via
   // a deliberately verified tenant field. Never substitute request time.
   data[confirmedReadyField]=v.ready_date;
   // Intentionally NOT sending undocumented payer and charges wire formats.
   for(const [k,value] of Object.entries(data))form.set(k,value);
   const posted=await fetch(base+"/shipment/create",{method:"POST",headers:bearer,body:form,signal:AbortSignal.timeout(25000)});
   const response=await posted.json();
   const id=Number(response?.data);
   if(!posted.ok||response?.status!=="success"||!Number.isSafeInteger(id)||id<=0){
    await db.from("anybike_move_test_submissions").update({state:"review_required"}).eq("test_key",key);
    return answer({error:"No confirmed shipment ID. Check Move before retrying; Test 3 is locked.",http_status:posted.status},502);
   }
   const {error:save}=await db.from("anybike_move_test_submissions").update({state:"confirmed",external_shipment_id:id}).eq("test_key",key);
   if(save)return answer({success:true,shipment_id:id,warning:"Shipment created but local guard update failed. Do not retry."});
   try{
    const read=await fetch(base+"/shipment/id/"+id,{headers:bearer,signal:AbortSignal.timeout(12000)});
    const json=await read.json(),s=json?.data?.shipment;
    const returnedBookingDate=str(s?.booking_date??s?.bookingDate);
    const dateMatches=read.ok&&Number(s?.id)===id&&returnedBookingDate===v.ready_date;
    return answer({success:true,shipment_id:id,tracking_no:read.ok&&Number(s?.id)===id?s.tracking_no:null,
      details_readback_confirmed:read.ok&&Number(s?.id)===id,
      move_booking_date:returnedBookingDate||null,
      requested_booking_date:v.ready_date,booking_date_verified:dateMatches,
      scheduling_status:dateMatches?"verified":"NEEDS MOVE ADMIN VERIFICATION — DATE NOT CONFIRMED",
      manual_freight_charge_required:true,do_not_dispatch:true});
   }catch{return answer({success:true,shipment_id:id,details_readback_confirmed:false,manual_freight_charge_required:true,do_not_dispatch:true});}
  }catch{
   await db.from("anybike_move_test_submissions").update({state:"review_required"}).eq("test_key",key);
   return answer({error:"Test 3 result uncertain or failed. Do not submit again; check Move first.",submission_locked:true},502);
  }
 }catch{return answer({error:"Test 3 request failed without booking confirmation"},400);}
});
