-- Admin controls for choosing which already-clean buyer-safe images are sent.
-- Excluding an image keeps the source and buyer-safe derivative internally;
-- it only removes it from buyer-facing galleries/previews.

create or replace function public.admin_get_scan_buyer_safe_images_v1(p_batch_id bigint)
returns table(
  scan_id bigint,
  image_id bigint,
  buyer_safe_url text,
  included boolean,
  image_position integer
)
language plpgsql
security definer
set search_path='public','pg_temp'
as $function$
begin
  if auth.uid() is null or not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select s.id,
         i.id,
         i.buyer_safe_url,
         coalesce(i.approved_for_buyer_display,false),
         i.position
  from public.used_bike_scans s
  join public.anybike_live_source_buyer_safe_images i
    on i.live_source_item_id=nullif(s.extraction->>'live_source_item_id','')::bigint
  where s.batch_id=p_batch_id
    and i.safe_status='safe'
    and nullif(i.buyer_safe_url,'') is not null
  order by s.id,i.position,i.id;
end;
$function$;

revoke all on function public.admin_get_scan_buyer_safe_images_v1(bigint) from public;
grant execute on function public.admin_get_scan_buyer_safe_images_v1(bigint) to authenticated;

create or replace function public.admin_set_scan_buyer_safe_image_included_v1(
  p_scan_id bigint,
  p_image_id bigint,
  p_included boolean
)
returns jsonb
language plpgsql
security definer
set search_path='public','pg_temp'
as $function$
declare
  v_item_id bigint;
  v_urls jsonb;
  v_count integer;
begin
  if auth.uid() is null or not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  select nullif(extraction->>'live_source_item_id','')::bigint
  into v_item_id
  from public.used_bike_scans
  where id=p_scan_id;

  if v_item_id is null then
    raise exception 'Scan not linked to Live Source';
  end if;

  update public.anybike_live_source_buyer_safe_images
  set approved_for_buyer_display=coalesce(p_included,false)
  where id=p_image_id
    and live_source_item_id=v_item_id
    and safe_status='safe';

  if not found then
    raise exception 'Buyer-safe image not found for this motorcycle';
  end if;

  select coalesce(jsonb_agg(buyer_safe_url order by position,id),'[]'::jsonb),
         count(*)::integer
  into v_urls,v_count
  from public.anybike_live_source_buyer_safe_images
  where live_source_item_id=v_item_id
    and safe_status='safe'
    and approved_for_buyer_display=true
    and nullif(buyer_safe_url,'') is not null;

  update public.used_bike_scans
  set buyer_image_urls=v_urls,
      extraction=jsonb_set(
        coalesce(extraction,'{}'::jsonb),
        '{buyer_safe_image_status}',
        to_jsonb(case when v_count>0 then 'ready' else 'pending' end::text),
        true
      ),
      updated_at=now()
  where id=p_scan_id;

  return jsonb_build_object(
    'scan_id',p_scan_id,
    'image_id',p_image_id,
    'included',coalesce(p_included,false),
    'buyer_image_urls',v_urls,
    'buyer_safe_image_count',v_count
  );
end;
$function$;

revoke all on function public.admin_set_scan_buyer_safe_image_included_v1(bigint,bigint,boolean) from public;
grant execute on function public.admin_set_scan_buyer_safe_image_included_v1(bigint,bigint,boolean) to authenticated;
