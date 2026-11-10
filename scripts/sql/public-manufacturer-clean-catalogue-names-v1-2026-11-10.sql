-- AnyBike public catalogue identity projection (NOT research publication).
-- Only reviewed-for-dropdown model names and broad categories are emitted.
-- Never grant browsers direct access to the source view or raw catalogue.
create or replace function public.public_anybike_manufacturer_catalogue_names_v1(p_make text)
returns jsonb
language sql stable security definer
set search_path = ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'make', q.make,
    'model', q.model,
    'category', coalesce(nullif(q.motorcycle_type,''),'Other')
  ) order by q.model), '[]'::jsonb)
  from (
    select d.make, d.model, d.motorcycle_type
    from public.motorcycle_catalog_dropdown_clean as d
    where d.make=p_make
      and p_make is not null
      and length(p_make) between 2 and 80
      and length(trim(d.model)) between 1 and 120
      and d.model !~* '(\m(apr|pcp|finance|financing|deposit|representative)\M|[0-9]+[.]?[0-9]*%)'
    order by d.model
    limit 200
  ) as q;
$function$;
revoke all on function public.public_anybike_manufacturer_catalogue_names_v1(text) from public;
grant execute on function public.public_anybike_manufacturer_catalogue_names_v1(text) to anon, authenticated;
-- Public projection contains no technical facts, photos, stock, contact or editorial fields.
