-- Snapshot bank/payment details on advertising invoices; source is existing company invoice settings.
alter table public.advertising_invoice_drafts
 add column if not exists issuer_bank_name text,
 add column if not exists issuer_bank_sort_code text,
 add column if not exists issuer_bank_account_number text,
 add column if not exists issuer_bank_iban text,
 add column if not exists issuer_bank_bic text;
CREATE OR REPLACE FUNCTION public.admin_prepare_advertising_invoice_draft_v1(p_billing_review_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
 b public.advertising_billing_reviews%rowtype;
 q public.advertising_quotations%rowtype;
 s public.anybike_company_invoice_settings%rowtype;
 t record;
 v_lines jsonb;
 v_id uuid;
begin
 if not public.anybike_is_admin() then raise exception 'Admin access required'; end if;
 select * into b from public.advertising_billing_reviews where id=p_billing_review_id for update;
 if not found then raise exception 'Billing review not found'; end if;
 if b.billing_status <> 'ready' then raise exception 'Billing details must be marked ready'; end if;
 if b.billing_contact_name is null or length(btrim(b.billing_contact_name))=0
  or b.billing_email is null or length(btrim(b.billing_email))=0
  or length(btrim(coalesce(b.billing_address,'')))<10
  or length(btrim(coalesce(b.billing_country,'')))=0 then
   raise exception 'Confirmed customer billing details are required';
 end if;
 select * into q from public.advertising_quotations where id=b.quotation_id;
 if not found or q.status<>'accepted' then raise exception 'Quotation must be accepted'; end if;
 if q.currency <> 'GBP' then raise exception 'Currency review required'; end if;
 select * into t from public.admin_advertising_quotation_totals_v1 where id=q.id;
 if t.placement_quantity<1 then raise exception 'No saved placements'; end if;
 if round(t.subtotal_gbp,2)<>round(b.subtotal_gbp,2)
   or round(t.discount_gbp,2)<>round(b.discount_gbp,2)
   or round(t.net_gbp,2)<>round(b.net_gbp,2)
   or round(t.vat_gbp,2)<>round(b.vat_gbp,2)
   or round(t.total_gbp,2)<>round(b.total_gbp,2) then
   raise exception 'Quotation totals changed; review billing before drafting';
 end if;
 select * into s from public.anybike_company_invoice_settings where id=1;
 if not found or length(btrim(s.legal_company_name))=0 or length(btrim(s.business_address))<10
   or length(btrim(s.vat_number))=0 then raise exception 'Review the company issuer and VAT settings first'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('description',description,'artwork_format',artwork_format,
   'quantity',quantity,'unit_price_gbp',unit_price_gbp,'line_total_gbp',line_total_gbp)
   order by created_at,id),'[]'::jsonb) into v_lines
 from public.advertising_quotation_items where quotation_id=q.id;
 insert into public.advertising_invoice_drafts(
  billing_review_id,quotation_id,advertiser_name,billing_contact,billing_email,billing_address,billing_country,
  buyer_vat_number,purchase_order_reference,issuer_name,issuer_trading_name,issuer_address,
  issuer_company_number,issuer_vat_number,issuer_email,issuer_bank_name,issuer_bank_sort_code,issuer_bank_account_number,issuer_bank_iban,issuer_bank_bic,payment_terms,currency,
  subtotal_gbp,discount_gbp,net_gbp,vat_gbp,gross_gbp,vat_rate_percent,lines)
 values(b.id,q.id,b.advertiser_name,b.billing_contact_name,b.billing_email,b.billing_address,b.billing_country,
  b.buyer_vat_number,b.purchase_order_reference,s.legal_company_name,s.trading_name,s.business_address,
  s.company_number,s.vat_number,s.email,s.bank_account_name,s.bank_sort_code,s.bank_account_number,s.bank_iban,s.bank_bic,'To be agreed — confirm advertising payment terms before issue','GBP',
  t.subtotal_gbp,t.discount_gbp,t.net_gbp,t.vat_gbp,t.total_gbp,q.vat_rate,v_lines)
 on conflict (quotation_id) do nothing
 returning id into v_id;
 if v_id is null then
  select id into v_id from public.advertising_invoice_drafts where quotation_id=q.id;
 end if;
 return v_id;
end $function$
;
