create or replace function public.admin_save_customer_shipping_review_v1(
  p_customer_id uuid,
  p_company text,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_address_1 text,
  p_address_2 text,
  p_city text,
  p_region text,
  p_postcode text,
  p_country text,
  p_collection_point text,
  p_reject boolean default false,
  p_review_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_plan_id bigint;
begin
  if not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_reject then
    insert into public.customer_buyer_onboarding(
      customer_id,shipper_status,internal_notes,last_reviewed_at,last_reviewed_by,updated_at
    )
    values(
      p_customer_id,'Review Required',nullif(trim(coalesce(p_review_note,'')),''),
      now(),v_uid,now()
    )
    on conflict (customer_id) do update
    set shipper_status='Review Required',
        internal_notes=case
          when nullif(trim(coalesce(p_review_note,'')),'') is not null then p_review_note
          else customer_buyer_onboarding.internal_notes
        end,
        last_reviewed_at=now(),
        last_reviewed_by=v_uid,
        updated_at=now();

    return jsonb_build_object('success',true,'status','Review Required');
  end if;

  if nullif(trim(coalesce(p_company,'')),'') is null
     or nullif(trim(coalesce(p_address_1,'')),'') is null
     or nullif(trim(coalesce(p_city,'')),'') is null
     or nullif(trim(coalesce(p_postcode,'')),'') is null then
    raise exception 'Shipping company, address, city and postcode are required';
  end if;

  update public.customer_profiles
  set preferred_shipping_company=nullif(trim(p_company),''),
      shipping_contact_name=nullif(trim(p_contact_name),''),
      shipping_contact_email=nullif(trim(p_contact_email),''),
      shipping_contact_phone=nullif(trim(p_contact_phone),''),
      shipping_address_line1=nullif(trim(p_address_1),''),
      shipping_address_line2=nullif(trim(p_address_2),''),
      shipping_city=nullif(trim(p_city),''),
      shipping_region=nullif(trim(p_region),''),
      shipping_postcode=nullif(trim(p_postcode),''),
      shipping_country=coalesce(nullif(trim(p_country),''),'United Kingdom'),
      preferred_uk_collection_point=nullif(trim(p_collection_point),''),
      updated_at=now()
  where id=p_customer_id;

  select id into v_plan_id
  from public.customer_handover_plans
  where customer_id=p_customer_id
    and plan_name='My Profile shipping preference'
  order by id
  limit 1;

  if v_plan_id is null then
    insert into public.customer_handover_plans(
      customer_id,plan_name,uk_handover_point,freight_forwarder_name,
      contact_name,contact_phone,contact_email,shipping_company_name,
      shipping_company_contact_name,shipping_company_contact_phone,
      shipping_company_contact_email,uk_handover_address_1,
      uk_handover_address_2,uk_handover_city,uk_handover_county,
      uk_handover_postcode,uk_handover_country,is_default,is_active
    )
    values(
      p_customer_id,'My Profile shipping preference',nullif(trim(p_collection_point),''),
      nullif(trim(p_company),''),nullif(trim(p_contact_name),''),nullif(trim(p_contact_phone),''),
      nullif(trim(p_contact_email),''),nullif(trim(p_company),''),nullif(trim(p_contact_name),''),
      nullif(trim(p_contact_phone),''),nullif(trim(p_contact_email),''),nullif(trim(p_address_1),''),
      nullif(trim(p_address_2),''),nullif(trim(p_city),''),nullif(trim(p_region),''),
      nullif(trim(p_postcode),''),coalesce(nullif(trim(p_country),''),'United Kingdom'),true,true
    );
  else
    update public.customer_handover_plans
    set uk_handover_point=nullif(trim(p_collection_point),''),
        freight_forwarder_name=nullif(trim(p_company),''),
        contact_name=nullif(trim(p_contact_name),''),
        contact_phone=nullif(trim(p_contact_phone),''),
        contact_email=nullif(trim(p_contact_email),''),
        shipping_company_name=nullif(trim(p_company),''),
        shipping_company_contact_name=nullif(trim(p_contact_name),''),
        shipping_company_contact_phone=nullif(trim(p_contact_phone),''),
        shipping_company_contact_email=nullif(trim(p_contact_email),''),
        uk_handover_address_1=nullif(trim(p_address_1),''),
        uk_handover_address_2=nullif(trim(p_address_2),''),
        uk_handover_city=nullif(trim(p_city),''),
        uk_handover_county=nullif(trim(p_region),''),
        uk_handover_postcode=nullif(trim(p_postcode),''),
        uk_handover_country=coalesce(nullif(trim(p_country),''),'United Kingdom'),
        is_default=true,
        is_active=true,
        updated_at=now()
    where id=v_plan_id;
  end if;

  insert into public.customer_buyer_onboarding(
    customer_id,shipper_status,last_reviewed_at,last_reviewed_by,updated_at
  )
  values(p_customer_id,'Verified',now(),v_uid,now())
  on conflict (customer_id) do update
  set shipper_status='Verified',
      last_reviewed_at=now(),
      last_reviewed_by=v_uid,
      updated_at=now();

  return jsonb_build_object('success',true,'status','Verified');
end;
$function$;

revoke all on function public.admin_save_customer_shipping_review_v1(uuid,text,text,text,text,text,text,text,text,text,text,text,boolean,text) from public;
revoke all on function public.admin_save_customer_shipping_review_v1(uuid,text,text,text,text,text,text,text,text,text,text,text,boolean,text) from anon;
grant execute on function public.admin_save_customer_shipping_review_v1(uuid,text,text,text,text,text,text,text,text,text,text,text,boolean,text) to authenticated;
