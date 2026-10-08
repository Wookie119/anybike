import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { createClient } from "jsr:@supabase/supabase-js@2";

function token(){const a=new Uint8Array(32);crypto.getRandomValues(a);return Array.from(a).map(x=>x.toString(16).padStart(2,"0")).join("")}
async function hash(v:string){const b=new TextEncoder().encode(v);const h=await crypto.subtle.digest("SHA-256",b);return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,"0")).join("")}
function esc(v:unknown){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]||c))}

export default {
  fetch: withSupabase({auth:"user"}, async (req,ctx)=>{
    try{
      const {data:isAdmin,error:adminError}=await ctx.supabase.rpc("anybike_is_admin");
      if(adminError||!isAdmin)return Response.json({error:"Admin access required"},{status:403});

      const body=await req.json();
      const force=body.force===true;
      const linkOnly=body.link_only===true;
      const idsRaw=Array.isArray(body.forwarder_ids)?body.forwarder_ids:[body.forwarder_id];
      const ids=[...new Set(idsRaw.map((x:any)=>Number(x)).filter((x:number)=>Number.isFinite(x)&&x>0))].slice(0,50);
      if(!ids.length)return Response.json({error:"No shippers selected"},{status:400});

      const U=Deno.env.get("SUPABASE_URL")||"",S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",R=Deno.env.get("RESEND_API_KEY")||"";
      if(!U||!S||(!R&&!linkOnly))return Response.json({error:"Required service is not configured"},{status:500});
      const db=createClient(U,S,{auth:{persistSession:false,autoRefreshToken:false}});

      const {data:rows,error}=await db.from("freight_forwarders")
        .select("id,company_name,email,email_2,email_3,profile_contact_email,profile_cc_email,contact_name,profile_invite_count,profile_invite_status")
        .in("id",ids);
      if(error)throw error;

      const results:any[]=[];
      for(const f of rows||[]){
        if(linkOnly){
          const raw=token(),h=await hash(raw),now=new Date().toISOString();
          const link="https://www.anybike.co.uk/shipper-profile.html?token="+encodeURIComponent(raw);
          const {error:saveError}=await db.from("freight_forwarders").update({
            profile_invite_token_hash:h,
            profile_invite_token_created_at:now,
            updated_at:now
          }).eq("id",f.id);
          if(saveError)throw saveError;
          results.push({id:f.id,company_name:f.company_name,status:"Link Ready",link});
          continue;
        }
        if(!force && ["Submitted","Updated","Declined"].includes(String(f.profile_invite_status||""))){
          results.push({id:f.id,company_name:f.company_name,status:"Skipped Responded"});
          continue;
        }
        const allEmails=[f.profile_contact_email,f.email,f.email_2,f.email_3,f.profile_cc_email]
          .map((v:any)=>String(v||"").trim())
          .filter(Boolean);
        const uniqueEmails:string[]=[];
        for(const addr of allEmails){
          if(!uniqueEmails.some(x=>x.toLowerCase()===addr.toLowerCase())) uniqueEmails.push(addr);
        }
        const email=uniqueEmails[0]||"";
        const cc=uniqueEmails.slice(1);
        if(!email){
          await db.from("freight_forwarders").update({profile_invite_status:"No Email",updated_at:new Date().toISOString()}).eq("id",f.id);
          results.push({id:f.id,company_name:f.company_name,status:"No Email"});
          continue;
        }

        const raw=token(),h=await hash(raw),now=new Date().toISOString();
        const link=`https://www.anybike.co.uk/shipper-profile.html?token=${encodeURIComponent(raw)}`;
        const subject="Update your free AnyBike shipper profile";

        const html=`<!doctype html><html><body style="margin:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#111">
        <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 14px">
        <table width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fff;border:1px solid #ddd;border-radius:12px;overflow:hidden">
        <tr><td style="padding:24px 32px;background:#111;color:#fff"><a href="https://www.anybike.co.uk/" style="display:inline-block;text-decoration:none"><img src="https://www.anybike.co.uk/anybike-logo-new.jpg" alt="AnyBike" width="150" style="display:block;width:150px;max-width:100%;height:auto;border:0;border-radius:10px"></a><div style="margin-top:12px;font-size:13px;color:#ccc">International Motorcycle Sourcing &amp; Export</div><div style="margin-top:8px;font-size:12px"><a href="https://www.anybike.co.uk/" style="color:#fff;text-decoration:none;font-weight:700">AnyBike.co.uk</a><span style="color:#666"> &nbsp;·&nbsp; </span><a href="https://www.anybike.co.uk/freight-forwarders.html" style="color:#ff6a70;text-decoration:none;font-weight:700">Freight Forwarders</a></div></td></tr>
        <tr><td style="height:4px;background:#ed1c24"></td></tr>
        <tr><td style="padding:32px">
          <div style="font-size:12px;font-weight:900;color:#ed1c24;letter-spacing:1.4px;text-transform:uppercase">Free shipper directory profile</div>
          <h1 style="font-size:24px;line-height:1.3;margin:10px 0 18px">Please check and update your ${esc(f.company_name)} profile on AnyBike.</h1>
          <p style="font-size:16px;line-height:1.65">AnyBike helps international motorcycle buyers source motorcycles in the UK and find suitable shipping partners. We currently list your company in our freight-forwarder directory.</p>
          <p style="font-size:16px;line-height:1.65">We would like your office to check this profile for free so buyers see the correct contact details, destinations, ports and services you actually provide.</p>
          <p style="font-size:16px;line-height:1.65">This invitation may have been sent to more than one contact at your company. Everyone receiving it uses the same secure ${esc(f.company_name)} office profile, so one colleague can start the update and another can review or amend the same draft before AnyBike publishes anything.</p>
          <p style="margin:26px 0"><a href="${link}" style="display:inline-block;background:#ed1c24;color:#fff;text-decoration:none;font-weight:900;padding:14px 22px;border-radius:8px">Review My Free Profile →</a></p>
          <p style="font-size:14px;line-height:1.6;color:#555">There is no charge to review or maintain your standard listing. Any changes you submit are reviewed by AnyBike before being published.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#111;color:#bbb;font-size:12px">AnyBike.co.uk · International Motorcycle Sourcing & Export</td></tr>
        </table></td></tr></table></body></html>`;

        const response=await fetch("https://api.resend.com/emails",{
          method:"POST",
          headers:{Authorization:`Bearer ${R}`,"Content-Type":"application/json"},
          body:JSON.stringify({
            from:"AnyBike <sales@anybike.co.uk>",
            to:[email],
            cc:cc.length?cc:undefined,
            reply_to:"sales@anybike.co.uk",
            subject,
            html
          })
        });
        const result=await response.json();

        if(!response.ok){
          results.push({id:f.id,company_name:f.company_name,status:"Send Failed",error:result});
          continue;
        }

        await db.from("freight_forwarders").update({
          profile_invite_status:"Invited",
          profile_invited_at:now,
          profile_last_reminded_at:now,
          profile_invite_count:Number(f.profile_invite_count||0)+1,
          profile_invite_token_hash:h,
          profile_invite_token_created_at:now,
          updated_at:now
        }).eq("id",f.id);

        results.push({id:f.id,company_name:f.company_name,status:"Invited",recipients:uniqueEmails.length});
      }

      return Response.json({ok:true,results});
    }catch(error){
      return Response.json({error:error instanceof Error?error.message:"Unexpected error"},{status:500});
    }
  })
};