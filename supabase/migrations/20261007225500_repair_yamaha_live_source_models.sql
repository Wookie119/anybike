with attrs as (
  select
    i.id,
    coalesce(nullif(regexp_replace(i.raw_data->>'Name','^\\s*(19\\d{2}|20\\d{2})\\s+Yamaha\\s+','','i'),''), i.model) as fixed_model,
    coalesce(
      case when (i.raw_data->>'Name') ~ '^\\s*(19\\d{2}|20\\d{2})\\b'
           then substring(i.raw_data->>'Name' from '^\\s*((?:19|20)\\d{2})')::int end,
      (select nullif(a->>'DefaultValue','')::int from jsonb_array_elements(coalesce(i.raw_data->'Attributes','[]'::jsonb)) a where lower(a->>'Name')='year' limit 1),
      i.year
    ) as fixed_year,
    coalesce((select nullif(regexp_replace(a->>'DefaultValue','[^0-9]','','g'),'')::int from jsonb_array_elements(coalesce(i.raw_data->'Attributes','[]'::jsonb)) a where lower(a->>'Name')='mileage' limit 1),i.mileage) as fixed_mileage,
    coalesce((select nullif(a->>'DefaultValue','') from jsonb_array_elements(coalesce(i.raw_data->'Attributes','[]'::jsonb)) a where lower(a->>'Name')='colour' limit 1),i.colour) as fixed_colour,
    coalesce((select nullif(a->>'DefaultValue','') from jsonb_array_elements(coalesce(i.raw_data->'Attributes','[]'::jsonb)) a where lower(a->>'Name')='registration' limit 1),i.registration) as fixed_registration,
    coalesce((select nullif(a->>'DefaultValue','') from jsonb_array_elements(coalesce(i.raw_data->'Attributes','[]'::jsonb)) a where lower(a->>'Name')='variant' limit 1),i.variant) as fixed_variant,
    coalesce((select nullif(a->>'DefaultValue','') from jsonb_array_elements(coalesce(i.raw_data->'Attributes','[]'::jsonb)) a where lower(a->>'Name')='location' limit 1),i.seller_address) as fixed_location
  from public.live_source_items i
  where i.connector_id=7
)
update public.live_source_items i
set make='Yamaha',model=a.fixed_model,year=a.fixed_year,mileage=a.fixed_mileage,colour=a.fixed_colour,
    registration=a.fixed_registration,variant=a.fixed_variant,seller_address=a.fixed_location,updated_at=now()
from attrs a where i.id=a.id;

update public.live_source_connectors
set notes='Structured Yamaha Approved Used feed. Model/year/mileage are read from asset Name + Attributes.',updated_at=now()
where id=7;