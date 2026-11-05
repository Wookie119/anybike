-- Per-dealer independent digest and individual auction invitation preferences.
alter table public.anybike_dealer_auction_email_preferences add column if not exists digest_enabled boolean not null default true;
alter table public.anybike_dealer_auction_email_preferences add column if not exists individual_invites_enabled boolean not null default true;
update public.anybike_dealer_auction_email_preferences set digest_enabled=case when frequency in ('off','outbid') then false else true end, individual_invites_enabled=case when frequency='off' then false else true end where frequency in ('off','outbid');
CREATE OR REPLACE FUNCTION public.anybike_trade_digest_suppress_individual_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
 if new.type in ('trade_underwrite_invitation','trade_underwrite_reopened','trade_underwrite') then
   if exists (
     select 1 from public.anybike_dealer_auction_email_preferences p
     where p.user_id=new.customer_id and p.individual_invites_enabled=false
   ) then return null; end if;
 elsif new.type='trade_daily_digest' then
   if exists (
     select 1 from public.anybike_dealer_auction_email_preferences p
     where p.user_id=new.customer_id and p.digest_enabled=false
   ) then return null; end if;
 end if;
 return new;
end;
$function$
;
revoke all on function public.anybike_trade_digest_suppress_individual_v1() from public,anon,authenticated;
