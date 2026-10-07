
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

function clean(v:any){return String(v??"").replace(/\s+/g," ").trim();}
function cookieHeader(setCookie:string){
  if(!setCookie)return "";
  const pairs:string[]=[];
  const starts=[...setCookie.matchAll(/(?:^|,\s*)([A-Za-z0-9_.-]+)=([^;,]+)/g)];
  for(const m of starts){
    const pair=m[1]+"="+m[2];
    if(!pairs.includes(pair))pairs.push(pair);
  }
  if(!pairs.length){
    const m=setCookie.match(/^\s*([^=;]+)=([^;]+)/);
    if(m)pairs.push(m[1]+"="+m[2]);
  }
  return pairs.join("; ");
}

function bmwJsonHeaders(resultsUrl:string,sid:string,cookie:string){
  const origin=new URL(resultsUrl).origin;
  const h:any={
    "Content-Type":"application/json",
    "Accept":"application/json, text/plain, */*",
    "GMB-SID":sid||"",
    "Origin":origin,
    "Referer":resultsUrl,
    "X-Requested-With":"XMLHttpRequest",
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36"
  };
  if(cookie)h["Cookie"]=cookieHeader(cookie);
  return h;
}

function json(body:any,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"}});}
function absoluteDetail(base:string,id:string){try{const u=new URL(base);return u.origin+"/UK/detail.cshtml?on="+encodeURIComponent(id);}catch{return "";}}
function extractIds(text:string){
  const ids=new Set<string>();
  for(const m of text.matchAll(/detail\.cshtml[^"'\s>]*[?&]on=(\d{4,12})/gi)) ids.add(m[1]);
  for(const m of text.matchAll(/[?&]on=(\d{4,12})/gi)) ids.add(m[1]);
  for(const m of text.matchAll(/\bBike\s*ID\s*[:#-]?\s*(\d{4,12})\b/gi)) ids.add(m[1]);
  return [...ids];
}
async function fetchText(url:string){
  const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; AnyBike Live Source Hub/2.0)","Accept":"text/html,text/plain,*/*"}});
  if(!res.ok) throw new Error("HTTP "+res.status);
  return (await res.text()).slice(0,12000000);
}
async function fetchReader(url:string){
  try{
    const res=await fetch("https://r.jina.ai/"+url,{headers:{"Accept":"text/plain","User-Agent":"AnyBike Live Source Hub/2.0"}});
    if(!res.ok)return "";
    return (await res.text()).slice(0,8000000);
  }catch{return "";}
}
function num(v:any){const n=Number(v);return Number.isFinite(n)?n:null;}
function int(v:any){const n=Number(v);return Number.isFinite(n)?Math.round(n):null;}

function normaliseBmwModelNoise(value:any){
  const x=clean(value||"");
  const exact:any={
    "CE 02 AM Pre Registered Special":"CE 02 AM",
    "F 900 R Ex":"F 900 R",
    "F 900 R Low":"F 900 R",
    "F 900 R LOW":"F 900 R",
    "G 310 GS Ex":"G 310 GS",
    "G 310 GS with":"G 310 GS",
    "M 1000 R EX":"M 1000 R",
    "M 1000 XR Low":"M 1000 XR",
    "R 1250 RT Very":"R 1250 RT",
    "R 1300 GS HIGH":"R 1300 GS",
    "F 900 R R":"F 900 R",
    "K 1600 B B":"K 1600 B"
  };
  return exact[x]||x;
}

function validBmwRefreshItem(item:any){
  const make=clean(item?.make).toLowerCase();
  const model=clean(item?.model);
  const seller=clean(item?.seller_name).toLowerCase();
  const price=Number(item?.source_advertised_price_gbp||0);
  const stock=clean(item?.source_stock_id);
  const sourceUrl=clean(item?.source_url);
  if(item?.scan_status!=="ready") return false;
  if(make!=="bmw") return false;
  if(!model || model.toLowerCase()==="bmw" || model.length<2) return false;
  if(!Number.isFinite(price) || price<1000 || price>100000) return false;
  if(seller==="test") return false;
  if(!/^\d{4,12}$/.test(stock)) return false;
  try{
    const u=new URL(sourceUrl);
    if(!u.hostname.toLowerCase().includes("approvedused.bmw-motorrad.co.uk")) return false;
    if(u.searchParams.get("on")!==stock) return false;
  }catch{return false;}
  return true;
}

async function upsertItem(admin:any,connectorId:number,item:any){
  const key=clean(item?.source_stock_id||item?.source_key||item?.source_url);
  if(!key) return {ok:false,isNew:false,changed:false};

  const {data:existing,error:findError}=await admin.from("live_source_items")
    .select("id,source_price_gbp,mileage,source_url")
    .eq("connector_id",connectorId).eq("source_key",key).maybeSingle();
  if(findError) throw findError;

  const patch:any={
    updated_at:new Date().toISOString(),
    last_seen_at:new Date().toISOString(),
    ended_at:null,
    source_status:"live",
    source_url:item.source_url||existing?.source_url||"",
    source_stock_id:item.source_stock_id||null,
    source_domain:item.source_domain||null,
    seller_name:item.seller_name||null,
    seller_phone:item.seller_phone||null,
    seller_email:item.seller_email||null,
    seller_address:item.seller_address||null,
    make:item.make||null,
    model:normaliseBmwModelNoise(item.model)||null,
    variant:item.variant||null,
    year:int(item.year),
    mileage:int(item.mileage),
    colour:item.colour||null,
    registration:item.registration||null,
    engine_cc:int(item.engine_cc),
    source_price_gbp:num(item.source_advertised_price_gbp),
    source_listed_at:item?.extraction?.source_listed_at||item?.source_listed_at||null,
    source_listed_at_source:item?.extraction?.source_listed_at_source||item?.source_listed_at_source||null,
    description_original:item.description_original||null,
    specification:item.specification||{},
    source_image_urls:Array.isArray(item.source_image_urls)?item.source_image_urls:[],
    raw_data:item
  };

  if(existing){
    const changed =
      Number(existing.source_price_gbp||0)!==Number(patch.source_price_gbp||0) ||
      Number(existing.mileage||0)!==Number(patch.mileage||0) ||
      String(existing.source_url||"")!==String(patch.source_url||"");
    if(changed) patch.last_changed_at=new Date().toISOString();
    const {error}=await admin.from("live_source_items").update(patch).eq("id",existing.id);
    if(error) throw error;
    return {ok:true,isNew:false,changed};
  }

  const {error}=await admin.from("live_source_items").insert({...patch,connector_id:connectorId,source_key:key,first_seen_at:new Date().toISOString()});
  if(error) throw error;
  return {ok:true,isNew:true,changed:false};
}

export default {
  fetch: withSupabase({auth:["user","secret"]}, async (req,ctx)=>{
    if(req.method==="OPTIONS") return json({});
    if(req.method!=="POST") return json({error:"POST required"},405);

    const admin=ctx.supabaseAdmin;

    if(ctx.authMode==="user"){
      const auth=req.headers.get("Authorization")||"";
      const token=auth.replace(/^Bearer\s+/i,"").trim();
      const {data:{user}}=await admin.auth.getUser(token);
      if(!user) return json({error:"Authentication required"},401);
      const {data:adminUser}=await admin.from("admin_users").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
      if(!adminUser) return json({error:"Admin access required"},403);
    }

    try{
      const body=await req.json().catch(()=>({}));
      const connectorId=Number(body.connector_id||1);

      const {data:connector,error:connectorError}=await admin.from("live_source_connectors").select("*").eq("id",connectorId).eq("enabled",true).maybeSingle();
      if(connectorError) throw connectorError;
      if(!connector) return json({error:"Source connector not found"},404);
      if(connector.adapter_key!=="bmw-approved-used-uk") return json({error:"This source does not have a catalogue refresh adapter yet."},400);

      let {data:run}=await admin.from("live_source_sync_runs")
        .select("*").eq("connector_id",connectorId).eq("status","running").order("id",{ascending:false}).limit(1).maybeSingle();

      if(!run){
        await admin.from("live_source_connectors").update({
          last_refresh_started_at:new Date().toISOString(),
          last_refresh_status:"running"
        }).eq("id",connectorId);

        let raw="",reader="",bootstrapCookie="",scCookie="";
        try{
          const boot=await fetch(connector.results_url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; AnyBike Live Source Hub/2.0)","Accept":"text/html,text/plain,*/*"}});
          raw=(await boot.text()).slice(0,12000000);
          bootstrapCookie=boot.headers.get("set-cookie")||"";
          const scm=bootstrapCookie.match(/(?:^|[,;]\\s*)sc=([^;,]+)/i);
          scCookie=scm?scm[1]:"";
        }catch{}
        reader=await fetchReader(connector.results_url);
        let ids=[...new Set([...extractIds(raw),...extractIds(reader)])];

        const rawScContexts:string[]=[];
        for(const token of ['setCookie("sc"', "setCookie('sc'", '"sc"', "'sc'", 'X-sc']){
          let pos=0;
          while(true){
            const j=raw.indexOf(token,pos);
            if(j<0)break;
            rawScContexts.push(raw.slice(Math.max(0,j-1500),Math.min(raw.length,j+4000)));
            pos=j+token.length;
            if(rawScContexts.length>=20)break;
          }
          if(rawScContexts.length>=20)break;
        }
        const scriptSrcs=[...raw.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]).slice(0,100);
        const hiddenInputDump:any[]=[];
        for(const m of raw.matchAll(/<input[^>]*(?:type=["']hidden["'])[^>]*>/gi)){
          const tag=m[0];
          const id=(tag.match(/\bid=["']([^"']*)["']/i)||[])[1]||"";
          const name=(tag.match(/\bname=["']([^"']*)["']/i)||[])[1]||"";
          const value=(tag.match(/\bvalue=["']([^"']*)["']/i)||[])[1]||"";
          if(id||name)hiddenInputDump.push({id,name,value:value.slice(0,1000)});
          if(hiddenInputDump.length>=100)break;
        }
        const hiddenInputs:any={};
        for(const name of ["ViewData","hfSID","hfMarktId","hfcultName","hfCulture","hfRC"]){
          const re=new RegExp("<input[^>]+id=[\\\"']"+name+"[\\\"'][^>]+value=[\\\"']([^\\\"']*)[\\\"']","i");
          const m=raw.match(re);
          if(m)hiddenInputs[name]=m[1];
        }
        let decodedViewData="";
        if(hiddenInputs.ViewData){
          try{decodedViewData=atob(hiddenInputs.ViewData).slice(0,20000);}catch{}
        }
        let newestProbe:any=null;
        try{
          const ns:any={
            InitFilter:false,IsFirstCall:false,MarktId:Number(hiddenInputs.hfMarktId||2),BuNo:"",
            Culture:hiddenInputs.hfcultName||"en-gb",Segment:[0],FuelType:[],Marke:10,Modell:[0],
            Fahrzeugart:0,Antrieb:0,EZV:0,EZB:0,PreisVon:null,PreisBis:null,KMVon:null,KMBis:null,
            KWVon:null,KWBis:null,PowerUnit:"PS",Farbe1Auswahl:[0],Merkmale:"",Umkreis:0,UmkreisPLZ:"",
            AngebotsNo:"",DetailAngebotsNo:"",Sonderausstattung:"",isSondermodell:false,Pakete:"",
            FilterHMFAChanged:false,FilterEZChanged:0,FilterColorChanged:false,
            ResOverviewData:{currResultCountToShow:50,selectedPage:1,pagingSize:50,totalItemCount:1032,pageItemsToShow:10,tableSortColumn:16,tableSortDirection:0},
            DetailData:{RowNumber:0},currRequest:5
          };
          const nh:any=bmwJsonHeaders(connector.results_url,hiddenInputs.hfSID||"",bootstrapCookie);
          const pageTests:any[]=[];
          for(const page of [1,2,3,10,50,104]){
            const ps=structuredClone(ns);
            ps.ResOverviewData.selectedPage=page;
            const nr=await fetch(new URL("/api/Home/ShowNewestVehicles",connector.results_url).toString(),{
              method:"POST",headers:nh,body:JSON.stringify(ps)
            });
            const nt=await nr.text();
            let nj:any=null;try{nj=JSON.parse(nt)}catch{}
            const nhtml=String(nj?.ResTable||nj?.ResOVTable||"");
            pageTests.push({
              page,status:nr.status,keys:nj?Object.keys(nj):[],
              id_count:extractIds(nhtml).length,ids:extractIds(nhtml).slice(0,100),
              ro:nj?.ResOverviewData||null,body:nt.slice(0,3000)
            });
          }
          newestProbe={page_tests:pageTests};
        }catch(e){newestProbe={error:clean(e instanceof Error?e.message:e)};}

        let resultsApiProbe:any=null;
        try{
          const rs:any={
            InitFilter:true,IsFirstCall:true,MarktId:Number(hiddenInputs.hfMarktId||2),BuNo:"",
            Culture:hiddenInputs.hfcultName||"en-gb",Segment:[0],FuelType:[],Marke:10,Modell:[0],
            Fahrzeugart:0,Antrieb:0,EZV:0,EZB:0,PreisVon:null,PreisBis:null,KMVon:null,KMBis:null,
            KWVon:null,KWBis:null,PowerUnit:"PS",Farbe1Auswahl:[0],Merkmale:"",Umkreis:0,UmkreisPLZ:"",
            AngebotsNo:"",DetailAngebotsNo:"",Sonderausstattung:"",isSondermodell:false,Pakete:"",
            FilterHMFAChanged:false,FilterEZChanged:0,FilterColorChanged:false,
            ResOverviewData:{currResultCountToShow:50,selectedPage:1,pagingSize:0,totalItemCount:0,pageItemsToShow:10,tableSortColumn:16,tableSortDirection:0},
            DetailData:{RowNumber:0},currRequest:1
          };

          const evalHeaders:any={"Content-Type":"application/json","GMB-SID":hiddenInputs.hfSID||""};
          if(bootstrapCookie)evalHeaders["Cookie"]=bootstrapCookie;
          const ev=await fetch(new URL("/api/SearchService/EvalFilterData",connector.results_url).toString(),{
            method:"POST",headers:evalHeaders,body:JSON.stringify(rs)
          });
          const evText=await ev.text();
          let evJson:any=null;try{evJson=JSON.parse(evText)}catch{}
          const evalCookie=ev.headers.get("set-cookie")||bootstrapCookie||"";
          const scm=(evalCookie||"").match(/(?:^|[,;]\\s*)sc=([^;,]+)/i);
          const evSc=scm?scm[1]:"";

          const headers:any={"Content-Type":"application/json","GMB-SID":hiddenInputs.hfSID||""};
          if(evalCookie)headers["Cookie"]=cookieHeader(evalCookie);
          if(evSc)headers["X-sc"]=evSc;

          const rr=await fetch(new URL("/api/ResultOverview/ShowResults",connector.results_url).toString(),{
            method:"POST",headers,body:JSON.stringify(rs)
          });
          const rt=await rr.text();
          let rj:any=null;try{rj=JSON.parse(rt)}catch{}
          const html=String(rj?.ResTable||"");
          const resultVariants:any[]=[];
          for(const endpoint of ["ShowResults","ShowResultsFilterChanged"]){
            for(const initFilter of [true,false]){
              for(const isFirst of [true,false]){
                const vs=structuredClone(rs);
                vs.InitFilter=initFilter;
                vs.IsFirstCall=isFirst;
                vs.Marke=10;
                vs.ResOverviewData.totalItemCount=1032;
                vs.ResOverviewData.currResultCountToShow=50;
                vs.ResOverviewData.pagingSize=50;
                try{
                  const vr=await fetch(new URL("/api/ResultOverview/"+endpoint,connector.results_url).toString(),{
                    method:"POST",headers,body:JSON.stringify(vs)
                  });
                  const vt=await vr.text();
                  let vj:any=null;try{vj=JSON.parse(vt)}catch{}
                  const vhtml=String(vj?.ResTable||"");
                  resultVariants.push({
                    endpoint,initFilter,isFirst,status:vr.status,
                    has_table:!!vj?.ResTable,id_count:extractIds(vhtml).length,
                    ids:extractIds(vhtml).slice(0,5),
                    ro:vj?.SearchFilter?.ResOverviewData||vj?.ResOverviewData||null,
                    err:vj?.ErrMsg||null
                  });
                }catch(e){resultVariants.push({endpoint,initFilter,isFirst,error:clean(e instanceof Error?e.message:e)});}
              }
            }
          }

          const detailTests:any[]=[];
          for(const rowNo of [0,1,20,50]){
            try{
              const ds=structuredClone(rs);
              ds.DetailData={RowNumber:rowNo};
              ds.currRequest=2;
              const dr=await fetch(new URL("/api/Detail/GetDetailDataByRowNumber",connector.results_url).toString(),{
                method:"POST",headers,body:JSON.stringify(ds)
              });
              const dt=await dr.text();
              let dj:any=null;try{dj=JSON.parse(dt)}catch{}
              detailTests.push({
                row:rowNo,status:dr.status,offer:dj?.angebotsNr||null,
                model:dj?.markeModell||null,price:dj?.price||null,km:dj?.Km||null,
                keys:dj?Object.keys(dj):[],body:dt.slice(0,3000)
              });
            }catch(e){detailTests.push({row:rowNo,error:clean(e instanceof Error?e.message:e)});}
          }

          resultsApiProbe={
            eval_status:ev.status,eval_count:evJson?.SuchErgebnissanzahl||null,
            status:rr.status,keys:rj?Object.keys(rj):[],
            id_count:extractIds(html).length,ids:extractIds(html).slice(0,60),
            search_filter:rj?.SearchFilter?.ResOverviewData||rj?.ResOverviewData||null,
            body:rt.slice(0,12000),eval_cookie:evSc?"present":"missing",
            detail_tests:detailTests,result_variants:resultVariants
          };
        }catch(e){resultsApiProbe={error:clean(e instanceof Error?e.message:e)};}

        let postProbe:any=null;
        try{
          const state:any={
            InitFilter:false,IsFirstCall:false,MarktId:Number(hiddenInputs.hfMarktId||2),BuNo:"",
            Culture:hiddenInputs.hfcultName||"en-gb",Segment:[0],FuelType:[],Marke:10,Modell:[0],
            Fahrzeugart:0,Antrieb:0,EZV:0,EZB:0,PreisVon:null,PreisBis:null,KMVon:null,KMBis:null,
            KWVon:null,KWBis:null,PowerUnit:"PS",Farbe1Auswahl:[0],Merkmale:"",Umkreis:0,UmkreisPLZ:"",
            AngebotsNo:"",DetailAngebotsNo:"",Sonderausstattung:"",isSondermodell:false,Pakete:"",
            FilterHMFAChanged:false,FilterEZChanged:0,FilterColorChanged:false,
            ResOverviewData:{currResultCountToShow:50,selectedPage:1,pagingSize:50,totalItemCount:1032,pageItemsToShow:10,tableSortColumn:16,tableSortDirection:0},
            DetailData:{RowNumber:0},currRequest:1
          };
          const bodyForm=new URLSearchParams();
          bodyForm.set("ViewData",btoa(JSON.stringify(state)));
          bodyForm.set("hfSID",hiddenInputs.hfSID||"");
          bodyForm.set("hfMarktId","2");
          bodyForm.set("hfcultName",hiddenInputs.hfcultName||"en-gb");
          const pr=await fetch(connector.results_url,{method:"POST",redirect:"follow",headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Mozilla/5.0 (compatible; AnyBike Live Source Hub/2.0)"},body:bodyForm.toString()});
          const pt=await pr.text();
          postProbe={status:pr.status,length:pt.length,id_count:extractIds(pt).length,ids:extractIds(pt).slice(0,80),sample:pt.slice(0,1500)};
        }catch(e){postProbe={error:clean(e instanceof Error?e.message:e)};}

        let postRedirectProbe:any=null;
        try{
          const state:any={
            InitFilter:false,IsFirstCall:false,MarktId:2,BuNo:"",
            Culture:hiddenInputs.hfcultName||"en-gb",Segment:[0],FuelType:[],Marke:10,Modell:[0],
            Fahrzeugart:0,Antrieb:0,EZV:0,EZB:0,PreisVon:null,PreisBis:null,KMVon:null,KMBis:null,
            KWVon:null,KWBis:null,PowerUnit:"PS",Farbe1Auswahl:[0],Merkmale:"",Umkreis:0,UmkreisPLZ:"",
            AngebotsNo:"",DetailAngebotsNo:"",Sonderausstattung:"",isSondermodell:false,Pakete:"",
            FilterHMFAChanged:false,FilterEZChanged:0,FilterColorChanged:false,
            ResOverviewData:{currResultCountToShow:50,selectedPage:1,pagingSize:50,totalItemCount:1032,pageItemsToShow:10,tableSortColumn:16,tableSortDirection:0},
            DetailData:{RowNumber:0},currRequest:1
          };
          const pf=new URLSearchParams();
          pf.set("ViewData",btoa(JSON.stringify(state)));
          pf.set("hfSID",hiddenInputs.hfSID||"");
          pf.set("hfMarktId","2");
          pf.set("hfcultName",hiddenInputs.hfcultName||"en-gb");
          const mr=await fetch(connector.results_url,{
            method:"POST",redirect:"manual",
            headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Mozilla/5.0 (compatible; AnyBike Live Source Hub/2.0)"},
            body:pf.toString()
          });
          postRedirectProbe={
            status:mr.status,
            location:mr.headers.get("location"),
            set_cookie:mr.headers.get("set-cookie")?"present":"missing",
            set_cookie_value:(mr.headers.get("set-cookie")||"").slice(0,1000),
            body:(await mr.text()).slice(0,2000)
          };
        }catch(e){postRedirectProbe={error:clean(e instanceof Error?e.message:e)};}

        let browserFlowProbe:any=null;
        let browserFlowIds:string[]=[];
        try{
          const state:any={
            InitFilter:false,IsFirstCall:false,MarktId:2,BuNo:"",
            Culture:hiddenInputs.hfcultName||"en-gb",Segment:[0],FuelType:[],Marke:10,Modell:[0],
            Fahrzeugart:0,Antrieb:0,EZV:0,EZB:0,PreisVon:null,PreisBis:null,KMVon:null,KMBis:null,
            KWVon:null,KWBis:null,PowerUnit:"PS",Farbe1Auswahl:[0],Merkmale:"",Umkreis:0,UmkreisPLZ:"",
            AngebotsNo:"",DetailAngebotsNo:"",Sonderausstattung:"",isSondermodell:false,Pakete:"",
            FilterHMFAChanged:false,FilterEZChanged:0,FilterColorChanged:false,
            ResOverviewData:{currResultCountToShow:50,selectedPage:1,pagingSize:50,totalItemCount:1032,pageItemsToShow:10,tableSortColumn:16,tableSortDirection:0},
            DetailData:{RowNumber:0},currRequest:1
          };
          const pf=new URLSearchParams();
          pf.set("ViewData",btoa(JSON.stringify(state)));
          pf.set("hfSID",hiddenInputs.hfSID||"");
          pf.set("hfMarktId","2");
          pf.set("hfcultName",hiddenInputs.hfcultName||"en-gb");
          const pageRes=await fetch(connector.results_url,{
            method:"POST",redirect:"follow",
            headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Mozilla/5.0 (compatible; AnyBike Live Source Hub/2.0)"},
            body:pf.toString()
          });
          const pageText=await pageRes.text();
          const sidMatch=pageText.match(/<input[^>]+id=["']hfSID["'][^>]+value=["']([^"']+)["']/i);
          const postSid=sidMatch?sidMatch[1]:"";
          const vdMatch=pageText.match(/<input[^>]+id=["']ViewData["'][^>]+value=["']([^"']*)["']/i);
          let returnedState:any=state;
          let returnedViewData="";
          if(vdMatch&&vdMatch[1]){
            returnedViewData=vdMatch[1];
            try{returnedState=JSON.parse(atob(vdMatch[1]));}catch{}
          }
          if(returnedState?.ResOverviewData){
            returnedState.ResOverviewData.currResultCountToShow=50;
          }
          const pageCookie=pageRes.headers.get("set-cookie")||"";
          const h:any=bmwJsonHeaders(connector.results_url,postSid||hiddenInputs.hfSID||"",pageCookie);

          const pageSummaries:any[]=[];
          const allResultIds=new Set<string>();
          const initialTotal=Number(returnedState?.ResOverviewData?.totalItemCount||0);
          const pageSize=Math.max(1,Number(returnedState?.ResOverviewData?.currResultCountToShow||50));
          const totalPages=Math.max(1,Math.ceil(initialTotal/pageSize));
          const maxPages=Math.min(totalPages,120);

          let firstStatus=0,firstHasTable=false,firstBody="",firstOverview:any=null;
          for(let page=1;page<=maxPages;page++){
            const stateForPage=structuredClone(returnedState);
            if(!stateForPage.ResOverviewData)stateForPage.ResOverviewData={};
            stateForPage.ResOverviewData.selectedPage=page;
            stateForPage.ResOverviewData.currResultCountToShow=pageSize;
            stateForPage.ResOverviewData.pagingSize=pageSize;
            stateForPage.currRequest=1;

            const rr=await fetch(new URL("/api/ResultOverview/ShowResults",connector.results_url).toString(),{
              method:"POST",headers:h,body:JSON.stringify(stateForPage)
            });
            const rt=await rr.text();
            let rj:any=null;try{rj=JSON.parse(rt)}catch{}
            const rh=String(rj?.ResTable||"");
            const pageIds=extractIds(rh);
            pageIds.forEach(id=>allResultIds.add(id));

            if(page===1){
              firstStatus=rr.status;
              firstHasTable=!!rj?.ResTable;
              firstBody=rt.slice(0,5000);
              firstOverview=rj?.ResOverviewData||null;
            }

            pageSummaries.push({
              page,status:rr.status,id_count:pageIds.length,
              first_id:pageIds[0]||null,last_id:pageIds[pageIds.length-1]||null
            });

            // Stop if BMW returns no table/IDs or starts repeating an earlier page.
            if(!rj?.ResTable || !pageIds.length)break;
            if(page>1 && pageSummaries.length>=2){
              const prev=pageSummaries[pageSummaries.length-2];
              if(prev.first_id===pageIds[0] && prev.last_id===pageIds[pageIds.length-1])break;
            }
          }

          browserFlowIds=[...allResultIds];
          browserFlowProbe={
            page_status:pageRes.status,post_sid:postSid?"present":"missing",returned_view_data:returnedViewData?"present":"missing",
            returned_state_summary:{
              InitFilter:returnedState?.InitFilter,
              IsFirstCall:returnedState?.IsFirstCall,
              MarktId:returnedState?.MarktId,
              BuNo:returnedState?.BuNo,
              Marke:returnedState?.Marke,
              Modell:returnedState?.Modell,
              currRequest:returnedState?.currRequest,
              ResOverviewData:returnedState?.ResOverviewData,
              DetailData:returnedState?.DetailData,
              keys:returnedState&&typeof returnedState==="object"?Object.keys(returnedState):[]
            },
            result_status:firstStatus,has_table:firstHasTable,
            id_count:browserFlowIds.length,ids:browserFlowIds.slice(0,100),
            ro:firstOverview,body:firstBody,pages:pageSummaries
          };
        }catch(e){browserFlowProbe={error:clean(e instanceof Error?e.message:e)};}

        if(browserFlowIds.length){
          ids=[...new Set([...ids,...browserFlowIds])];
        }

        let apiProbe:any=null;
        try{
          const base=new URL(connector.results_url);
          const apiUrl=base.origin+"/api/SearchService/EvalFilterData";
          const probeState:any={
            InitFilter:true,IsFirstCall:true,MarktId:Number(hiddenInputs.hfMarktId||2),BuNo:"",
            Culture:hiddenInputs.hfcultName||"en-gb",Segment:[0],FuelType:[],Marke:0,Modell:[0],
            Fahrzeugart:0,Antrieb:0,EZV:0,EZB:0,PreisVon:"from",PreisBis:"to",KMVon:"from",KMBis:"to",
            KWVon:"from",KWBis:"to",PowerUnit:"PS",Farbe1Auswahl:[0],Merkmale:"",Umkreis:1,UmkreisPLZ:"",
            AngebotsNo:"",DetailAngebotsNo:"",Sonderausstattung:"",isSondermodell:false,Pakete:"",
            FilterHMFAChanged:false,FilterEZChanged:0,FilterColorChanged:false,
            ResOverviewData:{currResultCountToShow:50,selectedPage:1,pagingSize:0,totalItemCount:0,pageItemsToShow:10,tableSortColumn:16,tableSortDirection:0},
            DetailData:{RowNumber:0},currRequest:1
          };
          const headers:any=bmwJsonHeaders(connector.results_url,hiddenInputs.hfSID||"",bootstrapCookie);
          if(scCookie)headers["X-sc"]=scCookie;
          const res=await fetch(apiUrl,{method:"POST",headers,body:JSON.stringify(probeState)});
          const bodyText=await res.text();
          let parsed:any=null;try{parsed=JSON.parse(bodyText)}catch{}
          apiProbe={
            status:res.status,body:bodyText.slice(0,30000),
            result_count:parsed?.SuchErgebnissanzahl||null,market_id:parsed?.MarktId||null,res_overview:parsed?.ResOverviewData||null,
            sc_cookie:scCookie?"present":"missing",
            response_headers:Object.fromEntries([...res.headers.entries()].filter(([k])=>/cookie|sc|sid|route|token/i.test(k)))
          };
        }catch(e){apiProbe={error:clean(e instanceof Error?e.message:e)};}
        const formActions=[...raw.matchAll(/<form[^>]+action=["']([^"']+)["']/gi)].map(m=>m[1]).slice(0,100);
        const endpointHints=[...new Set(
          [...raw.matchAll(/["']([^"']*(?:api|ajax|result|search|ergebnis|vehicle|fahrzeug)[^"']*)["']/gi)]
            .map(m=>clean(m[1]))
            .filter(x=>x.length>2&&x.length<300)
        )].slice(0,150);

        const bundleDiagnostics:any[]=[];
        for(const src of scriptSrcs){
          try{
            const u=new URL(src,connector.results_url).toString();
            const txt=await fetchText(u);
            const hits=[...new Set(
              [...txt.matchAll(/["']([^"']*(?:api|ajax|result|search|ergebnis|vehicle|fahrzeug|RedirectToResults|SetResultTable|currVehicle|pageSize|PageSize)[^"']*)["']/gi)]
                .map(m=>clean(m[1])).filter(x=>x.length>2&&x.length<500)
            )].slice(0,200);
            const snippets:string[]=[];
            for(const needle of ["RedirectToResults","SetResultTable","currVehicleTotal","SuchErgebnissanzahl","pageSize","PageSize","ResetSearch=function","ResOverviewData.currResultCountToShow","GlobalInfo","rootPath=","DetailData=","ResOverviewData=","MarktId=","SearchCriteria=function","ResultOverview/ShowResults"]){
              const idx=txt.indexOf(needle);
              if(idx>=0)snippets.push(txt.slice(Math.max(0,idx-3000),Math.min(txt.length,idx+12000)));
            }
            const tailIdx=txt.indexOf("o.currRequest=n.GetCurrentPage()");
            const controllerTail=tailIdx>=0?txt.slice(tailIdx,Math.min(txt.length,tailIdx+30000)):"";
            const scContexts:string[]=[];
            for(const token of ['setCookie("sc"', "setCookie('sc'", '"X-sc"', "'X-sc'", 'getCookie("sc"', "getCookie('sc'"]){
              let from=0;
              while(true){
                const j=txt.indexOf(token,from);
                if(j<0)break;
                scContexts.push(txt.slice(Math.max(0,j-2000),Math.min(txt.length,j+5000)));
                from=j+token.length;
                if(scContexts.length>=20)break;
              }
              if(scContexts.length>=20)break;
            }
            const resIdx=Math.max(txt.indexOf("showResOverview=function"),txt.indexOf("showResOverview = function"),txt.indexOf("showResOverview:function"),txt.indexOf("showResOverview="));
            const resFn=resIdx>=0?txt.slice(Math.max(0,resIdx-1500),Math.min(txt.length,resIdx+12000)):"";
            const filtIdx=Math.max(txt.indexOf("showResOverviewFilterChanged=function"),txt.indexOf("showResOverviewFilterChanged = function"),txt.indexOf("showResOverviewFilterChanged:function"),txt.indexOf("showResOverviewFilterChanged="));
            const filtFn=filtIdx>=0?txt.slice(Math.max(0,filtIdx-1500),Math.min(txt.length,filtIdx+12000)):"";
            bundleDiagnostics.push({src,hits,snippets,controller_tail:controllerTail,show_results_fn:resFn,show_results_filter_changed_fn:filtFn,sc_contexts:scContexts});
          }catch(e){
            bundleDiagnostics.push({src,error:clean(e instanceof Error?e.message:e)});
          }
        }

        if(!ids.length) return json({error:"BMW catalogue loaded but no Bike IDs were discovered.",script_srcs:scriptSrcs,form_actions:formActions,endpoint_hints:endpointHints},502);

        const {data:existingRows}=await admin.from("live_source_items")
          .select("source_key").eq("connector_id",connectorId).eq("source_status","live");
        const existing=new Set((existingRows||[]).map((x:any)=>String(x.source_key)));
        ids.sort((a,b)=>(existing.has(a)?1:0)-(existing.has(b)?1:0));

        const {data:newRun,error:runError}=await admin.from("live_source_sync_runs").insert({
          connector_id:connectorId,
          started_at:new Date().toISOString(),
          status:"running",
          discovered_count:ids.length,
          new_count:0,
          changed_count:0,
          ended_count:0,
          live_count:0,
          details:{ids,cursor:0,failed_count:0,raw_sc_contexts:rawScContexts,script_srcs:scriptSrcs,form_actions:formActions,endpoint_hints:endpointHints,bundle_diagnostics:bundleDiagnostics,hidden_inputs:hiddenInputs,hidden_input_dump:hiddenInputDump,decoded_view_data:decodedViewData,api_probe:apiProbe,post_probe:postProbe,results_api_probe:resultsApiProbe,newest_probe:newestProbe,browser_flow_probe:browserFlowProbe,post_redirect_probe:postRedirectProbe,sc_cookie_present:!!scCookie}
        }).select("*").single();
        if(runError) throw runError;
        run=newRun;
      }

      const details=run.details||{};
      const ids:Array<string>=Array.isArray(details.ids)?details.ids.map(String):[];
      let cursor=Number(details.cursor||0);
      if(!ids.length) throw new Error("Sync run has no discovered Bike IDs.");

      const chunkSize=Math.max(1,Math.min(Number(body.chunk_size)||20,20));
      const chunk=ids.slice(cursor,cursor+chunkSize);
      const sourceUrls=chunk.map(id=>absoluteDetail(connector.results_url,id)).filter(Boolean);

      let authHeaders:any={"Content-Type":"application/json"};
      if(ctx.authMode==="secret"){
        authHeaders.apikey=req.headers.get("apikey")||"";
      }else{
        authHeaders.Authorization=req.headers.get("Authorization")||"";
      }

      const scanRes=await fetch((Deno.env.get("SUPABASE_URL")||"")+"/functions/v1/scan-used-bike-advert",{
        method:"POST",headers:authHeaders,body:JSON.stringify({urls:sourceUrls})
      });
      const scanData=await scanRes.json().catch(()=>({}));
      if(!scanRes.ok) throw new Error(scanData?.error||"Scanner call failed");

      let newCount=Number(run.new_count||0),changedCount=Number(run.changed_count||0),failedCount=Number(details.failed_count||0);
      for(const item of (scanData.results||[])){
        if(!validBmwRefreshItem(item)){
          failedCount++;
          continue;
        }
        const result=await upsertItem(admin,connectorId,item);
        if(result.isNew)newCount++;
        if(result.changed)changedCount++;
      }

      cursor+=chunk.length;
      const completed=cursor>=ids.length;

      if(completed){
        const seen=new Set(ids);

        // Only a genuinely full catalogue run is allowed to mark unseen motorcycles ended.
        // Partial BMW discovery can occur when the source returns only part of the catalogue.
        const {data:history}=await admin.from("live_source_sync_runs")
          .select("discovered_count")
          .eq("connector_id",connectorId)
          .eq("status","completed")
          .neq("id",run.id)
          .order("discovered_count",{ascending:false})
          .limit(1);
        const previousMax=Math.max(0,Number(history?.[0]?.discovered_count||0));
        const fullCatalogueRun=previousMax>0
          ? ids.length>=Math.max(100,Math.floor(previousMax*0.8))
          : ids.length>=500;

        const {data:allRows}=await admin.from("live_source_items")
          .select("id,source_key,source_status")
          .eq("connector_id",connectorId);

        const endedIds=fullCatalogueRun
          ? (allRows||[]).filter((x:any)=>x.source_status==="live"&&!seen.has(String(x.source_key))).map((x:any)=>x.id)
          : [];

        if(endedIds.length){
          await admin.from("live_source_items")
            .update({source_status:"ended",ended_at:new Date().toISOString(),updated_at:new Date().toISOString()})
            .in("id",endedIds);
        }

        const {count:liveCount}=await admin.from("live_source_items")
          .select("id",{count:"exact",head:true})
          .eq("connector_id",connectorId)
          .eq("source_status","live");

        await admin.from("live_source_sync_runs").update({
          completed_at:new Date().toISOString(),status:"completed",
          new_count:newCount,changed_count:changedCount,ended_count:endedIds.length,live_count:liveCount||0,
          details:{...(run.details||{}),ids,cursor,failed_count:failedCount,full_catalogue_run:fullCatalogueRun,previous_max_discovered:previousMax}
        }).eq("id",run.id);

        await admin.from("live_source_connectors").update({
          last_refresh_completed_at:new Date().toISOString(),
          last_refresh_status:fullCatalogueRun?"completed":"partial",
          last_live_count:liveCount||0
        }).eq("id",connectorId);

        return json({
          connector_id:connectorId,run_id:run.id,discovered_count:ids.length,
          processed_count:chunk.length,cursor,total:ids.length,new_count:newCount,changed_count:changedCount,
          ended_count:endedIds.length,failed_count:failedCount,completed:true,
          full_catalogue_run:fullCatalogueRun,
          message:fullCatalogueRun
            ?"BMW source refresh completed."
            :"BMW partial refresh completed. Existing live motorcycles were preserved."
        });
      }

      await admin.from("live_source_sync_runs").update({
        new_count:newCount,changed_count:changedCount,
        details:{...(run.details||{}),ids,cursor,failed_count:failedCount}
      }).eq("id",run.id);

      return json({connector_id:connectorId,run_id:run.id,discovered_count:ids.length,processed_count:chunk.length,cursor,total:ids.length,new_count:newCount,changed_count:changedCount,failed_count:failedCount,completed:false,message:"BMW source refresh in progress: "+cursor+" / "+ids.length+" processed."});
    }catch(e){
      return json({error:clean(e instanceof Error?e.message:e)},500);
    }
  })
};