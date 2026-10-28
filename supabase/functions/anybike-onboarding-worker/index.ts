import {createClient} from "https://esm.sh/@supabase/supabase-js@2.57.0";
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key||req.headers.get("Authorization")!=="Bearer "+key)return new Response("Forbidden",{status:403});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:setting,error:se}=await db.from("anybike_onboarding_settings").select("sending_enabled").eq("id",true).single();
 if(se)return Response.json({error:se.message},{status:500});
 const {count,error:ce}=await db.from("anybike_onboarding_message_queue").select("id",{count:"exact",head:true}).eq("status","pending").lte("due_at",new Date().toISOString());
 if(ce)return Response.json({error:ce.message},{status:500});
 if(!setting?.sending_enabled)return Response.json({action:"dry_run",sending_enabled:false,pending_due:count||0,messages_sent:0,emails_sent:0});
 // Separate production approval gate: global setting alone must never activate real dealer emails.
 if(Deno.env.get("ANYBIKE_ONBOARDING_PRODUCTION_APPROVED")!=="true")return Response.json({action:"awaiting_production_approval",messages_sent:0,emails_sent:0},{status:409});
 const staleCutoff=new Date(Date.now()-24*60*60*1000).toISOString();
 const {count:oldCount,error:oldError}=await db.from("anybike_onboarding_message_queue").select("id",{count:"exact",head:true}).eq("status","pending").lt("due_at",staleCutoff);
 if(oldError)return Response.json({error:"queue_safety_check_failed"},{status:500});
 if((oldCount||0)>0)return Response.json({action:"queue_review_required",old_pending:oldCount,messages_sent:0,emails_sent:0},{status:409});
 const results=[];
 for(let i=0;i<5;i++){
  const {data,error}=await db.rpc("anybike_deliver_onboarding_one");
  if(error)return Response.json({error:error.message,results},{status:500});
  if(!data||data.action!=="delivered"){results.push(data);break;}
  const {data:outboxId,error:oe}=await db.rpc("anybike_register_onboarding_email",{p_queue_id:data.queue_id,p_message_id:data.message_id});
  if(oe){results.push({queue_id:data.queue_id,thread_id:data.thread_id,email:"registration_failed",error:oe.message});break;}
  results.push({queue_id:data.queue_id,thread_id:data.thread_id,outbox_id:outboxId,email:"registered"});
 }
 const emails=[];
 for(let i=0;i<5;i++){
  const response=await fetch(url+"/functions/v1/anybike-onboarding-email-sender",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:"{}"});
  let body:any={};try{body=await response.json()}catch{}
  if(!response.ok){emails.push({error:"email_sender_failed",status:response.status});break;}
  if(body.result?.action==="empty"||body.result?.action==="disabled")break;
  emails.push({outbox_id:body.outbox_id,status:body.status||"unknown"});
  if(!body.outbox_id)break;
 }
 return Response.json({sending_enabled:true,results,emails});
});