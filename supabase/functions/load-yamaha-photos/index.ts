import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const db=createClient(Deno.env.get("SUPABASE_URL")||"",Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",{auth:{persistSession:false}});
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
function urls(html:string,base:string){
 const found:string[]=[];
 const add=(v:string)=>{
   try{
     const u=new URL(v.replace(/&amp;/g,"&").replace(/\\\//g,"/"),base);
     if(!/^https?:$/.test(u.protocol))return;
     if(!/\.(?:png|webp|jpe?g)(?:$|[?#])/i.test(u.href)&& !/\/(?:images?|media|uploads|stock)\//i.test(u.pathname))return;
     if(/logo|placeholder|icon|banner|sprite|cookie|finance|warranty/i.test(u.href))return;
     if(!found.includes(u.href))found.push(u.href);
   }catch{}
 };
 for(const t of html.matchAll(/<(?:img|source)\b[^>]*>/gi)){
   if(/logo|icon|header|footer/i.test(t[0]))continue;
   for(const m of t[0].matchAll(/(?:data-src|data-original|data-full|data-image|src|srcset)\s*=\s*["']([^"']+)["']/gi))
     for(const part of m[1].split(","))add(part.trim().split(/\s+/)[0]);
 }
 for(const m of html.matchAll(/["']((?:https?:)?\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?)["']/gi))add(m[1]);
 return found.slice(0,12);
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return reply({});
 if(req.method!=="POST")return reply({error:"POST only"},405);
 try{
   const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
   const {data:{user},error:userError}=await db.auth.getUser(token);
   if(userError||!user)return reply({error:"Login required"},401);
   const admin=await db.from("admin_users").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
   if(!admin.data)return reply({error:"Admin required"},403);
   const body=await req.json();
   if(Number(body.connector_id)!==7)return reply({error:"Yamaha connector only"},400);
   const offset=Math.max(0,Math.floor(Number(body.offset)||0));
   const size=8;
   const list=await db.from("live_source_items").select("id,source_url,source_stock_id,source_image_urls").eq("connector_id",7).eq("source_status","live").order("id",{ascending:true}).range(offset,offset+size-1);
   if(list.error)throw list.error;
   let withPhotos=0;let inspected=0;
   for(const item of list.data||[]){
     inspected++;
     if(Array.isArray(item.source_image_urls)&&item.source_image_urls.length){withPhotos++;continue;}
     try{
       const url=String(item.source_url||"");
       if(!url.startsWith("https://cpo.yamaha-motor.co.uk/"))continue;
       const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; AnyBike/1.0)","Accept":"text/html"}});
       if(!res.ok)continue;
       const pictures=urls(await res.text(),url);
       if(!pictures.length)continue;
       const saved=await db.from("live_source_items").update({source_image_urls:pictures,updated_at:new Date().toISOString()}).eq("id",item.id);
       if(saved.error)throw saved.error;
       withPhotos++;
     }catch(e){console.error("Yamaha photo",item.id,String(e));}
   }
   return reply({completed:(list.data||[]).length<size,next_offset:offset+(list.data||[]).length,checked:inspected,with_photos:withPhotos});
 }catch(e){console.error(e);return reply({error:String(e)},500);}
});