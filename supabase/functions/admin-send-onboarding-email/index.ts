import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins=new Set(["https://www.anybike.co.uk","https://anybike.co.uk"]);
function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  return {
    "Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"https://www.anybike.co.uk",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors(req),"Content-Type":"application/json"}});
}
function esc(v:string){
  return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function tidyGivenName(value:string){
  const v=String(value||"").trim().toLocaleLowerCase("en-GB");
  return v.replace(/(^|[-'’])([a-zà-öø-ÿ])/g,(_m,p1,p2)=>p1+p2.toLocaleUpperCase("en-GB"));
}
function preferredFirstName(fullName:string){
  const parts=String(fullName||"").trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return "there";
  const first=parts[0];
  const second=parts[1]||"";
  const firstLooksSurnameFirst=parts.length>1 &&
    first===first.toLocaleUpperCase("en-GB") &&
    first!==first.toLocaleLowerCase("en-GB") &&
    /[a-zà-öø-ÿ]/.test(second);
  return tidyGivenName(firstLooksSurnameFirst?second:first);
}

function serviceClient(){
  const secretsRaw=Deno.env.get("SUPABASE_SECRET_KEYS");
  let secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(secretsRaw){try{const parsed=JSON.parse(secretsRaw);secret=parsed.default||secret;}catch{}}
  if(!secret)throw new Error("Server credential unavailable");
  return createClient(Deno.env.get("SUPABASE_URL")!,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{success:false,error:"Method not allowed"},405);
  try{
    const authHeader=req.headers.get("Authorization")||"";
    const accessToken=authHeader.replace(/^Bearer\s+/i,"").trim();
    if(!accessToken)return json(req,{success:false,error:"Admin authentication required"},401);

    const supabase=serviceClient();
    const {data:{user},error:userError}=await supabase.auth.getUser(accessToken);
    if(userError||!user)return json(req,{success:false,error:"Admin authentication required"},401);

    const {data:admin,error:adminError}=await supabase.from("admin_users")
      .select("user_id,active").eq("user_id",user.id).eq("active",true).maybeSingle();
    if(adminError)throw adminError;
    if(!admin)return json(req,{success:false,error:"Admin access required"},403);

    const body=await req.json().catch(()=>({}));
    const userId=String(body?.user_id||"").trim();
    const threadId=Number(body?.thread_id||0);
    const linkPath=String(body?.link||"/customer-dashboard.html").trim();
    const title=String(body?.title||"Complete your AnyBike setup").trim();
    if(!userId||!threadId)return json(req,{success:false,error:"Customer and message thread are required"},400);

    const {data:target,error:targetError}=await supabase.auth.admin.getUserById(userId);
    if(targetError||!target?.user)return json(req,{success:false,error:"Customer account not found"},404);

    const {data:thread,error:threadError}=await supabase.from("message_centre_threads")
      .select("id,customer_id,customer_name,customer_email,last_message")
      .eq("id",threadId).eq("customer_id",userId).maybeSingle();
    if(threadError)throw threadError;
    if(!thread)return json(req,{success:false,error:"Onboarding message thread not found"},404);

    const email=String(thread.customer_email||target.user.email||"").trim();
    if(!email)return json(req,{success:false,error:"Customer email is missing"},400);

    const customerName=String(thread.customer_name||target.user.user_metadata?.full_name||"").trim();
    const firstName=preferredFirstName(customerName);
    const message=String(thread.last_message||"Please continue your AnyBike account setup.").trim();

    let returnPath=linkPath;
    if(returnPath.startsWith("http")){
      try{
        const parsed=new URL(returnPath);
        returnPath=parsed.pathname+parsed.search+parsed.hash;
      }catch{
        returnPath="/customer-profile.html";
      }
    }
    if(!returnPath.startsWith("/") || returnPath.startsWith("//") || returnPath.toLowerCase().includes("admin-")){
      returnPath="/customer-profile.html";
    }

    const {data:setupLink,error:setupLinkError}=await supabase
      .from("customer_setup_links")
      .insert({customer_id:userId,return_path:returnPath,created_by:user.id})
      .select("token,return_path")
      .single();
    if(setupLinkError||!setupLink?.token)throw setupLinkError||new Error("Could not create protected setup link");

    const loginParams=new URLSearchParams();
    loginParams.set("setup",String(setupLink.token));
    loginParams.set("return",String(setupLink.return_path||returnPath));
    const setupUrl="https://www.anybike.co.uk/customer-login.html?"+loginParams.toString();

    const resendApiKey=Deno.env.get("RESEND_API_KEY")||"";
    if(!resendApiKey)return json(req,{success:false,error:"Email service is not configured"},503);

    const html=`<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#111">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f4">
<tr><td align="center" style="padding:30px 15px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:660px;background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden">
<tr><td align="center" style="padding:25px 28px 18px"><img src="https://www.anybike.co.uk/assets/Anybike-email-logo-white.png" alt="AnyBike" width="320" style="display:block;width:100%;max-width:320px;height:auto;border:0"></td></tr>
<tr><td style="height:4px;background:#cc1118"></td></tr>
<tr><td style="padding:32px 36px 36px">
<div style="font-size:12px;font-weight:700;letter-spacing:1.4px;color:#cc1118;text-transform:uppercase;margin-bottom:10px">Account Setup</div>
<h1 style="margin:0 0 20px;font-size:27px;line-height:1.25;color:#111">${esc(title)}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6">Hi ${esc(firstName)},</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.65">${esc(message)}</p>
<p style="margin:0 0 28px"><a href="${esc(setupUrl)}" style="display:inline-block;background:#cc1118;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:7px">Continue Your AnyBike Setup</a></p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f7f7;border-radius:8px"><tr><td style="padding:15px 17px;font-size:13px;line-height:1.6;color:#555">This email relates to the AnyBike account you registered. If you need help completing your details, sign in to My AnyBike and reply through Message Centre.</td></tr></table>
</td></tr>
<tr><td style="padding:21px 36px;background:#111;color:#fff"><div style="font-size:15px;font-weight:700">AnyBike.co.uk</div><div style="font-size:12px;line-height:1.6;color:#bbb;margin-top:5px">Motorcycle sourcing, trade and export.</div></td></tr>
</table>
</td></tr></table>
</body></html>`;

    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{Authorization:`Bearer ${resendApiKey}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        from:"AnyBike <no-reply@anybike.co.uk>",
        to:[email],
        subject:title,
        html
      })
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)return json(req,{success:false,error:"Setup email could not be sent",details:result},502);

    return json(req,{success:true,email_id:result?.id||null,to:email});
  }catch(error){
    return json(req,{success:false,error:error instanceof Error?error.message:String(error)},400);
  }
});