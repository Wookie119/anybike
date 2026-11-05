-- Individual auction emails are opt-in. This creates a private dispatch outbox.
-- Existing invitations are intentionally NOT backfilled.
create table if not exists public.anybike_individual_auction_email_outbox (
 invitation_id bigint not null references public.anybike_trade_underwrite_invitations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 dealer_organisation_id bigint not null references public.dealer_organisations(id),
 status text not null default 'queued' check (status in ('queued','claimed','sent','failed','skipped')),
 email_id text, error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(invitation_id,user_id)
);
alter table public.anybike_individual_auction_email_outbox enable row level security;
revoke all on table public.anybike_individual_auction_email_outbox from anon,authenticated;

create or replace function public.anybike_queue_opted_in_individual_invites_v1()
returns trigger language plpgsql security definer
set search_path to 'public','pg_temp'
as $$
begin
 insert into public.anybike_individual_auction_email_outbox(invitation_id,user_id,dealer_organisation_id)
 select new.id,du.user_id,new.dealer_organisation_id
 from public.dealer_users du
 join public.anybike_dealer_access a on a.user_id=du.user_id
 join public.anybike_dealer_auction_email_preferences pref on pref.user_id=du.user_id
 join public.dealer_organisations org on org.id=du.dealer_organisation_id
 join auth.users u on u.id=du.user_id
 join public.anybike_trade_underwrite_opportunities o on o.id=new.opportunity_id
 join public.seller_motorcycle_submissions s on s.id=o.submission_id
 where du.dealer_organisation_id=new.dealer_organisation_id
   and du.active=true and du.verified=true
   and org.active=true and org.verified=true and org.accepts_trade_underwrites=true
   and a.level=2 and a.approved_at is not null and a.can_view_underwrites=true
   and pref.individual_invites_enabled=true
   and u.email_confirmed_at is not null
   and o.status='live' and o.closes_at>now()
   and du.user_id is distinct from s.submitted_by
   and org.id is distinct from s.dealer_organisation_id
 on conflict do nothing;
 return new;
end;
$$;
revoke all on function public.anybike_queue_opted_in_individual_invites_v1() from public,anon,authenticated;
drop trigger if exists trg_anybike_queue_opted_in_individual_invites on public.anybike_trade_underwrite_invitations;
create trigger trg_anybike_queue_opted_in_individual_invites
after insert on public.anybike_trade_underwrite_invitations
for each row execute function public.anybike_queue_opted_in_individual_invites_v1();

-- Uses the existing server-side Vault credential, never embedded in browser code.
select cron.schedule(
 'anybike-opted-in-individual-auction-emails-5min',
 '*/5 * * * *',
 $cmd$select net.http_post(
  url := 'https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/anybike-individual-auction-email',
  headers := jsonb_build_object(
   'Content-Type','application/json',
   'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='anybike_edge_secret_key_v2'),
   'apikey',(select decrypted_secret from vault.decrypted_secrets where name='anybike_edge_secret_key_v2'),
   'x-anybike-cron-key',(select decrypted_secret from vault.decrypted_secrets where name='anybike_edge_secret_key_v2')
  ),body := '{}'::jsonb
 );$cmd$
);