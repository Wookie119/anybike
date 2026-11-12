-- Read-only exact-model approved, licensed, source-attributed research photographs.
-- Uses same canonical alias rules as approved hero but does not change heroes.
create or replace function public.public_anybike_verified_model_gallery_v1(p_make text,p_model text)
returns jsonb language sql stable security definer set search_path=''
as $function$
with requested as(
 select btrim(p_make) manufacturer,btrim(p_model) original_model
 where p_make is not null and p_model is not null
 and length(btrim(p_make)) between 2 and 80
 and length(btrim(p_model)) between 1 and 120
 and exists(select 1 from public.motorcycle_catalog_models c where c.manufacturer=btrim(p_make) and c.model=btrim(p_model))
),resolved as(
 select r.manufacturer,r.original_model,coalesce(a.canonical_model,r.original_model) model
 from requested r left join public.anybike_model_identity_aliases a
 on a.manufacturer=r.manufacturer and a.alias_model=r.original_model
 where a.canonical_model is null or exists(
 select 1 from public.motorcycle_catalog_models c where c.manufacturer=r.manufacturer and c.model=a.canonical_model)
), approved as(
 select p.*,r.original_model from resolved r
 join public.anybike_editorial_photo_bank p
 on p.manufacturer=r.manufacturer and p.model=r.model
 where p.approval_status='approved'
 and (('model_variant_gallery'=any(p.usage_contexts) and p.subject_category='whole_motorcycle')
   or ('engineering'=any(p.usage_contexts) and p.subject_category<>'whole_motorcycle'))
 and p.image_url ~ '^https://[^[:space:]]+$'
 and p.source_page_url ~ '^https://[^[:space:]]+$'
 and p.licence_url ~ '^https://[^[:space:]]+$'
 and length(btrim(coalesce(p.attribution,'')))>0
 and length(btrim(coalesce(p.licence,'')))>0
 order by p.model_year_start nulls last,p.asset_key
 limit 30
)
select coalesce(jsonb_agg(jsonb_build_object(
 'make',p.manufacturer,'model',p.original_model,'canonical_model',p.model,
 'title',p.title,'image_url',p.image_url,'source_page_url',p.source_page_url,
 'licence_url',p.licence_url,'licence',p.licence,'attribution',p.attribution,
 'model_year_start',p.model_year_start,'model_year_end',p.model_year_end,
 'subject_category',p.subject_category
) order by p.model_year_start nulls last,p.asset_key),'[]'::jsonb) from approved p;
$function$;
revoke all on function public.public_anybike_verified_model_gallery_v1(text,text) from public;
grant execute on function public.public_anybike_verified_model_gallery_v1(text,text) to anon,authenticated;