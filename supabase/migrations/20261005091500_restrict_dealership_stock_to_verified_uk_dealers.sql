create or replace function public.dealer_get_my_dealership()
returns table(
  dealer_organisation_id bigint,
  dealer_name text,
  dealer_role text
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    d.id,
    d.trading_name,
    du.role
  from public.dealer_users du
  join public.dealer_organisations d
    on d.id = du.dealer_organisation_id
  where du.user_id = auth.uid()
    and du.active = true
    and du.verified = true
    and d.active = true
    and d.verified = true
    and lower(trim(coalesce(d.country,''))) in (
      'united kingdom',
      'uk',
      'u.k.',
      'gb',
      'great britain',
      'england',
      'scotland',
      'wales',
      'northern ireland'
    )
  order by du.id
  limit 1;
end;
$function$;
