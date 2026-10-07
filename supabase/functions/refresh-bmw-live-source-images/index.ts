import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

function clean(v:any){return String(v??"").replace(/\s+/g," ").trim();}
function json(body:any,status=200){return new Response(JSON.stringify(body),{status,headers:{
  "Content-Type":"application/json","Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
}});}
function cookieHeader(setCookie:string){
  if(!setCookie)return "";
  const pairs:string[]=[];
  for(const m of setCookie.matchAll(/(?:^|,\s*)([A-Za-z0-9_.-]+)=([^;,]+)/g)){
    const pair=m[1]+"="+m[2]; if(!pairs.includes(pair))pairs.push(pair);
  }
  if(!pairs.length){const m=setCookie.match(/^\s*([^=;]+)=([^;]+)/);if(m)pairs.push(m[1]+"="+m[2]);}
  return pairs.join("; ");
}
function bmwHeaders(resultsUrl:string,sid:string,cookie:string){
  const origin=new URL(resultsUrl).origin;
  const h:any={"Content-Type":"application/json","Accept":"application/json, text/plain, */*",
    "GMB-SID":sid||"","Origin":origin,"Referer":resultsUrl,
    "X-Requested-With":"XMLHttpRequest",
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36"};
  if(cookie)h.Cookie=cookieHeader(cookie);
  return h;
}
function hidden(html:string,id:string){
  const a=new RegExp('<input[^>]+id=["\\\']'+id+'["\\\'][^>]+value=["\\\']([^"\\\']*)["\\\']','i').exec(html);
  if(a)return a[1]||"";
  const b=new RegExp('<input[^>]+value=["\\\']([^"\\\']*)["\\\'][^>]+id=["\\\']'+id+'["\\\']','i').exec(html);
  return b?b[1]||"":"";
}
function extractImageMap(html:string,base:string){
  const map:Record<string,string>={};
  const matches=[...html.matchAll(/ShowResOvDetail\('([0-9]{4,12})'[^)]*\)/g)];
  for(let i=0;i<matches.length;i++){
    const id=matches[i][1];
    const start=matches[i].index||0;
    const end=i+1<matches.length?(matches[i+1].index||start+5000):Math.min(html.length,start+5000);
    const seg=html.slice(start,end);
    const im=seg.match(/<img[^>]+src=["']([^"']*\/api\/Image\/GetImg\?imgId=[^"']+)["']/i);
    if(im?.[1]){
      try{map[id]=new URL(im[1],base).toString();}catch{}
    }
  }
  return map;
}
function extractDetailImages(html:string,base:string){
  const out:string[]=[];
  const normalised=String(html||"")
    .replace(/&amp;/gi,"&")
    .replace(/\\u0026/gi,"&")
    .replace(/\\\\\//g,"/");

  const add=(raw:string)=>{
    if(!raw||out.length>=12)return;
    try{
      const u=new URL(raw,base).toString();
      if(/\/api\/Image\/GetImg\?imgId=/i.test(u) && !out.includes(u))out.push(u);
    }catch{}
  };

  for(const m of normalised.matchAll(/(?:src|data-src|data-original|data-image|href)=["']([^"']*\/api\/Image\/GetImg\?imgId=[^"'<>\\s)]+)["']/gi)){
    add(m[1]);
    if(out.length>=12)break;
  }
  if(out.length<12){
    for(const m of normalised.matchAll(/((?:https?:)?\/\/[^"'<>\\s)]*\/api\/Image\/GetImg\?imgId=[^"'<>\\s)]+|\/api\/Image\/GetImg\?imgId=[^"'<>\\s)]+)/gi)){
      add(m[1]);
      if(out.length>=12)break;
    }
  }
  if(out.length<12){
    for(const m of normalised.matchAll(/(?:imgId|imageId|ImageId)["'\\s:=]+["']?([0-9a-f]{8}-[0-9a-f-]{27,36})/gi)){
      add("/api/Image/GetImg?imgId="+m[1]);
      if(out.length>=12)break;
    }
  }
  return out.slice(0,12);
}

export default {
  fetch: withSupabase({auth:["user"]},async(req,ctx)=>{
    if(req.method==="OPTIONS")return json({ok:true});
    if(req.method!=="POST")return json({error:"POST required"},405);

    const auth=req.headers.get("Authorization")||"";
    const token=auth.replace(/^Bearer\s+/i,"").trim();
    const {data:{user}}=await ctx.supabaseAdmin.auth.getUser(token);
    if(!user)return json({error:"Authentication required"},401);
    const {data:adminUser}=await ctx.supabaseAdmin.from("admin_users")
      .select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
    if(!adminUser)return json({error:"Admin access required"},403);

    const body=await req.json().catch(()=>({}));
    const connectorId=Number(body.connector_id||1);
    const makeFilter=clean(body.make||"");
    const modelFilter=clean(body.model||"");
    const itemIds=Array.isArray(body.item_ids)
      ? body.item_ids.map((x:any)=>Number(x)).filter((x:number)=>Number.isFinite(x)&&x>0).slice(0,50)
      : [];

    const {data:connector,error:connectorError}=await ctx.supabaseAdmin.from("live_source_connectors")
      .select("id,results_url,adapter_key").eq("id",connectorId).eq("enabled",true).maybeSingle();
    if(connectorError)throw connectorError;
    if(!connector)return json({error:"Source connector not found"},404);
    if(connector.adapter_key!=="bmw-approved-used-uk")return json({error:"BMW photo loader is only available for the BMW Approved Used connector"},400);

    let q=ctx.supabaseAdmin.from("live_source_items")
      .select("id,source_stock_id,source_url,make,model,source_image_urls")
      .eq("connector_id",connectorId).eq("source_status","live");
    if(itemIds.length) q=q.in("id",itemIds);
    else {
      if(makeFilter)q=q.ilike("make",makeFilter);
      if(modelFilter)q=q.ilike("model",modelFilter);
    }
    const {data:rows,error:rowsError}=await q;
    if(rowsError)throw rowsError;
    const wanted=new Map<string,any>();
    for(const row of rows||[])if(row.source_stock_id)wanted.set(String(row.source_stock_id),row);
    if(!wanted.size)return json({success:true,matched:0,updated:0,message:"No matching live motorcycles found."});

    const boot=await fetch(connector.results_url,{headers:{
      "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
      "Accept":"text/html,application/xhtml+xml"
    }});
    if(!boot.ok)return json({error:"BMW catalogue returned HTTP "+boot.status},502);
    const raw=await boot.text();
    const bootstrapCookie=boot.headers.get("set-cookie")||"";
    const hfSID=hidden(raw,"hfSID");
    const markt=Number(hidden(raw,"hfMarktId")||2);
    const culture=hidden(raw,"hfcultName")||"en-gb";

    const state:any={
      InitFilter:false,IsFirstCall:false,MarktId:markt,BuNo:"",
      Culture:culture,Segment:[0],FuelType:[],Marke:10,Modell:[0],
      Fahrzeugart:0,Antrieb:0,EZV:0,EZB:0,PreisVon:null,PreisBis:null,KMVon:null,KMBis:null,
      KWVon:null,KWBis:null,PowerUnit:"PS",Farbe1Auswahl:[0],Merkmale:"",Umkreis:0,UmkreisPLZ:"",
      AngebotsNo:"",DetailAngebotsNo:"",Sonderausstattung:"",isSondermodell:false,Pakete:"",
      FilterHMFAChanged:false,FilterEZChanged:0,FilterColorChanged:false,
      ResOverviewData:{currResultCountToShow:50,selectedPage:1,pagingSize:50,totalItemCount:1050,pageItemsToShow:10,tableSortColumn:16,tableSortDirection:0},
      DetailData:{RowNumber:0},currRequest:1
    };

    const pf=new URLSearchParams();
    pf.set("ViewData",btoa(JSON.stringify(state)));
    pf.set("hfSID",hfSID);
    pf.set("hfMarktId",String(markt));
    pf.set("hfcultName",culture);
    const pageRes=await fetch(connector.results_url,{method:"POST",redirect:"follow",headers:{
      "Content-Type":"application/x-www-form-urlencoded",
      "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36"
    },body:pf.toString()});
    if(!pageRes.ok)return json({error:"BMW catalogue session returned HTTP "+pageRes.status},502);
    const pageText=await pageRes.text();
    const sid=hidden(pageText,"hfSID")||hfSID;
    let returnedState:any=state;
    const vd=hidden(pageText,"ViewData");
    if(vd){try{returnedState=JSON.parse(atob(vd));}catch{}}
    if(!returnedState.ResOverviewData)returnedState.ResOverviewData=state.ResOverviewData;
    returnedState.ResOverviewData.currResultCountToShow=50;
    returnedState.ResOverviewData.pagingSize=50;

    const h=bmwHeaders(connector.results_url,sid,pageRes.headers.get("set-cookie")||bootstrapCookie);
    const imageMap:Record<string,string>={};
    const total=Number(returnedState.ResOverviewData.totalItemCount||1050);
    const totalPages=Math.min(120,Math.max(1,Math.ceil(total/50)));

    for(let page=1;page<=totalPages;page++){
      const s=structuredClone(returnedState);
      s.ResOverviewData.selectedPage=page;
      s.ResOverviewData.currResultCountToShow=50;
      s.ResOverviewData.pagingSize=50;
      s.currRequest=1;
      const rr=await fetch(new URL("/api/ResultOverview/ShowResults",connector.results_url).toString(),{
        method:"POST",headers:h,body:JSON.stringify(s)
      });
      if(!rr.ok)continue;
      const payload=await rr.json().catch(()=>null);
      const table=String(payload?.ResTable||"");
      if(!table)break;
      Object.assign(imageMap,extractImageMap(table,connector.results_url));
      const allFound=[...wanted.keys()].every(id=>!!imageMap[id]);
      if(allFound)break;
    }

    let updated=0,missing=0,galleries=0,totalGalleryImages=0;
    for(const [stockId,row] of wanted.entries()){
      const catalogueUrl=imageMap[stockId];
      const existing=Array.isArray(row.source_image_urls)?row.source_image_urls:[];
      const cleanExisting=existing.filter((u:any)=>/\/api\/Image\/GetImg\?imgId=/i.test(String(u)));
      let detailUrls:string[]=[];
      try{
        const detailUrl=row.source_url || (new URL("/UK/detail.cshtml?on="+encodeURIComponent(stockId),connector.results_url).toString());
        const detailRes=await fetch(detailUrl,{
          headers:{
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
            "Accept":"text/html,application/xhtml+xml",
            "Cookie":cookieHeader(pageRes.headers.get("set-cookie")||bootstrapCookie),
            "Referer":connector.results_url
          },
          redirect:"follow"
        });
        if(detailRes.ok){
          const detailHtml=(await detailRes.text()).slice(0,6000000);
          detailUrls=extractDetailImages(detailHtml,detailUrl);
        }
      }catch{}

      const urls=[catalogueUrl,...detailUrls,...cleanExisting]
        .filter(Boolean)
        .filter((u:any,i:number,a:any[])=>a.indexOf(u)===i)
        .slice(0,12);

      if(!urls.length){missing++;continue;}
      if(urls.length>1)galleries++;
      totalGalleryImages+=urls.length;

      const {error}=await ctx.supabaseAdmin.from("live_source_items").update({
        source_image_urls:urls,
        updated_at:new Date().toISOString()
      }).eq("id",row.id);
      if(!error)updated++;
    }

    return json({
      success:true,matched:wanted.size,updated,missing,galleries,total_gallery_images:totalGalleryImages,
      discovered_image_count:Object.keys(imageMap).length,
      message:"Loaded BMW source photos for "+updated+" of "+wanted.size+(itemIds.length?" selected":" matching")+" motorcycles"+
        (galleries?" · "+galleries+" multi-photo galleries found.":".")
    });
  })
};