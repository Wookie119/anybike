import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

const esc=(s:unknown)=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
const money=(value:unknown)=>"£"+Number(value||0).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
const validEmail=(email:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&email.length<255;
export default {fetch:withSupabase({auth:"user"},async(req,ctx)=>{
 if(req.method!=="POST")return Response.json({error:"POST required"},{status:405});
 const {data:admin,error:adminError}=await ctx.supabase.rpc("anybike_is_admin");
 if(adminError||admin!==true)return Response.json({error:"Admin access required"},{status:403});
 let quotationId="";
 try{const body=await req.json();quotationId=String(body?.quotation_id||"");if(!/^[a-f0-9-]{36}$/i.test(quotationId))throw Error();}catch{return Response.json({error:"Invalid quotation"},{status:400});}
 const {data:q,error:qerr}=await ctx.supabase.from("advertising_quotations").select("*").eq("id",quotationId).single();
 if(qerr||!q)return Response.json({error:"Quotation not found"},{status:404});
 if(q.status!=="draft")return Response.json({error:"Only draft quotations may be sent directly. Check existing delivery records."},{status:409});
 const to=String(q.contact_email||"").trim();
 if(!validEmail(to))return Response.json({error:"A valid contact email must be saved on the quotation"},{status:400});
 const {data:items,error:itemsError}=await ctx.supabase.from("advertising_quotation_items").select("*").eq("quotation_id",quotationId).order("created_at");
 if(itemsError||!items?.length)return Response.json({error:"At least one saved advertising placement is required"},{status:409});
 const {data:totals,error:totalError}=await ctx.supabase.from("admin_advertising_quotation_totals_v1").select("*").eq("id",quotationId).single();
 if(totalError||!totals)return Response.json({error:"Quotation totals unavailable"},{status:500});
 if(Number(totals.placement_quantity)<1||Number(totals.total_gbp)<=0)return Response.json({error:"Add priced advertising placements before issuing the quotation"},{status:409});
 if(items.some((i:any)=>!Array.isArray(i.countries)||!i.countries.length))return Response.json({error:"Set explicit country targeting on each placement before issuing the quotation"},{status:409});
 const key=Deno.env.get("RESEND_API_KEY");
 if(!key)return Response.json({error:"Email service unavailable"},{status:503});
 const {data:attempt,error:attemptError}=await ctx.supabase.from("advertising_quotation_email_deliveries").insert({quotation_id:quotationId,recipient_email:to,delivery_status:"sending"}).select("id").single();
 if(attemptError||!attempt)return Response.json({error:"A quotation email attempt already exists. Check delivery status before attempting another send."},{status:409});
 const ref="AB-ADQ-"+String(q.quote_number).padStart(6,"0");
 const lineHtml=items.map((i:any)=>"<tr><td style='padding:8px;border-bottom:1px solid #ddd'>"+esc(i.description)+"<br><small>"+esc(String(i.artwork_format||"").replaceAll("_"," "))+" · Countries: "+esc((i.countries||[]).join(", "))+" · "+esc((i.manufacturers||[]).join(", "))+" · "+esc((i.catalogue_model_ids||[]).length+" model page(s)")+"</small></td><td style='padding:8px;border-bottom:1px solid #ddd'>"+esc(i.quantity)+"</td><td style='padding:8px;border-bottom:1px solid #ddd'>"+money(i.unit_price_gbp)+"</td><td style='padding:8px;border-bottom:1px solid #ddd'>"+money(i.line_total_gbp)+"</td></tr>").join("");
 const html="<html><body style='background:#f4f4f4;padding:25px;font:15px/1.5 Arial;color:#171717'><main style='max-width:700px;margin:auto;background:white;padding:28px;border-top:5px solid #ed1c24'><h1 style='color:#111'>AnyBike advertising quotation</h1><p>Hello "+esc(q.contact_name||q.advertiser_name)+",</p><p>Thank you for your interest in advertising with AnyBike. Please review the proposed package below.</p><h2>"+esc(ref)+" — "+esc(q.title)+"</h2><p><strong>Advertiser:</strong> "+esc(q.advertiser_name)+"<br><strong>Audience:</strong> "+esc(q.audience)+"<br><strong>Duration:</strong> "+esc(q.duration_days)+" days<br><strong>Valid until:</strong> "+esc(q.valid_until||"To be agreed")+"</p><table style='width:100%;border-collapse:collapse'><tr style='background:#eee'><th>Placement</th><th>Qty</th><th>Unit</th><th>Net</th></tr>"+lineHtml+"</table><p>Subtotal: "+money(totals.subtotal_gbp)+"<br>Discount: "+money(totals.discount_gbp)+"<br>VAT: "+money(totals.vat_gbp)+"</p><h3>Total including VAT: "+money(totals.total_gbp)+"</h3><p>Proposed placements remain subject to availability, artwork and applicable compliance approval. Reply quoting "+esc(ref)+" to accept or discuss this quotation.</p><p>Many thanks,<br>AnyBike<br>sales@anybike.co.uk</p></main></body></html>";
 const update=async(status:string,messageId:string|null=null,errorText:string|null=null)=>{
  const result=await ctx.supabase.from("advertising_quotation_email_deliveries").update({delivery_status:status,provider_message_id:messageId,completed_at:new Date().toISOString(),error_text:errorText}).eq("id",attempt.id);
  return !result.error;
 };
 try{
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json","Idempotency-Key":"anybike-advertising-quote-"+quotationId},body:JSON.stringify({from:"AnyBike <no-reply@anybike.co.uk>",to:[to],reply_to:"sales@anybike.co.uk",subject:"AnyBike advertising quotation "+ref,html})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok){const certain=response.status>=400&&response.status<500&&![408,409,429].includes(response.status);await update(certain?"failed":"uncertain",null,"Provider HTTP "+response.status);return Response.json({error:certain?"Email provider rejected the message. Review delivery record.":"Email outcome uncertain. Check delivery record before retrying."},{status:502});}
  if(!result.id||!await update("sent",String(result.id)))return Response.json({error:"Provider may have accepted the email but audit status could not be confirmed. Do not retry."},{status:502});
  const saved=await ctx.supabase.from("advertising_quotations").update({status:"sent",updated_at:new Date().toISOString()}).eq("id",quotationId).eq("status","draft").select("id");
  if(saved.error||!saved.data?.length)return Response.json({error:"Provider accepted email, but quotation status needs manual reconciliation. Do not send again."},{status:502});
  return Response.json({success:true,reference:ref,recipient:to});
 }catch{
  await update("uncertain",null,"Network outcome uncertain");
  return Response.json({error:"Email delivery uncertain. Check the email provider before retrying."},{status:502});
 }
})};
