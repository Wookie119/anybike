import {createClient} from "npm:@supabase/supabase-js@2";
const origins=new Set(["https://www.anybike.co.uk","https://anybike.co.uk"]);
const max=10485760;
const types=new Set(["image/jpeg","image/png","image/webp","image/heic","image/heif","image/avif"]);
function magic(m:string,b:Uint8Array){
 if(m==="image/jpeg")return b[0]===255&&b[1]===216&&b[2]===255;
 if(m==="image/png")return [137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v);
 const str=(a:number,z:number)=>new TextDecoder().decode(b.slice(a,z));
 if(m==="image/webp")return str(0,4)==="RIFF"&&str(8,12)==="WEBP";
 if(str(4,8)!=="ftyp")return false;
 return (m==="image/avif"?["avif","avis"]:["heic","heix","hevc","hevx","mif1","msf1"]).includes(str(8,12));
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 const headers={"Access-Control-Allow-Origin":origins.has(origin)?origin:"https://www.anybike.co.uk","Vary":"Origin","Access-Control-Allow-Headers":"apikey,content-type,x-listing-token,x-photo-name","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store"};
 const out=(body:unknown,status=200)=>Response.json(body,{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST"||!origins.has(origin))return out({error:"Request not permitted"},403);
 const token=req.headers.get("x-listing-token")||"",mime=(req.headers.get("content-type")||"").toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(token))return out({error:"Invalid or expired listing link"},401);
 if(!types.has(mime)||Number(req.headers.get("content-length")||0)>max)return out({error:"Choose an original photograph up to 10 MB"},400);
 const url=Deno.env.get("SUPABASE_URL")||"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!url||!key)return out({error:"Upload unavailable"},503);
 const db=createClient(url,key,{auth:{persistSession:false}});
 let uploadedPath="";
 try{
  const {data:listing,error:linkError}=await db.rpc("seller_get_listing_refresh_v1",{p_token:token});
  if(linkError||!listing?.reference)return out({error:"Invalid, expired or used listing link"},401);
  const hex=(a:ArrayBuffer)=>Array.from(new Uint8Array(a),v=>v.toString(16).padStart(2,"0")).join("");
  const tokenHash=hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)));
  const {data:refresh,error:lookupError}=await db.from("seller_listing_refresh_requests").select("id,submission_id").or("token_hash.eq.\\x"+tokenHash+",message_token_hash.eq.\\x"+tokenHash).maybeSingle();
  if(lookupError||!refresh)return out({error:"Invalid listing link"},401);
  const {count,error:countError}=await db.from("seller_submission_images").select("id",{count:"exact",head:true}).eq("submission_id",refresh.submission_id);
  if(countError)return out({error:"Photo availability could not be checked"},503);
  if((count||0)>=24)return out({error:"This listing has reached its 24-photo limit"},409);
  const reader=req.body?.getReader();if(!reader)return out({error:"No photograph received"},400);
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();return out({error:"Photograph exceeds 10 MB"},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  if(size<100||!magic(mime,bytes))return out({error:"Photograph does not match its file format"},400);
  let name="original-photo";try{name=decodeURIComponent(req.headers.get("x-photo-name")||name).slice(0,150);}catch{}
  const hash=hex(await crypto.subtle.digest("SHA-256",bytes));
  const ext=mime==="image/jpeg"?"jpg":mime.split("/")[1];
  const path=refresh.submission_id+"/original/refresh-"+refresh.id+"/"+crypto.randomUUID()+"."+ext;
  const {error:storeError}=await db.storage.from("seller-intake").upload(path,bytes,{contentType:mime,upsert:false});
  if(storeError)return out({error:"Could not store photograph"},503);
  uploadedPath=path;
  const {data:registered,error:registerError}=await db.rpc("register_listing_refresh_photo_v1",{p_token:token,p_path:path,p_name:name,p_mime:mime,p_size:size,p_hash:hash});
  if(registerError||!registered?.success||registered.duplicate){await db.storage.from("seller-intake").remove([path]);uploadedPath="";}
  if(registerError||!registered?.success)return out({error:"Photograph could not be registered; check the link or photo limit"},409);
  uploadedPath="";
  return out({success:true,duplicate:!!registered.duplicate,status:"awaiting_admin_review"});
 }catch{if(uploadedPath)await db.storage.from("seller-intake").remove([uploadedPath]);return out({error:"Upload failed; please retry"},500);}
});
