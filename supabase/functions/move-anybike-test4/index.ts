import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.49.8";
const root="https://app.movemotorcycles.co.uk/api";
const testKey="forza125-readydate-test4-20261120";
const sourceKey="forza125-complete-contacts-test-3-20261120";
const authKey="forza125-test4-one-time-authorization";
const cors={"access-control-allow-origin":"https://www.anybike.co.uk","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, apikey, x-client-info, content-type","access-control-max-age":"600"};
const respond=(o:Record<string,unknown>,status=200)=>new Response(JSON.stringify(o),{status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
const clean=(x:unknown)=>typeof x==="string"?x.trim():"";
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return respond({error:"POST required"},405);
 try{
  const token=req.headers.get("Authorization")||"";
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const user=createClient(url,anon,{global:{headers:{Authorization:token}}});
  const {data:identity,error:identityError}=await user.auth.getUser();
  if(identityError||!identity?.user)return respond({error:"Admin authentication required"},401);
  const {data:allowed,error:permissionError}=await user.rpc("anybike_is_admin");
  if(permissionError||allowed!==true)return respond({error:"Admin access required"},403);
  const body=await req.json().catch(()=>({}));
  if(body?.action==="status"){
   const db=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
   const {data:existing}=await db.from("anybike_move_test_submissions").select("state,external_shipment_id").eq("test_key",testKey).maybeSingle();
   return respond({success:true,test:4,submission:existing||null,submit_enabled:!existing});
  }
  if(body?.action!=="submit"||body?.confirmation!=="CREATE ONE TEST 4 SHIPMENT")return respond({error:"Explicit one-time confirmation required"},400);
  const db=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data:existing}=await db.from("anybike_move_test_submissions").select("state,external_shipment_id").eq("test_key",testKey).maybeSingle();
  if(existing)return respond({error:"Test4 already attempted. Never retry automatically.",state:existing.state,external_shipment_id:existing.external_shipment_id},409);
  const {data:source,error:draftErr}=await db.from("anybike_move_test_drafts").select("booking_data").eq("test_key",sourceKey).single();
  if(draftErr||!source)return respond({error:"Saved Test3 details unavailable"},503);
  const b=source.booking_data as Record<string,string>;
  if(b.ready_date!=="2026-12-25")return respond({error:"Date mismatch: booking must be 2026-12-25"},422);
  const required=["sender_email","receiver_email","sender_street_address","sender_city","sender_code","receiver_street_address","receiver_city","receiver_code"];
  if(required.some(x=>!clean(b[x])))return respond({error:"Missing saved contact details"},422);

  const {error:insertError}=await db.from("anybike_move_test_submissions").insert({test_key:testKey,state:"submitting",requested_by:identity.user.id});
  if(insertError)return respond({error:"Submission already in progress or unsafe to create",code:insertError.code},409);
  try{
   const email=Deno.env.get("MOVE_CUSTOMER_EMAIL")||"",password=Deno.env.get("MOVE_CUSTOMER_PASSWORD")||"";
   if(email.toLowerCase()!=="sales@anybike.co.uk"||!password)throw Error("Move account missing");
   const login=await fetch(root+"/account/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(14000)});
   const ld=await login.json();
   if(!login.ok||ld?.status!=="success"||!ld.access_token)throw Error("Move login failed");
   const h={Authorization:"Bearer "+ld.access_token,Accept:"application/json"};
   const identity=await fetch(root+"/account",{headers:h,signal:AbortSignal.timeout(12000)});
   const user=await identity.json();
   if(!identity.ok||user?.data?.user?.email?.toLowerCase()!==email.toLowerCase()||user?.data?.user?.role!=="customer")throw Error("Move account identity mismatch");
   const form=new FormData();
   const vals:Record<string,string>={
    sender_name:"James Mitchell",sender_phone:"07772024763",sender_email:clean(b.sender_email),
    sender_street_address:clean(b.sender_street_address),sender_city:clean(b.sender_city),sender_code:clean(b.sender_code),sender_country:"United Kingdom",
    receiver_name:"Daniel Carter",receiver_phone:"07949574299",receiver_email:clean(b.receiver_email),
    receiver_street_address:clean(b.receiver_street_address),receiver_city:clean(b.receiver_city),receiver_code:clean(b.receiver_code),receiver_country:"United Kingdom",
    "pname[]":"Honda Forza 125","pquantity[]":"1",
    "custom_field[11548]":"Honda","custom_field[11549]":"Forza 125","custom_field[11550]":"HON125R",
    "custom_field[11556]":"180.00","custom_field[11557]":"TEST 4 — DO NOT DISPATCH OR INVOICE. READY DATE 2026-12-25. Receiver pays GBP 180 including VAT.",
    "booking_date":"2026-12-25","ready_date":"2026-12-25",
    "type":"Motorcycle or Scooter","mode":"Up to 7 Working days from ready date",
    "payer":"receiver","charges":JSON.stringify([{name:"Freight Charge",value:180}]),
    "instructions":"TEST 4 ONLY - DO NOT DISPATCH OR INVOICE. Motorcycle ready and booking date 2026-12-25. Receiver pays GBP 180 incl VAT. Manual freight verification required."
   };
   for(const [k,v] of Object.entries(vals))form.set(k,v);
   const posted=await fetch(root+"/shipment/create",{method:"POST",headers:h,body:form,signal:AbortSignal.timeout(25000)});
   const response=await posted.json();
   const id=Number(response?.data);
   if(!posted.ok||response?.status!=="success"||!Number.isSafeInteger(id)||id<=0){
    await db.from("anybike_move_test_submissions").update({state:"review_required"}).eq("test_key",testKey);
    return respond({error:"Move did not confirm new shipment; do not retry",http_status:posted.status,attempt_locked:true},502);
   }
   await db.from("anybike_move_test_submissions").update({state:"confirmed",external_shipment_id:id}).eq("test_key",testKey);
   let sh:Record<string,unknown>={};
   try{
    const read=await fetch(root+"/shipment/id/"+id,{headers:h,signal:AbortSignal.timeout(12000)});
    const payload=await read.json();
    if(read.ok&&Number(payload?.data?.shipment?.id)===id)sh=payload.data.shipment;
   }catch{}
   const receivedDate=sh.booking_date??sh.ready_date??null;
   return respond({success:true,test:4,shipment_id:id,tracking_no:sh.tracking_no??null,
    submitted_booking_date:"2026-12-25",move_booking_date:receivedDate,
    date_readback_matches:receivedDate==="2026-12-25",
    type:sh.type??null,mode:sh.mode??null,payer:sh.payer??null,
    charges:Array.isArray(sh.charges)?sh.charges:[],
    status:sh.status??null,
    note:"Do not dispatch or invoice. Date must be checked in Move Admin if not in API response."});
  }catch{
   await db.from("anybike_move_test_submissions").update({state:"review_required"}).eq("test_key",testKey);
   return respond({error:"Move response uncertain, do not retry. Check Move Admin for duplicate.",attempt_locked:true},502);
  }
 }catch{return respond({error:"Test4 server error; check saved records before retry."},500)}
});