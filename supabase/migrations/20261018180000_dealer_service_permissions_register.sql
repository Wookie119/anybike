create table if not exists public.anybike_dealer_service_permissions (
 dealer_id bigint primary key references public.dealer_organisations(id) on delete cascade,
 can_buy boolean not null default false,
 can_sell boolean not null default false,
 can_trade_underwrite boolean not null default false,
 can_bid_auction boolean not null default false,
 can_supply_international_vq boolean not null default false,
 updated_at timestamptz not null default now(),
 updated_by uuid
);
alter table public.anybike_dealer_service_permissions enable row level security;
revoke all on public.anybike_dealer_service_permissions from anon,authenticated;
create or replace function public.admin_list_dealer_service_permissions_v1()
returns table (dealer_id bigint,dealer_name text,active boolean,verified boolean,
 can_buy boolean,can_sell boolean,can_trade_underwrite boolean,can_bid_auction boolean,
 can_supply_international_vq boolean,configured boolean)
language sql security definer set search_path=public,pg_temp as $$
 select d.id,d.trading_name::text,d.active,d.verified,
 coalesce(p.can_buy,false),coalesce(p.can_sell,false),coalesce(p.can_trade_underwrite,false),
 coalesce(p.can_bid_auction,false),coalesce(p.can_supply_international_vq,false),p.dealer_id is not null
 from public.dealer_organisations d left join public.anybike_dealer_service_permissions p on p.dealer_id=d.id
 where auth.uid() is not null and public.anybike_is_admin()
 order by d.trading_name,d.id
$$;
create or replace function public.admin_set_dealer_service_permissions_v1(
 p_dealer_id bigint,p_buy boolean,p_sell boolean,p_trade boolean,p_bid boolean,p_international_vq boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d record;
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin permission required';end if;
 select id,verified,active into d from public.dealer_organisations where id=p_dealer_id for update;
 if not found then raise exception 'Dealership not found';end if;
 insert into public.anybike_dealer_service_permissions(dealer_id,can_buy,can_sell,can_trade_underwrite,can_bid_auction,can_supply_international_vq,updated_by)
 values(p_dealer_id,p_buy,p_sell,p_trade,p_bid,p_international_vq,auth.uid())
 on conflict(dealer_id) do update set can_buy=excluded.can_buy,can_sell=excluded.can_sell,can_trade_underwrite=excluded.can_trade_underwrite,can_bid_auction=excluded.can_bid_auction,can_supply_international_vq=excluded.can_supply_international_vq,updated_at=now(),updated_by=auth.uid();
 return jsonb_build_object('saved',true,'dealer_id',p_dealer_id);
end $$;
revoke all on function public.admin_list_dealer_service_permissions_v1() from public,anon;
revoke all on function public.admin_set_dealer_service_permissions_v1(bigint,boolean,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.admin_list_dealer_service_permissions_v1() to authenticated;
grant execute on function public.admin_set_dealer_service_permissions_v1(bigint,boolean,boolean,boolean,boolean,boolean) to authenticated;