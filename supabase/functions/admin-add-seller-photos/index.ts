import {createClient} from "npm:@supabase/supabase-js@2";
const allowedOrigins=new Set(["https://www.anybike.co.uk","https://anybike.co.uk"]);
const types=new Set(["image/jpeg","image/png","image/webp","image/heic","image/heif","image/avif"]);
const safeOrigin=(value:string)=>allowedOrigins.has(value)?value:"https://www.anybike.co.uk";
const validMagic=(mime:string,b:Uint8Array)=>{
 if(mime==="image/jpeg")return b.length>3&&b[0]===255&&b[1]===216&&b[2]===255;
 if(mime==="image/png")return b.length>8&&[137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x);
 if(mime==="image/webp")return b.length>12&&new TextDecoder().decode(b.slice(0,4))==="RIFF"&&new TextDecoder().decode(b.slice(8,12))==="WEBP";
 if(mime==="image/avif"){
  if(b.length<12||new TextDecoder().decode(b.slice(4,8))!=="ftyp")return false;
  const brand=new TextDecoder().decode(b.slice(8,12));
  return ["avif","avis","mif1","msf1"].includes(brand);
 }
 if(mime==="image/heic"||mime==="image/heif"){
  if(b.length<12||new TextDecoder().decode(b.slice(4,8))!=="ftyp")return false;
  const brand=new TextDecoder().decode(b.slice(8,12));
  return ["heic","heix","hevc","hevx","mif1","msf1"].includes(brand);
 }
 return false;
};
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 const headers={"Access-Control-Allow-Origin":safeOrigin(origin),"Vary":"Origin","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store"};
 const out=(payload:unknown,status=200)=>Response.json(payload,{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(!allowedOrigins.has(origin))return out({error:"Origin not allowed"},403);
 if(req.method!=="POST")return out({error:"POST required"},405);
 const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 const base=Deno.env.get("SUPABASE_URL")||"",pub=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!jwt||!base||!pub||!secret)return out({error:"Admin sign-in required"},401);
 try{
  const caller=createClient(base,pub,{global:{headers:{Authorization:"Bearer "+jwt}},auth:{persistSession:false}});
  const {data:{user},error:identityError}=await caller.auth.getUser(jwt);
  if(identityError||!user)return out({error:"Admin sign-in required"},401);
  const {data:admin,error:adminError}=await caller.rpc("anybike_is_admin");
  if(adminError||admin!==true)return out({error:"Admin permission required"},403);
  const form=await req.formData();
  const reference=String(form.get("reference")||"").trim().toUpperCase();
  if(!/^AB-S-\d{6}$/.test(reference))return out({error:"Invalid motorcycle reference"},400);
  const files=form.getAll("photos").filter((item):item is File=>item instanceof File&&item.size>0);
  if(!files.length||files.length>12)return out({error:"Choose 1 to 12 photographs"},400);
  if(files.some(f=>f.size>10485760||!types.has(f.type.toLowerCase())))return out({error:"Images must be JPEG, PNG, WEBP, HEIC or AVIF, maximum 10 MB each"},400);
  const db=createClient(base,secret,{auth:{persistSession:false}});
  const {data:bike,error:bikeError}=await db.from("seller_motorcycle_submissions").select("id,reference,make,model,registration").eq("reference",reference).maybeSingle();
  if(bikeError||!bike)return out({error:"Motorcycle submission not found"},404);
  const {data:existing,error:listError}=await db.from("seller_submission_images").select("position").eq("submission_id",bike.id);
  if(listError)return out({error:"Could not verify existing photographs"},500);
  if((existing||[]).length+files.length>24)return out({error:"A submission can contain no more than 24 photographs"},400);
  let position=Math.max(0,...(existing||[]).map(x=>Number(x.position||0))),added=0;
  for(const file of files){
   const mime=file.type.toLowerCase(),bytes=new Uint8Array(await file.arrayBuffer());
   if(!validMagic(mime,bytes))return out({success:false,added,error:"File contents do not match the selected image format"},400);
   position++;
   const filename=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-").slice(0,90)||"email-photo.jpg";
   const path=bike.id+"/original/"+position+"-"+crypto.randomUUID()+"-admin-email-"+filename;
   const {error:storageError}=await db.storage.from("seller-intake").upload(path,bytes,{contentType:mime,upsert:false});
   if(storageError)return out({success:false,added,error:"Could not store photograph"},500);
   const {error:rowError}=await db.from("seller_submission_images").insert({
    submission_id:bike.id,position,original_file_name:file.name,
    original_mime_type:mime,original_size_bytes:bytes.length,original_storage_path:path,
    file_validation_status:"pending",final_status:"quarantined",processing_status:"pending"
   });
   if(rowError){await db.storage.from("seller-intake").remove([path]);return out({success:false,added,error:"Could not register photograph"},500)}
   added++;
  }
  return out({success:true,reference,added,status:"awaiting_admin_review"});
 }catch{return out({error:"Admin photograph upload failed"},500)}
});