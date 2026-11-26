import {createClient} from "https://esm.sh/@supabase/supabase-js@2.49.4";
const origin="https://www.anybike.co.uk";
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"content-type,authorization,apikey","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const response=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers});
const enc=new TextEncoder();
const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(Deno.env.get("SUPABASE_URL")!,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const key=await crypto.subtle.importKey("raw",enc.encode(secret+"|anybike-ad-events-v1"),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);
const b64=(x:Uint8Array)=>btoa(String.fromCharCode(...x)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
const un64=(x:string)=>Uint8Array.from(atob(x.replaceAll("-","+").replaceAll("_","/")),c=>c.charCodeAt(0));
async function sign(p:Record<string,unknown>){const body=b64(enc.encode(JSON.stringify(p)));return body+"."+b64(new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(body))))}
async function decode(token:string){
 try{
  if(typeof token!=="string"||token.length>2048)return null;
  const [body,sig,extra]=token.split(".");
  if(!body||!sig||extra)return null;
  if(!await crypto.subtle.verify("HMAC",key,un64(sig),enc.encode(body)))return null;
  const p=JSON.parse(new TextDecoder().decode(un64(body)));
  if(!p||typeof p!=="object"||typeof p.cid!=="string"||typeof p.nonce!=="string")return null;
  if(p.cid.length!==36||p.nonce.length!==36||!Number.isFinite(p.exp))return null;
  if(p.exp<=Date.now()||p.exp>Date.now()+3600000)return null;
  if(p.mid!==null&&(!Number.isSafeInteger(p.mid)||p.mid<=0))return null;
  if(typeof p.country!=="string"||p.country.length!==2||p.country!==p.country.toUpperCase())return null;
  if(p.path!==undefined&&(typeof p.path!=="string"||p.path.length>200||!p.path.startsWith("/")||!p.path.endsWith(".html")||p.path.includes("..")))return null;
  if(p.slot!==undefined&&(typeof p.slot!=="string"||p.slot.length>96||!/^AB-[A-Z0-9-]+$/.test(p.slot)))return null;
  return p;
 }catch{return null}
}
// Approved presentation metadata comes only from the campaign and enabled page inventory.

