import {createClient} from "npm:@supabase/supabase-js@2";
Deno.serve(async req=>{
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":"https://www.anybike.co.uk","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const out=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers});
if(req.method==="OPTIONS")return out({});
if(req.method!=="POST")return out({error:"POST required"},405);
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const token=(req.headers.get("authorization")||"").replace(/^Bearer /i,"");
if(!key||!token)return out({error:"Authentication required"},401);
const db=createClient(Deno.env.get("SUPABASE_URL")!,key);
const cronKey=req.headers.get("x-anybike-cron-key")||"";
const authorized=await db.rpc("anybike_quotes_digest_cron_authorized",{k:cronKey});
if(!cronKey||authorized.error||authorized.data!==true)return out({error:"Scheduler authorization required"},403);
const london=new Date().toLocaleString("sv-SE",{timeZone:"Europe/London"});
const date=london.slice(0,10);
const localHour=london.slice(11,16);
const day=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",weekday:"short"}).format(new Date());
const {data:config,error:cfgErr}=await db.from("anybike_level2_trade_digest_schedule").select("*").eq("id",true).maybeSingle();
if(cfgErr||!config)return out({error:"Schedule settings unavailable"},500);
if(!config.enabled)return out({sent:false,status:"not_enabled"});
if(localHour!=="10:00"||!["Mon","Wed","Fri"].includes(day))return out({sent:false,status:"outside_scheduled_window",day,localHour});
const apiKey=Deno.env.get("RESEND_API_KEY");
if(!apiKey)return out({error:"Email service unavailable"},503);
const {data:dealers,error:dealersErr}=await db.rpc("anybike_level2_digest_recipients");
if(dealersErr)return out({error:"Recipient verification failed"},500);
const {data:auctions,error:auctionErr}=await db.from("anybike_trade_underwrite_opportunities").select("id,submission_id,closes_at,opens_at").eq("status","live").gt("closes_at",new Date().toISOString()).limit(250);
if(auctionErr)return out({error:"Auction list unavailable"},500);
const ids=(auctions||[]).map(a=>a.submission_id).filter(Boolean);
const {data:submissions,error:subErr}=ids.length?await db.from("seller_motorcycle_submissions").select("id,make,model,dealer_organisation_id,submitted_by,primary_display_image_url").in("id",ids):{data:[],error:null};
if(subErr)return out({error:"Submission list unavailable"},500);
// Honour each dealer's independent M/W/F digest opt-out before claiming a dispatch.
const userIds=[...new Set((dealers||[]).map((d:any)=>d.user_id).filter(Boolean))];
const {data:preferences,error:prefError}=userIds.length
 ? await db.from("anybike_dealer_auction_email_preferences").select("user_id,digest_enabled").in("user_id",userIds)
 : {data:[],error:null};
if(prefError)return out({error:"Cannot verify dealer email preferences; no digest sent"},500);
const optedOut=new Set((preferences||[]).filter((p:any)=>p.digest_enabled===false).map((p:any)=>String(p.user_id)));
const recipients=(dealers||[]).filter((d:any)=>!optedOut.has(String(d.user_id)));
const results=[];
for(const dealer of recipients){
  // Only new opportunities since this dealership's last successful digest.
  // On their first digest, include all currently live eligible opportunities.
  const {data:lastSent,error:lastSentError}=await db.from("anybike_level2_digest_dispatch")
    .select("created_at").eq("dealer_organisation_id",dealer.dealer_organisation_id)
    .eq("status","sent").order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(lastSentError){results.push({dealer_organisation_id:dealer.dealer_organisation_id,status:"history_check_failed"});continue;}
  const eligibleNow=(submissions||[]).filter(s=>{
    if(String(s.dealer_organisation_id||"")===String(dealer.dealer_organisation_id)||String(s.submitted_by||"")===String(dealer.user_id))return false;
    const auction=(auctions||[]).find(a=>String(a.submission_id)===String(s.id));
    return !!auction && (!lastSent?.created_at || (new Date(auction.opens_at).getTime()>new Date(lastSent.created_at).getTime()));
  });
  if(!eligibleNow.length){
    results.push({dealer_organisation_id:dealer.dealer_organisation_id,status:"skipped_no_new_auctions"});
    continue;
  }
  const {data:claimed,error:claimError}=await db.from("anybike_level2_digest_dispatch").insert({local_day:date,dealer_organisation_id:dealer.dealer_organisation_id,user_id:dealer.user_id,email:dealer.email,status:"claimed"}).select("dealer_organisation_id").maybeSingle();
  if(claimError){if(claimError.code==="23505"){results.push({dealer_organisation_id:dealer.dealer_organisation_id,status:"already_attempted"});continue;}results.push({dealer_organisation_id:dealer.dealer_organisation_id,status:"claim_failed"});continue;}
  try{
    const eligible=eligibleNow;
 const escape=(s:unknown)=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]!));
 const auctionBySubmission=new Map((auctions||[]).map(a=>[String(a.submission_id),a]));
 const opportunityIds=eligible.map(s=>auctionBySubmission.get(String(s.id))?.id).filter(Boolean);
 const {data:bids,error:bidError}=opportunityIds.length?await db.from("anybike_trade_underwrite_bids").select("opportunity_id,dealer_organisation_id,amount_gbp,status").in("opportunity_id",opportunityIds).eq("status","live"):{data:[],error:null};
 if(bidError)return out({error:"Could not verify bidding status"},500);
 const attachments: Array<{filename:string,content:string,content_type:string,content_id:string}>=[];
 const rows=eligible.map(s=>{
  const auction=auctionBySubmission.get(String(s.id));
  const relevant=(bids||[]).filter(b=>String(b.opportunity_id)===String(auction?.id));
  const mine=relevant.filter(b=>String(b.dealer_organisation_id)===String(dealer.dealer_organisation_id));
  const myHighest=Math.max(...mine.map(b=>Number(b.amount_gbp)||0),0);
  const highest=Math.max(...relevant.map(b=>Number(b.amount_gbp)||0),0);
  const closingSoon=auction?.closes_at&&new Date(auction.closes_at).getTime()-Date.now()<86400000;
  const label=mine.length?(myHighest>=highest?"Your Bid Is Leading":"Outbid!"):(closingSoon?"Auction Closing Soon":"No Bid Yet");
  const priority=label==="Outbid!"?0:closingSoon?1:label==="No Bid Yet"?2:3;
  const colour=label==="Outbid!"?"#ed1c24":label==="Your Bid Is Leading"?"#17803d":label==="Auction Closing Soon"?"#a56b00":"#666";
  const photo=String(s.primary_display_image_url||"");
  const thumbnail=photo.startsWith("https://tuehtnezhdnkqbbhttgp.supabase.co/storage/v1/object/public/")?"<img src='cid:auction-photo-"+escape(String(auction?.id||""))+"' width='64' height='48' style='width:64px;height:48px;object-fit:cover;vertical-align:middle;margin-right:10px' alt=''>":"";
  return {priority,html:"<tr><td style='padding:12px;border-bottom:1px solid #ddd'>"+thumbnail+"<a href='https://www.anybike.co.uk/trade-opportunities.html?opportunity="+encodeURIComponent(String(auction?.id||""))+"' style='color:#171717;text-decoration:underline;font-weight:bold'>"+escape(s.make)+" "+escape(s.model)+" ↗</a> <span style='float:right;font-weight:bold;color:"+colour+"'>"+label+"</span></td></tr>"};
 });
 const lines=rows.sort((a,b)=>a.priority-b.priority).map(x=>x.html).join("");
 let html="<html><body style='margin:0;background:#eee;font-family:Arial'><table align='center' width='720' style='width:100%;max-width:720px;background:white;border:1px solid #a61a20;border-left:4px solid #ed1c24;border-right:4px solid #ed1c24;border-collapse:separate;border-spacing:0;box-sizing:border-box'><tr><td style='height:8px;background:#ed1c24;font-size:0;line-height:0'>&nbsp;</td></tr><tr><td style='background:#0b0b0b;text-align:center;padding:10px 20px'><img src='cid:anybike-header-logo' alt='AnyBike' width='360' style='display:block;width:360px;max-width:100%;height:auto;margin:0 auto;border:0'></td></tr><tr><td style='height:4px;background:#ed1c24;font-size:0;line-height:0'>&nbsp;</td></tr><tr><td style='padding:28px 30px'><h2 style='margin:0 0 18px;padding:0 0 13px;border-bottom:2px solid #ed1c24;font-size:23px;line-height:29px;text-align:center'>Daily Auction Update</h2><p>Hello "+escape(dealer.dealer_name)+",</p><p style='font-weight:bold'>Latest Bikes for Underwrite</p><table width='100%'>"+lines+"</table><p style='text-align:center;margin:26px 0'><a href='https://www.anybike.co.uk/trade-opportunities.html' style='background:#ed1c24;color:white;text-decoration:none;padding:14px 22px;display:inline-block;font-weight:bold'>View Trade Opportunities →</a></p><p style='text-align:center;font-size:12px;color:#666'>You only receive this update when new auctions are available. <a href='https://www.anybike.co.uk/my-dealership.html#auctionEmailPreferences' style='color:#b71a20'>Manage auction email preferences</a></p><p style='text-align:center'>The AnyBike Team</p></td></tr><tr><td style='height:4px;background:#ed1c24;font-size:0;line-height:0'>&nbsp;</td></tr><tr><td style='background:#171717;color:white;text-align:center;padding:22px'><strong style='font-size:20px'>ANY<span style='color:#ed1c24'>BIKE</span>.CO.UK</strong><br><span style='font-size:10px;letter-spacing:2px'>UK MOTORCYCLE EXPORT SPECIALISTS</span></td></tr></table></body></html>";

 const toBase64=(bytes:Uint8Array)=>{let str="";for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str)};
 const logoResponse=await fetch("https://raw.githubusercontent.com/Wookie119/anybike/main/anybike-logo-new.jpg");
 if(!logoResponse.ok)return out({error:"Black AnyBike logo unavailable",status:logoResponse.status},502);
 const logoBytes=new Uint8Array(await logoResponse.arrayBuffer());
 const isPng=logoBytes.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>logoBytes[i]===v);
 const isJpeg=logoBytes.length>3&&logoBytes[0]===255&&logoBytes[1]===216&&logoBytes[2]===255;
 if(logoBytes.length<1000||logoBytes.length>2000000||(!isPng&&!isJpeg))return out({error:"Black AnyBike logo is not an accepted image"},502);
 attachments.push({filename:isPng?"anybike-header-logo.png":"anybike-header-logo.jpg",content:toBase64(logoBytes),content_type:isPng?"image/png":"image/jpeg",content_id:"anybike-header-logo"});
 const photos=await Promise.all(eligible.map(async bike=>{
  const link=String(bike.primary_display_image_url||"");
  if(!link.startsWith("https://tuehtnezhdnkqbbhttgp.supabase.co/storage/v1/object/public/"))return null;
  const id=auctionBySubmission.get(String(bike.id))?.id;
  if(!id)return null;
  try{const response=await fetch(link);if(!response.ok)return null;const data=new Uint8Array(await response.arrayBuffer());if(data.length>1200000)return null;
  const mime=response.headers.get("content-type")?.split(";")[0]||"image/jpeg";
  if(!["image/jpeg","image/png","image/webp"].includes(mime))return null;
  return {filename:"auction-"+id+(mime==="image/png"?".png":mime==="image/webp"?".webp":".jpg"),content:toBase64(data),content_type:mime,content_id:"auction-photo-"+id};
  }catch{return null}
 }));
 for(const photo of photos)if(photo)attachments.push(photo);
 for(let i=0;i<photos.length;i++){if(!photos[i]){const bike=eligible[i];const id=auctionBySubmission.get(String(bike.id))?.id;const link=String(bike.primary_display_image_url||"");if(id){html=html.replace("cid:auction-photo-"+id,escape(link));}}}

    // Repeated requests for the same dealership and local send date reuse one provider key.\n    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json","Idempotency-Key":"anybike-trade-digest-"+date+"-org-"+String(dealer.dealer_organisation_id)},body:JSON.stringify({from:"AnyBike <sales@anybike.co.uk>",to:[dealer.email],subject:"AnyBike | Daily Auction Update",html,attachments})});
    const data=await response.json();
    const success=response.ok&&!!data.id;
    await db.from("anybike_level2_digest_dispatch").update({status:success?"sent":"failed",email_id:success?data.id:null,motorcycle_count:eligible.length,error:success?null:JSON.stringify(data).slice(0,500),updated_at:new Date().toISOString()}).eq("local_day",date).eq("dealer_organisation_id",dealer.dealer_organisation_id);
    results.push({dealer_organisation_id:dealer.dealer_organisation_id,status:success?"sent":"failed",motorcycles:eligible.length});
  }catch(e){await db.from("anybike_level2_digest_dispatch").update({status:"failed",error:String(e).slice(0,500),updated_at:new Date().toISOString()}).eq("local_day",date).eq("dealer_organisation_id",dealer.dealer_organisation_id);results.push({dealer_organisation_id:dealer.dealer_organisation_id,status:"failed"});}
}
return out({date,day,recipients:recipients.length,opted_out:(dealers||[]).length-recipients.length,results});
});