alter table public.used_bike_scan_batches
  add column if not exists selection_token uuid;

update public.used_bike_scan_batches
set selection_token=gen_random_uuid()
where selection_token is null;

alter table public.used_bike_scan_batches
  alter column selection_token set default gen_random_uuid(),
  alter column selection_token set not null;

create unique index if not exists used_bike_scan_batches_selection_token_uidx
  on public.used_bike_scan_batches(selection_token);

create or replace function public.customer_get_used_bike_scan_batch_by_token_v1(p_selection uuid)
returns jsonb
language plpgsql
security definer
set search_path='public','pg_temp'
as $$
declare
  v_uid uuid := auth.uid();
  v_batch_id bigint;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select id into v_batch_id
  from public.used_bike_scan_batches
  where selection_token=p_selection
    and customer_id=v_uid
    and status='shared';

  if v_batch_id is null then raise exception 'Selection not found'; end if;

  return public.customer_get_used_bike_scan_batch_v1(v_batch_id);
end;
$$;

revoke all on function public.customer_get_used_bike_scan_batch_by_token_v1(uuid) from public, anon;
grant execute on function public.customer_get_used_bike_scan_batch_by_token_v1(uuid) to authenticated;

create or replace function public.admin_get_customer_sourced_match_batches_v1(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path='public','pg_temp'
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',b.id,
    'title',b.title,
    'status',b.status,
    'shared_at',b.shared_at,
    'created_at',b.created_at,
    'make',r.make,
    'model',r.model,
    'total_matches',(select count(*) from public.used_bike_scans s where s.batch_id=b.id and s.selected_for_buyer=true and s.price_checked=true),
    'interested_count',(select count(*) from public.used_bike_scans s where s.batch_id=b.id and s.buyer_response='Interested'),
    'declined_count',(select count(*) from public.used_bike_scans s where s.batch_id=b.id and s.buyer_response='Not Interested'),
    'unanswered_count',(select count(*) from public.used_bike_scans s where s.batch_id=b.id and s.selected_for_buyer=true and s.price_checked=true and s.buyer_response is null)
  ) order by coalesce(b.shared_at,b.created_at) desc),'[]'::jsonb)
  into v_result
  from public.used_bike_scan_batches b
  left join public.global_buyer_request_items r on r.id=b.request_item_id
  where b.customer_id=p_customer_id
    and b.status='shared';

  return v_result;
end;
$$;

revoke all on function public.admin_get_customer_sourced_match_batches_v1(uuid) from public, anon;
grant execute on function public.admin_get_customer_sourced_match_batches_v1(uuid) to authenticated;

do $$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='admin_share_used_bike_scan_batch_v1';

  v_def := replace(
    v_def,
    'v_link := ''/customer-sourced-matches.html?batch='' || p_batch_id::text || ''&thread='' || v_thread_id::text;',
    'v_link := ''/customer-sourced-matches.html?selection='' || v_batch.selection_token::text;'
  );
  execute v_def;
end $$;

create or replace function public.customer_get_sourced_match_batches_v1()
returns jsonb
language plpgsql
security definer
set search_path='public','pg_temp'
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',b.id,
    'selection_ref',b.selection_token::text,
    'shared_at',b.shared_at,
    'message_text',b.message_text,
    'make',r.make,
    'model',r.model,
    'total_matches',(select count(*) from public.used_bike_scans s where s.batch_id=b.id and s.selected_for_buyer=true and s.price_checked=true),
    'interested_count',(select count(*) from public.used_bike_scans s where s.batch_id=b.id and s.buyer_response='Interested'),
    'watching_count',(select count(*) from public.used_bike_scans s where s.batch_id=b.id and s.buyer_response='Watching'),
    'declined_count',(select count(*) from public.used_bike_scans s where s.batch_id=b.id and s.buyer_response='Not Interested')
  ) order by b.shared_at desc),'[]'::jsonb)
  into v_result
  from public.used_bike_scan_batches b
  left join public.global_buyer_request_items r on r.id=b.request_item_id
  where b.customer_id=v_uid and b.status='shared';

  return v_result;
end;
$$;
