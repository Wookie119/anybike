import {createClient} from "npm:@supabase/supabase-js@2";
const origins=new Set(["https://www.anybike.co.uk","https://anybike.co.uk"]);
const accepted=new Set(["image/jpeg","image/png","image/webp","image/heic","image/heif","image/avif"]);
const magic=(mime:string,b:Uint8Array)=>{
 if(mime==="image/jpeg")return b.length>3&&b[0]===255&&b[1]===216&&b[2]===255;
 if(mime==="image/png")return b.length>8&&[137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x);
 if(mime==="image/webp")return b.length>12&&new TextDecoder().decode(b.slice(0,4))==="RIFF"&&new TextDecoder().decode(b.slice(8,12))==="WEBP";
 if(["image/heic","image/heif","image/avif"].includes(mime)){
  if(b.length<12||new TextDecoder().decode(b.slice(4,8))!=="ftyp")return false;
  const brand=new TextDecoder().decode(b.slice(8,12));
  return ["heic","heix","hevc","hevx","mif1","msf1","avif","avis"].includes(brand);
 }
 return false;
};
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"",headers={
  "Access-Control-Allow-Origin":origins.has(origin)?origin:"https://www.anybike.co.uk",
  "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin","Cache-Control":"no-store"};
 const out=(body:unknown,status=200)=>Response.json(body,{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(!origins.has(origin))return out({error:"Origin not permitted"},403);
 if(req.method!=="POST")return out({error:"POST required"},405);
 const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 const url=Deno.env.get("SUPABASE_URL")||"",pub=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!jwt||!url||!pub||!key)return out({error:"Admin sign-in required"},401);
 try{
  const caller=createClient(url,pub,{auth:{persistSession:false},global:{headers:{Authorization:"Bearer "+jwt}}});
  const {data:{user},error:authError}=await caller.auth.getUser(jwt);
  if(authError||!user)return out({error:"Admin sign-in required"},401);
  const {data:isAdmin,error:adminError}=await caller.rpc("anybike_is_admin");
  if(adminError||isAdmin!==true)return out({error:"Admin permission required"},403);
  const body=await req.json().catch(()=>({}));
  const submissionId=Number(body.submission_id);
  if(!Number.isSafeInteger(submissionId)||submissionId<=0||body.confirmed_inspected!==true)
   return out({error:"Choose a valid submission and confirm you inspected all photographs"},400);
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {data:submission,error:submissionError}=await db.from("seller_motorcycle_submissions").select("id,reference").eq("id",submissionId).maybeSingle();
  if(submissionError||!submission)return out({error:"Submission not found"},404);
  const {data:photos,error:imagesError}=await db.from("seller_submission_images").select("id,position,original_storage_path,original_mime_type,original_size_bytes,final_status").eq("submission_id",submissionId).order("position",{ascending:true});
  if(imagesError)return out({error:"Unable to list submission photographs"},500);
  const pending=(photos||[]).filter(p=>!["rejected","approved"].includes(p.final_status));
  if(!pending.length)return out({success:true,approved:0,message:"No photographs awaiting approval"});
  if(pending.length>24)return out({error:"Too many photographs to approve in one batch"},400);
  let approved=0;const errors:string[]=[];
  for(const photo of pending){
   if(!photo.original_storage_path||!accepted.has(String(photo.original_mime_type||"").toLowerCase())){
    errors.push("Photo "+photo.position+" has no supported original");continue;
   }
   const {data:original,error:downloadError}=await db.storage.from("seller-intake").download(photo.original_storage_path);
   if(downloadError||!original){errors.push("Photo "+photo.position+" original unavailable");continue}
   const bytes=new Uint8Array(await original.arrayBuffer()),mime=String(photo.original_mime_type).toLowerCase();
   if(bytes.length<100||bytes.length>10485760||!magic(mime,bytes)){
    errors.push("Photo "+photo.position+" failed format/size validation");continue;
   }
   const extension=mime==="image/jpeg"?"jpg":mime.split("/")[1];
   const path="seller-safe/"+submissionId+"/admin-original-"+photo.id+"-"+crypto.randomUUID()+"."+extension;
   const {error:uploadError}=await db.storage.from("motorcycles").upload(path,bytes,{contentType:mime,upsert:false,cacheControl:"3600"});
   if(uploadError){errors.push("Photo "+photo.position+" storage unavailable");continue;}
   const publicUrl=db.storage.from("motorcycles").getPublicUrl(path).data.publicUrl;
   const {error:saveError}=await db.from("seller_submission_images").update({
    buyer_safe_storage_path:path,buyer_safe_url:publicUrl,
    file_validation_status:"passed",processing_status:"done",
    moderation_status:"approved",quality_status:"usable",
    identity_sanitisation_status:"clean",final_status:"approved",
    rejection_reason:"Admin inspected original and approved without image modification",
    updated_at:new Date().toISOString()
   }).eq("id",photo.id).eq("submission_id",submissionId).neq("final_status","rejected");
   if(saveError){await db.storage.from("motorcycles").remove([path]);errors.push("Photo "+photo.position+" could not save approval");continue;}
   approved++;
  }
  if(approved){const {error:refreshError}=await db.rpc("anybike_refresh_seller_submission_primary_image_v1",{p_submission_id:submissionId});if(refreshError)errors.push("Primary photo refresh unavailable");}
  return out({success:errors.length===0,approved,total:pending.length,errors,reference:submission.reference});
 }catch{return out({error:"Approval could not complete"},500)}
});