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
  return p;
 }catch{return null}
}
const match=(a:string[]|null,v:string)=>!a?.length||a.some(x=>String(x).trim().toLowerCase()===v.trim().toLowerCase());
const matchCountry=(a:string[]|null,v:string)=>!!a?.length&&a.some(x=>String(x).trim().toUpperCase()===v);
const verifiedCountry=async(req:Request)=>{
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
if(b.action==="select"){const id=Number(b.model_id);const country=await verifiedCountry(req);if(!Number.isSafeInteger(id)||id<=0||!country||b.country!==country||country!=="GB")return response({ad:null});const {data:m,error:me}=await db.from("motorcycle_catalog_models").select("id,manufacturer,model,slug").eq("id",id).maybeSingle();if(me||!m)return response({ad:null});const {data:override,error:oe}=await db.from("advertising_model_overrides").select("campaign_id,suppressed").eq("catalogue_model_id",id).eq("placement","below_hero").maybeSingle();if(oe)throw oe;if(override?.suppressed)return response({ad:null});const path="/motorcycle-v2-master.html";const {data:ads,error}=await db.from("public_advertising_creatives_v1").select("*").eq("placement","below_hero");if(error)throw error;const candidates=(ads||[]).filter(a=>(!override?.campaign_id||override.campaign_id===a.id)&&matchCountry(a.countries,country)&&match(a.manufacturers,m.manufacturer)&&match(a.models,m.model)&&match(a.page_categories,"model")&&(!a.customer_types?.length)&&match(a.page_paths,path)&&a.destination_url?.startsWith("https://")&&a.desktop_image_url?.startsWith("https://")&&a.mobile_image_url?.startsWith("https://"));candidates.sort((a,b)=>Number(!!b.models?.length)-Number(!!a.models?.length)||Number(!!b.manufacturers?.length)-Number(!!a.manufacturers?.length)||b.priority-a.priority||a.id.localeCompare(b.id));const a=candidates[0];if(!a)return response({ad:null});const token=await sign({cid:a.id,mid:id,nonce:crypto.randomUUID(),country,exp:Date.now()+3600000});return response({ad:{id:a.id,partner_name:a.partner_name,headline:(a.headline_template||a.name).replaceAll("{{make}}",m.manufacturer).replaceAll("{{model}}",m.model),subheading:a.subheading,cta_text:a.cta_text,desktop_image_url:a.desktop_image_url,mobile_image_url:a.mobile_image_url,destination_url:a.destination_url,alt_text:a.alt_text,disclosure:a.disclosure,use_model_photo:a.use_model_photo,token}})}
if(b.action==="select_page"){const path=String(b.page_path||"");const country=await verifiedCountry(req);if(!country||b.country!==country||country!=="GB"||path.length>200||!/^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]*\.html$/i.test(path))return response({ad:null});const {data:p,error:pe}=await db.from("advertising_page_inventory").select("page_path,page_category,placement_enabled,excluded").eq("page_path",path).maybeSingle();if(pe)throw pe;if(!p||!p.placement_enabled||p.excluded)return response({ad:null});const {data:ads,error}=await db.from("public_advertising_creatives_v1").select("*").eq("placement","below_hero");if(error)throw error;const candidates=(ads||[]).filter(a=>matchCountry(a.countries,country)&&match(a.page_categories,p.page_category)&&match(a.page_paths,path)&&!a.manufacturers?.length&&!a.models?.length&&!a.customer_types?.length&&!(/\{\{(?:make|model)\}\}/.test(a.headline_template||""))&&a.destination_url?.startsWith("https://")&&a.desktop_image_url?.startsWith("https://")&&a.mobile_image_url?.startsWith("https://"));candidates.sort((a,b)=>Number(!!b.page_paths?.length)-Number(!!a.page_paths?.length)||b.priority-a.priority||a.id.localeCompare(b.id));const a=candidates[0];if(!a)return response({ad:null});const token=await sign({cid:a.id,mid:null,path,nonce:crypto.randomUUID(),country,exp:Date.now()+3600000});return response({ad:{id:a.id,partner_name:a.partner_name,headline:a.headline_template||a.name,subheading:a.subheading,cta_text:a.cta_text,desktop_image_url:a.desktop_image_url,mobile_image_url:a.mobile_image_url,destination_url:a.destination_url,alt_text:a.alt_text,disclosure:a.disclosure,token}})}
if(b.action==="event"&&["impression","click"].includes(b.event_type)&&typeof b.token==="string"){const p=await decode(b.token);if(!p)return response({error:"Invalid event token"},400);const {data:a,error:ae}=await db.from("public_advertising_creatives_v1").select("id,countries,placement").eq("id",p.cid).maybeSingle();if(ae||!a||a.placement!=="below_hero"||!matchCountry(a.countries,p.country)||p.country!=="GB")return response({ok:false},409);const {error}=await db.from("advertising_events").upsert({campaign_id:p.cid,catalogue_model_id:p.mid,country_code:p.country,event_type:b.event_type,event_key:p.nonce+":"+b.event_type,page_path:p.path||"/motorcycle-v2-master.html"},{onConflict:"event_key",ignoreDuplicates:true});if(error)throw error;return response({ok:true})}
return response({error:"Invalid action"},400)}catch(e){console.error("advertising request failed",String(e));return response({error:"Advertising temporarily unavailable"},503)}});