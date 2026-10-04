-- Require buyer shipper confirmations before admin review and publish approved shippers.
alter table public.deal_customer_handover_selections
  add column if not exists buyer_contacted_shipper boolean not null default false,
  add column if not exists shipper_agreed_to_handle boolean not null default false,
  add column if not exists buyer_shipper_confirmed_at timestamptz,
  add column if not exists admin_decision_reason text,
  add column if not exists admin_decided_at timestamptz,
  add column if not exists admin_decided_by uuid;

drop function if exists public.customer_submit_deal_shipper_for_approval_v1(bigint,bigint,bigint);
alter table public.deal_customer_handover_selections drop column if exists proof_document_id;

create or replace function public.customer_submit_deal_shipper_for_approval_v2(
  p_deal_id bigint,
  p_handover_plan_id bigint,
  p_buyer_contacted_shipper boolean,
  p_shipper_agreed_to_handle boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_deal public.anybike_deals%rowtype;
  v_plan public.customer_handover_plans%rowtype;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  if coalesce(p_buyer_contacted_shipper,false) is not true
     or coalesce(p_shipper_agreed_to_handle,false) is not true then
    raise exception 'Confirm that you have contacted the shipper and that the shipper has agreed to handle your motorcycle / shipment before submitting';
  end if;

  select * into v_deal
  from public.anybike_deals
  where id=p_deal_id and customer_id=v_uid;
  if not found then raise exception 'Deal not found for this customer'; end if;

  select * into v_plan
  from public.customer_handover_plans
  where id=p_handover_plan_id
    and customer_id=v_uid
    and is_active=true;
  if not found then raise exception 'Shipping preference not found'; end if;

  if nullif(trim(coalesce(v_plan.freight_forwarder_name,'')),'') is null
     or nullif(trim(coalesce(v_plan.shipping_company_name,'')),'') is null
     or nullif(trim(coalesce(v_plan.uk_handover_address_1,'')),'') is null
     or nullif(trim(coalesce(v_plan.uk_handover_postcode,'')),'') is null then
    raise exception 'Complete the shipper and UK receiving details before submitting this option';
  end if;

  insert into public.deal_customer_handover_selections(
    customer_id,deal_id,handover_plan_id,status,selected_at,updated_at,
    buyer_contacted_shipper,shipper_agreed_to_handle,buyer_shipper_confirmed_at,
    verified_at,verified_by,admin_decision_reason,admin_decided_at,admin_decided_by
  )
  values(
    v_uid,p_deal_id,p_handover_plan_id,'Customer Selected',now(),now(),
    true,true,now(),null,null,null,null,null
  )
  on conflict(customer_id,deal_id)
  do update set
    handover_plan_id=excluded.handover_plan_id,
    status='Customer Selected',
    selected_at=now(),
    updated_at=now(),
    buyer_contacted_shipper=true,
    shipper_agreed_to_handle=true,
    buyer_shipper_confirmed_at=now(),
    verified_at=null,
    verified_by=null,
    admin_decision_reason=null,
    admin_decided_at=null,
    admin_decided_by=null;

  if not exists(
    select 1
    from public.admin_notifications n
    where n.type='shipping_details_confirmed'
      and n.link='/admin-enquiries.html?deal='||p_deal_id::text||'&tab=offer'
      and n.is_read=false
      and n.created_at>now()-interval '24 hours'
  ) then
    insert into public.admin_notifications(title,message,icon,type,link,is_read,created_at)
    values(
      'Buyer submitted shipper for approval',
      coalesce(v_deal.deal_number,'Deal '||p_deal_id::text)||
      ' · '||v_plan.freight_forwarder_name||
      ' · buyer contacted shipper · shipper agreed to handle shipment',
      '🚢','shipping_details_confirmed',
      '/admin-enquiries.html?deal='||p_deal_id::text||'&tab=offer',
      false,now()
    );
  end if;

  return jsonb_build_object(
    'success',true,'deal_id',p_deal_id,'handover_plan_id',p_handover_plan_id,
    'shipper',v_plan.freight_forwarder_name,
    'buyer_contacted_shipper',true,'shipper_agreed_to_handle',true
  );
end;
$function$;

revoke all on function public.customer_submit_deal_shipper_for_approval_v2(bigint,bigint,boolean,boolean) from public;
revoke all on function public.customer_submit_deal_shipper_for_approval_v2(bigint,bigint,boolean,boolean) from anon;
grant execute on function public.customer_submit_deal_shipper_for_approval_v2(bigint,bigint,boolean,boolean) to authenticated;

create or replace function public.customer_confirm_deal_shipping_v1(p_deal_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
begin
  raise exception 'Use My AnyBike Shipping Preferences and confirm both shipper checks before submitting the shipping option to AnyBike.';
end;
$function$;

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
  v_forwarder_id bigint;
  v_destination text;
  v_handover_point text;
begin
  if not public.anybike_is_admin() then raise exception 'Admin access required'; end if;
  if p_decision not in ('Approved by AnyBike','Declined by AnyBike') then raise exception 'Invalid handover decision'; end if;
  if p_decision='Declined by AnyBike' and v_reason is null then raise exception 'A reason is required when declining a shipper'; end if;

  select * into v_deal from public.anybike_deals where id=p_deal_id;
  if not found then raise exception 'Deal % was not found',p_deal_id; end if;

  select * into v_plan
  from public.customer_handover_plans
  where id=p_handover_plan_id and customer_id=v_deal.customer_id and is_active=true;
  if not found then raise exception 'The selected customer handover plan was not found for this Deal'; end if;

  select * into v_selection
  from public.deal_customer_handover_selections
  where deal_id=p_deal_id and handover_plan_id=p_handover_plan_id
  for update;
  if not found then raise exception 'Customer handover selection was not found for this Deal'; end if;

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

  if p_decision='Approved by AnyBike' then
    v_destination:=nullif(trim(coalesce(v_deal.destination_country,v_plan.destination_country,'')),'');
    v_handover_point:=nullif(trim(coalesce(v_plan.uk_handover_point,'')),'');

    select id into v_forwarder_id
    from public.freight_forwarders
    where lower(trim(company_name))=lower(trim(v_plan.freight_forwarder_name))
    order by id
    limit 1;

    if v_forwarder_id is null then
      insert into public.freight_forwarders(
        company_name,scope,country,city,uk_address,contact_name,email,phone,website,destination_port,
        countries_covered,ports_served,services,source_customer,verification_status,partner_status,
        is_active,last_used_at,internal_notes,created_at,updated_at
      )
      values(
        v_plan.freight_forwarder_name,'Both',
        coalesce(nullif(trim(coalesce(v_plan.uk_handover_country,'')),''),'United Kingdom'),
        nullif(trim(coalesce(v_plan.uk_handover_city,'')),''),
        nullif(trim(concat_ws(', ',
          nullif(trim(coalesce(v_plan.uk_handover_address_1,'')),''),
          nullif(trim(coalesce(v_plan.uk_handover_address_2,'')),''),
          nullif(trim(coalesce(v_plan.uk_handover_city,'')),''),
          nullif(trim(coalesce(v_plan.uk_handover_county,'')),''),
          nullif(trim(coalesce(v_plan.uk_handover_postcode,'')),'')
        )),''),
        nullif(trim(coalesce(v_plan.contact_name,'')),''),
        nullif(trim(coalesce(v_plan.contact_email,'')),''),
        nullif(trim(coalesce(v_plan.contact_phone,'')),''),
        nullif(trim(coalesce(v_plan.provider_website,'')),''),
        v_handover_point,
        case when v_destination is null then '[]'::jsonb else jsonb_build_array(v_destination) end,
        case when v_handover_point is null then '[]'::jsonb else jsonb_build_array(v_handover_point) end,
        jsonb_build_array('Motorcycle Freight'),
        coalesce(v_deal.deal_number,'Deal '||v_deal.id::text),
        'Verified','Standard',true,current_date,
        'Automatically added after AnyBike approved a buyer-nominated shipper. Buyer confirmed direct contact and shipper acceptance.',
        now(),now()
      )
      returning id into v_forwarder_id;
    else
      update public.freight_forwarders f
      set verification_status='Verified',
          is_active=true,
          last_used_at=current_date,
          countries_covered=case
            when v_destination is null or coalesce(f.countries_covered,'[]'::jsonb) @> jsonb_build_array(v_destination)
              then coalesce(f.countries_covered,'[]'::jsonb)
            else coalesce(f.countries_covered,'[]'::jsonb) || jsonb_build_array(v_destination)
          end,
          ports_served=case
            when v_handover_point is null or coalesce(f.ports_served,'[]'::jsonb) @> jsonb_build_array(v_handover_point)
              then coalesce(f.ports_served,'[]'::jsonb)
            else coalesce(f.ports_served,'[]'::jsonb) || jsonb_build_array(v_handover_point)
          end,
          city=coalesce(nullif(trim(coalesce(f.city,'')),''),nullif(trim(coalesce(v_plan.uk_handover_city,'')),'')),
          uk_address=coalesce(nullif(trim(coalesce(f.uk_address,'')),''),
            nullif(trim(concat_ws(', ',
              nullif(trim(coalesce(v_plan.uk_handover_address_1,'')),''),
              nullif(trim(coalesce(v_plan.uk_handover_address_2,'')),''),
              nullif(trim(coalesce(v_plan.uk_handover_city,'')),''),
              nullif(trim(coalesce(v_plan.uk_handover_county,'')),''),
              nullif(trim(coalesce(v_plan.uk_handover_postcode,'')),'')
            )),'')
          ),
          website=coalesce(nullif(trim(coalesce(f.website,'')),''),nullif(trim(coalesce(v_plan.provider_website,'')),'')),
          updated_at=now()
      where f.id=v_forwarder_id;
    end if;
  end if;

  if p_decision='Declined by AnyBike' then
    select id into v_thread_id
    from public.message_centre_threads
    where customer_id=v_deal.customer_id and related_deal_id=v_deal.id
    order by id desc limit 1;

    v_message :=
      'Your shipping / handover option for '||coalesce(v_deal.deal_number,'your AnyBike purchase')||
      ' needs to be changed.'||E'\n\n'||
      'Reason: '||v_reason||E'\n\n'||
      'Please update your Shipping Preferences or choose another suitable UK handover / freight-forwarder option.';

    if v_thread_id is not null then
      insert into public.message_centre_messages(
        thread_id,sender_type,sender_name,sender_email,message,is_internal_note,created_at
      )
      values(v_thread_id,'AnyBike','AnyBike','admin@anybike.co.uk',v_message,false,now());

      update public.message_centre_threads
      set last_message=v_message,last_message_at=now(),last_sender='AnyBike',status='Replied',updated_at=now()
      where id=v_thread_id;
    end if;

    insert into public.customer_notifications(
      customer_id,title,message,icon,type,link,is_read,created_at
    )
    values(
      v_deal.customer_id,'Shipping option needs changing',
      coalesce(v_deal.deal_number,'Your AnyBike purchase')||' · '||v_reason,
      '🚢','shipping_details_declined',
      '/customer-dashboard.html?action=confirm-shipping&deal='||v_deal.id::text||'#shipping-preferences',
      false,now()
    );
  end if;

  return jsonb_build_object(
    'success',true,'deal_id',v_deal.id,'deal_number',v_deal.deal_number,
    'handover_plan_id',v_plan.id,'decision',p_decision,'reason',v_reason,
    'buyer_contacted_shipper',v_selection.buyer_contacted_shipper,
    'shipper_agreed_to_handle',v_selection.shipper_agreed_to_handle,
    'freight_forwarder_id',v_forwarder_id,'decided_at',v_selection.admin_decided_at
  );
end;
$function$;

create or replace function public.public_get_verified_freight_forwarders_v1()
returns table(
  id bigint,company_name text,scope text,country text,city text,uk_address text,website text,
  destination_port text,countries_covered jsonb,ports_served jsonb,services jsonb,
  partner_status text,last_used_at date
)
language sql
security definer
set search_path = ''
as $function$
  select
    f.id,f.company_name,f.scope,f.country,f.city,f.uk_address,f.website,f.destination_port,
    f.countries_covered,f.ports_served,f.services,f.partner_status,f.last_used_at
  from public.freight_forwarders f
  where f.is_active=true
    and f.verification_status='Verified'
    and f.partner_status<>'Do Not Use'
  order by case when f.partner_status='Preferred' then 0 else 1 end,f.company_name;
$function$;

revoke all on function public.public_get_verified_freight_forwarders_v1() from public;
grant execute on function public.public_get_verified_freight_forwarders_v1() to anon,authenticated;
