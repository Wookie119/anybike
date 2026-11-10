/* AnyBike editorial photo bank — reusable public read-only image lookup.
   Separate from live dealer stock photography. Only approved rows are visible under RLS.
   Pass an existing Supabase client; do not embed secret keys. */
(function(root){
 "use strict";
 const CATEGORIES=new Set(["whole_motorcycle","engine","suspension","frame","transmission","equipment","colour","racing","factory","inspection"]);
 async function findPhotos(client,options){
  if(!client||typeof client.from!=="function")throw new Error("Supabase client required");
  const o=options||{};
  if(!o.manufacturer)throw new Error("Manufacturer required");
  let q=client.from("anybike_editorial_photo_bank").select("asset_key,manufacturer,model,model_year_start,model_year_end,subject_category,feature_tags,title,image_url,source_page_url,photographer,licence,licence_url,attribution,crop_position,aspect_ratio,usage_contexts").eq("approval_status","approved").eq("manufacturer",o.manufacturer).order("asset_key").limit(100);
  if(o.model)q=q.eq("model",o.model);
  if(o.category&&CATEGORIES.has(o.category))q=q.eq("subject_category",o.category);
  const {data,error}=await q;
  if(error)throw error;
  return (data||[]).filter(photo=>!o.year||(photo.model_year_start==null||photo.model_year_start<=o.year)&&(photo.model_year_end==null||photo.model_year_end>=o.year)).filter(photo=>!o.context||photo.usage_contexts?.includes(o.context));
 }
 function selectPhoto(photos,{manufacturer,model,year,category,feature,context}={}){
  return (photos||[]).filter(p=>p.manufacturer===manufacturer&&(!model||p.model===model)&&(!year||(p.model_year_start==null||p.model_year_start<=year)&&(p.model_year_end==null||p.model_year_end>=year))&&(!category||p.subject_category===category)&&(!context||p.usage_contexts?.includes(context))&&(!feature||p.feature_tags?.includes(feature)))[0]||null;
 }
 root.AnyBikeEditorialPhotos=Object.freeze({findPhotos,selectPhoto});
})(typeof window!=="undefined"?window:this);
