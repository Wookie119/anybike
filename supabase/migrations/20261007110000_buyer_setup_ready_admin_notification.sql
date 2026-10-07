create schema if not exists private;

create table if not exists private.buyer_setup_ready_notification_state (
  customer_id uuid primary key references public.customer_profiles(id) on delete cascade,
  was_complete boolean not null default false,
  notification_sent_at timestamptz,
  last_checked_at timestamptz not null default now()
);

revoke all on schema private from anon, authenticated;
revoke all on table private.buyer_setup_ready_notification_state from public, anon, authenticated;

create or replace function private.anybike_buyer_setup_ready_now(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, private
as $$
  with customer as (
    select
      cp.*,
      u.email_confirmed_at,
      coalesce(m.customer_intent, cp.customer_intent, 'unclear') as effective_intent,
      coalesce(
        m.route,
        case
          when coalesce(m.customer_intent, cp.customer_intent, 'unclear') in ('buy','buy_supply') then 'buyer_export'
          when coalesce(m.customer_intent, cp.customer_intent, 'unclear') in ('supply','dealer_trade_supply') then 'dealer_supplier'
          when coalesce(m.customer_intent, cp.customer_intent, 'unclear') = 'dealer_underwrite' then 'dealer_underwrite'
          when coalesce(m.customer_intent, cp.customer_intent, 'unclear') = 'vmoto_retail' then 'vmoto_retail'
          else 'needs_clarification'
        end
      ) as effective_route,
      coalesce(cbo.approval_status, 'not_reviewed') as approval_status
    from public.customer_profiles cp
    join auth.users u on u.id = cp.id
    left join public.anybike_onboarding_management m on m.user_id = cp.id
    left join public.customer_buyer_onboarding cbo on cbo.customer_id = cp.id
    where cp.id = p_customer_id
  )
  select coalesce((
    select
      not coalesce(is_test_account,false)
      and email_confirmed_at is not null
      and effective_route = 'buyer_export'
      and lower(coalesce(approval_status,'')) not in ('approved','approved_with_exception','approved with exceptions')
      and nullif(btrim(full_name),'') is not null
      and nullif(btrim(email),'') is not null
      and nullif(btrim(phone),'') is not null
      and nullif(btrim(contact_address_line1),'') is not null
      and nullif(btrim(city),'') is not null
      and nullif(btrim(region),'') is not null
      and nullif(btrim(contact_postcode),'') is not null
      and nullif(btrim(country),'') is not null
      and nullif(btrim(buyer_type),'') is not null
      and nullif(btrim(business_name),'') is not null
      and nullif(btrim(business_email),'') is not null
      and nullif(btrim(business_phone),'') is not null
      and nullif(btrim(business_address_line1),'') is not null
      and nullif(btrim(business_city),'') is not null
      and nullif(btrim(business_region),'') is not null
      and nullif(btrim(business_postcode),'') is not null
      and nullif(btrim(business_country),'') is not null
      and nullif(btrim(preferred_shipping_method),'') is not null
      and typical_bikes_per_shipment is not null
      and nullif(btrim(identity_document_path),'') is not null
      and nullif(btrim(proof_of_address_document_path),'') is not null
      and (
        nullif(btrim(preferred_shipping_company),'') is not null
        or shipping_directory_forwarder_id is not null
        or nullif(btrim(shipping_address_line1),'') is not null
        or nullif(btrim(shipping_country),'') is not null
      )
    from customer
  ), false);
$$;

revoke all on function private.anybike_buyer_setup_ready_now(uuid) from public, anon, authenticated;

insert into private.buyer_setup_ready_notification_state(
  customer_id, was_complete, notification_sent_at, last_checked_at
)
select
  cp.id,
  private.anybike_buyer_setup_ready_now(cp.id),
  case when private.anybike_buyer_setup_ready_now(cp.id) then now() else null end,
  now()
from public.customer_profiles cp
on conflict (customer_id) do nothing;

create or replace function private.anybike_refresh_buyer_setup_ready(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, private
as $$
declare
  v_complete boolean := false;
  v_was_complete boolean := false;
  v_sent_at timestamptz;
  v_name text;
begin
  if p_customer_id is null then
    return;
  end if;

  v_complete := private.anybike_buyer_setup_ready_now(p_customer_id);

  insert into private.buyer_setup_ready_notification_state(
    customer_id, was_complete, notification_sent_at, last_checked_at
  )
  values(p_customer_id, false, null, now())
  on conflict (customer_id) do nothing;

  select s.was_complete, s.notification_sent_at
    into v_was_complete, v_sent_at
  from private.buyer_setup_ready_notification_state s
  where s.customer_id = p_customer_id
  for update;

  if v_complete and not coalesce(v_was_complete,false) and v_sent_at is null then
    select coalesce(
      nullif(btrim(cp.full_name),''),
      nullif(btrim(cp.business_name),''),
      nullif(btrim(cp.email),''),
      'A customer'
    )
      into v_name
    from public.customer_profiles cp
    where cp.id = p_customer_id;

    insert into public.admin_notifications(
      title, message, icon, type, link, is_read, created_at
    )
    values(
      'Buyer Setup complete — ready for review',
      v_name || ' has completed Buyer Setup and is ready for AnyBike approval.',
      '✅',
      'buyer_setup_complete',
      '/admin-customers.html?customer=' || p_customer_id::text || '&action=review-setup',
      false,
      now()
    );

    update private.buyer_setup_ready_notification_state
    set was_complete = true,
        notification_sent_at = now(),
        last_checked_at = now()
    where customer_id = p_customer_id;
  else
    update private.buyer_setup_ready_notification_state
    set was_complete = v_complete,
        last_checked_at = now()
    where customer_id = p_customer_id;
  end if;
end;
$$;

revoke all on function private.anybike_refresh_buyer_setup_ready(uuid) from public, anon, authenticated;

create or replace function private.anybike_buyer_setup_profile_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, private
as $$
begin
  perform private.anybike_refresh_buyer_setup_ready(new.id);
  return new;
end;
$$;

revoke all on function private.anybike_buyer_setup_profile_trigger() from public, anon, authenticated;

drop trigger if exists trg_anybike_buyer_setup_ready_profile on public.customer_profiles;
create trigger trg_anybike_buyer_setup_ready_profile
after insert or update on public.customer_profiles
for each row execute function private.anybike_buyer_setup_profile_trigger();

create or replace function private.anybike_buyer_setup_auth_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, private
as $$
begin
  if tg_op = 'INSERT' or new.email_confirmed_at is distinct from old.email_confirmed_at then
    perform private.anybike_refresh_buyer_setup_ready(new.id);
  end if;
  return new;
end;
$$;

revoke all on function private.anybike_buyer_setup_auth_trigger() from public, anon, authenticated;

drop trigger if exists trg_anybike_buyer_setup_ready_auth on auth.users;
create trigger trg_anybike_buyer_setup_ready_auth
after insert or update of email_confirmed_at on auth.users
for each row execute function private.anybike_buyer_setup_auth_trigger();

create or replace function private.anybike_buyer_setup_management_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, private
as $$
begin
  perform private.anybike_refresh_buyer_setup_ready(new.user_id);
  return new;
end;
$$;

revoke all on function private.anybike_buyer_setup_management_trigger() from public, anon, authenticated;

drop trigger if exists trg_anybike_buyer_setup_ready_management on public.anybike_onboarding_management;
create trigger trg_anybike_buyer_setup_ready_management
after insert or update of route, customer_type, customer_intent on public.anybike_onboarding_management
for each row execute function private.anybike_buyer_setup_management_trigger();
