import { createClient } from "npm:@supabase/supabase-js@2";
const esc=(s:unknown)=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
Deno.serve(async(req)=>{
 if(req.method!=="POST")return Response.json({error:"POST required"},{status:405});
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),url=Deno.env.get("SUPABASE_URL");
 if(!service||!url||req.headers.get("Authorization")!=="Bearer "+service)return Response.json({error:"Service access required"},{status:403});
 const db=createClient(url,service,{auth:{persistSession:false}});
 const input=await req.json().catch(()=>({}));
 if(input.dry_run!==false||Deno.env.get("ANYBIKE_LISTING_REMINDERS_ENABLED")!=="true")return Response.json({success:true,mode:"dry_run",emails_sent:0});
 const key=Deno.env.get("RESEND_API_KEY");if(!key)return Response.json({error:"Email service unavailable"},{status:503});
 const results=[];
 for(let i=0;i<10;i++){
 const {data:d,error}=await db.rpc("service_claim_listing_refresh_reminder_v1");
 if(error)return Response.json({error:"Queue claim failed",processed:results.length},{status:500});
 if(!d)break;if(d.skipped)continue;
 const finish=async(state:string,provider:string|null=null)=>{const r=await db.rpc("service_finish_listing_refresh_reminder_v1",{p_request_id:d.request_id,p_state:state,p_provider_id:provider});return !r.error&&r.data===true;};
 const deliver=async()=>{ const name=String(d.name||"there").trim().split(/\s+/)[0],bike=String(d.bike||"motorcycle"),ref=String(d.reference),dealer=d.seller_type==="dealer";
 const link="https://www.anybike.co.uk/seller-update-listing.html#token="+encodeURIComponent(d.token);
 const intro=dealer?"Is your "+bike+" still available for trade offers?":"Is your "+bike+" still available for sale?";
 const detail=dealer?"Confirm your collection postcode and confidential minimum trade price. If you no longer need an urgent underwrite, we can discuss ongoing trade offers.":"Confirm your collection postcode and confidential minimum amount you would accept. AnyBike aims to achieve a fair price, deducting collection/delivery and applicable commission from the dealer's purchase price, not your agreed seller amount.";
 const html=`<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f4;font:16px/1.6 Arial;color:#111"><table role="presentation" width="100%" style="max-width:620px;margin:auto;background:white;border-collapse:collapse"><tr><td style="padding:22px;text-align:center;border-bottom:4px solid #ed1c24"><img src="https://www.anybike.co.uk/assets/Anybike-email-logo-white.png" alt="AnyBike" width="260" style="max-width:100%;height:auto"></td></tr><tr><td style="padding:28px"><h1 style="font-size:24px;line-height:1.2">Give your motorcycle the best chance of selling</h1><p>Hello ${esc(name)},</p><p>${esc(intro)} (${esc(ref)})</p><p>We would like to offer you a free refresh of your existing advert, with the opportunity to feature it as Recently Updated once reviewed. No need to start again.</p><p>${esc(detail)}</p><p>Update your mileage, condition, history and paperwork. Clear, recent original photographs are welcome — no screenshots or copied adverts.</p><p style="text-align:center;margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#ed1c24;color:white;text-decoration:none;padding:14px 24px;border-radius:7px;font-weight:bold">Update My Listing →</a></p><p>You can also confirm availability or tell us if the motorcycle is sold using this link. No advertising charges, no pressure and no commitment to sell. This private link expires in 14 days.</p><p>Many thanks,<br>AnyBike Team</p></td></tr></table></body></html>`;
 try{
 const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json","Idempotency-Key":"anybike-listing-refresh-"+d.request_id},body:JSON.stringify({from:"AnyBike <no-reply@anybike.co.uk>",to:[d.email],reply_to:"sales@anybike.co.uk",subject:"AnyBike — free listing refresh for "+bike,html})});
 if(!r.ok){const definitive=r.status>=400&&r.status<500&&r.status!==408&&r.status!==409&&r.status!==429;await finish(definitive?"failed":"unknown");return Response.json({error: definitive?"Email rejected":"Delivery uncertain; check before retrying"},{status:502});}
 const j=await r.json();if(!j.id||!await finish("sent",j.id))return Response.json({error:"Email may have been accepted; status not confirmed. Do not retry."},{status:502});
 return Response.json({success:true,reference:ref});
 }catch{try{await finish("unknown");}catch{}return Response.json({error:"Delivery uncertain; do not retry before checking"},{status:502});}
 };
 const outcome=await deliver();results.push({status:outcome.status});if(!outcome.ok)break;
 }
 return Response.json({success:results.every(r=>r.status===200),processed:results.length,sent:results.filter(r=>r.status===200).length});
});