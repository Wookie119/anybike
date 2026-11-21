import {createClient} from "npm:@supabase/supabase-js@2";

const allowed=new Set(["https://www.anybike.co.uk","https://anybike.co.uk"]);
function reply(origin:string,body:unknown,status=200){
 return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store","access-control-allow-origin":allowed.has(origin)?origin:"https://www.anybike.co.uk","access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"authorization,apikey,content-type,x-client-info","vary":"Origin"}});
}
const esc=(x:unknown)=>String(x??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]!));
const urls={owner:"https://www.anybike.co.uk/sell-your-motorcycle.html",dealer:"https://www.anybike.co.uk/uk-dealer-welcome.html"};
// Match the existing branded auction-email attachment: inline CID rather
// than a remotely hosted logo that clients may block in dark mode.
async function invitationLogo(){
 const res=await fetch("https://raw.githubusercontent.com/Wookie119/anybike/main/anybike-logo-new.jpg",{signal:AbortSignal.timeout(9000)});
 if(!res.ok)throw Error("Official AnyBike logo unavailable — no email sent");
 const bytes=new Uint8Array(await res.arrayBuffer());
 const jpg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const png=bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
 if(bytes.length<1000||bytes.length>2000000||(!jpg&&!png))throw Error("Invalid AnyBike logo — no email sent");
 let binary="";
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return [{filename:png?"anybike-logo.png":"anybike-logo.jpg",content:btoa(binary),content_type:png?"image/png":"image/jpeg",content_id:"anybike-invitation-logo"}];
}
function button(url:string,label:string){
 return "<table role='presentation' cellpadding='0' cellspacing='0' border='0' style='margin:15px 0 22px'><tr><td bgcolor='#ed1c24' style='background:#ed1c24;border-radius:5px'><a href='"+url+"' style='display:inline-block;padding:14px 20px;font:bold 16px Arial,Helvetica,sans-serif;text-decoration:none;color:#ffffff;background:#ed1c24;border-radius:5px'>"+esc(label)+" &rarr;</a></td></tr></table>";
}
function content(type:"dealer"|"private"|"both",name:string){
 const greeting=name&&name.length<35?"Hello "+esc(name)+",":"Hello,";
 const privateBody="<p>Did you know you can sell your motorcycle through AnyBike for free?</p>"+
  "<p>Whether you are thinking of changing bikes or simply want to see what offers are available, AnyBike gives private motorcycle owners a way to submit their motorcycle details for consideration by motorcycle trade buyers. Offers are not guaranteed, and you remain in control of whether to accept one.</p>"+
  "<p>Find out how to sell your motorcycle for free:</p>"+button(urls.owner,"Sell your motorcycle free")+
  "<p>There is no charge to submit your motorcycle to AnyBike.</p>";
 const dealerBody="<p>We would like to invite your dealership to join AnyBike, a UK motorcycle trade network. Registered and approved dealers can explore suitable trade opportunities and submit confidential offers on motorcycles.</p>"+
  "<p>You can learn more and register here:</p>"+button(urls.dealer,"Register with AnyBike")+
  "<p>Registration is free. Access to restricted trade services is subject to AnyBike verification and approval.</p>";
 const bothBody="<p>We would like to introduce you to AnyBike. Whether you own a motorcycle or work in the motorcycle trade, there is something here for you.</p>"+
  "<h2 style='font-size:18px'>For motorcycle owners</h2><p>You can submit your motorcycle to AnyBike for sale completely free, with no obligation to accept an offer.</p>"+button(urls.owner,"Sell your motorcycle free")+
  "<h2 style='font-size:18px'>For motorcycle dealers</h2><p>You can register free for the AnyBike UK motorcycle trade network. Once approved, you can explore trade opportunities and submit confidential offers.</p>"+button(urls.dealer,"Join AnyBike trade network");
 const body=type==="both"?bothBody:type==="private"?privateBody:dealerBody;
 const subjects={dealer:"AnyBike invitation — UK motorcycle dealers",private:"AnyBike invitation — sell your motorcycle free",both:"AnyBike invitation — motorcycles for owners and dealers"};
 const plain="AnyBike invitation\n\n"+(type!=="dealer"?"Sell your motorcycle for free: "+urls.owner+"\n\n":"")+(type!=="private"?"Motorcycle dealers: register free for trade opportunities: "+urls.dealer+"\n\n":"")+"Kind regards,\nThe AnyBike Team";
 const html="<!doctype html><html><body style='background:#f1f1f1;padding:14px 8px;font-family:Arial,Helvetica,sans-serif;color:#202020'><table role='presentation' align='center' cellpadding='0' cellspacing='0' width='660' style='width:100%;max-width:660px;border-collapse:collapse;background:#ffffff;border-top:5px solid #ed1c24'><tr><td style='padding:24px 28px'><div style='background:#fff;text-align:center;padding:6px 0 14px'><img src='cid:anybike-invitation-logo' alt='AnyBike motorcycle logo' width='280' style='display:block;width:280px;max-width:95%;height:auto;border:0;margin:0 auto'></div><h1 style='font-size:23px;margin:0 0 20px;color:#111'>AnyBike invitation</h1><p>"+greeting+"</p>"+body+"<p style='margin-top:24px'>Kind regards,<br>The AnyBike Team</p><p style='font-size:12px;color:#666;margin-top:24px'>AnyBike.co.uk &middot; To stop receiving invitations, reply to sales@anybike.co.uk with 'unsubscribe'.</p></td></tr></table></body></html>";
 return {subject:subjects[type],html,plain};
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(req.method==="OPTIONS")return reply(origin,{});
 if(req.method!=="POST"||!allowed.has(origin))return reply(origin,{success:false,error:"Invalid request origin or method"},403);
 try{
  const raw=Deno.env.get("SUPABASE_SECRET_KEYS")||"";
  let key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(raw)try{key=JSON.parse(raw).default||key}catch{}
  const url=Deno.env.get("SUPABASE_URL")||"",resend=Deno.env.get("RESEND_API_KEY")||"";
  if(!key||!url||!resend)return reply(origin,{success:false,error:"AnyBike email service is not configured"},503);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user)return reply(origin,{success:false,error:"Please sign in as an administrator"},401);
  const {data:admin,error:adminError}=await db.from("admin_users").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
  if(adminError||!admin)return reply(origin,{success:false,error:"Administrator access required"},403);
  const payload=await req.json().catch(()=>({}));
  if(payload.action==="preview"){
   const type=String(payload.invitation_type||"");
   if(!["dealer","private","both"].includes(type))return reply(origin,{success:false,error:"Invalid invitation type"},400);
   const letter=content(type,"");
   // Same subject and HTML renderer as real sends. A customer send may add a
   // recipient greeting; the preview uses the generic greeting.
   return reply(origin,{success:true,subject:letter.subject,html:letter.html,plain:letter.plain,logo_preview_url:"https://www.anybike.co.uk/anybike-logo-new.jpg",personalized_greeting:true,not_sent:true});
  }
  // Admin-only preview, delivered ONLY to the fixed owner test inbox.
  // Never reads/changes customer approval, contact or invitation log.
  if(payload.action==="send_test"){
   const type=String(payload.invitation_type||"");
   if(!["dealer","private","both"].includes(type)||payload.confirm_send!==true)return reply(origin,{success:false,error:"Confirm a valid invitation type for the test"},400);
   const testTo="mocp@hotmail.co.uk";
   const letter=content(type,"");
   const logo=await invitationLogo();
   const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resend,"Content-Type":"application/json"},body:JSON.stringify({from:"AnyBike <sales@anybike.co.uk>",to:[testTo],subject:"[TEST] "+letter.subject,html:letter.html,text:letter.plain,attachments:logo,reply_to:"sales@anybike.co.uk",tags:[{name:"campaign",value:"contact-invitation-test"}]})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result?.id)return reply(origin,{success:false,error:"Test email provider error: "+String(result?.message||response.status).slice(0,200)},502);
   return reply(origin,{success:true,submitted:true,test:true,recipient:testTo,message_id:String(result.id),note:"Provider accepted test email; inbox delivery not yet verified. No customer record changed."});
  }
  const id=Number(payload.contact_id),type=String(payload.invitation_type||"");
  if(!Number.isSafeInteger(id)||id<1||!["dealer","private","both"].includes(type)||payload.confirm_send!==true)return reply(origin,{success:false,error:"Choose a valid contact, invitation type and confirm sending"},400);
  const {data:contact,error:contactError}=await db.from("anybike_master_contacts").select("id,first_name,company,email,approved_for_invitation,marketing_permission,email_invite_sent_at").eq("id",id).maybeSingle();
  if(contactError||!contact)return reply(origin,{success:false,error:"Contact not found"},404);
  const address=String(contact.email||"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)||address.startsWith("unknown@")||address.endsWith("@app.movemotorcycles.co.uk"))return reply(origin,{success:false,error:"Contact does not have a usable email address"},400);
  if(!contact.approved_for_invitation||!String(contact.marketing_permission||"").trim())return reply(origin,{success:false,error:"Recorded invitation permission is required"},409);
  if(contact.email_invite_sent_at)return reply(origin,{success:false,error:"An email invitation has already been recorded for this contact"},409);
  const {data:registered,error:regError}=await db.from("customer_profiles").select("id").ilike("email",address).limit(1);
  if(regError)return reply(origin,{success:false,error:"Could not verify registration status"},503);
  if(registered?.length)return reply(origin,{success:false,error:"Contact is already registered with AnyBike"},409);
  // Atomic single-contact claim prevents a second request from sending again.
  const {data:claim,error:claimError}=await db.from("anybike_contact_invitation_email_log").insert({contact_id:id,recipient:address,invitation_type:type,status:"sending",admin_id:user.id}).select("id").single();
  if(claimError||!claim)return reply(origin,{success:false,error:"A send attempt has already been recorded for this contact. Check email history before retrying."},409);
  const name=String(contact.first_name||"").trim();
  const safeName=name.toLowerCase()===String(contact.company||"").trim().toLowerCase()?"":name;
  const letter=content(type,safeName);
  try{
   const logo=await invitationLogo();
   const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resend,"Content-Type":"application/json"},body:JSON.stringify({from:"AnyBike <sales@anybike.co.uk>",to:[address],subject:letter.subject,html:letter.html,text:letter.plain,attachments:logo,reply_to:"sales@anybike.co.uk",tags:[{name:"campaign",value:"contact-invitation"}]})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result?.id)throw Error(String(result?.message||"Email provider did not accept this message").slice(0,250));
   await db.from("anybike_contact_invitation_email_log").update({status:"submitted",provider_id:String(result.id),submitted_at:new Date().toISOString()}).eq("id",claim.id);
   const {data:updated,error:updateError}=await db.from("anybike_master_contacts").update({email_invite_sent_at:new Date().toISOString(),email_invite_confirmation:"AnyBike Resend accepted "+String(result.id),approved_for_invitation:false}).eq("id",id).is("email_invite_sent_at",null).select("id,email_invite_sent_at,approved_for_invitation").maybeSingle();
   return reply(origin,{success:true,submitted:true,message_id:String(result.id),recipient:address,recorded:!updateError&&!!updated,warning:updateError?"Email was accepted, but contact history needs reconciliation":null});
  }catch(error){
   await db.from("anybike_contact_invitation_email_log").update({status:"failed",error_message:String(error).slice(0,500)}).eq("id",claim.id);
   return reply(origin,{success:false,error:"Email not confirmed as submitted: "+String(error).slice(0,250)+". Check email history before retrying."},502);
  }
 }catch(error){return reply(origin,{success:false,error:"Unable to prepare the email invitation: "+String(error).slice(0,260)},500)}
});
