-- Advertising invoice drafts are separate from motorcycle sales invoicing.
CREATE TABLE IF NOT EXISTS public.advertising_invoice_drafts (
id uuid primary key default gen_random_uuid(),
billing_review_id uuid not null unique references public.advertising_billing_reviews(id) on delete restrict,
quotation_id uuid not null unique references public.advertising_quotations(id) on delete restrict,
state text not null default 'draft' check (state in ('draft','void')),
advertiser_name text not null,billing_contact text not null,billing_email text not null,
billing_address text not null,billing_country text not null,buyer_vat_number text,
purchase_order_reference text,issuer_name text not null,issuer_trading_name text not null,
issuer_address text not null,issuer_company_number text,issuer_vat_number text,
issuer_email text,payment_terms text not null default '',currency text not null default 'GBP' check(currency='GBP'),
subtotal_gbp numeric(12,2) not null,discount_gbp numeric(12,2) not null,
net_gbp numeric(12,2) not null,vat_gbp numeric(12,2) not null,gross_gbp numeric(12,2) not null,
vat_rate_percent numeric(6,2) not null,lines jsonb not null default '[]'::jsonb,
notes text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
constraint advertising_invoice_draft_amounts_ok check (subtotal_gbp>=0 and discount_gbp>=0 and net_gbp>=0 and vat_gbp>=0 and gross_gbp>=0 and round(net_gbp+vat_gbp,2)=gross_gbp)
);
ALTER TABLE public.advertising_invoice_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS advertising_invoice_drafts_admin ON public.advertising_invoice_drafts;
CREATE POLICY advertising_invoice_drafts_admin ON public.advertising_invoice_drafts FOR ALL TO authenticated USING ((select public.anybike_is_admin())) WITH CHECK ((select public.anybike_is_admin()));
GRANT SELECT,INSERT,UPDATE ON public.advertising_invoice_drafts TO authenticated;
COMMENT ON TABLE public.advertising_invoice_drafts IS 'Unissued advertising invoice snapshots, separate from motorcycle sales invoicing.';
CREATE POLICY anybike_company_invoice_settings_admin_read_for_advertising ON public.anybike_company_invoice_settings FOR SELECT TO authenticated USING ((select public.anybike_is_admin()));
GRANT SELECT ON public.anybike_company_invoice_settings TO authenticated;

undefined
REVOKE ALL ON FUNCTION public.admin_prepare_advertising_invoice_draft_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_prepare_advertising_invoice_draft_v1(uuid) TO authenticated;
