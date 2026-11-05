-- UK dealer email confirmation -> Admin review notification (not approval).
CREATE OR REPLACE FUNCTION public.anybike_dealer_confirmation_auth_trigger_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
begin
  if new.email_confirmed_at is not null
     and old.email_confirmed_at is distinct from new.email_confirmed_at then
    perform public.anybike_notify_confirmed_dealer_review_v1(new.id);
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.anybike_dealer_confirmation_profile_trigger_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
begin
  perform public.anybike_notify_confirmed_dealer_review_v1(new.id);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.anybike_notify_confirmed_dealer_review_v1(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
  v_profile public.customer_profiles%rowtype;
  v_confirmed_at timestamptz;
  v_level integer;
  v_name text;
  v_link text;
begin
  select * into v_profile from public.customer_profiles where id = p_user_id;
  if not found or v_profile.customer_type not in ('uk_dealer', 'uk_distributor')
     or coalesce(v_profile.is_test_account,false)
     or nullif(btrim(coalesce(v_profile.business_name,'')),'') is null then
    return false;
  end if;
  select email_confirmed_at into v_confirmed_at from auth.users where id=p_user_id;
  if v_confirmed_at is null then return false; end if;
  select level into v_level from public.anybike_dealer_access where user_id=p_user_id;
  if coalesce(v_level,1) >= 2 then return false; end if;
  v_link := '/admin-customer-database.html?customer='||p_user_id::text;
  -- Prevent duplicate notices across confirmation/profile update triggers and retries.
  if exists (
    select 1 from public.admin_notifications
    where type='dealer_email_confirmed' and link=v_link
  ) then return false; end if;
  v_name := coalesce(nullif(btrim(v_profile.business_trading_name),''),
                     nullif(btrim(v_profile.business_name),''),'UK dealership');
  insert into public.admin_notifications(title,message,icon,type,link,is_read,created_at)
  values('Dealer email confirmed — approval review',
         v_name||' confirmed its email address and has business details on file. Review the application before granting Level 2 access.',
         'users','dealer_email_confirmed',v_link,false,now());
  return true;
end;
$function$;

revoke all on function public.anybike_notify_confirmed_dealer_review_v1(uuid) from public,anon,authenticated;
revoke all on function public.anybike_dealer_confirmation_auth_trigger_v1() from public,anon,authenticated;
revoke all on function public.anybike_dealer_confirmation_profile_trigger_v1() from public,anon,authenticated;
drop trigger if exists trg_anybike_dealer_confirmation_auth_v1 on auth.users;
create trigger trg_anybike_dealer_confirmation_auth_v1 after update of email_confirmed_at on auth.users for each row execute function public.anybike_dealer_confirmation_auth_trigger_v1();
drop trigger if exists trg_anybike_dealer_confirmation_profile_v1 on public.customer_profiles;
create trigger trg_anybike_dealer_confirmation_profile_v1 after insert or update of customer_type,business_name,business_trading_name on public.customer_profiles for each row execute function public.anybike_dealer_confirmation_profile_trigger_v1();
-- Backfill previously confirmed applicants, idempotently.
select public.anybike_notify_confirmed_dealer_review_v1(p.id) from public.customer_profiles p join auth.users u on u.id=p.id where p.customer_type in ('uk_dealer','uk_distributor') and u.email_confirmed_at is not null and nullif(btrim(coalesce(p.business_name,'')),'') is not null and not coalesce(p.is_test_account,false) and not exists (select 1 from public.anybike_dealer_access a where a.user_id=p.id and a.level>=2);
