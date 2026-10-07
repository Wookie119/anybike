-- Live Source Hub buyer opt-in controlled from Customer 360.
alter table public.customer_profiles
  add column if not exists live_source_enabled boolean not null default false;

create unique index if not exists global_buyer_network_customer_id_unique
  on public.global_buyer_network(customer_id)
  where customer_id is not null;

create or replace function public.admin_set_live_source_buyer_v1(
  p_user_id uuid,
  p_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_profile public.customer_profiles%rowtype;
  v_buyer_id bigint;
begin
  if auth.uid() is null or not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.customer_profiles
  set live_source_enabled = coalesce(p_enabled,false)
  where id = p_user_id
  returning * into v_profile;

  if not found then raise exception 'Customer profile not found'; end if;

  select id into v_buyer_id
  from public.global_buyer_network
  where customer_id = p_user_id
     or (customer_id is null and v_profile.email is not null and lower(email)=lower(v_profile.email))
  order by case when customer_id=p_user_id then 0 else 1 end, id
  limit 1;

  if coalesce(p_enabled,false) then
    if v_buyer_id is null then
      insert into public.global_buyer_network(
        customer_id,business_name,contact_name,email,phone,country,city,status,lead_source
      ) values (
        p_user_id,
        nullif(btrim(coalesce(v_profile.business_name,'')),''),
        nullif(btrim(coalesce(v_profile.full_name,'')),''),
        nullif(btrim(coalesce(v_profile.email,'')),''),
        nullif(btrim(coalesce(v_profile.phone,'')),''),
        nullif(btrim(coalesce(v_profile.country,'')),''),
        nullif(btrim(coalesce(v_profile.city,'')),''),
        'Active','Customer 360'
      ) returning id into v_buyer_id;
    else
      update public.global_buyer_network set
        customer_id=p_user_id,
        business_name=coalesce(nullif(btrim(coalesce(v_profile.business_name,'')),''),business_name),
        contact_name=coalesce(nullif(btrim(coalesce(v_profile.full_name,'')),''),contact_name),
        email=coalesce(nullif(btrim(coalesce(v_profile.email,'')),''),email),
        phone=coalesce(nullif(btrim(coalesce(v_profile.phone,'')),''),phone),
        country=coalesce(nullif(btrim(coalesce(v_profile.country,'')),''),country),
        city=coalesce(nullif(btrim(coalesce(v_profile.city,'')),''),city),
        archived_at=null,archived_by=null,archive_reason=null
      where id=v_buyer_id;
    end if;
  end if;

  return jsonb_build_object('success',true,'user_id',p_user_id,'enabled',coalesce(p_enabled,false),'buyer_id',v_buyer_id);
end;
$function$;

revoke all on function public.admin_set_live_source_buyer_v1(uuid,boolean) from public;
grant execute on function public.admin_set_live_source_buyer_v1(uuid,boolean) to authenticated;

create or replace function public.admin_get_live_source_buyers_v1()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin access required'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',g.id,'customer_id',g.customer_id,'business_name',g.business_name,
    'contact_name',g.contact_name,'email',g.email,'country',g.country
  ) order by coalesce(g.business_name,g.contact_name,g.email),g.id),'[]'::jsonb)
  into v_result
  from public.global_buyer_network g
  join public.customer_profiles cp on cp.id=g.customer_id
  where g.archived_at is null and cp.live_source_enabled=true;

  return v_result;
end;
$function$;

revoke all on function public.admin_get_live_source_buyers_v1() from public;
grant execute on function public.admin_get_live_source_buyers_v1() to authenticated;

-- The sourcing queue uses the same opt-in rule.
create or replace function public.admin_get_buyer_sourcing_queue_v1()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin access required'; end if;

  with reqs as (
    select g.id buyer_id,g.business_name,g.contact_name,g.email,r.id request_id,r.make,r.model,r.created_at request_created_at,
      exists(select 1 from public.used_bike_scan_batches b where b.buyer_id=g.id and b.request_item_id=r.id) has_batch,
      exists(select 1 from public.used_bike_scan_batches b join public.used_bike_scans s on s.batch_id=b.id
             where b.buyer_id=g.id and b.request_item_id=r.id and s.buyer_response is not null) has_response
    from public.global_buyer_network g
    join public.customer_profiles cp on cp.id=g.customer_id and cp.live_source_enabled=true
    join public.global_buyer_request_items r on r.buyer_id=g.id
    where g.archived_at is null
  ), buyer_rollup as (
    select buyer_id,max(business_name) business_name,max(contact_name) contact_name,max(email) email,
      count(*)::int request_count,
      count(*) filter(where not has_batch)::int waiting_for_matches_count,
      count(*) filter(where has_batch and not has_response)::int in_progress_count,
      count(*) filter(where has_response)::int responded_count,
      min(request_created_at) filter(where not has_batch) oldest_waiting_since,
      coalesce(jsonb_agg(jsonb_build_object('request_id',request_id,'make',make,'model',model,'request_created_at',request_created_at)
               order by request_created_at) filter(where not has_batch),'[]'::jsonb) waiting_requests
    from reqs group by buyer_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'buyer_id',buyer_id,'business_name',business_name,'contact_name',contact_name,'email',email,
    'request_count',request_count,'waiting_for_matches_count',waiting_for_matches_count,
    'in_progress_count',in_progress_count,'responded_count',responded_count,
    'oldest_waiting_since',oldest_waiting_since,'waiting_requests',waiting_requests
  ) order by case when waiting_for_matches_count>0 then 0 else 1 end,oldest_waiting_since nulls last,buyer_id),'[]'::jsonb)
  into v_result from buyer_rollup;

  return v_result;
end;
$function$;

revoke all on function public.admin_get_buyer_sourcing_queue_v1() from public;
grant execute on function public.admin_get_buyer_sourcing_queue_v1() to authenticated;

-- Keep the two existing sourcing buyers enabled and add the test account.
update public.customer_profiles set live_source_enabled=true
where id in (
  '16b0ef8f-fba9-4e4f-8805-1f8af919b7be'::uuid,
  '40f42e2e-54d0-4064-9b5f-225f575c83bd'::uuid,
  'd833e6cf-c8ac-4b7a-b161-3717cf615193'::uuid
);

update public.global_buyer_network
set customer_id='40f42e2e-54d0-4064-9b5f-225f575c83bd'::uuid
where id=17 and customer_id is null;

insert into public.global_buyer_network(customer_id,business_name,contact_name,email,phone,country,city,status,lead_source)
select cp.id,cp.business_name,cp.full_name,cp.email,cp.phone,cp.country,cp.city,'Active','Customer 360'
from public.customer_profiles cp
where cp.id='d833e6cf-c8ac-4b7a-b161-3717cf615193'::uuid
and not exists(select 1 from public.global_buyer_network g where g.customer_id=cp.id);
