-- Separate advertising billing review staging from motorcycle-deal invoices.
-- These records never issue invoices automatically.
create table if not exists public.advertising_billing_reviews (
 id uuid primary key default gen_random_uuid(),
 quotation_id uuid not null unique references public.advertising_quotations(id) on delete restrict,
 advertiser_name text not null,
 billing_email text,
 currency text not null default 'GBP' check (currency='GBP'),
 subtotal_gbp numeric(12,2) not null default 0,
 discount_gbp numeric(12,2) not null default 0,
 net_gbp numeric(12,2) not null default 0,
 vat_gbp numeric(12,2) not null default 0,
 total_gbp numeric(12,2) not null default 0,
 billing_status text not null default 'needs_review' check (billing_status in ('needs_review','ready','invoiced','cancelled')),
 notes text,
 external_invoice_reference text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.advertising_billing_reviews enable row level security;
drop policy if exists advertising_billing_admin_only on public.advertising_billing_reviews;
create policy advertising_billing_admin_only on public.advertising_billing_reviews for all to authenticated using ((select public.anybike_is_admin())) with check ((select public.anybike_is_admin()));
grant select,insert,update on public.advertising_billing_reviews to authenticated;
comment on table public.advertising_billing_reviews is 'Advertising-only invoice preparation and reconciliation. This does not issue a legal invoice or touch motorcycle deal invoices.';
