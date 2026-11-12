-- AnyBike licensed exact-model photography: one public data source for all makes.
-- Applied to live Supabase on 12 November 2026. This migration preserves
-- the deployed function definition for repeatable future environments.
-- No private dealer stock, customer information or draft editorial assets.
create or replace function public.public_anybike_model_hero_v1(
  p_make text,
  p_model text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
with requested as (
  select trim(p_make) manufacturer, trim(p_model) model
  where p_make is not null and p_model is not null
    and length(trim(p_make)) between 2 and 80
    and length(trim(p_model)) between 1 and 120
    and exists (
      select 1
      from public.motorcycle_catalog_models c
      where c.manufacturer = trim(p_make)
        and c.model = trim(p_model)
    )
), approved as (
  select p.*
  from requested r
  join public.anybike_editorial_photo_bank p
    on p.manufacturer = r.manufacturer
   and p.model = r.model
  where p.approval_status = 'approved'
    and p.subject_category = 'whole_motorcycle'
    and 'model_hero' = any(p.usage_contexts)
    and p.image_url like 'https://%'
    and p.source_page_url like 'https://%'
    and p.licence_url like 'https://%'
    and length(trim(coalesce(p.attribution,''))) > 0
    and length(trim(coalesce(p.licence,''))) > 0
  order by p.model_year_start desc nulls last, p.asset_key
  limit 1
)
select jsonb_build_object(
  'make', p.manufacturer,
  'model', p.model,
  'image_url', p.image_url,
  'source_page_url', p.source_page_url,
  'licence_url', p.licence_url,
  'attribution', p.attribution,
  'licence', p.licence,
  'title', p.title,
  'model_year_start', p.model_year_start,
  'model_year_end', p.model_year_end
) from approved p;
$function$;

revoke all on function public.public_anybike_model_hero_v1(text,text) from public;
grant execute on function public.public_anybike_model_hero_v1(text,text)
  to anon, authenticated;

comment on function public.public_anybike_model_hero_v1(text,text) is
'Read-only licensed exact-model hero projection for all manufacturers; no near-model substitution or stock data.';
