-- Auction invitations already create a dedicated bell notification in
-- admin_invite_verified_trade_dealer_v1. Avoid the additional generic
-- "New message from AnyBike" bell generated for the initial invitation.
-- Keep the Message Centre message and all ordinary reply alerts unchanged.
create or replace function anybike_private.notify_customer_message_centre_reply()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'anybike_private'
as $function$
declare
  v_customer_id uuid;
  v_customer_email text;
  v_subject text;
  v_source_type text;
begin
  if lower(btrim(coalesce(new.sender_type,''))) in ('customer','buyer','user') then
    return new;
  end if;

  select t.customer_id,t.customer_email,t.subject,t.source_type
  into v_customer_id,v_customer_email,v_subject,v_source_type
  from public.message_centre_threads t
  where t.id=new.thread_id;

  -- The dedicated invitation bell links straight to the motorcycle.
  -- Only suppress the first invitation message, not subsequent replies.
  if v_source_type='trade_underwrite_invitation'
     and not exists (
       select 1 from public.message_centre_messages m
       where m.thread_id=new.thread_id and m.id<>new.id
     ) then
    return new;
  end if;

  if v_customer_id is null and nullif(btrim(coalesce(v_customer_email,'')),'') is not null then
    select cp.id
    into v_customer_id
    from public.customer_profiles cp
    where lower(cp.email)=lower(v_customer_email)
    limit 1;
  end if;

  if v_customer_id is null then
    return new;
  end if;

  insert into public.customer_notifications(
    customer_id,title,message,icon,type,link,is_read,created_at
  )
  values(
    v_customer_id,
    'New message from AnyBike',
    left(coalesce(nullif(btrim(new.message),''),'AnyBike has sent you a new message.'),250),
    case
      when lower(coalesce(v_subject,'')) like '%global buyer%' then '🌍'
      else '💬'
    end,
    'message',
    '/customer-messages.html?thread=' || new.thread_id::text,
    false,
    coalesce(new.created_at,now())
  );

  return new;
end;
$function$;
