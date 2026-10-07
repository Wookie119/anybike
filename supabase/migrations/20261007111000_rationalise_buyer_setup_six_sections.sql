create or replace function public.admin_get_onboarding_pipeline_v1()
returns table(
  user_id uuid,
  email text,
  email_confirmed_at timestamptz,
  auth_created_at timestamptz,
  has_profile boolean,
  full_name text,
  business_name text,
  country text,
  buyer_type text,
  is_test_account boolean,
  customer_type text,
  customer_intent text,
  route text,
  admin_notes text,
  last_reminder_at timestamptz,
  reminder_count integer,
  contact_complete boolean,
  business_complete boolean,
  preferences_complete boolean,
  buyer_export_complete boolean,
  shipping_complete boolean,
  sections_complete integer,
  onboarding_submitted_at timestamptz,
  approval_status text,
  account_status text,
  buyer_network_records bigint,
  request_count bigint,
  scan_batch_count bigint,
  deal_count bigint,
  onboarding_stage text,
  next_link text
)
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_temp'
as $function$
begin
  if not public.anybike_is_admin() then raise exception 'Admin access required'; end if;

  return query
  with x as (
    select
      u.id user_id,u.email,u.email_confirmed_at,u.created_at auth_created_at,
      (cp.id is not null) has_profile,cp.full_name,cp.business_name,cp.country,cp.buyer_type,
      coalesce(cp.is_test_account,false) is_test_account,cp.onboarding_submitted_at,
      (
        cp.id is not null and nullif(trim(coalesce(cp.full_name,'')),'') is not null and
        nullif(trim(coalesce(cp.phone,'')),'') is not null and
        nullif(trim(coalesce(cp.contact_address_line1,'')),'') is not null and
        nullif(trim(coalesce(cp.city,'')),'') is not null and
        nullif(trim(coalesce(cp.region,'')),'') is not null and
        nullif(trim(coalesce(cp.contact_postcode,'')),'') is not null and
        nullif(trim(coalesce(cp.country,'')),'') is not null
      ) contact_complete,
      (
        cp.id is not null and nullif(trim(coalesce(cp.buyer_type,'')),'') is not null and
        nullif(trim(coalesce(cp.business_name,'')),'') is not null and
        nullif(trim(coalesce(cp.business_email,'')),'') is not null and
        nullif(trim(coalesce(cp.business_phone,'')),'') is not null and
        nullif(trim(coalesce(cp.business_address_line1,'')),'') is not null and
        nullif(trim(coalesce(cp.business_city,'')),'') is not null and
        nullif(trim(coalesce(cp.business_region,'')),'') is not null and
        nullif(trim(coalesce(cp.business_postcode,'')),'') is not null and
        nullif(trim(coalesce(cp.business_country,'')),'') is not null
      ) business_complete,
      (
        cp.id is not null and
        nullif(trim(coalesce(cp.preferred_currency,'')),'') is not null and
        nullif(trim(coalesce(cp.preferred_language,'')),'') is not null
      ) preferences_complete,
      (
        cp.id is not null and
        nullif(trim(coalesce(cp.preferred_shipping_method,'')),'') is not null and
        cp.typical_bikes_per_shipment is not null
      ) buyer_core_complete,
      (
        cp.id is not null and
        nullif(trim(coalesce(cp.identity_document_path,'')),'') is not null
      ) identity_complete,
      (
        cp.id is not null and
        nullif(trim(coalesce(cp.proof_of_address_document_path,'')),'') is not null
      ) proof_complete,
      (
        cp.id is not null and
        nullif(trim(coalesce(cp.preferred_shipping_method,'')),'') is not null and
        cp.typical_bikes_per_shipment is not null and
        nullif(trim(coalesce(cp.identity_document_path,'')),'') is not null and
        nullif(trim(coalesce(cp.proof_of_address_document_path,'')),'') is not null
      ) buyer_export_complete,
      (
        cp.id is not null and (
          nullif(trim(coalesce(cp.preferred_shipping_company,'')),'') is not null or
          cp.shipping_directory_forwarder_id is not null or
          nullif(trim(coalesce(cp.shipping_address_line1,'')),'') is not null or
          nullif(trim(coalesce(cp.shipping_country,'')),'') is not null
        )
      ) shipping_complete,
      cbo.approval_status,cbo.account_status,
      coalesce(m.customer_type,cp.customer_type) effective_customer_type,
      coalesce(m.customer_intent,cp.customer_intent,'unclear') effective_customer_intent,
      coalesce(
        m.route,
        case
          when coalesce(cp.customer_intent,'unclear') in ('buy','buy_supply') then 'buyer_export'
          when cp.customer_intent in ('supply','dealer_trade_supply') then 'dealer_supplier'
          when cp.customer_intent='dealer_underwrite' then 'dealer_underwrite'
          when cp.customer_intent='vmoto_retail' then 'vmoto_retail'
          else 'needs_clarification'
        end
      ) effective_route,
      m.admin_notes,m.last_reminder_at,coalesce(m.reminder_count,0) reminder_count
    from auth.users u
    left join public.customer_profiles cp on cp.id=u.id
    left join public.customer_buyer_onboarding cbo on cbo.customer_id=u.id
    left join public.anybike_onboarding_management m on m.user_id=u.id
  ),
  y as (
    select x.*,
      (
        x.contact_complete::int +
        x.business_complete::int +
        x.buyer_core_complete::int +
        x.identity_complete::int +
        x.proof_complete::int +
        x.shipping_complete::int
      )::integer sections_complete,
      coalesce((select count(*) from public.global_buyer_network g where g.customer_id=x.user_id),0) buyer_network_records,
      coalesce((select count(*) from public.global_buyer_request_items r where r.buyer_id in (select g.id from public.global_buyer_network g where g.customer_id=x.user_id)),0) request_count,
      coalesce((select count(*) from public.used_bike_scan_batches s where s.customer_id=x.user_id),0) scan_batch_count,
      coalesce((select count(*) from public.anybike_deals d where d.customer_id=x.user_id),0) deal_count
    from x
  )
  select
    y.user_id,y.email::text,y.email_confirmed_at,y.auth_created_at,y.has_profile,
    y.full_name::text,y.business_name::text,y.country::text,y.buyer_type::text,y.is_test_account,
    y.effective_customer_type::text,y.effective_customer_intent::text,y.effective_route::text,
    y.admin_notes::text,y.last_reminder_at,y.reminder_count,
    y.contact_complete,y.business_complete,y.preferences_complete,y.buyer_export_complete,y.shipping_complete,
    y.sections_complete,y.onboarding_submitted_at,y.approval_status::text,y.account_status::text,
    y.buyer_network_records,y.request_count,y.scan_batch_count,y.deal_count,
    case
      when y.is_test_account then 'Test account'
      when y.email_confirmed_at is null then 'Email confirmation required'
      when not y.has_profile then 'Confirmed — profile recovery required'
      when nullif(trim(coalesce(y.effective_customer_type,'')),'') is null
        or coalesce(y.effective_customer_intent,'unclear')='unclear' then 'Customer type / use required'
      when y.effective_customer_intent='dealer_underwrite' then 'Dealer underwrite route'
      when y.effective_customer_intent in ('supply','dealer_trade_supply') then 'Dealer / supplier route'
      when y.effective_customer_type='uk_private' and y.effective_customer_intent='vmoto_retail' then 'UK private retail buyer'
      when y.effective_customer_type='uk_private' then 'Route clarification required'
      when y.effective_customer_intent='partnership' then 'Partner / integration route'
      when y.effective_customer_intent='freight_logistics' then 'Freight / logistics route'
      when y.effective_customer_intent='vmoto_retail' then 'VMoto retail route'
      when y.deal_count>0 then 'Active / Deal in system'
      when y.approval_status in ('Approved','Approved with Exceptions') then 'Approved Buyer'
      when y.sections_complete=6 then 'Ready for AnyBike Review'
      when not y.contact_complete then 'Contact Details required'
      when not y.business_complete then 'Business Details required'
      when not y.buyer_core_complete then 'Buyer & Export required'
      when not y.identity_complete then 'Photo ID required'
      when not y.proof_complete then 'Proof of Address required'
      when not y.shipping_complete then 'Shipping Preferences required'
      else 'Needs review'
    end::text onboarding_stage,
    case
      when not y.has_profile then null
      when nullif(trim(coalesce(y.effective_customer_type,'')),'') is null
        or coalesce(y.effective_customer_intent,'unclear')='unclear'
        then '/customer-profile.html#section-profile-update'
      when y.effective_customer_intent='dealer_underwrite' then '/dealer-underwrite.html'
      when y.effective_customer_intent in ('supply','dealer_trade_supply') then '/sell-your-motorcycle.html'
      when y.effective_customer_intent='vmoto_retail' then '/vmoto.html'
      when y.effective_customer_intent='partnership' then '/partners-integrations.html'
      when y.effective_customer_intent='freight_logistics' then '/freight-forwarders.html'
      when y.effective_customer_type='uk_private' then '/customer-dashboard.html'
      when not y.contact_complete then '/customer-profile.html#section-contact'
      when not y.business_complete then '/customer-profile.html#section-business'
      when not y.buyer_core_complete or not y.identity_complete or not y.proof_complete then '/customer-profile.html#buyer-onboarding'
      when not y.shipping_complete then '/customer-profile.html#section-shipping'
      else '/customer-dashboard.html'
    end::text next_link
  from y
  order by
    y.is_test_account asc,
    case when y.request_count>0 or y.scan_batch_count>0 then 0 else 1 end,
    y.auth_created_at desc;
end;
$function$;
