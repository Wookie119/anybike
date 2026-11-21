-- Advertising invoice email delivery audit. One deliberate delivery attempt per issued invoice.
create table if not exists public.advertising_invoice_email_deliveries (
 id uuid primary key default gen_random_uuid(),
 invoice_id uuid not null references public.advertising_issued_invoices(id) on delete restrict,
 recipient_email text not null check (length(btrim(recipient_email)) between 5 and 254),
 delivery_status text not null default 'sending' check (delivery_status in ('sending','sent','failed','uncertain')),
 provider_message_id text,
 error_text text,
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 constraint advertising_invoice_email_delivery_once unique(invoice_id)
);
create index if not exists advertising_invoice_email_deliveries_created_idx on public.advertising_invoice_email_deliveries(created_at desc);
alter table public.advertising_invoice_email_deliveries enable row level security;
revoke all on public.advertising_invoice_email_deliveries from public, anon, authenticated;
grant select, insert, update on public.advertising_invoice_email_deliveries to authenticated;
create policy advertising_invoice_email_admin_select on public.advertising_invoice_email_deliveries for select to authenticated using ((select public.anybike_is_admin()));
create policy advertising_invoice_email_admin_insert on public.advertising_invoice_email_deliveries for insert to authenticated with check ((select public.anybike_is_admin()));
create policy advertising_invoice_email_admin_update on public.advertising_invoice_email_deliveries for update to authenticated using ((select public.anybike_is_admin())) with check ((select public.anybike_is_admin()));
