
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
  const re=/##\s+(?:\[)?([^\n\]]*Harley-Davidson[^\n\]]*)(?:\]\(([^)]+)\))?([\s\S]*?)(?=\n\s*(?:\*\s*)*##\s+|$)/gi;
  let m:RegExpExecArray|null;
  while((m=re.exec(text))!==null){
    const title=clean(m[1]||"");
    let sourceUrl=base;
    if(m[2]){
      try{sourceUrl=new URL(m[2],base).toString();}catch{}
    }
    const block=String(m[3]||"");

    const priceMatch=block.match(/£\s*([\d,]+(?:\.\d+)?)/);
    const stockMatch=block.match(/(?:^|\n)\s*(\d{4,7})\s*(?:\n|$)/);
    const conditionMatch=block.match(/(?:^|\n)\s*(New|Pre-owned|Used)\s*(?:\n|$)/i);
    const yearMatch=block.match(/(?:^|\n)\s*(20\d{2})\s*(?:\n|$)/);
    const mileageMatch=block.match(/(?:^|\n)\s*([\d,]+)\s*mi\s*(?:\n|$)/i);

    if(!priceMatch||!stockMatch) continue;

    const makePos=block.search(/Harley-Davidson®?/i);
    let colour:any=null;
    if(makePos>=0){
      const tail=block.slice(makePos).split(/\r?\n/).map(x=>clean(x)).filter(Boolean);
      const idx=tail.findIndex(x=>/^Harley-Davidson®?$/i.test(x));
      if(idx>=0 && tail[idx+1]) colour=tail[idx+1];
    }

    const mv=sykesModel(title);
    if(!mv.model) continue;

    const plain=block.split(/\r?\n/).map(x=>clean(x)).filter(Boolean);
    let desc="";
    for(const x of plain){
      if(/^(£|New$|Pre-owned$|Used$|20\d{2}$|[\d,]+\s*mi$|\d{4,7}$|Harley-Davidson®?$)/i.test(x)) continue;
      if(/Find out more|Book test ride|Request details/i.test(x)) continue;
      if(x.length>45){desc=x;break;}
    }

    out.push({
      source_stock_id:stockMatch[1],
      source_key:stockMatch[1],
      source_url:sourceUrl,
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
function parseSykesLoose(md:string,base:string){
  const text=String(md||"").replace(/\r/g,"");
  const lines=text.split("\n");
  const starts:number[]=[];
  for(let i=0;i<lines.length;i++){
    const x=clean(lines[i]).replace(/^[*#\-\s]+/,"");
    if(/(?:NEW\s+)?20\d{2}\s+Harley-Davidson\b/i.test(x) || /^Harley-Davidson\b/i.test(x)){
      const nearby=lines.slice(i,i+12).join("\n");
      if(/£\s*[\d,]+/.test(nearby) && /\b(?:New|Pre-owned|Used)\b/i.test(nearby)) starts.push(i);
    }
  }

  const out:any[]=[];
  for(let s=0;s<starts.length;s++){
    const i=starts[s];
    const next=starts[s+1]??Math.min(lines.length,i+40);
    const blockLines=lines.slice(i,next);
    const block=blockLines.join("\n");
    const title=clean(blockLines[0]).replace(/^[*#\-\s]+/,"");
    const priceMatch=block.match(/£\s*([\d,]+(?:\.\d+)?)/);
    const yearMatch=block.match(/\b(20\d{2})\b/);
    const conditionMatch=block.match(/(?:^|\n)\s*(New|Pre-owned|Used)\s*(?:\n|$)/i);
    const mileageMatch=block.match(/\b([\d,]+)\s*(?:mi|miles)\b/i);

    let stock="";
    for(const lm of block.matchAll(/(?:^|\n)\s*(\d{4,7})\s*(?=\n|$)/g)){
      const candidate=lm[1];
      if(candidate!==yearMatch?.[1] && candidate!==mileageMatch?.[1]?.replace(/,/g,"")){
        stock=candidate;break;
      }
    }
    if(!priceMatch||!stock) continue;

    const mv=sykesModel(title);
    if(!mv.model) continue;

    let colour:any=null;
    const hdLine=blockLines.findIndex(x=>/^Harley-Davidson®?\s*$/i.test(clean(x)));
    if(hdLine>=0){
      for(let k=hdLine+1;k<Math.min(blockLines.length,hdLine+4);k++){
        const v=clean(blockLines[k]);
        if(v && !/^(New|Pre-owned|Used|20\d{2}|\d{4,7})$/i.test(v)){colour=v;break;}
      }
    }

    let detailUrl=base;
    const link=block.match(/\((https?:\/\/sykeshd\.com\/inventory\/\d+\/[^)\s]+)\)/i);
    if(link) detailUrl=link[1];

    let desc="";
    for(const raw of blockLines){
      const x=clean(raw).replace(/^[*#\-\s]+/,"");
      if(!x||x===title)continue;
      if(/^£/.test(x)||/^(New|Pre-owned|Used|20\d{2}|\d{4,7}|Harley-Davidson®?)$/i.test(x))continue;
      if(/Find out more|Book test ride|Request details/i.test(x))continue;
      if(x.length>45){desc=x;break;}
    }

    out.push({
      source_stock_id:stock,source_key:stock,source_url:detailUrl,source_domain:"sykeshd.com",
      seller_name:"Sykes Harley-Davidson",seller_phone:"01825 872003",seller_address:"Holmes Hill, Nr Lewes, BN8 6JA",
      make:"Harley-Davidson",model:mv.model,variant:mv.variant,year:yearMatch?Number(yearMatch[1]):null,
      mileage:mileageMatch?Number(mileageMatch[1].replace(/,/g,"")):(conditionMatch&&/^New$/i.test(conditionMatch[1])?0:null),
      colour:colour||null,source_advertised_price_gbp:Number(priceMatch[1].replace(/,/g,"")),
      description_original:desc||title,specification:{condition:conditionMatch?.[1]||null,source:"Sykes Harley-Davidson"},
      source_image_urls:images(block),raw_data:{title,condition:conditionMatch?.[1]||null}
    });
  }
  return [...new Map(out.map((x:any)=>[String(x.source_stock_id),x])).values()];
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

function decodeHtml(v:string){
  return String(v||"")
    .replace(/&nbsp;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&pound;/gi,"£")
    .replace(/&#(\d+);/g,(_m,n)=>{try{return String.fromCharCode(Number(n))}catch{return " "}});
}
function htmlText(html:string){
  return clean(decodeHtml(String(html||"")
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<\/(?:h1|h2|h3|h4|p|div|li|tr|section|article)>/gi,"\n")
    .replace(/<br\s*\/?>/gi,"\n")
    .replace(/<[^>]+>/g," ")
    .replace(/[ \t]+\n/g,"\n")
    .replace(/\n[ \t]+/g,"\n")));
}
function attrImages(html:string,base:string){
  const out:string[]=[];
  for(const m of String(html||"").matchAll(/(?:src|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)){
    try{
      const u=new URL(decodeHtml(m[1]),base).toString();
      if(!out.includes(u))out.push(u);
    }catch{}
  }
  return out.filter(x=>!/logo|icon|sprite|avatar|cookie/i.test(x)).slice(0,12);
}
function sykesDetailUrls(html:string,base:string){
  const out:string[]=[];
  for(const m of String(html||"").matchAll(/href=["']([^"']*\/inventory\/\d+\/[^"'?#]+[^"']*)["']/gi)){
    try{
      const u=new URL(decodeHtml(m[1]),base).toString();
      if(!out.includes(u))out.push(u);
    }catch{}
  }
  return out;
}
function parseSykesDetailHtml(html:string,url:string){
  const text=htmlText(html);
  const title=
    decodeHtml((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||"").replace(/<[^>]+>/g," ").trim() ||
    decodeHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||"").replace(/\|.*$/,"").trim();
  const priceMatch=text.match(/(?:Price:\s*)?£\s*([\d,]+(?:\.\d+)?)/i);
  const stockCandidates=[...text.matchAll(/\b(\d{4,7})\b/g)].map(m=>m[1]);
  const yearMatch=text.match(/\b(20\d{2})\b/);
  const conditionMatch=text.match(/\b(New|Pre-owned|Used)\b/i);
  const mileageMatch=text.match(/\b([\d,]+)\s*(?:mi|miles)\b/i);
  const vinMatch=text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  const stock=stockCandidates.find(x=>x!==yearMatch?.[1] && x!==mileageMatch?.[1]?.replace(/,/g,""))||"";
  const make="Harley-Davidson";
  const mv=sykesModel(title);
  if(!priceMatch||!stock||!mv.model)return null;

  let colour:any=null;
  const colourMatch=text.match(/Harley-Davidson®?\s+(?:Cruiser|Touring|Adventure Touring|Sport|CVO|Softail|Sportster)?\s*(?:New|Pre-owned|Used)\s+20\d{2}\s+([^£\n]{3,80}?)(?:Book test ride|Reserve This Bike|Finance|Request details|01825)/i);
  if(colourMatch)colour=clean(colourMatch[1]);

  return {
    source_stock_id:stock,
    source_key:stock,
    source_url:url,
    source_domain:"sykeshd.com",
    seller_name:"Sykes Harley-Davidson",
    seller_phone:"01825 872003",
    seller_address:"Holmes Hill, Nr Lewes, BN8 6JA",
    make,
    model:mv.model,
    variant:mv.variant,
    year:yearMatch?Number(yearMatch[1]):null,
    mileage:mileageMatch?Number(mileageMatch[1].replace(/,/g,"")):(conditionMatch&&/^New$/i.test(conditionMatch[1])?0:null),
    colour:colour||null,
    registration:null,
    source_advertised_price_gbp:Number(priceMatch[1].replace(/,/g,"")),
    description_original:text.slice(0,2500),
    specification:{condition:conditionMatch?.[1]||null,vin:vinMatch?.[1]||null,source:"Sykes Harley-Davidson"},
    source_image_urls:attrImages(html,url),
    raw_data:{title,condition:conditionMatch?.[1]||null,vin:vinMatch?.[1]||null}
  };
}
async function fetchDirect(url:string){
  const r=await fetch(url,{redirect:"follow",headers:{
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
    "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language":"en-GB,en;q=0.9"
  }});
  if(!r.ok)throw new Error("Source HTTP "+r.status);
  return await r.text();
}

async function refreshSykes(connector:any){
  const inventoryUrl=connector.results_url||"https://sykeshd.com/inventory";
  let indexHtml="";
  try{indexHtml=await fetchDirect(inventoryUrl);}catch{}
  let urls=indexHtml?sykesDetailUrls(indexHtml,inventoryUrl):[];
  let readerMd="";
  try{readerMd=await fetchReader(inventoryUrl);}catch{}
  const looseFirst=readerMd?parseSykesLoose(readerMd,inventoryUrl):[];
  if(looseFirst.length){
    return finalise(connector,looseFirst);
  }

  if(!urls.length){
    try{
      const md=await fetchReader(inventoryUrl);
      for(const m of md.matchAll(/\[[^\]]+\]\((https?:\/\/sykeshd\.com\/inventory\/\d+\/[^)\s]+)\)/g)){
        if(!urls.includes(m[1]))urls.push(m[1]);
      }
    }catch{}
  }

  // If the first inventory page exposes pagination, collect detail links from subsequent pages.
  for(let page=2;page<=10 && urls.length<100;page++){
    try{
      const u=new URL(inventoryUrl);u.searchParams.set("page",String(page));
      const html=await fetchDirect(u.toString());
      const pageUrls=sykesDetailUrls(html,u.toString());
      let added=0;
      for(const x of pageUrls){if(!urls.includes(x)){urls.push(x);added++;}}
      if(!added)break;
    }catch{break;}
  }

  urls=[...new Set(urls)].slice(0,100);
  const out:any[]=[];
  for(const url of urls){
    try{
      const html=await fetchDirect(url);
      const item=parseSykesDetailHtml(html,url);
      if(item)out.push(item);
    }catch{}
  }

  if(!out.length){
    // Final fallback: parse the public inventory text directly.
    try{
      const md=await fetchReader(inventoryUrl);
      const parsedLoose=parseSykesLoose(md,inventoryUrl);
      out.push(...(parsedLoose.length?parsedLoose:parseSykes(md,inventoryUrl)));
    }catch{}
  }

  const unique=[...new Map(out.map((x:any)=>[String(x.source_stock_id),x])).values()];
  if(!unique.length)throw new Error("Sykes source is reachable but no complete motorcycle records could be extracted.");
  return finalise(connector,unique);
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
  let connectorId=0;
  try{
    const body=await req.json().catch(()=>({}));
    const id=Number(body.connector_id||0);
    connectorId=id;
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
      if(connectorId) await admin.from("live_source_connectors").update({
        last_refresh_completed_at:new Date().toISOString(),
        last_refresh_status:"failed",
        updated_at:new Date().toISOString()
      }).eq("id",connectorId);
    }catch{}
    console.error("refresh-partner-live-source",connectorId,message);
    return json({error:message,failed:true},200);
  }
});
