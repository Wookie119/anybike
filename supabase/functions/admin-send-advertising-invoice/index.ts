import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

const esc=(s:unknown)=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
const gbp=(v:unknown)=>"£"+Number(v||0).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
const date=(v:unknown)=>v?new Date(String(v)).toLocaleDateString("en-GB",{timeZone:"UTC"}):"—";
const validEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=254;
export default {fetch:withSupabase({auth:"user"},async(req,ctx)=>{
 if(req.method!=="POST")return Response.json({error:"POST required"},{status:405});
 const {data:admin,error:adminError}=await ctx.supabase.rpc("anybike_is_admin");
 if(adminError||admin!==true)return Response.json({error:"Admin access required"},{status:403});
 let invoiceId="";
 try{const body=await req.json();invoiceId=String(body?.invoice_id||"");if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(invoiceId))throw Error();}catch{return Response.json({error:"Invalid issued invoice"},{status:400});}
 const {data:invoice,error:fetchError}=await ctx.supabase.from("advertising_issued_invoices").select("id,invoice_number,issued_at,invoice_snapshot").eq("id",invoiceId).maybeSingle();
 if(fetchError||!invoice)return Response.json({error:"Only issued invoices may be emailed"},{status:404});
 const s=invoice.invoice_snapshot||{};
 const to=String(s.billing_email||"").trim(),from="AnyBike <no-reply@anybike.co.uk>";
 if(!validEmail(to))return Response.json({error:"Verified billing email missing from issued invoice"},{status:409});
 if(s.invoice_number!==invoice.invoice_number||!Array.isArray(s.lines)||s.lines.length===0||Number(s.gross_gbp)<=0||!String(s.issuer_name||"").trim()||!String(s.issuer_address||"").trim()||!String(s.issuer_vat_number||"").trim()||!String(s.billing_address||"").trim())
  return Response.json({error:"Issued invoice snapshot incomplete. Review original record before sending."},{status:409});
 const key=Deno.env.get("RESEND_API_KEY");
 if(!key)return Response.json({error:"Email service unavailable"},{status:503});
 // Insert before contacting provider: the invoice_id unique constraint also guards racing requests.
 const {data:attempt,error:attemptError}=await ctx.supabase.from("advertising_invoice_email_deliveries").insert({invoice_id:invoiceId,recipient_email:to,delivery_status:"sending"}).select("id").single();
 if(attemptError||!attempt)return Response.json({error:"A delivery attempt already exists. Review status before resending; no duplicate email sent."},{status:409});
 const update=async(state:string,providerId:string|null=null,err:string|null=null)=>{
  const {error}=await ctx.supabase.from("advertising_invoice_email_deliveries").update({delivery_status:state,provider_message_id:providerId,error_text:err,completed_at:new Date().toISOString()}).eq("id",attempt.id);
  return !error;
 };
 const lineHtml=s.lines.map((l:any)=>"<tr><td>"+esc(l.description)+"<small style='display:block'>"+esc(String(l.artwork_format||"").replaceAll("_"," "))+"</small></td><td>"+esc(l.quantity)+"</td><td>"+gbp(l.unit_price_gbp)+"</td><td>"+gbp(l.line_total_gbp)+"</td></tr>").join("");
 const bank=[s.issuer_bank_name&&"Account name: "+s.issuer_bank_name,s.issuer_bank_sort_code&&"Sort code: "+s.issuer_bank_sort_code,s.issuer_bank_account_number&&"Account number: "+s.issuer_bank_account_number,s.issuer_bank_iban&&"IBAN: "+s.issuer_bank_iban,s.issuer_bank_bic&&"BIC: "+s.issuer_bank_bic].filter(Boolean).map(v=>esc(v)).join("<br>");
 const html="<html><body style='margin:0;padding:22px;background:#f3f3f3;color:#191919;font:14px/1.5 Arial,sans-serif'><main style='background:white;max-width:720px;margin:auto;padding:24px;border-top:5px solid #ed1c24'><h1 style='font-size:24px;margin:0 0 12px'>AnyBike advertising invoice</h1><p><strong>"+esc(invoice.invoice_number)+"</strong> · Issued "+date(invoice.issued_at)+" · Service date "+date(s.service_date)+" · Due "+date(s.payment_due_on)+"</p><table style='width:100%;margin:18px 0'><tr><td style='vertical-align:top;width:50%'><strong>From</strong><br>"+esc(s.issuer_name)+"<br>"+esc(s.issuer_trading_name)+"<br>"+esc(s.issuer_address).replaceAll("\n","<br>")+"<br>Company: "+esc(s.issuer_company_number)+"<br>VAT: "+esc(s.issuer_vat_number)+"</td><td style='vertical-align:top'><strong>Bill to</strong><br>"+esc(s.advertiser_name)+"<br>"+esc(s.billing_contact)+"<br>"+esc(s.billing_address).replaceAll("\n","<br>")+"<br>"+esc(s.billing_country)+"<br>Customer VAT: "+esc(s.buyer_vat_number)+"<br>PO: "+esc(s.purchase_order_reference)+"</td></tr></table><table style='width:100%;border-collapse:collapse'><tr style='background:#eee'><th style='text-align:left'>Placement</th><th>Qty</th><th>Unit</th><th>Net</th></tr>"+lineHtml+"</table><p style='text-align:right'>Subtotal "+gbp(s.subtotal_gbp)+"<br>Discount "+gbp(s.discount_gbp)+"<br>VAT ("+esc(s.vat_rate_percent)+"%) "+gbp(s.vat_gbp)+"</p><h2 style='text-align:right'>Total: "+gbp(s.gross_gbp)+"</h2><p><strong>Payment terms:</strong> "+esc(s.payment_terms)+"<br><strong>Due date:</strong> "+date(s.payment_due_on)+"<br><strong>Reference:</strong> "+esc(invoice.invoice_number)+"</p>"+(bank?"<p><strong>Payment details</strong><br>"+bank+"</p>":"")+"<p>Please quote the invoice number when making payment. For queries reply to sales@anybike.co.uk.</p><p>AnyBike</p></main></body></html>";
 try{
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json","Idempotency-Key":"anybike-issued-advertising-invoice-"+invoiceId},body:JSON.stringify({from,to:[to],reply_to:"sales@anybike.co.uk",subject:"AnyBike advertising invoice "+invoice.invoice_number,html})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const definitive=response.status>=400&&response.status<500&&![408,409,429].includes(response.status);await update(definitive?"failed":"uncertain",null,"Provider HTTP "+response.status);return Response.json({error:definitive?"Email provider rejected the message; review the delivery record.":"Email outcome uncertain; check provider before any retry."},{status:502});}
  if(!data.id||!await update("sent",String(data.id)))return Response.json({error:"Email may have been accepted but audit update was not confirmed. Do not retry."},{status:502});
  return Response.json({success:true,invoice_number:invoice.invoice_number,recipient:to});
 }catch{await update("uncertain",null,"Network outcome uncertain");return Response.json({error:"Email delivery uncertain. Check provider before retrying."},{status:502});}
})};