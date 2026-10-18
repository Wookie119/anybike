create or replace function public.admin_list_verified_trade_dealers_for_invites_v2()
returns table(dealer_id bigint,dealer_name text,contact_count bigint,invitation_count bigint,auction_opted_in boolean,bid_authorised boolean,permissions_configured boolean)
language sql security definer set search_path=public,pg_temp as $$
select d.id,d.trading_name::text,
(select count(*) from public.dealer_users u where u.dealer_organisation_id=d.id and u.active and u.verified),
(select count(*) from public.anybike_trade_underwrite_invitations i where i.dealer_organisation_id=d.id),
coalesce(d.accepts_trade_underwrites,false),
coalesce(p.can_bid_auction,true),
p.dealer_id is not null
from public.dealer_organisations d
left join public.anybike_dealer_service_permissions p on p.dealer_id=d.id
where auth.uid() is not null and public.anybike_is_admin() and d.active and d.verified
order by d.trading_name,d.id $$;
revoke all on function public.admin_list_verified_trade_dealers_for_invites_v2() from public,anon;
grant execute on function public.admin_list_verified_trade_dealers_for_invites_v2() to authenticated;