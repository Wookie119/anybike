import {createClient} from "npm:@supabase/supabase-js@2";

const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{"content-type":"application/json","cache-control":"no-store"}
});
const escape=(v:unknown)=>String(v??"").replace(/[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]!));

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
      const html="<html><body style='font-family:Arial,sans-serif;color:#171717;background:#f3f3f3;padding:20px'>"+
        "<div style='background:#fff;border:1px solid #555;border-top:5px solid #ed1c24;max-width:650px;margin:auto;padding:24px'>"+
        "<h2 style='margin-top:0'>AnyBike · Confidential trade opportunity</h2>"+
        "<p>An approved motorcycle is available for confidential UK trade bidding:</p><h3>"+escape(name)+"</h3>"+
        "<p><a href='"+href+"' style='display:inline-block;background:#ed1c24;color:#fff;text-decoration:none;padding:12px 18px;border-radius:5px'>View motorcycle &amp; bid</a></p>"+
        "<p>This is an individual auction alert you requested. No competing dealer identities or bid amounts are shared.</p>"+
        "<p style='font-size:12px;color:#555'>Change your email settings any time: "+
        "<a href='https://www.anybike.co.uk/my-dealership.html#auctionEmailPreferences'>Auction Email Preferences</a>.</p></div></body></html>";
      const sent=await fetch("https://api.resend.com/emails",{
        method:"POST",headers:{"authorization":"Bearer "+resendKey,"content-type":"application/json"},
        body:JSON.stringify({from:"AnyBike <sales@anybike.co.uk>",to:[account.email],
          subject:"AnyBike | Trade auction invitation — "+name,html})
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