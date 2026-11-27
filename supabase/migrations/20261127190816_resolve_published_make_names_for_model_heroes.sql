-- The permanent V2 routes use the full Indian name and one spelling of Vmoto.
-- Prefer the exact catalogue identity when both spellings contain the requested model.
CREATE OR REPLACE FUNCTION public.public_anybike_model_hero_v1(p_make text, p_model text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
with requested as(
 select c.manufacturer, c.model as original_model
 from public.motorcycle_catalog_models c
 where c.model = trim(p_model)
 and length(trim(p_make)) between 2 and 80 and length(trim(p_model)) between 1 and 120
 and (c.manufacturer = trim(p_make)
      or (trim(p_make) = 'Indian Motorcycle' and c.manufacturer = 'Indian')
      or (lower(trim(p_make)) = 'vmoto' and c.manufacturer in ('Vmoto','VMoto')))
 order by (c.manufacturer = trim(p_make)) desc, c.id
 limit 1
), resolved as(
 select r.manufacturer,r.original_model,
 coalesce(a.canonical_model,r.original_model) model
 from requested r left join public.anybike_model_identity_aliases a
 on a.manufacturer=r.manufacturer and a.alias_model=r.original_model
 where a.canonical_model is null or exists(
 select 1 from public.motorcycle_catalog_models c where c.manufacturer=r.manufacturer and c.model=a.canonical_model)
), approved as(
 select p.*,r.original_model from resolved r
 join public.anybike_editorial_photo_bank p
 on p.manufacturer=r.manufacturer and p.model=r.model
 where p.approval_status='approved' and p.subject_category='whole_motorcycle'
 and 'model_hero'=any(p.usage_contexts)
 and p.image_url like 'https://%' and p.source_page_url like 'https://%'
 and p.licence_url like 'https://%'
 and length(trim(coalesce(p.attribution,'')))>0 and length(trim(coalesce(p.licence,'')))>0
 order by p.model_year_start desc nulls last,p.asset_key
 limit 1
)
select jsonb_build_object(
'make',trim(p_make),'model',p.original_model,'canonical_model',p.model,
'image_url',p.image_url,'source_page_url',p.source_page_url,'licence_url',p.licence_url,
'attribution',p.attribution,'licence',p.licence,'title',p.title,
'model_year_start',p.model_year_start,'model_year_end',p.model_year_end) from approved p
$function$;
