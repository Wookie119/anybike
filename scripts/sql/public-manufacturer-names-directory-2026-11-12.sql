-- Public manufacturer-name directory: only already-clean canonical catalogue identities.
-- Never exposes unpublished research, private stock, customer or dealer records.
create or replace function public.public_anybike_manufacturer_names_v1()
returns jsonb language sql stable security definer set search_path = ''
as $fn$
 select coalesce(jsonb_agg(make order by make),'[]'::jsonb)
 from (select distinct trim(d.make) as make
       from public.motorcycle_catalog_dropdown_clean d
       where length(trim(d.make)) between 2 and 80) q;
$fn$;
revoke all on function public.public_anybike_manufacturer_names_v1() from public;
grant execute on function public.public_anybike_manufacturer_names_v1() to anon, authenticated;