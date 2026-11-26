CREATE OR REPLACE FUNCTION public.anybike_uk_retail_catalog_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
 'item_id', s.item_id, 'make', s.make, 'model', s.model, 'variant', s.variant,
 'year', s.year, 'mileage', s.mileage, 'engine_cc', s.engine_cc, 'colour', s.colour,
 'price', s.price_gbp, 'dealer_name', s.dealer_name, 'publication_scope', 'uk_retail',
 'catalog_model_id', model.id,
 'catalogue_model_name', model.model,
 'catalogue_identity_status', case when model.id is not null then 'verified' end,
 'publication_eligible', true,
 'accent_hex', brand.public_stock_accent_hex, 'image_url', photo.images->>0, 'images', photo.images
)) order by s.item_id), '[]'::jsonb)
from anybike_private.uk_trade_feed_listings_v1 s
join public.junction_stock junction on junction.id=s.junction_stock_id
left join public.motorcycle_catalog_models model on model.id::text=junction.extra_fields->>'catalogue_model_id'
 and regexp_replace(lower(model.manufacturer),'[^a-z0-9]','','g')=regexp_replace(lower(s.make),'[^a-z0-9]','','g')
left join public.motorcycle_catalog_manufacturers brand
 on brand.slug=trim(both '-' from regexp_replace(lower(s.make),'[^a-z0-9]+','-','g'))
left join lateral (
 select jsonb_agg(image.buyer_safe_url order by image.position,image.id) as images
 from (
  select p.buyer_safe_url,p.position,p.id
  from public.anybike_live_source_buyer_safe_images p
  join public.junction_stock_images im on im.junction_stock_id=s.junction_stock_id
   and im.position=p.position and im.source_url=p.source_url and im.source_active
  where p.live_source_item_id=s.item_id and p.safe_status='safe'
   and p.approved_for_buyer_display and p.buyer_safe_url like 'https://%'
   and not exists (select 1 from public.anybike_stock_image_exclusions x where x.image_url in (p.buyer_safe_url,p.source_url))
  order by p.position,p.id limit 6
 ) image
) photo on true;
$function$;
