-- Numbered advertising invoices, issued only by deliberate admin RPC.
-- Existing motorcycle invoices are not used or changed.
ALTER TABLE public.advertising_invoice_drafts
 ADD COLUMN IF NOT EXISTS payment_due_on date,
 ADD COLUMN IF NOT EXISTS service_date date,
 ADD COLUMN IF NOT EXISTS vat_review_notes text,
 ADD COLUMN IF NOT EXISTS vat_review_confirmed boolean not null default false;

CREATE SEQUENCE IF NOT EXISTS public.advertising_invoice_number_seq START WITH 1 INCREMENT BY 1;
REVOKE ALL ON SEQUENCE public.advertising_invoice_number_seq FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.advertising_issued_invoices (
 id uuid primary key default gen_random_uuid(),
 draft_id uuid not null unique references public.advertising_invoice_drafts(id) on delete restrict,
 billing_review_id uuid not null unique references public.advertising_billing_reviews(id) on delete restrict,
 quotation_id uuid not null unique references public.advertising_quotations(id) on delete restrict,
 invoice_number text not null unique,
 issued_at timestamptz not null default now(),
 issued_by uuid not null,
 invoice_snapshot jsonb not null,
 created_at timestamptz not null default now()
);
ALTER TABLE public.advertising_issued_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS advertising_issued_invoices_admin_read ON public.advertising_issued_invoices;
CREATE POLICY advertising_issued_invoices_admin_read ON public.advertising_issued_invoices
 FOR SELECT TO authenticated USING ((select public.anybike_is_admin()));
GRANT SELECT ON public.advertising_issued_invoices TO authenticated;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON public.advertising_issued_invoices FROM authenticated,anon;

CREATE OR REPLACE FUNCTION public.advertising_issued_invoice_immutable_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
 raise exception 'Issued advertising invoices cannot be edited or deleted. Use a separate credit or correction document.';
end $function$
;
DROP TRIGGER IF EXISTS advertising_issued_invoice_immutable ON public.advertising_issued_invoices;
CREATE TRIGGER advertising_issued_invoice_immutable
 BEFORE UPDATE OR DELETE ON public.advertising_issued_invoices
 FOR EACH ROW EXECUTE FUNCTION public.advertising_issued_invoice_immutable_v1();

CREATE OR REPLACE FUNCTION public.admin_issue_advertising_invoice_v1(p_draft_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
 d public.advertising_invoice_drafts%rowtype;
 b public.advertising_billing_reviews%rowtype;
 q public.advertising_quotations%rowtype;
 v_existing text;
 v_ref text;
 v_now timestamptz;
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin access required'; end if;
 select * into d from public.advertising_invoice_drafts where id=p_draft_id for update;
 if not found then raise exception 'Invoice draft not found'; end if;
 select invoice_number into v_existing from public.advertising_issued_invoices where draft_id=d.id;
 if found then return v_existing; end if;
 if d.state<>'draft' then raise exception 'Draft has been voided'; end if;
 select * into b from public.advertising_billing_reviews where id=d.billing_review_id for update;
 if not found or b.billing_status<>'ready' then raise exception 'Billing review must be ready'; end if;
 select * into q from public.advertising_quotations where id=d.quotation_id;
 if not found or q.status<>'accepted' then raise exception 'Quotation must be accepted'; end if;
 if d.currency<>'GBP' or d.billing_country !~* '^(united kingdom|uk|great britain|england|scotland|wales|northern ireland)$'
   then raise exception 'International advertising invoices need tax review and a separate issuing workflow'; end if;
 if length(btrim(coalesce(d.billing_contact,'')))<2
  or length(btrim(coalesce(d.billing_email,'')))<5
  or length(btrim(coalesce(d.billing_address,'')))<10
  or length(btrim(coalesce(d.issuer_name,'')))<3
  or length(btrim(coalesce(d.issuer_address,'')))<10
  or length(btrim(coalesce(d.issuer_vat_number,'')))<5 then
    raise exception 'Invoice parties or issuer VAT details are incomplete'; end if;
 if d.vat_review_confirmed is not true or length(btrim(coalesce(d.vat_review_notes,'')))<10 then
    raise exception 'Record the manual VAT treatment review and approval before issuing'; end if;
 if length(btrim(coalesce(d.payment_terms,'')))<8
   or d.payment_terms ilike '%to be agreed%'
   or d.payment_due_on is null or d.payment_due_on<current_date
   or d.service_date is null then
    raise exception 'Enter approved advertising payment terms, future due date and service date'; end if;
 if d.subtotal_gbp<0 or d.discount_gbp<0 or d.net_gbp<0 or d.vat_gbp<0 or d.gross_gbp<=0
    or round(d.subtotal_gbp-d.discount_gbp,2)<>d.net_gbp
    or round(d.net_gbp+d.vat_gbp,2)<>d.gross_gbp
    or round(d.net_gbp*d.vat_rate_percent/100,2)<>d.vat_gbp then
     raise exception 'Invoice amounts or VAT are inconsistent'; end if;
 if jsonb_array_length(d.lines)<1 then raise exception 'Invoice requires at least one advertising placement'; end if;
 if d.net_gbp<>b.net_gbp or d.vat_gbp<>b.vat_gbp or d.gross_gbp<>b.total_gbp then
    raise exception 'Billing and invoice totals no longer agree'; end if;
 v_now=now();
 v_ref='AB-ADV-'||lpad(nextval('public.advertising_invoice_number_seq')::text,6,'0');
 insert into public.advertising_issued_invoices
  (draft_id,billing_review_id,quotation_id,invoice_number,issued_at,issued_by,invoice_snapshot)
 values (d.id,d.billing_review_id,d.quotation_id,v_ref,v_now,auth.uid(),to_jsonb(d)||
  jsonb_build_object('invoice_number',v_ref,'issued_at',v_now,'issued_by',auth.uid()));
 update public.advertising_billing_reviews set billing_status='invoiced',
  external_invoice_reference=v_ref,updated_at=v_now where id=b.id and billing_status='ready';
 return v_ref;
end $function$
;
REVOKE ALL ON FUNCTION public.admin_issue_advertising_invoice_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_issue_advertising_invoice_v1(uuid) TO authenticated;
