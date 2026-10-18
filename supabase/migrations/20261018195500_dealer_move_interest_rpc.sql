create or replace function public.admin_list_dealer_service_permissions_v2()
returns table (dealer_id bigint,dealer_name text,active boolean,verified boolean,can_buy boolean,can_sell boolean,can_trade_underwrite boolean,can_bid_auction boolean,can_supply_international_vq boolean,move_delivery_interest boolean,configured boolean)
language sql security definer set search_path=public,pg_temp as $$
select d.id,d.trading_name::text,d.active,d.verified,coalesce(p.can_buy,false),coalesce(p.can_sell,false),coalesce(p.can_trade_underwrite,false),coalesce(p.can_bid_auction,false),coalesce(p.can_supply_international_vq,false),coalesce(p.move_delivery_interest,false),p.dealer_id is not null
from public.dealer_organisations d left join public.anybike_dealer_service_permissions p on p.dealer_id=d.id
where auth.uid() is not null and public.anybike_is_admin() order by d.trading_name,d.id $$;
create or replace function public.admin_set_dealer_service_permissions_v2(p_dealer_id bigint,p_buy boolean,p_sell boolean,p_trade boolean,p_bid boolean,p_international_vq boolean,p_move_interest boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_result jsonb;
begin
v_result:=public.admin_set_dealer_service_permissions_v1(p_dealer_id,p_buy,p_sell,p_trade,p_bid,p_international_vq);
update public.anybike_dealer_service_permissions set move_delivery_interest=p_move_interest,updated_at=now(),updated_by=auth.uid() where dealer_id=p_dealer_id;
return v_result;
end $$;
revoke all on function public.admin_list_dealer_service_permissions_v2() from public,anon;
revoke all on function public.admin_set_dealer_service_permissions_v2(bigint,boolean,boolean,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.admin_list_dealer_service_permissions_v2() to authenticated;
grant execute on function public.admin_set_dealer_service_permissions_v2(bigint,boolean,boolean,boolean,boolean,boolean,boolean) to authenticated;