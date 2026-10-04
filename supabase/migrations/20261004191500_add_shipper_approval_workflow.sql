-- Shipper approval / decline and buyer confirmation audit
alter table public.deal_customer_handover_selections
  add column if not exists admin_decision_reason text,
  add column if not exists admin_decided_at timestamptz,
  add column if not exists admin_decided_by uuid,
  add column if not exists buyer_contacted_shipper boolean not null default false,
  add column if not exists shipper_agreed_to_handle boolean not null default false,
  add column if not exists buyer_shipper_confirmed_at timestamptz;

create or replace function public.admin_decide_customer_handover_plan_v1(
  p_deal_id bigint,
  p_handover_plan_id bigint,
  p_decision text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_admin uuid := auth.uid();
  v_selection public.deal_customer_handover_selections%rowtype;
  v_deal public.anybike_deals%rowtype;
  v_plan public.customer_handover_plans%rowtype;
  v_thread_id bigint;
  v_message text;
  v_reason text := nullif(trim(coalesce(p_reason,'')),'');
begin
  if not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_decision not in ('Approved by AnyBike','Declined by AnyBike') then
    raise exception 'Invalid handover decision';
  end if;

  if p_decision='Declined by AnyBike' and v_reason is null then
    raise exception 'A reason is required when declining a shipper';
  end if;

  select * into v_deal
  from public.anybike_deals
  where id=p_deal_id;

  if not found then
    raise exception 'Deal % was not found',p_deal_id;
  end if;

  select * into v_plan
  from public.customer_handover_plans
  where id=p_handover_plan_id
    and customer_id=v_deal.customer_id
    and is_active=true;

  if not found then
    raise exception 'The selected customer handover plan was not found for this Deal';
  end if;

  select * into v_selection
  from public.deal_customer_handover_selections
  where deal_id=p_deal_id
    and handover_plan_id=p_handover_plan_id
  for update;

  if not found then
    raise exception 'Customer handover selection was not found for this Deal';
  end if;

  if p_decision='Approved by AnyBike'
     and (not v_selection.buyer_contacted_shipper or not v_selection.shipper_agreed_to_handle) then
    raise exception 'Buyer must confirm they contacted the shipper and the shipper agreed to handle the motorcycle before AnyBike can approve this route';
  end if;

  update public.deal_customer_handover_selections
  set status=p_decision,
      verified_at=case when p_decision='Approved by AnyBike' then now() else null end,
      verified_by=case when p_decision='Approved by AnyBike' then v_admin else null end,
      admin_decision_reason=v_reason,
      admin_decided_at=now(),
      admin_decided_by=v_admin,
      updated_at=now()
  where id=v_selection.id
  returning * into v_selection;

  if p_decision='Declined by AnyBike' then
    select id into v_thread_id
    from public.message_centre_threads
    where customer_id=v_deal.customer_id
      and related_deal_id=v_deal.id
    order by id desc
    limit 1;

    v_message :=
      'Your shipping / handover option for '||coalesce(v_deal.deal_number,'your AnyBike purchase')||
      ' needs to be changed.'||E'\n\n'||
      'Reason: '||v_reason||E'\n\n'||
      'Please update your Shipping Preferences or choose another suitable UK handover / freight-forwarder option.';

    if v_thread_id is not null then
      insert into public.message_centre_messages(
        thread_id,sender_type,sender_name,sender_email,message,is_internal_note,created_at
      )
      values(
        v_thread_id,'AnyBike','AnyBike','admin@anybike.co.uk',v_message,false,now()
      );

      update public.message_centre_threads
      set last_message=v_message,
          last_message_at=now(),
          last_sender='AnyBike',
          status='Replied',
          updated_at=now()
      where id=v_thread_id;
    end if;

    insert into public.customer_notifications(
      customer_id,title,message,icon,type,link,is_read,created_at
    )
    values(
      v_deal.customer_id,
      'Shipping option needs changing',
      coalesce(v_deal.deal_number,'Your AnyBike purchase')||' · '||v_reason,
      '🚢',
      'shipping_details_declined',
      '/customer-dashboard.html?action=confirm-shipping&deal='||v_deal.id::text||'#shipping-preferences',
      false,
      now()
    );
  end if;

  return jsonb_build_object(
    'success',true,
    'deal_id',v_deal.id,
    'deal_number',v_deal.deal_number,
    'handover_plan_id',v_plan.id,
    'decision',p_decision,
    'reason',v_reason,
    'buyer_contacted_shipper',v_selection.buyer_contacted_shipper,
    'shipper_agreed_to_handle',v_selection.shipper_agreed_to_handle,
    'decided_at',v_selection.admin_decided_at
  );
end;
$function$;

revoke all on function public.admin_decide_customer_handover_plan_v1(bigint,bigint,text,text) from public;
revoke all on function public.admin_decide_customer_handover_plan_v1(bigint,bigint,text,text) from anon;
grant execute on function public.admin_decide_customer_handover_plan_v1(bigint,bigint,text,text) to authenticated;
