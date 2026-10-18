create or replace function public.anybike_reject_self_underwrite_invitation_v1()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner bigint;v_can_bid boolean;
begin
 select s.dealer_organisation_id into v_owner
 from public.anybike_trade_underwrite_opportunities o
 join public.seller_motorcycle_submissions s on s.id=o.submission_id
 where o.id=new.opportunity_id;
 if v_owner is not null and v_owner=new.dealer_organisation_id then
   raise exception 'The submitting dealership cannot be invited to its own motorcycle';
 end if;
 select p.can_bid_auction into v_can_bid from public.anybike_dealer_service_permissions p where p.dealer_id=new.dealer_organisation_id;
 if v_can_bid is false then
   raise exception 'Auction bidding is not authorised for this dealership';
 end if;
 return new;
end $$;