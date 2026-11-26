alter table public.motorcycle_catalog_manufacturers
 add column if not exists public_stock_accent_hex text
 check (public_stock_accent_hex ~ '^#[0-9A-Fa-f]{6}$');

update public.motorcycle_catalog_manufacturers
set public_stock_accent_hex='#FF6600'
where slug='harley-davidson';

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
 'accent_hex', brand.public_stock_accent_hex, 'image_url', photo.images->>0, 'images', photo.images
)) order by s.item_id), '[]'::jsonb)
from anybike_private.uk_trade_feed_listings_v1 s
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

select cron.schedule('anybike-dealerwebs-gallery-photos','1-59/3 * * * *',$job$
 update public.junction_stock_images im
 set source_active=true,source_ended_at=null
 from anybike_private.uk_trade_feed_listings_v1 s
 where s.junction_stock_id=im.junction_stock_id
   and im.source_provider='dealerwebs' and im.position between 2 and 4 and not im.source_active
   and im.source_url ~ '^https://autocdn[.]co[.]uk/cdn-cgi/imagedelivery/[A-Za-z0-9_-]+/[0-9a-fA-F-]{36}/[A-Za-z0-9_-]+$'
   and exists (select 1 from public.junction_stock_images lead
               where lead.junction_stock_id=im.junction_stock_id and lead.position=1
                and lead.source_active and lead.approved_for_buyer_display);
 select net.http_post(
  url:='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/process-buyer-safe-image',
  headers:=jsonb_build_object('Content-Type','application/json','apikey',key.decrypted_secret),
  body:=jsonb_build_object('junction_stock_id',photo.junction_stock_id),
  timeout_milliseconds:=120000
 )
 from vault.decrypted_secrets key
 cross join lateral (
  select s.junction_stock_id
  from anybike_private.uk_trade_feed_listings_v1 s
  join lateral (
   select im.position,im.buyer_safe_status
   from public.junction_stock_images im
   where im.junction_stock_id=s.junction_stock_id and im.source_active
     and im.source_url is not null and im.buyer_safe_status in ('waiting','failed')
   order by im.position,im.id limit 1
  ) next_photo on next_photo.position between 2 and 4 and next_photo.buyer_safe_status='waiting'
  order by next_photo.position,s.item_id limit 1
 ) photo
 where key.name='anybike_edge_secret_key_v2';
$job$);
