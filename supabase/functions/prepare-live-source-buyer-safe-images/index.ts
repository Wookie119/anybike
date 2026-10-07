import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

function json(body:any,status=200){
  return new Response(JSON.stringify(body),{status,headers:{
    "Content-Type":"application/json",
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS"
  }});
}
function clean(v:any){return String(v??"").replace(/\s+/g," ").trim();}

export default {
  fetch: withSupabase({auth:["user"]},async(req,ctx)=>{
    if(req.method==="OPTIONS")return json({ok:true});
    if(req.method!=="POST")return json({error:"POST required"},405);

    const authorization=req.headers.get("Authorization")||"";
    const token=authorization.replace(/^Bearer\s+/i,"").trim();
    const {data:{user},error:userError}=await ctx.supabaseAdmin.auth.getUser(token);
    if(userError||!user)return json({error:userError?.message||"Authentication required"},401);

    const {data:adminUser,error:adminError}=await ctx.supabaseAdmin.from("admin_users")
      .select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
    if(adminError)return json({error:adminError.message},500);
    if(!adminUser)return json({error:"Admin access required"},403);

    const body=await req.json().catch(()=>({}));
    const itemId=Number(body.live_source_item_id||0);
    if(!Number.isFinite(itemId)||itemId<=0)return json({error:"live_source_item_id required"},400);

    let {data:item,error:itemError}=await ctx.supabaseAdmin.from("live_source_items")
      .select("id,connector_id,source_stock_id,source_status,source_image_urls")
      .eq("id",itemId).maybeSingle();
    if(itemError||!item)return json({error:itemError?.message||"Live Source item not found"},404);
    if(item.source_status!=="live")return json({error:"This motorcycle is no longer live"},409);

    const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
    const publicKey=req.headers.get("apikey")||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||
      Deno.env.get("SUPABASE_ANON_KEY")||
      "";
    const publicKeyResolved=publicKey;
    const targetSafeCount=Math.max(1,Math.min(8,Number(body.target_safe_count||6)));

    let realImages=(Array.isArray(item.source_image_urls)?item.source_image_urls:[])
      .filter((u:any)=>/\/api\/Image\/GetImg\?imgId=/i.test(String(u)));

    if(realImages.length<targetSafeCount && Number(item.connector_id)===1 && supabaseUrl && publicKeyResolved){
      try{
        const loadRes=await fetch(supabaseUrl+"/functions/v1/refresh-bmw-live-source-images",{
          method:"POST",
          headers:{
            "Authorization":authorization,
            "apikey":publicKeyResolved,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({connector_id:1,item_ids:[itemId]})
        });
        await loadRes.json().catch(()=>null);
        const refreshed=await ctx.supabaseAdmin.from("live_source_items")
          .select("id,connector_id,source_stock_id,source_status,source_image_urls")
          .eq("id",itemId).maybeSingle();
        if(!refreshed.error&&refreshed.data)item=refreshed.data;
        realImages=(Array.isArray(item.source_image_urls)?item.source_image_urls:[])
          .filter((u:any)=>/\/api\/Image\/GetImg\?imgId=/i.test(String(u)));
      }catch{}
    }

    if(!realImages.length){
      return json({error:"No real motorcycle photo could be loaded automatically for this bike."},409);
    }

    const secretKey=
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||
      Deno.env.get("SUPABASE_SECRET_KEY")||
      "";
    if(!supabaseUrl||!publicKeyResolved)return json({error:"Supabase function environment is incomplete"},500);
    if(!secretKey)return json({error:"Server-side buyer-safe worker key is unavailable"},500);

    const queueRes=await fetch(supabaseUrl+"/rest/v1/rpc/admin_queue_live_source_buyer_safe_v1",{
      method:"POST",
      headers:{
        "Authorization":authorization,
        "apikey":publicKey,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({p_item_ids:[itemId]})
    });
    const queueData=await queueRes.json().catch(()=>null);
    if(!queueRes.ok){
      return json({error:clean(queueData?.message||queueData?.error||"Could not queue BMW image for cleaning")},queueRes.status);
    }

    const {data:junction,error:junctionError}=await ctx.supabaseAdmin.from("junction_stock")
      .select("id")
      .eq("source_provider","bmw-approved-used-uk")
      .contains("extra_fields",{live_source_item_id:itemId})
      .order("id",{ascending:false})
      .limit(1)
      .maybeSingle();
    if(junctionError||!junction){
      return json({error:junctionError?.message||"BMW image bridge did not create Junction Stock"},500);
    }

    const processResults:any[]=[];
    for(let attempt=0;attempt<12;attempt++){
      const {data:currentSafe,error:currentSafeError}=await ctx.supabaseAdmin
        .from("anybike_live_source_buyer_safe_images")
        .select("id")
        .eq("live_source_item_id",itemId)
        .eq("safe_status","safe")
        .eq("approved_for_buyer_display",true);
      if(currentSafeError)return json({error:currentSafeError.message},500);
      if((currentSafe||[]).length>=targetSafeCount)break;

      const processRes=await fetch(supabaseUrl+"/functions/v1/process-buyer-safe-image",{
        method:"POST",
        headers:{
          "apikey":secretKey,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({junction_stock_id:Number(junction.id)})
      });
      const processData=await processRes.json().catch(()=>null);
      processResults.push(processData);

      if(!processRes.ok){
        const msg=clean(processData?.error||"Buyer-safe image cleaning failed");
        if(/no .*image|nothing|waiting|queue/i.test(msg))break;
        return json({
          error:msg,
          queue:queueData,
          process:processResults[processResults.length-1]||null,
          process_results:processResults,
          target_safe_count:targetSafeCount
        },processRes.status);
      }

      if(Number(processData?.processed||0)===0)break;
    }

    const {data:safeRows,error:safeError}=await ctx.supabaseAdmin
      .from("anybike_live_source_buyer_safe_images")
      .select("position,source_url,buyer_safe_url,safe_status,approved_for_buyer_display,blocked_reason,processed_at")
      .eq("live_source_item_id",itemId)
      .order("position",{ascending:true});
    if(safeError)return json({error:safeError.message},500);

    const rows=safeRows||[];
    const safe=rows.filter((x:any)=>x.safe_status==="safe"&&x.approved_for_buyer_display&&x.buyer_safe_url);
    const blocked=rows.filter((x:any)=>x.safe_status==="blocked_branding").length;
    const failed=rows.filter((x:any)=>x.safe_status==="failed").length;

    return json({
      success:true,
      live_source_item_id:itemId,
      junction_stock_id:Number(junction.id),
      safe_count:safe.length,
      source_image_count:realImages.length,
      blocked_branding_count:blocked,
      failed_count:failed,
      buyer_safe_urls:safe.map((x:any)=>x.buyer_safe_url),
      queue:queueData,
      process:processResults[processResults.length-1]||null,
      process_results:processResults,
      target_safe_count:targetSafeCount,
      results:rows,
      message:safe.length
        ? safe.length+" cleaned buyer-safe image"+(safe.length===1?"":"s")+" ready."
        : "Source images were processed but no buyer-safe image was approved yet."
    });
  })
};