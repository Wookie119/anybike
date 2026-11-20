-- One protected email attempt per quotation: record provider acceptance and prevent accidental duplicates.
create table if not exists public.advertising_quotation_email_deliveries (
 id uuid primary key default gen_random_uuid(),
 quotation_id uuid not null references public.advertising_quotations(id) on delete restrict,
 recipient_email text not null,
 delivery_status text not null default 'sending' check(delivery_status in ('sending','sent','failed','uncertain')),
 provider_message_id text,
 attempted_at timestamptz not null default now(),
 completed_at timestamptz,
 error_text text,
 initiated_by uuid default auth.uid()
);
create unique index if not exists advertising_quotation_one_send_attempt on public.advertising_quotation_email_deliveries(quotation_id);
alter table public.advertising_quotation_email_deliveries enable row level security;
drop policy if exists advertising_quotation_email_admin on public.advertising_quotation_email_deliveries;
create policy advertising_quotation_email_admin on public.advertising_quotation_email_deliveries for all to authenticated using ((select public.anybike_is_admin())) with check ((select public.anybike_is_admin()));
grant select,insert,update on public.advertising_quotation_email_deliveries to authenticated;
comment on table public.advertising_quotation_email_deliveries is 'One guarded send attempt per quotation. Uncertain delivery must be reconciled before any manual resend.';
