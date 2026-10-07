-- Restore onboarding origin/source-page visibility for all auth users,
-- including registration-only accounts without customer_profiles rows.
-- Match historical enquiries/threads by customer_id or email and ignore
-- setup-help threads so an admin reminder cannot become the customer's origin.

create or replace function public.admin_get_onboarding_origins_v1()
returns table(user_id uuid, origin_label text, origin_detail text, origin_page text)
language sql
security definer
set search_path to 'public','auth','pg_temp'
as $function$
  with users as (
    select u.id user_id, lower(u.email::text) email
    from auth.users u
  ),
  first_thread as (
    select distinct on (u.user_id)
      u.user_id,
      coalesce(
        nullif(trim(t.origin_page_type),''),
        nullif(trim(t.source_type),''),
        case
          when lower(coalesce(t.source_page,'')) like '%vmoto%' then 'VMoto'
          when lower(coalesce(t.source_page,'')) like '%underwrite%' then 'Dealer Underwrite'
          when lower(coalesce(t.source_page,'')) like '%sell%' then 'Dealer / Supplier'
          when lower(coalesce(t.source_page,'')) like '%connect%' then 'AnyBike Connect'
          else null
        end
      ) origin_label,
      nullif(trim(concat_ws(' ',
        nullif(trim(t.origin_brand),''),
        nullif(trim(t.origin_model),''),
        nullif(trim(t.bike_make),''),
        nullif(trim(t.bike_model),'')
      )),'') origin_detail,
      coalesce(
        nullif(trim(t.origin_page_title),''),
        nullif(trim(t.related_page_title),''),
        nullif(trim(t.origin_page_url),''),
        nullif(trim(t.related_page_url),''),
        nullif(trim(t.source_page),'')
      ) origin_page
    from users u
    join public.message_centre_threads t
      on t.customer_id=u.user_id
      or (t.customer_id is null and lower(coalesce(t.customer_email,''))=u.email)
    where coalesce(t.source_type,'') <> 'Onboarding'
    order by u.user_id,t.created_at asc,t.id asc
  ),
  first_enquiry as (
    select distinct on (u.user_id)
      u.user_id,
      coalesce(
        nullif(trim(e.origin_page_type),''),
        nullif(trim(e.enquiry_type),''),
        'Motorcycle enquiry'
      ) origin_label,
      nullif(trim(concat_ws(' ',
        nullif(trim(e.origin_brand),''),
        nullif(trim(e.origin_model),'')
      )),'') origin_detail,
      coalesce(
        nullif(trim(e.origin_page_title),''),
        nullif(trim(e.origin_page_url),'')
      ) origin_page
    from users u
    join public.bike_enquiries e
      on e.customer_id=u.user_id
      or (e.customer_id is null and lower(coalesce(e.customer_email,''))=u.email)
    order by u.user_id,e.created_at asc,e.id asc
  ),
  first_request as (
    select distinct on (g.customer_id)
      g.customer_id,
      nullif(trim(concat_ws(' ',
        nullif(trim(r.make),''),
        nullif(trim(r.model),''),
        nullif(trim(r.variant),'')
      )),'') request_detail
    from public.global_buyer_network g
    join public.global_buyer_request_items r on r.buyer_id=g.id
    where g.customer_id is not null
    order by g.customer_id,r.created_at asc,r.id asc
  )
  select
    u.user_id,
    coalesce(fe.origin_label,ft.origin_label,
      case when fr.request_detail is not null then 'Buyer requirement' else 'Source not recorded' end
    )::text origin_label,
    coalesce(
      nullif(trim(fe.origin_detail),''),
      nullif(trim(ft.origin_detail),''),
      nullif(trim(fr.request_detail),''),
      null
    )::text origin_detail,
    coalesce(fe.origin_page,ft.origin_page)::text origin_page
  from users u
  left join first_enquiry fe on fe.user_id=u.user_id
  left join first_thread ft on ft.user_id=u.user_id
  left join first_request fr on fr.customer_id=u.user_id;
$function$;
