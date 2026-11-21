-- Keep public ad rendering tied to current quotation acceptance and original territory.
-- Retain the existing public view's column order and all established partner/time guards.
create or replace view public.public_advertising_creatives_v1 as
select c.id,c.name,c.placement,c.desktop_image_url,c.mobile_image_url,
 c.destination_url,c.alt_text,c.disclosure,c.headline_template,
 c.subheading,c.cta_text,c.use_model_photo,c.countries,c.manufacturers,
 c.models,c.page_categories,c.customer_types,c.page_paths,c.priority,
 c.starts_at,c.ends_at,p.name as partner_name
from public.advertising_campaigns c
join public.commercial_partners p on p.id=c.partner_id
left join public.finance_partner_terms t on t.partner_id=p.id
where c.status='active'
 and p.status='approved'
 and p.agreement_approved
 and p.branding_approved
 and (c.starts_at is null or c.starts_at<=now())
 and (c.ends_at is null or c.ends_at>now())
 and p.kind<>'finance'
 and (c.source_quotation_item_id is null or exists (
   select 1 from public.advertising_quotation_items i
   join public.advertising_quotations q on q.id=i.quotation_id
   where i.id=c.source_quotation_item_id
    and q.status='accepted'
    and (q.partner_id is null or q.partner_id=c.partner_id)
    and (
      (q.audience='UK' and c.countries=array['GB']::text[])
      or (q.audience='International' and not ('GB'=any(c.countries)) and cardinality(c.countries)>0)
      or (q.audience='Worldwide' and cardinality(c.countries)>0)
    )
  ));