// Planner-controlled rotation: stable within each interval, automatic
// fallback to normal campaign ranking when disabled or only one is eligible.
const pickCampaign=(ads:any[],enabled:boolean,minutes:number)=>{
 if(!ads.length)return null;
 if(!enabled||ads.length===1)return ads[0];
 const interval=Math.max(5,Math.min(1440,Number(minutes)||30));
 const turn=Math.floor(Date.now()/(interval*60000));
 return ads[turn%ads.length];
};
const campaignCreative=async(id:string)=>{const {data,error}=await db.from("advertising_campaigns").select("slim_image_url,compact_image_url,stock_card_image_url").eq("id",id).maybeSingle();if(error)throw error;return data||{}};
const buildCompanion=async(primary:Record<string,unknown>,companionId:string|null,_eligible:Record<string,unknown>[],
 meta:{country:string;mid:number|null;path:string;category:string;slot:string;make?:string;model?:string})=>{
 if(!companionId||companionId===primary.id)return null;
 // Only the approved public ACTIVE projection can supply a companion advert.
 const {data:a,error}=await db.from("public_advertising_creatives_v1").select("*").eq("id",companionId).maybeSingle();
 if(error)throw error;
 if(!a||!matchCountry(a.countries,meta.country)||
  !match(a.page_categories,meta.category)||!match(a.page_paths,meta.path)||
  !match(a.manufacturers,meta.make||"")||!match(a.models,meta.model||"")||
  a.customer_types?.length||!a.destination_url?.startsWith("https://")||
  !a.desktop_image_url?.startsWith("https://")||!a.mobile_image_url?.startsWith("https://"))return null;
 const artwork=await campaignCreative(String(a.id));
 return {id:a.id,partner_name:a.partner_name,...artwork,desktop_image_url:a.desktop_image_url,
 mobile_image_url:a.mobile_image_url,destination_url:a.destination_url,
 alt_text:a.alt_text,disclosure:a.disclosure,
 token:await sign({cid:a.id,mid:meta.mid,path:meta.path,nonce:crypto.randomUUID(),
 country:meta.country,slot:meta.slot+"-B",exp:Date.now()+3600000})};
};
// Public multi-advert layouts are used only for eligible approved campaigns.
// An incomplete or ineligible published layout safely falls back to the existing single advert.
const publishedLayoutForPage=async(p:any,_candidates:any[],verifiedMarket:string|null,modelId:number|null=null)=>{
 if(!verifiedMarket||(modelId===null&&verifiedMarket!=="GB")||!/^AB-[A-Z0-9-]+$/.test(String(p.slot_code||"")))return null;
 const {data:layout,error:le}=await db.from("advertising_slot_published_layouts")
  .select("slot_code,page_path,campaign_ids,artwork_formats,advert_count")
  .eq("slot_code",p.slot_code).eq("page_path",p.page_path).maybeSingle();
 if(le){console.warn("Multi-advert layout unavailable",String(le));return null}
 if(!layout)return null;
 const ids=layout.campaign_ids||[],formats=layout.artwork_formats||[];
 if(ids.length!==layout.advert_count||formats.length!==ids.length||ids.length<1||ids.length>4||new Set(ids).size!==ids.length)return null;
 const {data:campaigns,error:ce}=await db.from("advertising_campaigns")
  .select("id,partner_id,status").in("id",ids);
 if(ce||campaigns?.length!==ids.length)return null;
 const owners=new Map(campaigns.map((c:any)=>[c.id,c]));
 const partnerIds=[...new Set(campaigns.map((c:any)=>c.partner_id))];
 const {data:masters,error:me}=await db.from("advertising_partner_artwork_library")
  .select("partner_id,creative_format,active_artwork_id").in("partner_id",partnerIds).not("active_artwork_id","is",null);
 if(me)return null;
 const versionsIds=[...new Set((masters||[]).map((x:any)=>x.active_artwork_id))];
 const {data:versions,error:ve}=versionsIds.length?
  await db.from("advertising_client_artwork").select("id,public_url,status,alt_text").in("id",versionsIds):
  {data:[],error:null};
 if(ve)return null;
 const approved=new Map((versions||[]).filter((x:any)=>x.status==="approved"&&typeof x.public_url==="string"&&x.public_url.startsWith("https://")).map((x:any)=>[x.id,x]));
 const artMap=new Map((masters||[]).map((x:any)=>[x.partner_id+"|"+x.creative_format,approved.get(x.active_artwork_id)]));
 // A deliberately published named-slot assignment overrides automatic page/category targeting.
 // Still require the public approved creative projection, correct country and campaign dates.
 const {data:assigned,error:assignedError}=await db.from("public_advertising_creatives_v1")
  .select("*").in("id",ids);
 if(assignedError||!assigned||(modelId===null&&assigned.length!==ids.length))return null;
 const byId=new Map(assigned.filter((a:any)=>matchCountry(a.countries,verifiedMarket)).map((a:any)=>[a.id,a]));
 const ready=[];
 for(let i=0;i<ids.length;i++){
  const c=owners.get(ids[i]),a=byId.get(ids[i]),format=formats[i];
  if(modelId!==null&&(!c||c.status!=="active"||!a))continue;
  if(!c||c.status!=="active"||!a||!["square","slim","stock_card","landscape","portrait"].includes(format))return null;
  const art=artMap.get(c.partner_id+"|"+format);
  if(!art||!a.destination_url?.startsWith("https://"))return null;
  ready.push({id:a.id,slot_code:p.slot_code,placement_key:p.placement_key,partner_name:a.partner_name,format,image_url:art.public_url,
   alt_text:art.alt_text||a.alt_text||"",destination_url:a.destination_url,
   token:await sign({cid:a.id,mid:modelId,path:p.page_path,nonce:crypto.randomUUID(),
    country:verifiedMarket,slot:p.slot_code+"-"+(i+1),exp:Date.now()+3600000})});
 }
 return ready.length?ready:null;
};
const match=(a:string[]|null,v:string)=>!a?.length||a.some(x=>String(x).trim().toLowerCase()===v.trim().toLowerCase());
const matchCountry=(a:string[]|null,v:string)=>!!a?.length&&a.some(x=>String(x).trim().toUpperCase()===v);
const verifiedCountry=async(req:Request)=>{
 // Only managed Cloudflare geo metadata or verified IP lookup controls paid targeting.
 const cloudflareCountry=(req.headers.get("cf-ipcountry")||"").trim().toUpperCase();
 if(/^[A-Z]{2}$/.test(cloudflareCountry)&&cloudflareCountry!=="XX")return cloudflareCountry;
 // Never trust user-supplied country, x-forwarded-for or x-real-ip for advertising geography.
 // Managed Supabase ingress supplies cf-connecting-ip; absence or an untrusted value fails closed.
 const ip=(req.headers.get("cf-connecting-ip")||"").trim();
 if(!ip||ip.length>64||!(/^[a-f0-9:.]+$/i.test(ip))||ip==="127.0.0.1"||ip==="::1")return null;
 try{
  const response=await fetch("https://ipwho.is/"+encodeURIComponent(ip)+"?fields=success,country_code",{signal:AbortSignal.timeout(2000)});
  if(!response.ok)return null;
  const geo=await response.json();
  const code=String(geo?.country_code||"").toUpperCase();
  return geo?.success!==false&&/^[A-Z]{2}$/.test(code)?code:null;
 }catch{return null;}
};
Deno.serve(async req=>{if(req.headers.get("origin")!==origin)return response({error:"Origin not permitted"},403);if(req.method==="OPTIONS")return new Response(null,{status:204,headers});if(req.method!=="POST")return response({error:"Method not permitted"},405);try{const raw=await req.text();if(raw.length>4096)return response({error:"Request too large"},413);const b=JSON.parse(raw);
if(b.action==="select"){const id=Number(b.model_id);const verifiedMarket=await verifiedCountry(req);const marketTargeting=b.market_targeting===true;
const country=marketTargeting?verifiedMarket:"GB";
if(!country||!Number.isSafeInteger(id)||id<=0||(!marketTargeting&&b.country!=="GB"))return response({ad:null});const {data:m,error:me}=await db.from("motorcycle_catalog_models").select("id,manufacturer,model,slug").eq("id",id).maybeSingle();if(me||!m)return response({ad:null});const {data:override,error:oe}=await db.from("advertising_model_overrides").select("campaign_id,suppressed").eq("catalogue_model_id",id).eq("placement","below_hero").maybeSingle();if(oe)throw oe;if(override?.suppressed)return response({ad:null});const path="/motorcycle-v2-master.html";const {data:placement,error:placementError}=await db.from("advertising_page_inventory").select("placement_enabled,excluded,placement_key,creative_format,slot_code,paired_layout,companion_campaign_id,market_scope,rotation_enabled,rotation_interval_minutes").eq("page_path",path).maybeSingle();if(placementError)throw placementError;if(!placement?.placement_enabled||placement.excluded||
 (!marketTargeting&&verifiedMarket!=="GB"&&placement.market_scope!=="uk_site_house"))return response({ad:null});const {data:ads,error}=await db.from("public_advertising_creatives_v1").select("*").eq("placement","below_hero");if(error)throw error;const candidates=(ads||[]).filter(a=>(!override?.campaign_id||override.campaign_id===a.id)&&
 (marketTargeting||verifiedMarket==="GB"||(a.campaign_category==="house"&&a.partner_kind==="transport"))&&matchCountry(a.countries,country)&&match(a.manufacturers,m.manufacturer)&&match(a.models,m.model)&&match(a.page_categories,"model")&&(!a.customer_types?.length)&&match(a.page_paths,path)&&a.destination_url?.startsWith("https://")&&a.desktop_image_url?.startsWith("https://")&&a.mobile_image_url?.startsWith("https://"));candidates.sort((a,b)=>Number(!!b.models?.length)-Number(!!a.models?.length)||Number(!!b.manufacturers?.length)-Number(!!a.manufacturers?.length)||b.priority-a.priority||a.id.localeCompare(b.id));const published=override?.campaign_id?null:await publishedLayoutForPage({...placement,page_path:path},candidates,verifiedMarket,id);
if(published)return response({layout:published,ad:null});
const a=pickCampaign(candidates,!!placement.rotation_enabled,placement.rotation_interval_minutes);if(!a)return response({ad:null});const token=await sign({cid:a.id,mid:id,nonce:crypto.randomUUID(),country,path,slot:placement.slot_code+"-M"+id,exp:Date.now()+3600000});const artwork=await campaignCreative(a.id);const companion=placement.paired_layout&&(marketTargeting||verifiedMarket==="GB")?await buildCompanion(a,placement.companion_campaign_id,candidates,{country,mid:id,path,category:"model",slot:placement.slot_code+"-M"+id,make:m.manufacturer,model:m.model}):null;return response({ad:{id:a.id,slot_code:placement.slot_code,paired_layout:placement.paired_layout,companion,...artwork,placement_key:placement.placement_key,creative_format:placement.creative_format,partner_name:a.partner_name,headline:(a.headline_template||a.name).replaceAll("{{make}}",m.manufacturer).replaceAll("{{model}}",m.model),subheading:a.subheading,cta_text:a.cta_text,desktop_image_url:a.desktop_image_url,mobile_image_url:a.mobile_image_url,destination_url:a.destination_url,alt_text:a.alt_text,disclosure:a.disclosure,use_model_photo:a.use_model_photo,token}})}
if(b.action==="select_page"){const path=String(b.page_path||"");const verifiedMarket=await verifiedCountry(req);const country="GB";
if(b.country!=="GB"||path.length>200||!/^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]*\.html$/i.test(path))return response({ad:null});const {data:p,error:pe}=await db.from("advertising_page_inventory").select("page_path,page_category,placement_enabled,excluded,placement_key,creative_format,slot_code,paired_layout,companion_campaign_id,market_scope,rotation_enabled,rotation_interval_minutes").eq("page_path",path).maybeSingle();if(pe)throw pe;if(!p||!p.placement_enabled||p.excluded||
 (verifiedMarket!=="GB"&&p.market_scope!=="uk_site_house"))return response({ad:null});const {data:ads,error}=await db.from("public_advertising_creatives_v1").select("*").eq("placement","below_hero");if(error)throw error;const candidates=(ads||[]).filter(a=>(verifiedMarket==="GB"||
 (a.campaign_category==="house"&&a.partner_kind==="transport"))&&matchCountry(a.countries,country)&&match(a.page_categories,p.page_category)&&match(a.page_paths,path)&&!a.manufacturers?.length&&!a.models?.length&&!a.customer_types?.length&&!(/\{\{(?:make|model)\}\}/.test(a.headline_template||""))&&a.destination_url?.startsWith("https://")&&a.desktop_image_url?.startsWith("https://")&&a.mobile_image_url?.startsWith("https://"));candidates.sort((a,b)=>Number(!!b.page_paths?.length)-Number(!!a.page_paths?.length)||b.priority-a.priority||a.id.localeCompare(b.id));// Stock cards require an uploaded approved stock-size creative; no fallback
// to a slim 16:9 banner, which could distort or break the approved grid.
if(p.placement_key==="stock_grid"){
 const ids=candidates.map(c=>c.id);
 const {data:art,error:artError}=ids.length?
   await db.from("advertising_campaigns").select("id,stock_card_image_url").in("id",ids):
   {data:[],error:null};
 if(artError)throw artError;
 const ready=new Set((art||[]).filter(c=>typeof c.stock_card_image_url==="string"&&
   c.stock_card_image_url.startsWith("https://")).map(c=>c.id));
 for(let i=candidates.length-1;i>=0;i--)if(!ready.has(candidates[i].id))candidates.splice(i,1);
}
const published=await publishedLayoutForPage(p,candidates,verifiedMarket);if(published)return response({layout:published,ad:null});
const a=pickCampaign(candidates,!!p.rotation_enabled,p.rotation_interval_minutes);if(!a)return response({ad:null});const token=await sign({cid:a.id,mid:null,path,nonce:crypto.randomUUID(),country,slot:p.slot_code,exp:Date.now()+3600000});const artwork=await campaignCreative(a.id);const companion=p.paired_layout&&verifiedMarket==="GB"?await buildCompanion(a,p.companion_campaign_id,candidates,{country,mid:null,path,category:p.page_category,slot:p.slot_code}):null;return response({ad:{id:a.id,slot_code:p.slot_code,paired_layout:p.paired_layout,companion,...artwork,placement_key:p.placement_key,creative_format:p.creative_format,partner_name:a.partner_name,headline:a.headline_template||a.name,subheading:a.subheading,cta_text:a.cta_text,desktop_image_url:a.desktop_image_url,mobile_image_url:a.mobile_image_url,destination_url:a.destination_url,alt_text:a.alt_text,disclosure:a.disclosure,token}})}
// Listing positions are explicit published assignments, using the existing layout table.
// The first rollout deliberately permits only approved house transport campaigns.
// Retail finance stays disabled until authenticated audience targeting is implemented.
if(b.action==="select_listing"){
 const path=String(b.page_path||"");
 // Public stock accepts only UK house transport campaigns, never finance or dealer-only promotions.
 const audience=path==="/trade-opportunities.html"?"trade_dealer":path==="/international-vq-motorcycle.html"?"retail_public":null;
 if(!audience||b.audience!==audience||b.country!=="GB"||await verifiedCountry(req)!=="GB")return response({placements:[]});
 const prefix=audience==="trade_dealer"?"AB-UK-TRADE-LISTING":"AB-UK-STOCK-LISTING";
 const positions=[["listing_after_gallery","GALLERY"],["listing_after_description","DESCRIPTION"],["listing_bottom","BOTTOM"]];
 const {data:inventory,error:ie}=await db.from("advertising_page_inventory").select("placement_enabled,excluded,page_category").eq("page_path",path).maybeSingle();
 if(ie||!inventory?.placement_enabled||inventory.excluded)return response({placements:[]});
 const out=[],used=new Set();
 for(const [placement_key,suffix] of positions){
  const slot=prefix+"-"+suffix;
  const {data:layout,error:le}=await db.from("advertising_slot_published_layouts").select("campaign_ids,artwork_formats,advert_count").eq("page_path",path).eq("slot_code",slot).maybeSingle();
  if(le||!layout||layout.advert_count!==1||!Array.isArray(layout.campaign_ids)||layout.campaign_ids.length!==1||!Array.isArray(layout.artwork_formats)||layout.artwork_formats.length!==1)continue;
  const id=layout.campaign_ids[0];
  if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||used.has(id)||layout.artwork_formats[0]!=="slim")continue;
  const {data:a,error:ae}=await db.from("public_advertising_creatives_v1").select("*").eq("id",id).maybeSingle();
  if(ae||!a||a.placement!=="below_hero"||a.partner_kind!=="transport"||a.campaign_category!=="house"||a.customer_types?.length||!matchCountry(a.countries,"GB")||!match(a.page_paths,path)||!match(a.page_categories,inventory.page_category)||!match(a.manufacturers,String(b.manufacturer||""))||!match(a.models,String(b.model||""))||!a.destination_url?.startsWith("https://"))continue;
  let art;
  try{art=await campaignCreative(id)}catch{continue}
  if(!art.slim_image_url?.startsWith("https://")||!art.compact_image_url?.startsWith("https://"))continue;
  used.add(id);
  out.push({id,placement_key,eligible_audiences:[audience],commercial_category:"transport",partner_name:a.partner_name,desktop_image_url:art.slim_image_url,mobile_image_url:art.compact_image_url,destination_url:a.destination_url,alt_text:a.alt_text,disclosure:a.disclosure,token:await sign({cid:id,mid:null,path,nonce:crypto.randomUUID(),country:"GB",slot,exp:Date.now()+3600000})});
 }
 return response({placements:out});
}
if(b.action==="event"&&["impression","click"].includes(b.event_type)&&typeof b.token==="string"){const p=await decode(b.token);if(!p)return response({error:"Invalid event token"},400);const {data:a,error:ae}=await db.from("public_advertising_creatives_v1").select("id,countries,placement").eq("id",p.cid).maybeSingle();if(ae||!a||a.placement!=="below_hero"||!matchCountry(a.countries,p.country)||(p.country!=="GB"&&(p.mid===null||p.path!=="/motorcycle-v2-master.html")))return response({ok:false},409);const {error}=await db.from("advertising_events").upsert({campaign_id:p.cid,catalogue_model_id:p.mid,country_code:p.country,event_type:b.event_type,event_key:p.nonce+":"+b.event_type,page_path:p.path||"/motorcycle-v2-master.html",slot_code:p.slot||null},{onConflict:"event_key",ignoreDuplicates:true});if(error)throw error;return response({ok:true})}
return response({error:"Invalid action"},400)}catch(e){console.error("advertising request failed",String(e));return response({error:"Advertising temporarily unavailable"},503)}});