-- Advertising payment records, separate from motorcycle sales billing.
-- Deployed to AnyBike Supabase on 21 November 2026.
create table if not exists public.advertising_invoice_payments (
 id uuid primary key default gen_random_uuid(),
 invoice_id uuid not null references public.advertising_issued_invoices(id) on delete restrict,
 amount_gbp numeric(12,2) not null check(amount_gbp>0),
 paid_on date not null,
 payment_method text not null check(payment_method in ('bank_transfer','card','cheque','cash','other')),
 payment_reference text not null check(length(btrim(payment_reference))>=3),
 notes text,
 recorded_by uuid not null default auth.uid(),
 recorded_at timestamptz not null default now(),
 constraint advertising_invoice_payments_reference_unique unique(invoice_id,payment_reference)
);
create index if not exists advertising_invoice_payments_invoice_idx on public.advertising_invoice_payments(invoice_id);
alter table public.advertising_invoice_payments enable row level security;
revoke all on public.advertising_invoice_payments from public,anon,authenticated;
grant select,insert on public.advertising_invoice_payments to authenticated;
create policy advertising_invoice_payments_admin_select on public.advertising_invoice_payments
 for select to authenticated using ((select public.anybike_is_admin()));
create policy advertising_invoice_payments_admin_insert on public.advertising_invoice_payments
 for insert to authenticated with check ((select public.anybike_is_admin()) and recorded_by=auth.uid());

create or replace function public.advertising_payment_limit_v1() returns trigger
language plpgsql set search_path=public as $$
declare v_total numeric(12,2); v_received numeric(12,2);
begin
 if not public.anybike_is_admin() or auth.uid() is null then raise exception 'Admin access required'; end if;
 select (invoice_snapshot->>'gross_gbp')::numeric(12,2) into v_total
 from public.advertising_issued_invoices where id=new.invoice_id for update;
 if v_total is null or v_total<=0 then raise exception 'Issued invoice amount unavailable'; end if;
 select coalesce(sum(amount_gbp),0) into v_received
 from public.advertising_invoice_payments where invoice_id=new.invoice_id;
 if v_received+new.amount_gbp>v_total then raise exception 'Payment exceeds outstanding invoice balance'; end if;
 return new;
end $$;
drop trigger if exists advertising_invoice_payments_limit on public.advertising_invoice_payments;
create trigger advertising_invoice_payments_limit before insert on public.advertising_invoice_payments
 for each row execute function public.advertising_payment_limit_v1();

create or replace function public.advertising_payment_immutable_v1() returns trigger
language plpgsql set search_path=public as $$
begin
 raise exception 'Advertising payment entries are permanent. Record corrections through an approved adjustment workflow';
end $$;
drop trigger if exists advertising_invoice_payments_immutable on public.advertising_invoice_payments;
create trigger advertising_invoice_payments_immutable before update or delete on public.advertising_invoice_payments
 for each row execute function public.advertising_payment_immutable_v1();
