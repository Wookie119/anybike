
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_ROLE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const admin=createClient(SUPABASE_URL,SERVICE_ROLE,{auth:{persistSession:false}});

function clean(v:any){return String(v??"").replace(/\s+/g," ").trim();}
function json(body:any,status=200){return new Response(JSON.stringify(body),{status,headers:{
  "Content-Type":"application/json",
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
}});}
async function requireAdmin(req:Request){
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token) return false;
  const u=await admin.auth.getUser(token);
  const user=u.data.user;
  if(!user) return false;
  const a=await admin.from("admin_users").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
  return !!a.data;
}
async function fetchReader(url:string){
  const r=await fetch("https://r.jina.ai/"+url,{headers:{"User-Agent":"AnyBike Live Source Hub/3.0","Accept":"text/plain"}});
  if(!r.ok) throw new Error("Source reader HTTP "+r.status);
  return (await r.text()).slice(0,8000000);
}
function money(v:string){const m=v.match(/£\s*([\d,]+(?:\.\d+)?)/);return m?Number(m[1].replace(/,/g,"")):null;}
function images(md:string){
  const a:string[]=[];
  for(const m of md.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)){if(!a.includes(m[1]))a.push(m[1]);}
  return a.slice(0,12);
}
function titleLink(line:string,base:string){
  const m=line.match(/\[([^\]]+)\]\(([^)]+)\)/);
  let url="";
  try{url=new URL(m?.[2]||"",base).toString();}catch{}
  return {title:clean(m?.[1]||line.replace(/^.*?##\s+/,"")),url};
}
function sykesModel(title:string){
  let x=clean(title).replace(/^NEW\s+/i,"").replace(/^20\d{2}\s+/,"").replace(/^Harley-Davidson(?:®)?\s+/i,"").replace(/\s+in\s+.+$/i,"");
  const p=x.split(/\s+/).filter(Boolean); let variant:any=null;
  if(p.length>1 && /^[A-Z0-9-]{3,12}$/.test(p[0]) && /\d/.test(p[0])) variant=p.shift();
  return {model:clean(p.join(" "))||x,variant};
}
function parseSykes(md:string,base:string){
  const out:any[]=[];
  const text=String(md||"");
  const re=/##\s+\[([^\]]*Harley-Davidson[^\]]*)\]\(([^)]+)\)([\s\S]*?)(?=(?:\n\s*(?:\*\s*)*##\s+\[)|$)/gi;
  let m:RegExpExecArray|null;
  while((m=re.exec(text))!==null){
    const title=clean(m[1]||"");
    let sourceUrl="";
    try{sourceUrl=new URL(m[2]||"",base).toString();}catch{}
    const block=String(m[3]||"");
    if(sourceUrl && !/\/inventory\//i.test(sourceUrl)) continue;

    const priceMatch=block.match(/£\s*([\d,]+(?:\.\d+)?)/);
    const stockMatch=block.match(/(?:^|\n)\s*(\d{4,7})\s*(?:\n|$)/);
    const conditionMatch=block.match(/(?:^|\n)\s*(New|Pre-owned)\s*(?:\n|$)/i);
    const yearMatch=block.match(/(?:^|\n)\s*(20\d{2})\s*(?:\n|$)/);
    const mileageMatch=block.match(/(?:^|\n)\s*([\d,]+)\s*mi\s*(?:\n|$)/i);
    const makePos=block.search(/Harley-Davidson®?/i);
    let colour:any=null;
    if(makePos>=0){
      const tail=block.slice(makePos).split(/\r?\n/).map(x=>clean(x)).filter(Boolean);
      const idx=tail.findIndex(x=>/^Harley-Davidson®?$/i.test(x));
      if(idx>=0 && tail[idx+1]) colour=tail[idx+1];
    }
    const mv=sykesModel(title);
    if(!priceMatch||!stockMatch||!mv.model) continue;

    const plain=block.split(/\r?\n/).map(x=>clean(x)).filter(Boolean);
    let desc="";
    for(const x of plain){
      if(/^(£|New$|Pre-owned$|20\d{2}$|[\d,]+\s*mi$|\d{4,7}$|Harley-Davidson®?$)/i.test(x)) continue;
      if(/Find out more|Book test ride|Request details/i.test(x)) continue;
      if(x.length>45){desc=x;break;}
    }

    out.push({
      source_stock_id:stockMatch[1],
      source_key:stockMatch[1],
      source_url:sourceUrl||base,
      source_domain:"sykeshd.com",
      seller_name:"Sykes Harley-Davidson",
      seller_phone:"01825 872003",
      seller_address:"Holmes Hill, Nr Lewes, BN8 6JA",
      make:"Harley-Davidson",
      model:mv.model,
      variant:mv.variant,
      year:yearMatch?Number(yearMatch[1]):null,
      mileage:mileageMatch?Number(mileageMatch[1].replace(/,/g,"")):(conditionMatch&&/^New$/i.test(conditionMatch[1])?0:null),
      colour:colour||null,
      source_advertised_price_gbp:Number(priceMatch[1].replace(/,/g,"")),
      description_original:desc||title,
      specification:{condition:conditionMatch?.[1]||null,source:"Sykes Harley-Davidson"},
      source_image_urls:images(block),
      raw_data:{title,condition:conditionMatch?.[1]||null}
    });
  }
  return out;
}
function parseVmoto(md:string,url:string){
  const tm=md.match(/^#\s+(.+)$/m); const model=clean(tm?.[1]||""); if(!model)return null;
  const pm=md.match(/Starting\s+from\s+£\s*([\d,]+(?:\.\d+)?)/i);
  const spec:any={};
  for(const line of md.split(/\r?\n/)){
    const m=line.match(/^\s*([^|\n]{2,60}?)\s+\|\s+(.+?)\s*$/);
    if(m)spec[clean(m[1]).toLowerCase().replace(/[^a-z0-9]+/g,"_")]=clean(m[2]);
  }
  let desc="";
  for(const x0 of md.split(/\r?\n/)){const x=clean(x0);if(x.length>90&&!/Vmoto is|privacy|cookie/i.test(x)){desc=x;break;}}
  const slug=new URL(url).pathname.split("/").filter(Boolean).pop()||model.toLowerCase().replace(/[^a-z0-9]+/g,"-");
  return {
    source_stock_id:"vmoto-"+slug,source_key:"vmoto-"+slug,source_url:url,source_domain:"vmoto.co.uk",
    seller_name:"VMoto UK",make:"VMoto",model,variant:null,year:null,mileage:0,colour:spec.colours||null,
    source_advertised_price_gbp:pm?Number(pm[1].replace(/,/g,"")):null,
    description_original:desc||("Official VMoto UK model catalogue entry for "+model+"."),
    specification:Object.assign({},spec,{catalogue_only:true,stock_note:"Confirm current UK stock with VMoto before offering a specific unit."}),
    source_image_urls:images(md),raw_data:{catalogue_only:true,source:"VMoto UK",model}
  };
}
async function upsert(connectorId:number,item:any){
  const key=clean(item.source_stock_id||item.source_key||item.source_url);
  const old=await admin.from("live_source_items").select("id,source_price_gbp,mileage,source_url").eq("connector_id",connectorId).eq("source_key",key).maybeSingle();
  if(old.error)throw old.error;
  const now=new Date().toISOString();
  const patch:any={
    updated_at:now,last_seen_at:now,ended_at:null,source_status:"live",source_url:item.source_url||"",
    source_stock_id:item.source_stock_id||null,source_domain:item.source_domain||null,seller_name:item.seller_name||null,
    seller_phone:item.seller_phone||null,seller_email:item.seller_email||null,seller_address:item.seller_address||null,
    make:item.make||null,model:item.model||null,variant:item.variant||null,year:item.year??null,mileage:item.mileage??null,
    colour:item.colour||null,registration:item.registration||null,engine_cc:item.engine_cc??null,
    source_price_gbp:item.source_advertised_price_gbp??null,description_original:item.description_original||null,
    specification:item.specification||{},source_image_urls:item.source_image_urls||[],raw_data:item.raw_data||item
  };
  if(old.data){
    if(Number(old.data.source_price_gbp||0)!==Number(patch.source_price_gbp||0)||Number(old.data.mileage||0)!==Number(patch.mileage||0)||String(old.data.source_url||"")!==String(patch.source_url||""))patch.last_changed_at=now;
    const r=await admin.from("live_source_items").update(patch).eq("id",old.data.id); if(r.error)throw r.error;
    return {isNew:false,key};
  }
  const r=await admin.from("live_source_items").insert(Object.assign({},patch,{connector_id:connectorId,source_key:key,first_seen_at:now})); if(r.error)throw r.error;
  return {isNew:true,key};
}
async function finalise(connector:any,items:any[]){
  const seen:string[]=[];let added=0;
  for(const item of items){const r=await upsert(Number(connector.id),item);seen.push(r.key);if(r.isNew)added++;}
  if(seen.length){
    const old=await admin.from("live_source_items").select("id,source_key").eq("connector_id",Number(connector.id)).eq("source_status","live");
    if(old.error)throw old.error;
    const ended=(old.data||[]).filter((x:any)=>!seen.includes(clean(x.source_key))).map((x:any)=>Number(x.id));
    if(ended.length){const now=new Date().toISOString();const e=await admin.from("live_source_items").update({source_status:"ended",ended_at:now,updated_at:now}).in("id",ended);if(e.error)throw e.error;}
  }
  const now=new Date().toISOString();
  await admin.from("live_source_connectors").update({last_refresh_completed_at:now,last_refresh_status:"success",last_live_count:items.length,updated_at:now}).eq("id",Number(connector.id));
  return {completed:true,discovered_count:items.length,added,message:"Source refresh completed."};
}
async function refreshSykes(connector:any){
  const out:any[]=[];const seen=new Set<string>();let total=0;
  for(let page=1;page<=12;page++){
    const u=new URL(connector.results_url||"https://sykeshd.com/inventory");u.searchParams.set("page",String(page));
    let md="";
    try{md=await fetchReader(u.toString());}
    catch{
      const direct=await fetch(u.toString(),{headers:{"User-Agent":"Mozilla/5.0 (compatible; AnyBike Live Source Hub/3.0)","Accept":"text/html,*/*"}});
      if(!direct.ok)throw new Error("Sykes source HTTP "+direct.status);
      md=await direct.text();
    }
    const tm=md.match(/Showing\s+\d+\s*-\s*\d+\s+of\s+(\d+)\s+results/i);if(tm)total=Number(tm[1]||0);
    const rows=parseSykes(md,u.toString());let n=0;
    for(const r of rows){if(!seen.has(r.source_stock_id)){seen.add(r.source_stock_id);out.push(r);n++;}}
    if(!n||total&&out.length>=total)break;
  }
  if(!out.length)throw new Error("Sykes inventory loaded but no motorcycle records could be parsed from the current page format.");
  return finalise(connector,out);
}
async function refreshVmoto(connector:any){
  const home=await fetchReader(connector.results_url||"https://vmoto.co.uk/");
  const urls:string[]=[];
  for(const m of home.matchAll(/\[[^\]]+\]\((https?:\/\/vmoto\.co\.uk\/bike\/[^)\s]+)\)/g)){if(!urls.includes(m[1]))urls.push(m[1]);}
  const fallback=["stash","tc-max","ts-street-hunter-pro","tc-wanderer-pro","tc","tsx","cux-pro","cpx","cpx-pro","cpx-explorer","vs1","vs2","vs3","cpx-fleet"].map(x=>"https://vmoto.co.uk/bike/"+x+"/");
  const targets=(urls.length?urls:fallback).slice(0,30);
  const out:any[]=[];
  for(const url of targets){try{const md=await fetchReader(url);const item=parseVmoto(md,url);if(item)out.push(item);}catch{}}
  if(!out.length)throw new Error("VMoto model parser found no current models.");
  return finalise(connector,out);
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return json({});
  if(req.method!=="POST")return json({error:"POST required"},405);
  if(!(await requireAdmin(req)))return json({error:"Admin access required"},403);
  try{
    const body=await req.json().catch(()=>({}));
    const id=Number(body.connector_id||0);
    const q=await admin.from("live_source_connectors").select("*").eq("id",id).eq("enabled",true).maybeSingle();
    if(q.error)throw q.error;if(!q.data)return json({error:"Source connector not found"},404);
    await admin.from("live_source_connectors").update({last_refresh_started_at:new Date().toISOString(),last_refresh_status:"running"}).eq("id",id);
    let result:any;
    if(q.data.adapter_key==="sykes-hd-uk")result=await refreshSykes(q.data);
    else if(q.data.adapter_key==="vmoto-uk-catalogue")result=await refreshVmoto(q.data);
    else return json({error:"Unsupported partner source adapter"},400);
    return json(result);
  }catch(e){
    const message=clean(e instanceof Error?e.message:e);
    try{
      const body=await req.clone().json().catch(()=>({}));
      const id=Number(body.connector_id||0);
      if(id) await admin.from("live_source_connectors").update({
        last_refresh_completed_at:new Date().toISOString(),
        last_refresh_status:"failed",
        updated_at:new Date().toISOString()
      }).eq("id",id);
    }catch{}
    return json({error:message},500);
  }
});
