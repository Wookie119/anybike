-- Allow onboarding setup help for registration-only and unconfirmed accounts.
-- In-app customer notifications are only created once a customer_profiles row exists,
-- avoiding the buyer_setup_ready_notification_state FK failure for registration-only users.

create or replace function public.admin_send_onboarding_help_v1(
  p_user_id uuid,
  p_template_key text
)
returns table(thread_id bigint, link text, title text)
language plpgsql
security definer
set search_path to 'public','auth','pg_temp'
as $function$
declare
  v_email text;
  v_name text;
  v_phone text;
  v_country text;
  v_confirmed timestamptz;
  v_has_profile boolean:=false;
  v_thread_id bigint;
  v_link text;
  v_title text;
  v_message text;
  v_key text:=lower(btrim(coalesce(p_template_key,'')));
begin
  if not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  select
    u.email::text,
    u.email_confirmed_at,
    coalesce(nullif(btrim(cp.full_name),''),split_part(u.email,'@',1)),
    cp.phone,
    cp.country,
    (cp.id is not null)
  into v_email,v_confirmed,v_name,v_phone,v_country,v_has_profile
  from auth.users u
  left join public.customer_profiles cp on cp.id=u.id
  where u.id=p_user_id;

  if v_email is null then raise exception 'Customer account not found'; end if;

  case v_key
    when 'complete_profile' then
      v_title:='Complete your AnyBike profile';
      v_link:='/customer-profile.html#section-profile-update';
      v_message:='Thanks for registering with AnyBike. Please complete your profile so we have the correct contact and account details and can take you to the right next step.';
    when 'export_buyer_setup' then
      v_title:='Complete your AnyBike buyer setup';
      v_link:='/customer-profile.html#buyer-onboarding';
      v_message:='Thanks for registering to buy motorcycles through AnyBike. Please complete your Buyer Setup, including your business, export and shipping details, so we can approve your account and start matching motorcycles to your requirements.';
    when 'dealer_supplier' then
      v_title:='Set up your dealer supply account';
      v_link:='/customer-profile.html#section-profile-update';
      v_message:='Thanks for registering your motorcycle business with AnyBike. Please complete your dealership details so you can offer motorcycles to AnyBike and use the dealer supply and underwrite services.';
    when 'dealer_underwrite' then
      v_title:='Complete your dealer underwrite setup';
      v_link:='/underwrite.html';
      v_message:='Thanks for registering to use AnyBike Underwrite. Please complete your dealership profile, then you can submit motorcycles for AnyBike to check trade interest and international buyer demand.';
    when 'trade_underwriter' then
      v_title:='Complete your trade underwriter setup';
      v_link:='/customer-profile.html#section-profile-update';
      v_message:='Thanks for registering to bid on AnyBike trade opportunities. Please complete your dealership details. AnyBike will then review your account and, once approved and the current Trade Underwriter Agreement is accepted, eligible opportunities can be made available to you.';
    when 'vmoto_retail' then
      v_title:='Continue your VMoto enquiry';
      v_link:='/vmoto.html';
      v_message:='Thanks for your interest in a new VMoto motorcycle. Please complete your contact details and continue your VMoto enquiry so AnyBike can help with availability, pricing and delivery.';
    when 'new_uk_retail' then
      v_title:='Continue your new motorcycle enquiry';
      v_link:='/customer-profile.html#section-profile-update';
      v_message:='Thanks for registering with AnyBike. Please complete your contact details so we can help with your new motorcycle enquiry and the next available options.';
    when 'partnership' then
      v_title:='Complete your AnyBike partner details';
      v_link:='/customer-profile.html#section-profile-update';
      v_message:='Thanks for registering with AnyBike. Please complete your business and contact details so we can review the most appropriate partnership or integration route with you.';
    when 'freight_logistics' then
      v_title:='Complete your freight / logistics details';
      v_link:='/customer-profile.html#section-profile-update';
      v_message:='Thanks for registering with AnyBike. Please complete your company and contact details so we can review your freight or logistics services and connect them to the correct AnyBike workflow.';
    when 'clarify_use' then
      v_title:='Tell AnyBike how you would like to use your account';
      v_link:='/customer-messages.html';
      v_message:='Thanks for registering with AnyBike. Please tell us what you would like to do: buy motorcycles, sell or supply motorcycles, request dealer underwrites, bid on trade opportunities, buy a new VMoto, or work with AnyBike as a partner. Reply here and we will put you on the correct route.';
    else
      raise exception 'Invalid onboarding message template';
  end case;

  select t.id into v_thread_id
  from public.message_centre_threads t
  where t.customer_id=p_user_id and t.source_type='Onboarding'
  order by t.id desc
  limit 1;

  if v_thread_id is null then
    insert into public.message_centre_threads(
      customer_id,customer_name,customer_email,customer_phone,country,
      source_type,source_page,subject,status,department,priority,
      last_message,last_message_at,last_sender,created_at,updated_at
    )
    values(
      p_user_id,v_name,v_email,v_phone,v_country,
      'Onboarding','admin-onboarding.html',v_title,'Open','Sales','Normal',
      v_message,now(),'AnyBike',now(),now()
    )
    returning id into v_thread_id;
  else
    update public.message_centre_threads
    set subject=v_title,
        last_message=v_message,
        last_message_at=now(),
        last_sender='AnyBike',
        updated_at=now(),
        status='Open'
    where id=v_thread_id;
  end if;

  insert into public.message_centre_messages(
    thread_id,sender_type,sender_name,sender_email,message,is_internal_note,created_at
  )
  values(v_thread_id,'AnyBike','AnyBike','sales@anybike.co.uk',v_message,false,now());

  if v_has_profile then
    insert into public.customer_notifications(
      customer_id,title,message,icon,type,link,is_read,created_at
    )
    values(p_user_id,v_title,v_message,'✅','onboarding',v_link,false,now());
  end if;

  insert into public.anybike_onboarding_management(
    user_id,last_reminder_at,reminder_count,last_reminder_stage,updated_at,updated_by
  )
  values(p_user_id,now(),1,v_title,now(),auth.uid())
  on conflict(user_id) do update set
    last_reminder_at=excluded.last_reminder_at,
    reminder_count=public.anybike_onboarding_management.reminder_count+1,
    last_reminder_stage=excluded.last_reminder_stage,
    updated_at=excluded.updated_at,
    updated_by=excluded.updated_by;

  return query select v_thread_id,v_link,v_title;
end;
$function$;
