alter table public.advertising_billing_reviews
 add column if not exists billing_contact_name text,
 add column if not exists billing_address text,
 add column if not exists billing_country text,
 add column if not exists purchase_order_reference text,
 add column if not exists buyer_vat_number text;
comment on column public.advertising_billing_reviews.billing_address is 'Confirmed advertiser billing address, not inferred from the contact directory.';
