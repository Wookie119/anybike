-- Add useful labels to the intentionally managed Live Source Hub buyer list.
-- The underlying opt-in remains customer_profiles.live_source_enabled, default false.

create or replace function public.admin_get_live_source_buyers_v1()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',g.id,
        'customer_id',g.customer_id,
        'business_name',g.business_name,
        'contact_name',g.contact_name,
        'email',g.email,
        'country',coalesce(g.country,cp.country),
        'customer_type',cp.customer_type
      )
      order by coalesce(g.business_name,g.contact_name,g.email),g.id
    ),
    '[]'::jsonb
  )
  into v_result
  from public.global_buyer_network g
  join public.customer_profiles cp on cp.id=g.customer_id
  where g.archived_at is null
    and cp.live_source_enabled=true;

  return v_result;
end;
$function$;

revoke all on function public.admin_get_live_source_buyers_v1() from public;
grant execute on function public.admin_get_live_source_buyers_v1() to authenticated;
