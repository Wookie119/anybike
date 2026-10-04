-- Central reusable freight-forwarder directory for buyer profile prefilling.
alter table public.freight_forwarders
  add column if not exists uk_address_line1 text,
  add column if not exists uk_address_line2 text,
  add column if not exists uk_region text,
  add column if not exists uk_postcode text,
  add column if not exists uk_country text not null default 'United Kingdom';

create or replace function public.customer_get_freight_forwarder_directory_v1()
returns table(
  id bigint,
  company_name text,
  verification_status text,
  partner_status text,
  country text,
  city text,
  uk_address text,
  uk_address_line1 text,
  uk_address_line2 text,
  uk_region text,
  uk_postcode text,
  uk_country text,
  contact_name text,
  contact_role text,
  email text,
  phone text,
  website text,
  destination_port text,
  countries_covered jsonb,
  ports_served jsonb,
  services jsonb
)
language plpgsql
security definer
set search_path=''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    f.id,f.company_name,f.verification_status,f.partner_status,f.country,f.city,f.uk_address,
    f.uk_address_line1,f.uk_address_line2,f.uk_region,f.uk_postcode,f.uk_country,
    f.contact_name,f.contact_role,f.email,f.phone,f.website,f.destination_port,
    f.countries_covered,f.ports_served,f.services
  from public.freight_forwarders f
  where f.is_active=true
    and f.partner_status<>'Do Not Use'
  order by
    case when f.verification_status='Verified' then 0 else 1 end,
    case when f.partner_status='Preferred' then 0 else 1 end,
    f.company_name;
end;
$function$;

revoke all on function public.customer_get_freight_forwarder_directory_v1() from public;
revoke all on function public.customer_get_freight_forwarder_directory_v1() from anon;
grant execute on function public.customer_get_freight_forwarder_directory_v1() to authenticated;

update public.freight_forwarders
set uk_address_line1=coalesce(uk_address_line1,uk_address),
    uk_postcode=coalesce(
      uk_postcode,
      nullif((regexp_match(coalesce(uk_address,''),'([A-Z]{1,2}[0-9][A-Z0-9]?[ ]?[0-9][A-Z]{2})','i'))[1],'')
    ),
    uk_country=coalesce(nullif(uk_country,''),'United Kingdom')
where is_active=true;
