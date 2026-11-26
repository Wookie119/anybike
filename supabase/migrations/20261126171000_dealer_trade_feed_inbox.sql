
create or replace function anybike_private.can_read_trade_feed_enquiries(p_organisation_id bigint)
returns boolean language sql stable set search_path='' as $$
 select exists (
  select 1 from public.dealer_users u
  join public.dealer_organisations o on o.id=u.dealer_organisation_id
  join public.anybike_dealer_access a on a.user_id=u.user_id
  where u.user_id=auth.uid() and u.dealer_organisation_id=p_organisation_id
    and u.active and u.verified and o.active and o.verified and a.level>=2
    and lower(btrim(o.country)) in ('united kingdom','uk','u.k.','gb','great britain','england','scotland','wales','northern ireland')
 );
$$;
revoke all on function anybike_private.can_read_trade_feed_enquiries(bigint) from public,anon,authenticated;

create or replace function public.dealer_trade_feed_inbox_v1(p_thread_id bigint default null)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'enabled',exists(select 1 from public.dealer_users u where u.user_id=auth.uid()
    and anybike_private.can_read_trade_feed_enquiries(u.dealer_organisation_id)),
  'threads',coalesce((select jsonb_agg(to_jsonb(t) order by t.last_message_at desc nulls last,t.id desc)
    from (
      select t.id,t.subject,t.status,t.last_message_at,t.bike_make,t.bike_model,
       case when p_thread_id is not null then (
        select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at,m.id),'[]'::jsonb)
        from (select m.id,m.created_at,m.sender_type,m.message
              from public.message_centre_messages m
              where m.thread_id=t.id and m.is_internal_note is not true
              order by m.id desc limit 200) m
       ) end as messages
      from public.message_centre_threads t
      where t.trade_feed_stock_item_id is not null and t.trade_feed_dealer_organisation_id is not null
       and (p_thread_id is null or p_thread_id=t.id)
       and anybike_private.can_read_trade_feed_enquiries(t.trade_feed_dealer_organisation_id)
      order by t.last_message_at desc nulls last,t.id desc limit 100
    ) t),'[]'::jsonb)
 );
$$;

create or replace function public.dealer_reply_to_trade_feed_enquiry_v1(p_thread_id bigint,p_message text)
returns void language plpgsql security definer set search_path='' as $$
declare v_dealer text; v_message text:=btrim(p_message);
begin
 if v_message is null or length(v_message) not between 1 and 4000 then
  raise exception 'Enter a reply of up to 4,000 characters' using errcode='22023';
 end if;
 select o.trading_name into v_dealer
 from public.message_centre_threads t
 join public.dealer_organisations o on o.id=t.trade_feed_dealer_organisation_id
 where t.id=p_thread_id and t.trade_feed_stock_item_id is not null
   and anybike_private.can_read_trade_feed_enquiries(o.id)
 for update of t;
 if not found then raise exception 'Enquiry unavailable' using errcode='42501'; end if;
 insert into public.message_centre_messages(thread_id,sender_type,sender_name,message,is_internal_note)
 values(p_thread_id,'dealer',v_dealer,v_message,false);
 update public.message_centre_threads
 set last_message=v_message,last_message_at=now(),last_sender='dealer',updated_at=now()
 where id=p_thread_id;
end;
$$;

revoke all on function public.dealer_trade_feed_inbox_v1(bigint) from public,anon,authenticated;
revoke all on function public.dealer_reply_to_trade_feed_enquiry_v1(bigint,text) from public,anon,authenticated;
grant execute on function public.dealer_trade_feed_inbox_v1(bigint) to authenticated;
grant execute on function public.dealer_reply_to_trade_feed_enquiry_v1(bigint,text) to authenticated;
CREATE OR REPLACE FUNCTION public.dealer_get_my_stock()
 RETURNS TABLE(dealer_stock_id bigint, registration text, make text, model text, variant text, year integer, colour text, current_mileage integer, current_asking_price_gbp numeric, source_count bigint, confidential_bottom_line_gbp numeric, bottom_line_vat_treatment text, bottom_line_price_includes_vat boolean, bottom_line_effective_from date, stocking_plan_call_off_date date, opportunity_reason text, opportunity_notes text, anybike_may_make_offers boolean, bottom_line_active boolean, opportunity_status text, days_to_call_off integer, vat_confirmation_required boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare

    v_dealer_id bigint;

begin

    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;


    v_dealer_id :=
        public.anybike_user_dealer_organisation_id();


    if v_dealer_id is null then
        raise exception 'No verified dealership is linked to this account';
    end if;


    return query

    select

        ds.id,

        m.registration,

        m.make,

        m.model,

        m.variant,

        m.year,

        m.colour,

        coalesce(retail.mileage,ds.current_mileage),

        coalesce(retail.price_gbp,ds.current_asking_price_gbp),

        (
            select count(*)
            from public.stock_source_links sl
            where sl.dealer_stock_master_id = ds.id
        )::bigint,

        p.confidential_bottom_line_gbp,

        p.bottom_line_vat_treatment,

        p.bottom_line_price_includes_vat,

        p.bottom_line_effective_from,

        p.stocking_plan_call_off_date,

        p.opportunity_reason,

        p.opportunity_notes,

        coalesce(
            p.anybike_may_make_offers,
            true
        ),

        case
            when p.confidential_bottom_line_gbp is null
                then false

            when p.bottom_line_effective_from is not null
             and p.bottom_line_effective_from > current_date
                then false

            else true
        end,

        case

            when p.confidential_bottom_line_gbp is null
                then 'no_bottom_line'

            when p.bottom_line_effective_from is not null
             and p.bottom_line_effective_from > current_date
                then 'scheduled'

            when p.stocking_plan_call_off_date is not null
             and p.stocking_plan_call_off_date < current_date
                then 'call_off_overdue'

            when p.stocking_plan_call_off_date = current_date
                then 'call_off_today'

            else 'active'

        end,

        case
            when p.stocking_plan_call_off_date is null
                then null
            else
                (
                    p.stocking_plan_call_off_date
                    -
                    current_date
                )::integer
        end,

        case

            when p.confidential_bottom_line_gbp is null
                then false

            when p.bottom_line_vat_treatment is null
              or p.bottom_line_vat_treatment = 'unknown'
                then true

            when p.bottom_line_vat_treatment = 'full_vat'
             and p.bottom_line_price_includes_vat is null
                then true

            else false

        end

    from public.dealer_stock_master ds

    join public.canonical_motorcycles m
      on m.id = ds.canonical_motorcycle_id

    left join lateral (
      select listing.mileage,listing.price_gbp
      from anybike_private.uk_trade_feed_listings_v1 listing
      where listing.stock_master_id=ds.id and listing.dealer_organisation_id=v_dealer_id
      order by listing.last_seen_at desc,listing.item_id
      limit 1
    ) retail on true

    left join public.dealer_stock_preferences p
      on p.dealer_stock_master_id = ds.id

    where ds.dealer_organisation_id =
          v_dealer_id

    order by
        m.make,
        m.model,
        m.registration;

end;
$function$;
