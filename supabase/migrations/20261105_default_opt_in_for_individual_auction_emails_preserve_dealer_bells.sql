-- Gentle notification policy: M/W/F digest ON by default; individual auction emails OFF until opted in.
-- Existing customer preferences unchanged. In-account bells remain available regardless of email choices.
alter table public.anybike_dealer_auction_email_preferences
  alter column individual_invites_enabled set default false;
create or replace function public.anybike_trade_digest_suppress_individual_v1()
returns trigger language plpgsql security definer
set search_path to 'public','pg_temp'
as $$
begin
  return new;
end;
$$;
revoke all on function public.anybike_trade_digest_suppress_individual_v1() from public,anon,authenticated;
