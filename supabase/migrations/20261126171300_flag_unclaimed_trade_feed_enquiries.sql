create or replace function public.admin_unclaimed_trade_feed_enquiries_v1()
returns table(thread_id bigint, subject text, dealership text)
language sql stable security definer set search_path='' as $$
 select t.id,t.subject,o.trading_name
 from public.message_centre_threads t
 join public.dealer_organisations o on o.id=t.trade_feed_dealer_organisation_id
 where auth.uid() is not null and public.anybike_is_admin()
  and t.trade_feed_stock_item_id is not null
  and lower(coalesce(t.status,'')) not in ('closed','resolved','archived')
  and not exists (
   select 1 from public.dealer_users u
   join public.anybike_dealer_access a on a.user_id=u.user_id and a.level>=2
   where u.dealer_organisation_id=o.id and u.active and u.verified and o.active and o.verified
    and lower(btrim(o.country)) in ('united kingdom','uk','u.k.','gb','great britain','england','scotland','wales','northern ireland')
  )
 order by t.last_message_at desc nulls last,t.id desc limit 100;
$$;
revoke all on function public.admin_unclaimed_trade_feed_enquiries_v1() from public,anon,authenticated;
grant execute on function public.admin_unclaimed_trade_feed_enquiries_v1() to authenticated;
