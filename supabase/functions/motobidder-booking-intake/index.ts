import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.49.8";

const headers={"content-type":"application/json","cache-control":"no-store","access-control-allow-origin":"null"};
const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers});
const trim=(s:unknown)=>typeof s==="string"?s.trim():"";
const canon=(v:unknown):string=>Array.isArray(v)?"["+v.map(canon).join(",")+"]":v&&typeof v==="object"?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,val])=>JSON.stringify(k)+":"+canon(val)).join(",")+"}":JSON.stringify(v);
async function digest(s:string){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function authenticate(received:string,expected:string){
 if(expected.length<32||received.length<32)return false;
 const a=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(received));
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(expected));
 let delta=0;const x=new Uint8Array(a),y=new Uint8Array(b);for(let i=0;i<x.length;i++)delta|=x[i]^y[i];return delta===0;
}
const isPostcode=(v:string)=>/^(GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/i.test(v);
const isIsland=(v:string)=>{const p=v.replace(/\s/g,"").toUpperCase();if(/^(?:BT|IM|JE|GY|HS|ZE)/.test(p))return true;const m=/^PO(\d{1,2})/.exec(p);return Boolean(m&&Number(m[1])>=30&&Number(m[1])<=41);};
const isPhone=(v:string)=>/^(?:\+447\d{9}|07\d{9})$/.test(v.replace(/[\s()-]/g,""));
const isEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=254;
const rates:Record<string,number>={mainland:19900,glasgow_edinburgh:29900,above_glasgow_edinburgh:34900,above_inverness:38900};
function validate(b:Record<string,unknown>){
 const errors:string[]=[];
 for(const k of ["auction_sale_id","transport_booking_id"])if(!trim(b[k])||trim(b[k]).length>120)errors.push(k+" required, max 120 characters");
 const m=b.motorcycle as Record<string,unknown> | undefined;
 if(!m||!trim(m.make)||!trim(m.model)||!(trim(m.registration)||trim(m.vin)))errors.push("motorcycle make/model and VIN or registration required");
 for(const role of ["sender","receiver"]){
  const p=b[role] as Record<string,unknown>|undefined;
  if(!p||typeof p!=="object"||Array.isArray(p)){errors.push(role+" required");continue;}
  for(const k of ["dealership","contact_name","email","mobile","street_address","city","postcode"])if(!trim(p[k]))errors.push(role+"."+k+" required");
  if(!isEmail(trim(p.email)))errors.push(role+".email invalid");
  if(!isPhone(trim(p.mobile)))errors.push(role+".mobile must be UK mobile");
  if(!isPostcode(trim(p.postcode)))errors.push(role+".postcode invalid");
  if(isIsland(trim(p.postcode)))errors.push(role+".postcode is island/outside supported coverage");
  if(trim(p.country).toLowerCase()!=="united kingdom")errors.push(role+".country must be United Kingdom");
 }
 if(!/^\d{4}-\d{2}-\d{2}$/.test(trim(b.ready_date))||Number.isNaN(Date.parse(trim(b.ready_date)))||new Date(trim(b.ready_date)).toISOString().slice(0,10)!==trim(b.ready_date))errors.push("ready_date must be valid YYYY-MM-DD");
 if(!["sender","receiver"].includes(trim(b.payer)))errors.push("payer must be sender or receiver");
 if(b.currency!=="GBP"||b.vat_included!==true)errors.push("GBP VAT-inclusive price required");
 const raw=b.freight_inc_vat;const pence=typeof raw==="number"&&Number.isFinite(raw)?Math.round(raw*100):NaN;
 if(!Number.isSafeInteger(pence)||Math.abs((raw as number)*100-pence)>0.0000001)errors.push("freight_inc_vat must be two-decimal price");
 if(!Object.hasOwn(rates,trim(b.rate_band))||pence!==rates[trim(b.rate_band)])errors.push("freight price does not match stated rate band");
 return {errors,pence};
}
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{error:"POST required"});
 const expected=Deno.env.get("MOTOBIDDER_INTAKE_API_KEY")||"";
 if(!(await authenticate(req.headers.get("x-motobidder-api-key")||"",expected)))return reply(401,{error:"Unauthorized or API not configured"});
 const length=Number(req.headers.get("content-length")||0);
 if(length>20000)return reply(413,{error:"Maximum request 20 KB"});
 let raw="";try{raw=await req.text();}catch{return reply(400,{error:"Body unreadable"});}
 if(new TextEncoder().encode(raw).length>20000)return reply(413,{error:"Maximum request 20 KB"});
 let booking:unknown;try{booking=JSON.parse(raw);}catch{return reply(400,{error:"Invalid JSON"});}
 if(!booking||typeof booking!=="object"||Array.isArray(booking))return reply(422,{error:"Booking object required"});
 const b=booking as Record<string,unknown>;
 const {errors,pence}=validate(b);
 if(errors.length)return reply(422,{error:"Invalid booking",details:errors});
 const dbUrl=Deno.env.get("SUPABASE_URL"),role=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!dbUrl||!role)return reply(503,{error:"Server not configured"});
 const db=createClient(dbUrl,role);
 const hash=await digest(canon(b));
 const key=trim(b.transport_booking_id);
 const {data:found,error:readErr}=await db.from("anybike_motobidder_move_booking_queue").select("request_sha256,state,id").eq("source","motobidder").eq("external_booking_id",key).maybeSingle();
 if(readErr)return reply(503,{error:"Intake lookup unavailable"});
 if(found){
  if(found.request_sha256!==hash)return reply(409,{error:"Booking reference already used with different details"});
  return reply(202,{status:found.state,booking_reference:key,accepted_for_review:true,duplicate:true});
 }
 const record={source:"motobidder",external_booking_id:key,auction_sale_id:trim(b.auction_sale_id),request_sha256:hash,booking_data:b,
 billing_party:trim(b.payer),freight_inc_vat_pence:pence,rate_band:trim(b.rate_band),ready_date:trim(b.ready_date),
 state:"pending_review",billing_state:"needs_manual_charge"};
 const {error:insertErr}=await db.from("anybike_motobidder_move_booking_queue").insert(record);
 if(insertErr){
  if(insertErr.code==="23505")return reply(409,{error:"Booking reference already reserved; check status before retrying"});
  return reply(503,{error:"Unable to queue booking"});
 }
 return reply(202,{status:"pending_review",booking_reference:key,accepted_for_review:true,duplicate:false,
  next_action:"Move Admin must verify mainland route and agreed price, then manually enter Freight Charge and invoice payer."});
});
