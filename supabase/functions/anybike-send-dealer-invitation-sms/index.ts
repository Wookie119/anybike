import {createClient} from "npm:@supabase/supabase-js@2";
const origins=new Set(["https://www.anybike.co.uk","https://anybike.co.uk"]);
const send=(origin:string,data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store","access-control-allow-origin":origins.has(origin)?origin:"https://www.anybike.co.uk","access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"authorization,apikey,content-type,x-client-info",vary:"Origin"}});
function invitationText(type:string){
 return type==="both"
  ?"AnyBike invitation: Sell your motorcycle for free or join the UK motorcycle dealer network. Find out more: https://www.anybike.co.uk"
  :type==="private"
   ?"AnyBike invitation: Sell your motorcycle for free, with no obligation to accept an offer. Find out more: https://www.anybike.co.uk/sell-your-motorcycle.html"
   :"AnyBike invitation: UK motorcycle dealers can register free to explore trade opportunities. https://www.anybike.co.uk/uk-dealer-welcome.html";
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(req.method==="OPTIONS")return send(origin,{},200);
 if(req.method!=="POST"||!origins.has(origin))return send(origin,{success:false,error:"Invalid request"},403);
 try{
 const url=Deno.env.get("SUPABASE_URL")||"",raw=Deno.env.get("SUPABASE_SECRET_KEYS")||"";
 let secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(raw){try{secret=JSON.parse(raw).default||secret}catch{}}
 if(!secret)throw Error("Service unavailable");
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 const {data:{user},error:ue}=await db.auth.getUser(token);
 if(ue||!user)return send(origin,{success:false,error:"Please sign in as an administrator"},401);
 const {data:admin,error:ae}=await db.from("admin_users").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
 if(ae||!admin)return send(origin,{success:false,error:"Admin access required"},403);
 const payload=await req.json();
 if(payload.action==="preview"){
  const type=String(payload.invitation_type||"");
  if(!["dealer","private","both"].includes(type))return send(origin,{success:false,error:"Invalid invitation type"},400);
  return send(origin,{success:true,text:invitationText(type),not_sent:true});
 }

 const username=Deno.env.get("CLICKSEND_USERNAME")||"",apikey=Deno.env.get("CLICKSEND_API_KEY")||"";
 if(payload.action==="status")return send(origin,{success:true,configured:!!(username&&apikey)});
 if(payload.action==="send_test"){
  // Fixed owner-only mobile destination, never provided by the client.
  // Uses the exact same private invitation text and ClickSend provider
  // as customer SMS, without selecting or updating any contact.
  if(payload.invitation_type!=="private"||payload.confirm_send!==true)return send(origin,{success:false,error:"Confirm the private AnyBike SMS test"},400);
  if(!username||!apikey)return send(origin,{success:false,error:"SMS provider is not configured"},503);
  const recipient="+447772024763";
  const messageBody=invitationText("private");
  const since=new Date(Date.now()-10*60*1000).toISOString();
  const {data:previous,error:previousError}=await db.from("anybike_contact_invitation_sms_test_log").select("id,status,requested_at").gte("requested_at",since).in("status",["sending","submitted"]).limit(1);
  if(previousError)throw previousError;
  if(previous?.length)return send(origin,{success:false,error:"A test SMS has already been submitted in the last 10 minutes. Check your phone or provider log before retrying."},409);
  const {data:attempt,error:attemptError}=await db.from("anybike_contact_invitation_sms_test_log")
   .insert({sent_by:user.id,recipient,message_body:messageBody,status:"sending"}).select("id").single();
  if(attemptError||!attempt)throw attemptError||Error("Unable to record SMS test");
  try{
   const response=await fetch("https://rest.clicksend.com/v3/sms/send",{method:"POST",headers:{"authorization":"Basic "+btoa(username+":"+apikey),"content-type":"application/json"},body:JSON.stringify({messages:[{from:"AnyBike",source:"AnyBike-Invitation-Test",body:messageBody,to:recipient}]})});
   const result=await response.json().catch(()=>({}));
   const message=result?.data?.messages?.[0],status=String(message?.status||result?.response_code||"");
   const success=response.ok&&status==="SUCCESS";
   const messageId=String(message?.message_id||"")||null;
   await db.from("anybike_contact_invitation_sms_test_log")
    .update({status:success?"submitted":"failed",sent_at:success?new Date().toISOString():null,provider_message_id:messageId,error_message:success?null:String(message?.status||result?.response_msg||"SMS provider error")})
    .eq("id",attempt.id);
   return send(origin,success?{success:true,submitted:true,test:true,recipient,log_id:attempt.id,message_id:messageId,note:"Provider accepted the test; handset delivery not yet confirmed. No customer record changed."}:{success:false,error:String(message?.status||result?.response_msg||"Test SMS was rejected"),log_id:attempt.id},success?200:502);
  }catch(e){
   await db.from("anybike_contact_invitation_sms_test_log").update({status:"failed",error_message:String(e).slice(0,400)}).eq("id",attempt.id);
   throw e;
  }
 }

 if(!username||!apikey)return send(origin,{success:false,error:"SMS provider is not configured"},503);
 const id=Number(payload.contact_id);
 if(!Number.isSafeInteger(id)||id<1||payload.confirm_send!==true)return send(origin,{success:false,error:"Contact and send confirmation are required"},400);
 const invitationType=String(payload.invitation_type||"dealer");
 if(!["dealer","private","both"].includes(invitationType))return send(origin,{success:false,error:"Unsupported invitation type"},400);
 const {data:contact,error:ce}=await db.from("anybike_master_contacts").select("id,first_name,company,phone,sms_invite_selected,sms_marketing_permission,sms_permission_verified_at,personal_intro").eq("id",id).maybeSingle();
 if(ce||!contact)return send(origin,{success:false,error:"Contact not found"},404);
 if(!contact.sms_invite_selected||!contact.sms_permission_verified_at||String(contact.sms_marketing_permission||"").trim().length<12)return send(origin,{success:false,error:"Recorded SMS marketing permission is required before sending a text"},409);
 const phone=String(contact.phone||"").replace(/\s/g,"");
 if(!/^07\d{9}$/.test(phone))return send(origin,{success:false,error:"Contact requires a valid UK mobile"},400);
 const {data:recent,error:re}=await db.from("anybike_invitation_sms_log").select("id,requested_at,status").eq("contact_id",id).in("status",["sending","submitted"]).gte("requested_at",new Date(Date.now()-24*3600*1000).toISOString()).order("requested_at",{ascending:false}).limit(1);
 if(re)throw re;
 if(recent?.length&&!payload.force)return send(origin,{success:false,error:"An invitation was already submitted in the last 24 hours. Check the log before trying again."},409);
 // The actual provider message is generated on the server, not accepted as
 // arbitrary client text. Both is suitable for unclassified contacts and
 // never addresses recipients as dealership contacts without evidence.
 const text=invitationText(invitationType);
 const recipient="+44"+phone.substring(1);
 const {data:log,error:le}=await db.from("anybike_invitation_sms_log").insert({contact_id:id,recipient,message_body:text,sent_by:user.id}).select("id").single();
 if(le||!log)throw le||Error("Unable to record sending attempt");
 try{
 const response=await fetch("https://rest.clicksend.com/v3/sms/send",{method:"POST",headers:{"authorization":"Basic "+btoa(username+":"+apikey),"content-type":"application/json"},body:JSON.stringify({messages:[{from:"AnyBike",source:"AnyBike-Contact-Invitations",body:text,to:recipient}]})});
 const result=await response.json().catch(()=>({}));
 const message=result?.data?.messages?.[0];
 const providerStatus=String(message?.status||result?.response_code||"");
 const success=response.ok&&providerStatus==="SUCCESS";
 const providerId=String(message?.message_id||"")||null;
 await db.from("anybike_invitation_sms_log").update({status:success?"submitted":"failed",sent_at:success?new Date().toISOString():null,provider_message_id:providerId,error_message:success?null:String(message?.status||result?.response_msg||"Provider error")}).eq("id",log.id);
 return send(origin,success?{success:true,submitted:true,recipient,log_id:log.id,message_id:providerId}:{success:false,error:String(message?.status||result?.response_msg||"SMS failed"),log_id:log.id},success?200:502);
 }catch(e){await db.from("anybike_invitation_sms_log").update({status:"failed",error_message:String(e).slice(0,500)}).eq("id",log.id);throw e}
 }catch(e){return send(origin,{success:false,error:e instanceof Error?e.message:"SMS unavailable"},500)}
});