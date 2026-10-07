-- Use registration metadata country as a fallback in Onboarding.
-- Some older accounts have no customer_profiles.country/business_country but did supply a country at sign-up.

do $$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='admin_get_onboarding_pipeline_v1';

  if v_def is null then
    raise exception 'admin_get_onboarding_pipeline_v1 not found';
  end if;

  v_def := replace(
    v_def,
    'cp.full_name,cp.business_name,cp.country,cp.buyer_type,',
    'cp.full_name,cp.business_name,coalesce(nullif(trim(cp.country),''''),nullif(trim(cp.business_country),''''),nullif(trim(u.raw_user_meta_data->>''country''),'''')) country,cp.buyer_type,'
  );

  execute v_def;
end $$;
