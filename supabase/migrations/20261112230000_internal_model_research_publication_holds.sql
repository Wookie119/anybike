-- Internal publication coverage: verified facts with a valid research section
-- whose exact catalogue identity is withheld from the public model finder.
-- Not a visibility assertion or instruction to override pending reviews.
create or replace view public.anybike_model_research_publication_holds_v1
with (security_invoker=true) as
select f.id as fact_id,f.catalog_model_id,c.manufacturer as make,c.model,
 f.category,f.label,n.review_status,
 case when n.review_status='pending_review' then 'pending_catalogue_identity_review'
      when a.alias_model_id is not null then 'catalogue_model_alias'
      else 'missing_public_catalogue_route' end as hold_reason,
 (r.category is not null) as research_section_supported,
 exists(select 1 from public.motorcycle_catalog_fact_verification_audit v
        where v.fact_id=f.id and v.source_url=f.source_url
          and nullif(btrim(v.verification_basis),'') is not null and v.checked_at<=now()) as source_audited
from public.motorcycle_catalog_facts f
join public.motorcycle_catalog_models c on c.id=f.catalog_model_id
left join public.motorcycle_catalog_dropdown_clean d on d.model_id=f.catalog_model_id
left join public.motorcycle_catalog_name_reviews n
  on n.catalog_model_id=f.catalog_model_id and n.review_status='pending_review'
left join public.motorcycle_catalog_model_aliases a on a.alias_model_id=f.catalog_model_id
left join public.anybike_model_research_section_registry r on r.category=f.category
where f.verification_status='verified' and d.model_id is null;
revoke all on public.anybike_model_research_publication_holds_v1 from anon,authenticated;
