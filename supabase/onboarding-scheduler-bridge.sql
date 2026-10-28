-- AnyBike scheduler bridge. Uses no hard-coded credentials.
-- Provision secret "anybike_onboarding_worker_bearer" in Supabase Vault before production activation.
-- Cron should execute as postgres, not an untrusted API role.
create or replace function public.anybike_onboarding_scheduler_dispatch()
returns text language plpgsql security invoker
set search_path = pg_catalog, public
as $body$
declare
  v_enabled boolean;
  v_token text;
  v_req bigint;
begin
  select coalesce(sending_enabled,false) into v_enabled
  from public.anybike_onboarding_settings where id=true;
  if not coalesce(v_enabled,false) then
    return 'dry_run: customer sending disabled';
  end if;
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='anybike_onboarding_worker_bearer'
  limit 1;
  if nullif(v_token,'') is null then
    return 'blocked: missing Vault credential';
  end if;
  select net.http_post(
    url := 'https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/anybike-onboarding-worker',
    headers := jsonb_build_object('Authorization','Bearer '||v_token,'Content-Type','application/json'),
    body := '{}'::jsonb
  ) into v_req;
  return 'queued protected worker request '||v_req;
end;
$body$;
revoke all on function public.anybike_onboarding_scheduler_dispatch() from public, anon, authenticated;
-- Existing hourly dry-run cron stays untouched until separate release approval.
