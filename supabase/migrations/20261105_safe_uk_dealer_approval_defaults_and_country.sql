-- UK dealer approval: standard email defaults and UK organisation geography.
-- Existing saved preferences are never overwritten.
create or replace function public.anybike_sync_approved_uk_dealer_organisation()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp'
as $fn$
declare p record;v_org bigint;
begin
 if new.level<>2 or new.approved_at is null then return new;end if;
 select id,email,full_name,business_name,phone,customer_type,country into p
 from public.customer_profiles where id=new.user_id;
 if not found or p.customer_type not in ('uk_dealer','uk_distributor') then return new;end if;

 insert into public.anybike_dealer_auction_email_preferences
 (user_id,digest_enabled,individual_invites_enabled)
 values(new.user_id,true,false)
 on conflict(user_id) do nothing;

 if not new.can_offer_underwrites then return new;end if;
 select dealer_organisation_id into v_org from public.dealer_users
 where user_id=new.user_id order by verified desc,active desc limit 1;
 if v_org is null then
   insert into public.dealer_organisations
   (trading_name,legal_name,email,telephone,country,active,verified,accepts_trade_underwrites,notes)
   values (
   coalesce(nullif(trim(p.business_name),''),nullif(trim(p.full_name),''),'UK Dealer'),
   nullif(trim(p.business_name),''),p.email,p.phone,'United Kingdom',
   true,true,true,'Created from AnyBike administrator UK dealer approval')
   returning id into v_org;
   insert into public.dealer_users(dealer_organisation_id,user_id,role,active,verified)
   values(v_org,new.user_id,'dealer_admin',true,true);
 end if;
 return new;
end $fn$;