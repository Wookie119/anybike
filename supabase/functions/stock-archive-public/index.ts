// Read-only archive service. Database view is the sole publication boundary.
const headers={"Access-Control-Allow-Origin":"https://www.anybike.co.uk","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type","Cache-Control":"no-store","Content-Type":"application/json"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="GET")return reply({error:"Method not allowed"},405);
 const p=new URL(req.url).searchParams;
 const raw=p.get("id");
 if(raw!==null&&(!raw||!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw))||Number(raw)<1))return reply({error:"Invalid motorcycle ID"},400);
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!base||!key)return reply({error:"Archive unavailable"},503);
 try{
 const query=new URLSearchParams({select:"item_id,make,model,year,mileage,ended_at,public_description,image_url",item_id:"eq."+Number(raw),limit:"1"});
 if(raw===null){
  query.delete("item_id");query.set("select","item_id,make,model,year,mileage,ended_at");query.set("limit","100");query.set("order","item_id.asc");
  const after=p.get("after")||"0";if(!/^\d+$/.test(after)||!Number.isSafeInteger(Number(after)))return reply({error:"Invalid cursor"},400);
  query.set("item_id","gt."+Number(after));
 }
 const res=await fetch(base+"/rest/v1/stock_archive_publication_v1?"+query,{headers:{apikey:key,Authorization:"Bearer "+key},signal:AbortSignal.timeout(7000)});
 if(!res.ok)return reply({error:"Archive unavailable"},503);
 const rows=await res.json();
 if(!Array.isArray(rows))return reply({error:"Archive unavailable"},503);
 if(raw===null)return reply({items:rows,next:rows.length===100?rows[rows.length-1].item_id:null});
 if(!rows.length)return reply({error:"Archive record unavailable"},404);
 return reply({item:rows[0]});
 }catch{return reply({error:"Archive unavailable"},503);}
});