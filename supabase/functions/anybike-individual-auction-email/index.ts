import {createClient} from "npm:@supabase/supabase-js@2";

const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{"content-type":"application/json","cache-control":"no-store"}
});
const escape=(v:unknown)=>String(v??"").replace(/[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]!));


const toBase64=(bytes:Uint8Array)=>{
  let str="";
  for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(str);
};
async function brandedLogo(){
  const res=await fetch("https://raw.githubusercontent.com/Wookie119/anybike/main/anybike-logo-new.jpg");
  if(!res.ok)throw Error("AnyBike brand logo unavailable");
  const bytes=new Uint8Array(await res.arrayBuffer());
  const png=bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
  const jpg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(bytes.length<1000||bytes.length>2000000||(!jpg&&!png))throw Error("AnyBike brand logo invalid");
  return [{filename:png?"anybike-logo.png":"anybike-logo.jpg",content:toBase64(bytes),
    content_type:png?"image/png":"image/jpeg",content_id:"anybike-header-logo"}];
}
function brandedHtml(title:string,bodyHtml:string){
  const preferences="https://www.anybike.co.uk/my-dealership.html#auctionEmailPreferences";
  return "<!doctype html><html><body style='margin:0;padding:16px 8px;background:#eeeeee;font-family:Arial,Helvetica,sans-serif;color:#171717'>"+
    "<table role='presentation' align='center' width='680' cellpadding='0' cellspacing='0' style='width:100%;max-width:680px;border:1px solid #444;border-left:4px solid #ed1c24;border-right:4px solid #ed1c24;background:#fff;border-collapse:separate;border-spacing:0'>"+
    "<tr><td style='height:8px;background:#101010;font-size:0'>&nbsp;</td></tr>"+
    "<tr><td style='text-align:center;padding:16px 20px;background:#fff'><img src='cid:anybike-header-logo' alt='AnyBike' width='320' style='display:block;width:320px;max-width:95%;height:auto;border:0;margin:0 auto'></td></tr>"+
    "<tr><td style='height:4px;background:#ed1c24;font-size:0'>&nbsp;</td></tr>"+
    "<tr><td style='padding:25px 27px 28px'><h1 style='font-size:22px;line-height:1.3;margin:0 0 16px;padding:0 0 12px;border-bottom:2px solid #ed1c24;color:#171717'>"+escape(title)+"</h1>"+
    bodyHtml+
    "<p style='margin:26px 0 2px;font-size:12px;color:#666;text-align:center'>"+
    "You're in control of your auction emails. <a href='"+preferences+"' style='color:#b5121b'>Manage email preferences</a>.</p>"+
    "<p style='font-size:14px;margin:22px 0 0'>The AnyBike Team</p></td></tr>"+
    "<tr><td style='height:4px;background:#ed1c24;font-size:0'>&nbsp;</td></tr>"+
    "<tr><td style='background:#151515;color:#fff;padding:20px;text-align:center;font-size:12px'>"+
    "<strong style='font-size:18px;letter-spacing:1px'>ANY<span style='color:#ed1c24'>BIKE</span>.CO.UK</strong>"+
    "<p style='margin:7px 0 0;color:#ddd'>UK Motorcycle Trade &amp; International Sourcing</p></td></tr></table></body></html>";
}

