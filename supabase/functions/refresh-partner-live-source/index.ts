
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
function stripReaderMarkup(v:string){
  return clean(String(v||"")
    .replace(/cite[^†]+†/g," ")
    .replace(/cite[^]*/g," ")
    .replace(/[]/g," ")
    .replace(/\[[^\]]+\]\(([^)]+)\)/g,(m)=>m.replace(/\]\([^)]+\)/,"").replace(/^\[/,""))
    .replace(/^[*#\-\s]+/," "));
}
function parseSykesLoose(md:string,base:string){
  const text=String(md||"").replace(/\r/g,"");
  const lines=text.split("\n");
  const starts:number[]=[];

  for(let i=0;i<lines.length;i++){
    const x=stripReaderMarkup(lines[i]);
    if(/\b(?:NEW\s+)?20\d{2}\s+Harley-Davidson\b/i.test(x)){
      const nearby=lines.slice(i,i+14).map(stripReaderMarkup).join("\n");
      if(/£\s*[\d,]+/.test(nearby) && /\b(?:New|Pre-owned|Used)\b/i.test(nearby)){
        starts.push(i);
      }
    }
  }

  const out:any[]=[];
  for(let s=0;s<starts.length;s++){
    const i=starts[s];
    const next=starts[s+1]??Math.min(lines.length,i+45);
    const blockLines=lines.slice(i,next);
    const cleanedLines=blockLines.map(stripReaderMarkup).filter(Boolean);
    const block=cleanedLines.join("\n");

    const titleLine=cleanedLines.find(x=>/\b(?:NEW\s+)?20\d{2}\s+Harley-Davidson\b/i.test(x))||"";
    const titleMatch=titleLine.match(/((?:NEW\s+)?20\d{2}\s+Harley-Davidson.*)$/i);
    const title=clean(titleMatch?.[1]||titleLine);

    const priceMatch=block.match(/£\s*([\d,]+(?:\.\d+)?)/);
    const yearMatch=title.match(/\b(20\d{2})\b/)||block.match(/\b(20\d{2})\b/);
    const conditionMatch=block.match(/(?:^|\n)(New|Pre-owned|Used)(?:\n|$)/i);
    const mileageMatch=block.match(/(?:^|\n)([\d,]+)\s*(?:mi|miles)(?:\n|$)/i);

    let stock="";
    for(const line of cleanedLines){
      const m=line.match(/^(\d{4,7})$/);
      if(!m) continue;
      const candidate=m[1];
      if(candidate!==yearMatch?.[1] && candidate!==mileageMatch?.[1]?.replace(/,/g,"")){
        stock=candidate;
        break;
      }
    }

    if(!priceMatch||!stock||!title) continue;

    const mv=sykesModel(title);
    if(!mv.model) continue;

    let colour:any=null;
    const hdLine=cleanedLines.findIndex(x=>/^Harley-Davidson®?$/i.test(x));
    if(hdLine>=0){
      for(let k=hdLine+1;k<Math.min(cleanedLines.length,hdLine+4);k++){
        const v=cleanedLines[k];
        if(v && !/^(New|Pre-owned|Used|20\d{2}|\d{4,7}|[\d,]+\s*(?:mi|miles))$/i.test(v)){
          colour=v;break;
        }
      }
    }

    let detailUrl=base;
    const urlMatch=blockLines.join("\n").match(/https?:\/\/sykeshd\.com\/inventory\/\d+\/[^)\s]+/i);
    if(urlMatch)detailUrl=urlMatch[0];

    let desc="";
    for(const x of cleanedLines){
      if(!x||x===title)continue;
      if(/^£/.test(x)||/^(New|Pre-owned|Used|20\d{2}|\d{4,7}|Harley-Davidson®?|[\d,]+\s*(?:mi|miles))$/i.test(x))continue;
      if(/Find out more|Book test ride|Request details/i.test(x))continue;
      if(x.length>45){desc=x;break;}
    }

    out.push({
      source_stock_id:stock,
      source_key:stock,
      source_url:detailUrl,
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
      source_image_urls:images(blockLines.join("\n")),
      raw_data:{title,condition:conditionMatch?.[1]||null}
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

function parseSykesSequence(md:string,base:string){
  const raw=String(md||"").replace(/\r/g,"");
  const cleaned=raw
    .replace(/cite\d+†/g,"")
    .replace(/cite[^]*/g,"")
    .replace(/[]/g,"");

  const out:any[]=[];
  const re=/(?:^|\n)[^\n]{0,120}?((?:NEW\s+)?(20\d{2})\s+Harley-Davidson[^\n]{5,180})\n[\s\S]{0,260}?£\s*([\d,]+(?:\.\d+)?)\s*\n[\s\S]{0,120}?\b(\d{4,7})\b\s*\n[\s\S]{0,80}?\b(New|Pre-owned|Used)\b\s*\n[\s\S]{0,80}?\b(20\d{2})\b([\s\S]{0,420}?)(?=(?:\n[^\n]{0,120}?(?:NEW\s+)?20\d{2}\s+Harley-Davidson)|$)/gi;

  let m:RegExpExecArray|null;
  while((m=re.exec(cleaned))!==null){
    const title=clean(m[1]||"")
      .replace(/^[*#\-\s]+/,"")
      .replace(/\[([^\]]+)\]\([^)]+\)/g,"$1");
    const year=Number(m[2]||m[6]||0)||null;
    const price=Number(String(m[3]||"").replace(/,/g,""));
    const stock=String(m[4]||"");
    const condition=clean(m[5]||"");
    const tail=String(m[7]||"");

    const mileageMatch=tail.match(/(?:^|\n)\s*([\d,]+)\s*(?:mi|miles)\b/i);
    const mileage=mileageMatch?Number(mileageMatch[1].replace(/,/g,"")):(/^New$/i.test(condition)?0:null);

    const tailLines=tail.split("\n").map(x=>clean(x).replace(/^[*#\-\s]+/,"")).filter(Boolean);
    let colour:any=null;
    const hdIndex=tailLines.findIndex(x=>/^Harley-Davidson®?$/i.test(x));
    if(hdIndex>=0 && tailLines[hdIndex+1]) colour=tailLines[hdIndex+1];
    if(!colour){
      colour=tailLines.find(x=>x && !/^(Harley-Davidson®?|Find out more|Book test ride|Request details)$/i.test(x) && !/^\d/.test(x) && x.length<90) || null;
    }

    let sourceUrl=base;
    const nearby=raw.slice(Math.max(0,m.index-250),Math.min(raw.length,m.index+500));
    const link=nearby.match(/\[[^\]]*Harley-Davidson[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
    if(link) sourceUrl=link[1];

    const mv=sykesModel(title);
    if(!mv.model || !stock || !price) continue;

    out.push({
      source_stock_id:stock,
      source_key:stock,
      source_url:sourceUrl,
      source_domain:"sykeshd.com",
      seller_name:"Sykes Harley-Davidson",
      seller_phone:"01825 872003",
      seller_address:"Holmes Hill, Nr Lewes, BN8 6JA",
      make:"Harley-Davidson",
      model:mv.model,
      variant:mv.variant,
      year,
      mileage,
      colour:colour||null,
      source_advertised_price_gbp:price,
      description_original:title,
      specification:{condition,source:"Sykes Harley-Davidson"},
      source_image_urls:images(tail),
      raw_data:{title,condition}
    });
  }
  return [...new Map(out.map((x:any)=>[String(x.source_stock_id),x])).values()];
}

async function refreshSykes(connector:any){
  const inventoryUrl=connector.results_url||"https://sykeshd.com/inventory";
  const collected:any[]=[];
  const seen=new Set<string>();

  for(let page=1;page<=10;page++){
    const u=new URL(inventoryUrl);
    if(page>1) u.searchParams.set("page",String(page));

    let md="";
    try{md=await fetchReader(u.toString());}
    catch{
      try{
        const html=await fetchDirect(u.toString());
        md=htmlText(html);
      }catch{}
    }

    if(!md) break;

    let rows=parseSykesSequence(md,u.toString());
    if(!rows.length) rows=parseSykesLoose(md,u.toString());
    if(!rows.length) rows=parseSykes(md,u.toString());

    let added=0;
    for(const row of rows){
      const key=String(row.source_stock_id||"");
      if(!key||seen.has(key)) continue;
      seen.add(key);
      collected.push(row);
      added++;
    }

    const totalMatch=md.match(/Showing\s+\d+\s*-\s*\d+\s+of\s+(\d+)\s+results/i);
    const total=Number(totalMatch?.[1]||0);
    if(total && collected.length>=total) break;
    if(!added) break;
  }

  if(!collected.length){
    throw new Error("Sykes source is reachable but no complete motorcycle records could be extracted.");
  }

  // Enrich records from detail pages where a usable detail URL was exposed.
  for(let i=0;i<collected.length;i++){
    const item=collected[i];
    if(!/\/inventory\/\d+\//i.test(String(item.source_url||""))) continue;
    try{
      const html=await fetchDirect(item.source_url);
      const detail=parseSykesDetailHtml(html,item.source_url);
      if(detail){
        collected[i]={
          ...item,
          ...detail,
          source_stock_id:item.source_stock_id,
          source_key:item.source_key
        };
      }
    }catch{}
  }

  return finalise(connector,collected);
}
function extractHarleyAssets(raw:string){
  const text=String(raw||"");
  const out:any[]=[];
  const seen=new Set<string>();

  // Preferred path: locate JSON objects shaped like {"Asset":{...}} exposed in the stock page.
  const startNeedle='{"Asset":{';
  let pos=0;
  while(true){
    const start=text.indexOf(startNeedle,pos);
    if(start<0)break;
    let depth=0,inString=false,escaped=false,end=-1;
    for(let i=start;i<text.length;i++){
      const ch=text[i];
      if(inString){
        if(escaped){escaped=false;continue;}
        if(ch==="\\"){escaped=true;continue;}
        if(ch==='"'){inString=false;}
        continue;
      }
      if(ch==='"'){inString=true;continue;}
      if(ch==='{')depth++;
      else if(ch==='}'){
        depth--;
        if(depth===0){end=i+1;break;}
      }
    }
    if(end<0)break;
    try{
      const parsed=JSON.parse(text.slice(start,end));
      const a=parsed?.Asset;
      if(a?.AssetID && !seen.has(String(a.AssetID))){
        seen.add(String(a.AssetID));
        out.push(a);
      }
    }catch{}
    pos=Math.max(end,start+startNeedle.length);
  }

  // Fallback: some renders expose the whole array as valid JSON.
  if(!out.length){
    try{
      const arr=JSON.parse(text);
      if(Array.isArray(arr)){
        for(const row of arr){
          const a=row?.Asset;
          if(a?.AssetID&&!seen.has(String(a.AssetID))){
            seen.add(String(a.AssetID));out.push(a);
          }
        }
      }
    }catch{}
  }
  return out;
}
function harleyCertifiedItem(a:any){
  const assetId=String(a?.AssetID||"");
  if(!assetId)return null;
  const assetName=clean(a?.AssetName||"");
  const make=clean(a?.Make||"Harley-Davidson")
    .replace(/^HARLEY-DAVIDSON$/i,"Harley-Davidson");
  const model=clean(a?.Model||assetName.replace(/^\d{4}\s+/,"").replace(/^HARLEY-DAVIDSON\s+/i,""));
  const year=Number(a?.Year||0)||null;
  const mileage=Number.isFinite(Number(a?.Mileage))?Number(a.Mileage):null;
  const price=Number.isFinite(Number(a?.DefaultPrice))?Number(a.DefaultPrice):null;
  const registration=clean(a?.Registration||"")||null;
  const colour=clean(a?.Colour||"")||null;
  const dealer=clean(a?.DealerName||"")||null;
  const postcode=clean(a?.PostCode||"");
  const location=clean(a?.Location||"");
  const category=clean(a?.Category||"");
  const slug=assetName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"");
  const detailUrl="https://www.h-dcertified.co.uk/gb/bikes/view/"+assetId+"/"+slug;
  const imageId=String(a?.MainImage||"");
  const imageUrls=imageId?[
    "https://www.h-dcertified.co.uk/gb/image/"+imageId
  ]:[];

  return {
    source_stock_id:assetId,
    source_key:assetId,
    source_url:detailUrl,
    source_domain:"h-dcertified.co.uk",
    seller_name:dealer,
    seller_address:[location,postcode].filter(Boolean).join(", ")||null,
    make,
    model,
    variant:category||null,
    year,
    mileage,
    colour,
    registration,
    source_advertised_price_gbp:price,
    description_original:assetName,
    specification:{
      category:category||null,
      certified:true,
      monthly_repayment:Number(a?.MonthlyRepayment||0)||null,
      owner_id:a?.OwnerID??null,
      locator_id:a?.LocatorID??null
    },
    source_image_urls:imageUrls,
    raw_data:a
  };
}
async function refreshHarleyCertified(connector:any){
  const collected:any[]=[];
  const seen=new Set<string>();
  let expected=0;

  for(let page=1;page<=40;page++){
    const url="https://www.h-dcertified.co.uk/gb/bikes/page/"+page;
    let raw="";
    try{
      const direct=await fetch(url,{redirect:"follow",headers:{
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        "Accept":"text/html,application/json,*/*",
        "Accept-Language":"en-GB,en;q=0.9"
      }});
      if(direct.ok)raw=await direct.text();
    }catch{}

    if(!raw){
      try{raw=await fetchReader(url);}catch{}
    }
    if(!raw)break;

    const countMatch=raw.match(/of\s+([\d,]+)\s+(?:results|bikes|vehicles)/i);
    if(countMatch) expected=Number(countMatch[1].replace(/,/g,""))||expected;

    const assets=extractHarleyAssets(raw);
    let added=0;
    for(const a of assets){
      const item=harleyCertifiedItem(a);
      if(!item)continue;
      const key=String(item.source_stock_id);
      if(seen.has(key))continue;
      seen.add(key);
      collected.push(item);
      added++;
    }

    if(expected && collected.length>=expected)break;
    if(!added)break;
  }

  if(!collected.length){
    throw new Error("Harley-Davidson Approved Used source is reachable but no structured motorcycle records could be extracted.");
  }

  return finalise(connector,collected);
}

function ducatiDetailLinks(raw:string,base:string){
  const out:string[]=[];
  const text=String(raw||"");
  for(const m of text.matchAll(/(?:https?:\/\/preowned\.ducati\.com)?\/models\/gb\/en\/detail\?vid=([A-Za-z0-9_-]+)/g)){
    const u="https://preowned.ducati.com/models/gb/en/detail?vid="+m[1];
    if(!out.includes(u))out.push(u);
  }
  for(const m of text.matchAll(/\[[^\]]+\]\((https?:\/\/preowned\.ducati\.com\/models\/gb\/en\/detail\?vid=[^)]+)\)/g)){
    if(!out.includes(m[1]))out.push(m[1]);
  }
  return out;
}
function parseDucatiDetail(raw:string,url:string){
  const text=String(raw||"")
    .replace(/\r/g,"")
    .replace(/&pound;/gi,"£")
    .replace(/&nbsp;/gi," ")
    .replace(/<[^>]+>/g,"\n")
    .replace(/\n{2,}/g,"\n");
  const cleanLines=text.split("\n").map(x=>clean(x)).filter(Boolean);

  let title="";
  for(const x of cleanLines){
    if(/^(?:Ducati\s+)?(?:Panigale|Multistrada|Monster|Diavel|Hypermotard|Scrambler|Streetfighter|SuperSport|DesertX|XDiavel|959|899|1299|1199|848|1098|749|999)/i.test(x)){
      title=x;break;
    }
  }
  if(!title){
    const tm=text.match(/(?:<title[^>]*>)?([^<\n]{3,120})\s*-\s*Pre-owned bikes/i);
    if(tm)title=clean(tm[1]);
  }
  title=title.replace(/^Ducati\s+/i,"").trim();
  if(!title)return null;

  const priceMatch=text.match(/(?:£|GBP)\s*([\d,]+(?:\.\d+)?)/i);
  const mileageMatch=text.match(/([\d,]+)\s*(?:mi|miles)\b/i);
  const regMatch=text.match(/(?:First Registration|FIRST REGISTRATION|prima immatricolazione)[:\s]*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-][0-9]{2,4}|[A-Za-z]{3,9}\s+20\d{2}|20\d{2})/i);
  const yearMatch=(regMatch?.[1]||text).match(/\b(20\d{2})\b/);
  const dealerIndex=cleanLines.findIndex(x=>/^dealer$/i.test(x));
  let dealer:any=null;
  if(dealerIndex>=0 && cleanLines[dealerIndex+1]) dealer=cleanLines[dealerIndex+1];
  if(!dealer){
    const dm=text.match(/Dealer[:\s]+([^\n]{3,100})/i);
    if(dm)dealer=clean(dm[1]);
  }
  let city:any=null;
  const cityIndex=cleanLines.findIndex(x=>/^city$/i.test(x));
  if(cityIndex>=0 && cleanLines[cityIndex+1]) city=cleanLines[cityIndex+1];

  const vid=(new URL(url)).searchParams.get("vid")||url;
  const imgs:string[]=[];
  for(const m of String(raw||"").matchAll(/https?:\/\/[^"'()\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'()\s]*)?/gi)){
    const u=m[0];
    if(!/logo|icon|sprite|cookie/i.test(u)&&!imgs.includes(u))imgs.push(u);
    if(imgs.length>=12)break;
  }

  return {
    source_stock_id:vid,
    source_key:vid,
    source_url:url,
    source_domain:"preowned.ducati.com",
    seller_name:dealer,
    seller_address:city||null,
    make:"Ducati",
    model:title,
    variant:null,
    year:yearMatch?Number(yearMatch[1]):null,
    mileage:mileageMatch?Number(mileageMatch[1].replace(/,/g,"")):null,
    colour:null,
    registration:null,
    source_advertised_price_gbp:priceMatch?Number(priceMatch[1].replace(/,/g,"")):null,
    description_original:title,
    specification:{approved_used:true,source:"Ducati Approved",first_registration:regMatch?.[1]||null,city:city||null},
    source_image_urls:imgs,
    raw_data:{title,dealer,city,first_registration:regMatch?.[1]||null}
  };
}
async function refreshDucatiApproved(connector:any){
  const home=connector.results_url||"https://preowned.ducati.com/models/gb/en/home";
  let raw="";
  try{raw=await fetchReader(home);}catch{}
  if(!raw){
    try{raw=await fetchDirect(home);}catch{}
  }
  if(!raw)throw new Error("Ducati Approved source could not be loaded.");

  let links=ducatiDetailLinks(raw,home);

  // Some portal renders expose the result links only after an initial shell. Try a few common result/pagination URLs.
  if(!links.length){
    for(const candidate of [
      "https://preowned.ducati.com/models/gb/en/home",
      "https://preowned.ducati.com/pob/gb/en"
    ]){
      try{
        const txt=await fetchReader(candidate);
        links=[...new Set([...links,...ducatiDetailLinks(txt,candidate)])];
      }catch{}
    }
  }

  const out:any[]=[];
  for(const url of links.slice(0,250)){
    try{
      let detail=await fetchReader(url);
      if(!detail)detail=await fetchDirect(url);
      const item=parseDucatiDetail(detail,url);
      if(item)out.push(item);
    }catch{}
  }

  if(!out.length){
    throw new Error("Ducati Approved source is reachable but no UK motorcycle records could be extracted.");
  }
  return finalise(connector,[...new Map(out.map((x:any)=>[String(x.source_stock_id),x])).values()]);
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

function siteHost(url:string){
  try{return new URL(url).hostname.replace(/^www\./,"").toLowerCase();}catch{return "";}
}
function allLinks(raw:string,base:string){
  const out:string[]=[];
  for(const m of String(raw||"").matchAll(/(?:href=["']([^"']+)["']|\[[^\]]+\]\(([^)]+)\))/gi)){
    const v=m[1]||m[2]; if(!v)continue;
    try{
      const u=new URL(decodeHtml(v),base).toString().split("#")[0];
      if(!out.includes(u))out.push(u);
    }catch{}
  }
  return out;
}
function likelyBikeLink(url:string,baseHost:string){
  try{
    const u=new URL(url);
    const h=u.hostname.replace(/^www\./,"").toLowerCase();
    if(baseHost && h!==baseHost && !h.endsWith("."+baseHost))return false;
    const p=(u.pathname+u.search).toLowerCase();
    if(/\.(jpg|jpeg|png|webp|svg|pdf|css|js)(\?|$)/.test(p))return false;
    return /(bike|bikes|motorcycle|used|stock|vehicle|approved|preowned|pre-owned|detail|view|inventory|showroom)/.test(p);
  }catch{return false;}
}
function jsonLdObjects(raw:string){
  const out:any[]=[];
  for(const m of String(raw||"").matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{
      const j=JSON.parse(m[1]);
      if(Array.isArray(j))out.push(...j); else out.push(j);
    }catch{}
  }
  return out;
}
function flattenJsonLd(v:any,out:any[]=[]){
  if(!v)return out;
  if(Array.isArray(v)){for(const x of v)flattenJsonLd(x,out);return out;}
  if(typeof v==="object"){
    if(v["@type"]||v.name||v.offers)out.push(v);
    if(v["@graph"])flattenJsonLd(v["@graph"],out);
    if(v.itemListElement)flattenJsonLd(v.itemListElement,out);
    if(v.item)flattenJsonLd(v.item,out);
  }
  return out;
}
function knownMakeFromText(v:string){
  const s=String(v||"");
  const makes=["BMW","Ducati","Triumph","Yamaha","Kawasaki","Honda","Suzuki","Harley-Davidson","Harley Davidson","KTM","Aprilia","Moto Guzzi","Indian","Royal Enfield","Husqvarna","MV Agusta","Benelli","CFMOTO","Vmoto","Norton"];
  return makes.find(x=>new RegExp("\\b"+x.replace(/[- ]/g,"[- ]?")+"\\b","i").test(s))||null;
}
function normaliseMake(v:any){
  const s=clean(v||"");
  if(/harley/i.test(s))return "Harley-Davidson";
  if(/^bmw$/i.test(s))return "BMW";
  if(/^vmoto$/i.test(s))return "VMoto";
  return s||null;
}
function parseGenericBike(raw:string,url:string,connector:any){
  const html=String(raw||"");
  const text=htmlText(html);
  const ld=flattenJsonLd(jsonLdObjects(html));
  const product=ld.find((x:any)=>{
    const t=String(x?.["@type"]||"").toLowerCase();
    return /product|vehicle|motorcycle|car/.test(t) || (x?.name&&x?.offers);
  })||null;

  const h1=decodeHtml((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||"").replace(/<[^>]+>/g," ").trim();
  const mdHeading=(html.match(/^#\s+(.+)$/m)||[])[1]||"";
  let title=clean(product?.name||h1||mdHeading||"");
  if(!title){
    const tm=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    title=clean(decodeHtml(tm?.[1]||"").replace(/\|.*$/,""));
  }
  if(!title)return null;

  const offers=Array.isArray(product?.offers)?product.offers[0]:product?.offers;
  let price=Number(offers?.price||offers?.lowPrice||0)||null;
  if(!price){
    const pm=text.match(/(?:£|GBP)\s*([\d,]+(?:\.\d+)?)/i);
    if(pm)price=Number(pm[1].replace(/,/g,""));
  }
  const yearMatch=text.match(/\b(20[0-3]\d|19[89]\d)\b/);
  const mileageMatch=text.match(/\b([\d,]{1,7})\s*(?:mi|miles)\b/i);
  const regMatch=text.match(/\b([A-Z]{2}\d{2}\s?[A-Z]{3}|[A-Z]\d{1,3}\s?[A-Z]{3})\b/i);
  const stockMatch=text.match(/(?:stock|ref(?:erence)?|vehicle|bike)\s*(?:no|number|#|id)?[:\s-]*([A-Z0-9-]{4,30})/i);
  const make=normaliseMake(product?.brand?.name||product?.brand||knownMakeFromText(title)||knownMakeFromText(text)||connector?.name?.split(" ")[0]);
  let model=title;
  if(make){
    model=model.replace(new RegExp("^"+String(make).replace(/[- ]/g,"[- ]?")+"\\s*","i"),"").trim();
  }
  model=model.replace(/^\d{4}\s+/,"").trim();
  if(!model||model.length>140)return null;

  const imgs:string[]=[];
  const addImg=(v:any)=>{
    if(!v)return;
    const arr=Array.isArray(v)?v:[v];
    for(const x0 of arr){
      const x=typeof x0==="string"?x0:(x0?.url||x0?.contentUrl||"");
      if(!x)continue;
      try{
        const u=new URL(x,url).toString();
        if(!/logo|icon|sprite|cookie|favicon/i.test(u)&&!imgs.includes(u))imgs.push(u);
      }catch{}
      if(imgs.length>=12)break;
    }
  };
  addImg(product?.image);
  addImg(attrImages(html,url));
  addImg(images(html));

  const seller=clean(product?.seller?.name||product?.offers?.seller?.name||"")||null;
  const sourceKey=stockMatch?.[1]||new URL(url).pathname.replace(/\/$/,"").split("/").pop()||url;
  return {
    source_stock_id:String(sourceKey),
    source_key:String(sourceKey),
    source_url:url,
    source_domain:siteHost(url),
    seller_name:seller||connector?.name||null,
    seller_address:null,
    make:make||null,
    model,
    variant:null,
    year:yearMatch?Number(yearMatch[1]):null,
    mileage:mileageMatch?Number(mileageMatch[1].replace(/,/g,"")):null,
    colour:null,
    registration:regMatch?regMatch[1].toUpperCase().replace(/\s+/g,""):null,
    source_advertised_price_gbp:price,
    description_original:title,
    specification:{generic_adapter:true,source:connector?.name||null},
    source_image_urls:imgs.slice(0,12),
    raw_data:{title}
  };
}
async function fetchSourceText(url:string){
  try{return await fetchDirect(url);}catch{}
  try{return await fetchReader(url);}catch{}
  return "";
}
function normaliseYamahaModel(value:string){
  const x=clean(String(value||"").replace(/\bYAMAHA\b/gi,"").replace(/\s+/g," "));
  const u=x.toUpperCase();
  if(/MT[- ]?125|MT125/.test(u))return "MT-125";
  if(/MT[- ]?07|MT07/.test(u))return /Y-AMT/.test(u)?"MT-07 Y-AMT":"MT-07";
  if(/MT[- ]?09|MT09/.test(u)){
    if(/\bSP\b/.test(u))return "MT-09 SP";
    if(/Y-AMT|YAMT/.test(u))return "MT-09 Y-AMT";
    return "MT-09";
  }
  if(/MT[- ]?10|MT10/.test(u))return "MT-10";
  if(/N-?MAX[ -]?125/.test(u))return "NMAX 125";
  if(/N-?MAX[ -]?155/.test(u))return "NMAX 155";
  if(/YZF[- ]?R1M|R1M/.test(u))return "YZF-R1M";
  if(/(^|[^0-9])R1([^0-9]|$)/.test(u))return "R1";
  if(/YZF[ -]?R125|R125/.test(u))return "R125";
  if(/(^|[^0-9])R3([^0-9]|$)/.test(u))return "R3";
  if(/(^|[^0-9])R7([^0-9]|$)/.test(u))return "R7";
  if(/YZF[ -]?R9|(^|[^0-9])R9([^0-9]|$)/.test(u))return "R9";
  if(/RAYZR/.test(u))return "RAYZR";
  if(/TENERE 700 WORLD RAID/.test(u))return "TENERE 700 WORLD RAID";
  if(/TENERE 700 RALLY/.test(u))return "TENERE 700 RALLY";
  if(/TENERE 700/.test(u))return "TENERE 700";
  if(/TMAX/.test(u))return /TECH MAX/.test(u)?"TMAX TECH MAX":"TMAX";
  if(/TRACER[ -]?7|TRACER 700/.test(u)){
    if(/GT/.test(u)&&/Y-AMT/.test(u))return "TRACER 7 GT Y-AMT";
    if(/GT/.test(u))return "TRACER 7 GT";
    return "TRACER 7";
  }
  if(/TRACER 9|TRACER 900/.test(u)){
    if(/GT\+/.test(u))return "TRACER 9 GT+";
    if(/GT/.test(u)&&/Y-AMT/.test(u))return "TRACER 9 GT Y-AMT";
    if(/GT/.test(u))return "TRACER 9 GT";
    return "TRACER 9";
  }
  if(/TRICITY 300/.test(u))return "TRICITY 300";
  if(/TRICITY/.test(u)&&/125/.test(u))return "TRICITY 125";
  if(/WR125R/.test(u))return "WR125R";
  if(/XMAX 125/.test(u))return "XMAX 125";
  if(/XMAX 300/.test(u))return /TECH MAX/.test(u)?"XMAX 300 TECH MAX":"XMAX 300";
  if(/XSR[ -]?125/.test(u))return "XSR125";
  if(/XSR[ -]?700/.test(u))return "XSR700";
  if(/XSR[ -]?900/.test(u))return /GP/.test(u)?"XSR900 GP":"XSR900";
  return x.replace(/[,;-].*$/,"").trim();
}
async function refreshAssetCertified(connector:any,sourceLabel:string){
  const base=connector.results_url||connector.base_url;
  const collected:any[]=[]; const seen=new Set<string>();
  const prefix=base.replace(/\/(?:home|page\/1)?\/?$/i,"");
  const candidates=[base,prefix+"/gb/bikes/page/1",prefix+"/gb/home"];
  let pageBase=candidates[0];

  for(const c of candidates){
    const raw=await fetchSourceText(c);
    const assets=extractHarleyAssets(raw);
    if(assets.length){pageBase=c;break;}
  }

  const attr=(a:any,name:string)=>{
    const row=(Array.isArray(a?.Attributes)?a.Attributes:[]).find((x:any)=>String(x?.Name||"").toLowerCase()===name.toLowerCase());
    return clean(row?.DefaultValue??row?.Value??"")||null;
  };

  for(let page=1;page<=40;page++){
    let url=pageBase;
    if(/\/page\/\d+/i.test(pageBase))url=pageBase.replace(/\/page\/\d+/i,"/page/"+page);
    else if(page>1){const u=new URL(pageBase);u.searchParams.set("page",String(page));url=u.toString();}
    const raw=await fetchSourceText(url);
    if(!raw)break;
    const assets=extractHarleyAssets(raw);
    let added=0;

    for(const a of assets){
      const id=String(a?.AssetID||""); if(!id||seen.has(id))continue;
      seen.add(id);
      const assetName=clean(a?.Name||a?.AssetName||"");
      const portalMake=/yamaha/i.test(sourceLabel)?"Yamaha":(/kawasaki/i.test(sourceLabel)?"Kawasaki":null);
      const namedMake=normaliseMake(knownMakeFromText(assetName)||"");
      const make=normaliseMake(namedMake||portalMake||attr(a,"Make")||sourceLabel.split(" ")[0]);

      let model="";
      if(assetName){
        model=assetName.replace(/^\s*(?:19\d{2}|20\d{2})\s+/,"");
        if(make)model=model.replace(new RegExp("^"+String(make).replace(/[- ]/g,"[- ]?")+"\\s*","i"),"").trim();
      }
      if(!model)model=clean(attr(a,"Model")||"");
      if(/yamaha/i.test(sourceLabel))model=normaliseYamahaModel(model);

      const nameYear=assetName.match(/^\s*(19\d{2}|20\d{2})\b/);
      const attrYear=Number(attr(a,"Year")||0);
      const year=nameYear?Number(nameYear[1]):(attrYear>=1900&&attrYear<=2100?attrYear:null);
      const mileageRaw=attr(a,"Mileage");
      const colour=attr(a,"Colour");
      const registration=attr(a,"Registration");
      const location=attr(a,"Location");
      const variant=attr(a,"Variant");
      const engineRaw=attr(a,"Engine Size");
      const price=Number(a?.DefaultPrice||attr(a,"Price")||0)||null;
      const root=new URL(url).origin;

      collected.push({
        source_stock_id:id,source_key:id,
        source_url:root+"/gb/bikes/view/"+id+"/",
        source_domain:siteHost(root),
        seller_name:null,seller_address:location||null,
        make,model:model||null,variant:variant||null,
        year,
        mileage:mileageRaw?Number(String(mileageRaw).replace(/,/g,""))||null:null,
        colour:colour||null,registration:registration||null,
        engine_cc:engineRaw?Number(String(engineRaw).replace(/[^\d.]/g,""))||null:null,
        source_advertised_price_gbp:price,
        description_original:assetName||model,
        specification:{approved_used:true,source:sourceLabel,condition:attr(a,"Condition"),type:attr(a,"Type"),series:attr(a,"Series")},
        source_image_urls:Array.isArray(a?.Images)?a.Images.map((x:any)=>typeof x==="string"?x:(x?.Url||x?.URL||x?.url||"")).filter(Boolean).slice(0,12):[],
        raw_data:a
      });
      added++;
    }
    if(!added)break;
  }
  if(!collected.length)throw new Error(sourceLabel+" source is reachable but no structured motorcycle records could be extracted.");
  return finalise(connector,collected);
}
function parseListBlockSource(md:string,sourceName:string,forcedMake:string|null=null,baseUrl:string=""){
  const lines=String(md||"").replace(/\r/g,"").split("\n");
  const out:any[]=[];
  const titleRe=/^(?:#{1,5}\s*)?(?:\[)?((?:BMW|Ducati|Triumph|Yamaha|Kawasaki|Honda|Suzuki|Harley-Davidson|KTM|Aprilia|Moto Guzzi|Indian|Royal Enfield|Husqvarna|MV Agusta|Benelli|CFMOTO|Norton)\b[^\]\n]{2,170})(?:\]\(([^)]+)\))?\s*$/i;
  for(let i=0;i<lines.length;i++){
    const line=clean(lines[i]).replace(/^\*+\s*/,"");
    const tm=line.match(titleRe);
    if(!tm)continue;
    const title=clean(tm[1]);
    const body=lines.slice(i+1,Math.min(lines.length,i+30)).join("\n");
    if(!/\b(19\d{2}|20\d{2})\b/.test(body))continue;
    if(!/View bike/i.test(body))continue;

    const make=normaliseMake(forcedMake||knownMakeFromText(title)||"");
    if(!make)continue;
    let model=title.replace(new RegExp("^"+String(make).replace(/[- ]/g,"[- ]?")+"\\s*","i"),"").trim();
    const yearMatch=body.match(/\b(19\d{2}|20\d{2})\b/);
    const mileageMatch=body.match(/\b([\d,]+)\s*Miles?\b/i);
    const priceMatches=[...body.matchAll(/(?:Now\s+)?£\s*([\d,]{3,})(?:\.\d{2})?/gi)]
      .map(x=>Number(x[1].replace(/,/g,""))).filter(n=>n>=500);
    const price=priceMatches.length?priceMatches[priceMatches.length-1]:null;
    if(!price)continue;

    let link=tm[2]||"";
    if(!link){
      const lm=body.match(/(?:View bike|Details)\]?\(([^)]+)\)/i);
      if(lm)link=lm[1];
    }
    let sourceUrl=baseUrl;
    try{if(link)sourceUrl=new URL(link,baseUrl).toString();}catch{}
    const idMatch=sourceUrl.match(/\/(\d+)\.htm(?:\?|$)/i);
    const dealer=clean((body.match(/Bike location:\s*([^\n]+)/i)||[])[1]||
                       (body.match(/\n\s*([^\n]+?)\s*-\s*(?:\[)?see all their bikes/i)||[])[1]||sourceName);
    const stable=idMatch?.[1]||[make,model,yearMatch?.[1]||"",mileageMatch?.[1]||"",price,dealer].join("|").toLowerCase().replace(/\s+/g,"-").slice(0,240);

    out.push({
      source_stock_id:stable,source_key:stable,source_url:sourceUrl||baseUrl,
      source_domain:siteHost(baseUrl),seller_name:dealer||sourceName,seller_address:dealer||null,
      make,model,variant:null,year:yearMatch?Number(yearMatch[1]):null,
      mileage:mileageMatch?Number(mileageMatch[1].replace(/,/g,"")):null,
      colour:null,registration:null,source_advertised_price_gbp:price,
      description_original:title,
      specification:{source:sourceName,approved_used:/approved/i.test(sourceName),generic_adapter:false},
      source_image_urls:[],
      raw_data:{title,dealer}
    });
  }
  return [...new Map(out.map((x:any)=>[String(x.source_key),x])).values()];
}
async function refreshTriumphApproved(connector:any){
  const start="https://www.triumphapproved.co.uk/approved-preowned";
  const raw=await fetchSourceText(start);
  if(!raw)throw new Error("Triumph Approved source could not be loaded.");

  const links=allLinks(raw,start)
    .filter(u=>/^https?:\/\/(?:www\.)?triumphapproved\.co\.uk\/approved-preowned\/triumph\/[^/?#]+\/\d+\.htm(?:\?.*)?$/i.test(u))
    .filter((u,i,a)=>a.indexOf(u)===i);

  if(!links.length)throw new Error("Triumph Approved page loaded but no motorcycle detail links were found.");

  const collected:any[]=[]; const seen=new Set<string>();
  const concurrency=8;
  for(let i=0;i<links.length;i+=concurrency){
    const rows=await Promise.all(links.slice(i,i+concurrency).map(async(url)=>{
      const detail=await fetchSourceText(url);
      if(!detail)return null;
      const item=parseGenericBike(detail,url,{...connector,name:"Triumph Approved Used"});
      if(!item)return null;
      item.make="Triumph";
      item.seller_name=item.seller_name||"Triumph Approved Used";
      item.specification={...(item.specification||{}),approved_used:true,source:"Triumph Approved Used"};
      const id=(url.match(/\/(\d+)\.htm(?:\?|$)/i)||[])[1];
      if(id){item.source_stock_id=id;item.source_key=id;}
      return item;
    }));
    for(const item of rows){
      if(!item||!item.source_advertised_price_gbp)continue;
      const key=String(item.source_key||item.source_url);
      if(seen.has(key))continue;
      seen.add(key);collected.push(item);
    }
  }
  if(!collected.length)throw new Error("Triumph Approved detail pages loaded but no complete motorcycle records could be extracted.");
  return finalise(connector,collected);
}
async function refreshLindUsed(connector:any){
  const start="https://www.lind.co.uk/used?search_advert_type=used";
  const raw=await fetchSourceText(start);
  if(!raw)throw new Error("LIND used-bike source could not be loaded.");

  const links=allLinks(raw,start)
    .filter(u=>/^https?:\/\/(?:www\.)?lind\.co\.uk\/used\/[^?#]+\/\d+\.htm(?:\?.*)?$/i.test(u))
    .filter((u,i,a)=>a.indexOf(u)===i);

  if(!links.length)throw new Error("LIND used-bike page loaded but no motorcycle detail links were found.");

  const collected:any[]=[]; const seen=new Set<string>();
  const concurrency=8;
  for(let i=0;i<links.length;i+=concurrency){
    const rows=await Promise.all(links.slice(i,i+concurrency).map(async(url)=>{
      const detail=await fetchSourceText(url);
      if(!detail)return null;
      const item=parseGenericBike(detail,url,{...connector,name:"LIND Used"});
      if(!item)return null;
      const id=(url.match(/\/(\d+)\.htm(?:\?|$)/i)||[])[1];
      if(id){item.source_stock_id=id;item.source_key=id;}
      const loc=htmlText(detail).match(/Bike location:\s*([^\n\r]+)/i);
      if(loc?.[1]){item.seller_name=clean(loc[1]);item.seller_address=clean(loc[1]);}
      item.specification={...(item.specification||{}),source:"LIND Used"};
      return item;
    }));
    for(const item of rows){
      if(!item||!item.source_advertised_price_gbp)continue;
      const key=String(item.source_key||item.source_url);
      if(seen.has(key))continue;
      seen.add(key);collected.push(item);
    }
  }
  if(!collected.length)throw new Error("LIND detail pages loaded but no complete motorcycle records could be extracted.");
  return finalise(connector,collected);
}
async function refreshMotoGbUsed(connector:any){
  const start="https://www.motogb.co.uk/used-bikes/brands/all-brands";
  const raw=await fetchSourceText(start);
  if(!raw)throw new Error("MotoGB used-bike source could not be loaded.");

  const links=allLinks(raw,start)
    .filter(u=>{
      try{
        const x=new URL(u);
        if(!/^(?:www\.)?motogb\.co\.uk$/i.test(x.hostname))return false;
        const p=x.pathname.toLowerCase();
        return /^\/used-bikes\/.+-\d+\/?$/.test(p) && !/\/brands\//.test(p);
      }catch{return false;}
    })
    .filter((u,i,a)=>a.indexOf(u)===i);

  if(!links.length)throw new Error("MotoGB used-bike page loaded but no motorcycle detail links were found.");

  const collected:any[]=[]; const seen=new Set<string>();
  const concurrency=8;
  for(let i=0;i<links.length;i+=concurrency){
    const rows=await Promise.all(links.slice(i,i+concurrency).map(async(url)=>{
      const detail=await fetchSourceText(url);
      if(!detail)return null;
      const item=parseGenericBike(detail,url,{...connector,name:"MotoGB Used"});
      if(!item)return null;
      const id=(url.match(/-(\d+)\/?(?:\?|$)/)||[])[1];
      if(id){item.source_stock_id=id;item.source_key=id;}
      item.specification={...(item.specification||{}),source:"MotoGB Used"};
      return item;
    }));
    for(const item of rows){
      if(!item||!item.source_advertised_price_gbp||Number(item.source_advertised_price_gbp)<500)continue;
      const key=String(item.source_key||item.source_url);
      if(seen.has(key))continue;
      seen.add(key);collected.push(item);
    }
  }
  if(!collected.length)throw new Error("MotoGB detail pages loaded but no complete motorcycle records could be extracted.");
  return finalise(connector,collected);
}
async function refreshGenericPartner(connector:any){
  const start=connector.results_url||connector.base_url;
  const host=siteHost(start);
  const firstRaw=await fetchSourceText(start);
  if(!firstRaw)throw new Error((connector.name||"Source")+" could not be loaded.");

  let links=allLinks(firstRaw,start).filter(x=>likelyBikeLink(x,host));
  links=links.filter((x,i,a)=>a.indexOf(x)===i).slice(0,120);

  const collected:any[]=[]; const seen=new Set<string>();

  // Parse cards/details from the landing page itself where possible.
  const landingItem=parseGenericBike(firstRaw,start,connector);
  if(landingItem && landingItem.source_advertised_price_gbp) {
    seen.add(String(landingItem.source_key));collected.push(landingItem);
  }

  const concurrency=8;
  for(let i=0;i<links.length;i+=concurrency){
    const batch=links.slice(i,i+concurrency);
    const rows=await Promise.all(batch.map(async(url)=>{
      const raw=await fetchSourceText(url);
      if(!raw)return null;
      return parseGenericBike(raw,url,connector);
    }));
    for(const item of rows){
      if(!item)continue;
      const key=String(item.source_key||item.source_url);
      if(seen.has(key))continue;
      // Require enough motorcycle-like data to avoid navigation/category pages.
      if(!item.source_advertised_price_gbp && !item.mileage && !item.registration)continue;
      seen.add(key);collected.push(item);
    }
  }

  if(!collected.length){
    throw new Error((connector.name||"Source")+" is reachable but no complete motorcycle records could be extracted.");
  }
  return finalise(connector,collected);
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
    else if(q.data.adapter_key==="harley-certified-uk")result=await refreshHarleyCertified(q.data);
    else if(q.data.adapter_key==="ducati-approved-uk")result=await refreshDucatiApproved(q.data);
    else if(q.data.adapter_key==="yamaha-certified-uk")result=await refreshAssetCertified(q.data,"Yamaha Approved Used");
    else if(q.data.adapter_key==="kawasaki-validated-uk")result=await refreshAssetCertified(q.data,"Kawasaki Approved Used");
    else if(q.data.adapter_key==="vmoto-uk-catalogue")result=await refreshVmoto(q.data);
    else if(q.data.adapter_key==="triumph-approved-uk")result=await refreshTriumphApproved(q.data);
    else if(q.data.adapter_key==="lind-used-uk")result=await refreshLindUsed(q.data);
    else if(q.data.adapter_key==="motogb-used-uk")result=await refreshMotoGbUsed(q.data);
    else if(String(q.data.adapter_key||"").startsWith("generic-"))result=await refreshGenericPartner(q.data);
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
