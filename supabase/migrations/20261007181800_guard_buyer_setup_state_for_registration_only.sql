-- Prevent buyer-setup readiness trigger from creating state for registration-only users.
-- customer_profiles is the FK parent of private.buyer_setup_ready_notification_state.

create or replace function private.anybike_refresh_buyer_setup_ready(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog','public','auth','private'
as $function$
declare
  v_complete boolean := false;
  v_was_complete boolean := false;
  v_sent_at timestamptz;
  v_name text;
begin
  if p_customer_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.customer_profiles cp
    where cp.id = p_customer_id
  ) then
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
$function$;