Deno.serve(async req=>{
  if(req.method!=="POST")return response({error:"POST required"},405);
  const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url=Deno.env.get("SUPABASE_URL");
  const resendKey=Deno.env.get("RESEND_API_KEY");
  const supplied=req.headers.get("x-anybike-cron-key")||"";
  if(!url||!secret||!supplied)return response({error:"Unauthorized"},401);
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const authorization=await db.rpc("anybike_quotes_digest_cron_authorized",{k:supplied});
  if(authorization.error||authorization.data!==true)return response({error:"Unauthorized"},403);
  if(!resendKey)return response({error:"Email service unavailable"},503);
  // Explicit admin-only delivery test. Never creates an auction or alters a dealer's preferences.
  const input=await req.json().catch(()=>({}));
  if(input?.mode==="send_test"){
    const testEmail="andy.gifford@yahoo.co.uk";
    const {data:users,error:lookupError}=await db.schema("public").from("customer_profiles")
      .select("id,email").ilike("email",testEmail).limit(2);
    if(lookupError||!users||users.length!==1)return response({error:"Test recipient lookup failed"},500);
    const uid=users[0].id;
    const {data:access,error:accessError}=await db.from("anybike_dealer_access")
      .select("level,approved_at,can_view_underwrites").eq("user_id",uid).maybeSingle();
    if(accessError||access?.level!==2||!access.approved_at||!access.can_view_underwrites)
      return response({error:"Test account lacks verified dealer access"},403);
    const {data:account,error:accountError}=await db.auth.admin.getUserById(uid);
    if(accountError||account?.user?.email?.toLowerCase()!==testEmail||!account.user.email_confirmed_at)
      return response({error:"Test account email confirmation unavailable"},403);
    const html=brandedHtml("Dealer auction email · TEST",
      "<p style='line-height:1.55'>This is a branded delivery test for the Gifford Motorcycles UK dealer account.</p>"+
      "<p style='line-height:1.55'><strong>TEST ONLY — no auction was opened, no invitation was generated, and your email preferences were not changed.</strong></p>"+
      "<p style='line-height:1.55'>Live individual auction invitations are only emailed when you choose to receive them.</p>");
    let attachments;
    try{attachments=await brandedLogo();}catch(e){return response({error:String(e)},502);}
    const sent=await fetch("https://api.resend.com/emails",{
      method:"POST",headers:{"authorization":"Bearer "+resendKey,"content-type":"application/json"},
      body:JSON.stringify({from:"AnyBike <sales@anybike.co.uk>",to:[testEmail],
        subject:"AnyBike TEST — Branded auction email",html,attachments})
    });
    const provider=await sent.json().catch(()=>({}));
    if(!sent.ok||!provider.id)return response({status:"failed",provider_status:sent.status},502);
    return response({status:"accepted_by_email_provider",email_id:String(provider.id),test_account:true});
  }

  const {data:pending,error:listError}=await db
    .from("anybike_individual_auction_email_outbox")
    .select("invitation_id,user_id,dealer_organisation_id")
    .eq("status","queued").order("created_at",{ascending:true}).limit(20);
  if(listError)return response({error:"Cannot read invitation queue"},500);
  const result={checked:(pending||[]).length,sent:0,skipped:0,failed:0};
  for(const item of pending||[]){
    const where={invitation_id:item.invitation_id,user_id:item.user_id};
    const {data:claimed,error:claimError}=await db.from("anybike_individual_auction_email_outbox")
      .update({status:"claimed",updated_at:new Date().toISOString()})
      .eq("invitation_id",where.invitation_id).eq("user_id",where.user_id)
      .eq("status","queued").select("invitation_id").maybeSingle();
    if(claimError||!claimed)continue;
    const finish=async(status:"skipped"|"failed"|"sent",error?:string,emailId?:string)=>{
      await db.from("anybike_individual_auction_email_outbox").update({
        status,error:error?.slice(0,300)||null,email_id:emailId||null,updated_at:new Date().toISOString()
      }).eq("invitation_id",where.invitation_id).eq("user_id",where.user_id).eq("status","claimed");
      result[status]++;
    };
    try{
      // Re-check preferences and permissions at the moment of sending.
      const [pref,inv,userAccess,member,org,userData]=await Promise.all([
        db.from("anybike_dealer_auction_email_preferences").select("individual_invites_enabled").eq("user_id",item.user_id).maybeSingle(),
        db.from("anybike_trade_underwrite_invitations").select("opportunity_id,dealer_organisation_id,status").eq("id",item.invitation_id).maybeSingle(),
        db.from("anybike_dealer_access").select("level,approved_at,can_view_underwrites").eq("user_id",item.user_id).maybeSingle(),
        db.from("dealer_users").select("active,verified").eq("user_id",item.user_id).eq("dealer_organisation_id",item.dealer_organisation_id).eq("active",true).eq("verified",true).limit(1).maybeSingle(),
        db.from("dealer_organisations").select("active,verified,accepts_trade_underwrites,country").eq("id",item.dealer_organisation_id).maybeSingle(),
        db.auth.admin.getUserById(item.user_id)
      ]);
      if([pref,inv,userAccess,member,org].some(x=>x.error)||userData.error)throw Error("Recipient verification unavailable");
      const account=userData.data?.user;
      const d=org.data;
      if(pref.data?.individual_invites_enabled!==true
        ||inv.data?.dealer_organisation_id!==item.dealer_organisation_id
        ||!["invited","viewed","bid_submitted"].includes(inv.data?.status||"")
        ||userAccess.data?.level!==2||!userAccess.data?.approved_at||userAccess.data?.can_view_underwrites!==true
        ||!member.data?.active||!member.data?.verified
        ||!d?.active||!d?.verified||!d?.accepts_trade_underwrites
        ||!["uk","gb","united kingdom","great britain","england","scotland","wales","northern ireland"].includes(String(d.country||"").trim().toLowerCase())
        ||!account?.email||!account.email_confirmed_at){
        await finish("skipped","Not eligible or individual emails disabled");continue;
      }
      const {data:auction,error:auctionError}=await db.from("anybike_trade_underwrite_opportunities")
        .select("id,status,closes_at,submission_id").eq("id",inv.data!.opportunity_id).maybeSingle();
      if(auctionError)throw Error("Auction verification unavailable");
      if(!auction||auction.status!=="live"||new Date(auction.closes_at).getTime()<=Date.now()){
        await finish("skipped","Auction no longer open");continue;
      }
      const {data:bike,error:bikeError}=await db.from("seller_motorcycle_submissions")
        .select("make,model,bike_year,dealer_organisation_id,submitted_by").eq("id",auction.submission_id).maybeSingle();
      if(bikeError||!bike)throw Error("Motorcycle verification unavailable");
      if(String(bike.dealer_organisation_id||"")===String(item.dealer_organisation_id)||bike.submitted_by===item.user_id){
        await finish("skipped","Own motorcycle excluded");continue;
      }
      const name=[bike.bike_year,bike.make,bike.model].filter(Boolean).join(" ");
      const href="https://www.anybike.co.uk/trade-opportunities.html?opportunity="+encodeURIComponent(String(auction.id));
      const html=brandedHtml("Confidential trade auction invitation",
        "<p style='line-height:1.6'>An approved motorcycle is available for confidential UK trade bidding:</p>"+
        "<h2 style='font-size:20px;color:#171717;margin:12px 0 18px'>"+escape(name)+"</h2>"+
        "<p style='text-align:center;margin:22px 0'><a href='"+href+
        "' style='display:inline-block;background:#ed1c24;color:#fff;font-weight:bold;text-decoration:none;padding:14px 22px;border-radius:7px'>View motorcycle &amp; bid</a></p>"+
        "<p style='line-height:1.6'>Only authorised dealerships can view this auction. Competing dealer identities and bid amounts remain confidential.</p>");
      const attachments=await brandedLogo();
      const sent=await fetch("https://api.resend.com/emails",{
        method:"POST",headers:{"authorization":"Bearer "+resendKey,"content-type":"application/json"},
        body:JSON.stringify({from:"AnyBike <sales@anybike.co.uk>",to:[account.email],
          subject:"AnyBike | Trade auction invitation — "+name,html,attachments})
      });
      const body=await sent.json().catch(()=>({}));
      if(!sent.ok||!body.id){await finish("failed","Email provider rejected request");continue;}
      await finish("sent",undefined,String(body.id));
    }catch(e){
      await finish("failed",String(e));
    }
  }
  return response(result);
});