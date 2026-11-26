create or replace view anybike_private.uk_trade_feed_listings_v1 as
select i.id as item_id, j.id as junction_stock_id, m.id as stock_master_id,
       c.dealer_organisation_id, c.dealer_name, i.make, i.model, j.variant,
       j.year, j.mileage, j.engine_cc, j.colour, j.price_gbp, j.last_seen_at
from public.live_source_items i
join public.live_source_connectors lc on lc.id=i.connector_id and lc.adapter_key='dealerwebs-dms14'
join public.junction_stock j on i.source_key='junction:'||j.id::text
 and i.raw_data->>'junction_stock_id'=j.id::text and j.source_provider='dealerwebs'
join public.stock_source_connections c on c.id=j.connection_id and c.configuration->>'source'='dealerwebs-dms14'
join public.source_feed_records r on r.id=j.source_record_id and r.connection_id=c.id
join public.stock_source_links l on l.junction_stock_id=j.id
join public.dealer_stock_master m on m.id=l.dealer_stock_master_id and m.dealer_organisation_id=c.dealer_organisation_id
join public.dealer_stock_channel_eligibility e on e.dealer_stock_master_id=m.id and e.channel='uk_retail' and e.enabled
where i.source_status in ('review','live') and i.excluded_from_sourcing
 and j.ended_at is null and r.ended_at is null and not j.export_visible and not j.trade_visible
 and m.availability_status in ('unknown','available') and m.hold_status in ('none','released','expired','declined')
 and j.price_gbp>0 and j.extra_fields?'catalogue_model_id'
 and exists (
   select 1 from public.source_feed_runs run
   where run.connection_id=c.id and run.success and run.reconciliation_status='accepted'
 );
revoke all on anybike_private.uk_trade_feed_listings_v1 from public, anon, authenticated;

create or replace function public.anybike_uk_retail_catalog_v1()
returns jsonb language sql stable security definer set search_path to '' as $function$
select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
 'item_id', s.item_id, 'make', s.make, 'model', s.model, 'variant', s.variant,
 'year', s.year, 'mileage', s.mileage, 'engine_cc', s.engine_cc, 'colour', s.colour,
 'price', s.price_gbp, 'dealer_name', s.dealer_name, 'publication_scope', 'uk_retail',
 'image_url', photo.buyer_safe_url
)) order by s.item_id), '[]'::jsonb)
from anybike_private.uk_trade_feed_listings_v1 s
left join lateral (
 select p.buyer_safe_url
 from public.anybike_live_source_buyer_safe_images p
 where p.live_source_item_id=s.item_id and p.safe_status='safe'
 and p.approved_for_buyer_display and p.buyer_safe_url like 'https://%'
 and not exists (select 1 from public.anybike_stock_image_exclusions x where x.image_url=p.buyer_safe_url)
 order by p.position,p.id limit 1
) photo on true;
$function$;
revoke execute on function public.anybike_uk_retail_catalog_v1() from public,anon,authenticated;
grant execute on function public.anybike_uk_retail_catalog_v1() to service_role;

CREATE OR REPLACE FUNCTION public.submit_uk_trade_stock_enquiry_v1(p_item_id bigint, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_dealer bigint; v_make text; v_model text; v_result jsonb; v_thread bigint; v_country text;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 select lower(btrim(country)) into v_country from public.customer_profiles where id=auth.uid();
 if v_country is null or v_country not in ('gb','uk','united kingdom','great britain') then raise exception 'UK account required' using errcode='42501'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>16000 then raise exception 'Invalid enquiry'; end if;
 select dealer_organisation_id,make,model into strict v_dealer,v_make,v_model
 from anybike_private.uk_trade_feed_listings_v1
 where item_id=p_item_id;
 v_result:=public.public_submit_connect_enquiry_v1(p_payload||jsonb_build_object('journey','Buy a Motorcycle','subject',concat('Stock enquiry: ',v_make,' ',v_model),'country','United Kingdom','origin_url',concat('https://www.anybike.co.uk/international-vq-motorcycle.html?id=',p_item_id),'origin_title',concat(v_make,' ',v_model)));
 v_thread:=(v_result->>'thread_id')::bigint;
 update public.message_centre_threads set trade_feed_dealer_organisation_id=v_dealer,trade_feed_stock_item_id=p_item_id,bike_make=v_make,bike_model=v_model where id=v_thread and customer_id=auth.uid();
 if not found then raise exception 'Unable to assign enquiry'; end if;
 return v_result;
exception when no_data_found then raise exception 'Motorcycle unavailable';
end;
$function$;

-- Enable the matched UK pilot using the same retail eligibility as enquiry routing.
insert into public.dealer_stock_channel_eligibility(dealer_stock_master_id,channel,enabled,enabled_at,notes)
select distinct m.id,'uk_retail',true,now(),'DealerWebs UK retail pilot'
from public.junction_stock j
join public.stock_source_connections c on c.id=j.connection_id and c.configuration->>'source'='dealerwebs-dms14'
join public.source_feed_records r on r.id=j.source_record_id and r.connection_id=c.id and r.ended_at is null
join public.live_source_items i on i.connector_id=20 and i.source_key='junction:'||j.id::text
 and i.raw_data->>'junction_stock_id'=j.id::text and i.source_status='review' and i.excluded_from_sourcing
join public.stock_source_links l on l.junction_stock_id=j.id
join public.dealer_stock_master m on m.id=l.dealer_stock_master_id and m.dealer_organisation_id=c.dealer_organisation_id
where j.connection_id in (30,31,32) and j.source_provider='dealerwebs'
 and j.ended_at is null and not j.export_visible and not j.trade_visible
 and j.price_gbp>0 and j.extra_fields?'catalogue_model_id'
on conflict (dealer_stock_master_id,channel) do update
set enabled=true,enabled_at=excluded.enabled_at,disabled_at=null,notes=excluded.notes,updated_at=now()
where not dealer_stock_channel_eligibility.enabled
 and dealer_stock_channel_eligibility.notes='DealerWebs: pending confirmed dealer authority, approved photographs and UK release';
