alter table public.advertising_billing_reviews
 add constraint advertising_billing_ready_confirmed_details_check
 check (
  billing_status not in ('ready','invoiced')
  or (
   nullif(btrim(coalesce(billing_contact_name,'')),'') is not null
   and nullif(btrim(coalesce(billing_email,'')),'') is not null
   and length(btrim(coalesce(billing_address,'')))>=10
   and nullif(btrim(coalesce(billing_country,'')),'') is not null
  )
 );
