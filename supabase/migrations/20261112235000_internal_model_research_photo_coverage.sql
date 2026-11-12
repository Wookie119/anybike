-- AnyBike internal source-to-public-page coverage report.
-- Count only audited, approved, section-supported facts from the public clean
-- catalogue identity or its manually reviewed one-to-one exact model alias.
-- Photo data here represents approval metadata, NOT proof image bytes load.
create or replace view public.anybike_public_model_research_coverage_v1
with (security_invoker=true) as
with eligible_facts as (
 select f.catalog_model_id,count(*)::integer as verified_fact_count
 from public.motorcycle_catalog_facts f
 join public.anybike_model_research_section_registry s on s.category=f.category
 where f.verification_status='verified'
  and f.source_url ~ '^https://[^[:space:]]+$'
  and nullif(btrim(f.label),'') is not null
  and exists(select 1 from public.motorcycle_catalog_fact_verification_audit a
    where a.fact_id=f.id and a.source_url=f.source_url and a.checked_at<=now()
      and nullif(btrim(a.verification_basis),'') is not null)
 group by f.catalog_model_id
), photo_counts as (
 select p.manufacturer,p.model,
 count(*) filter(where p.subject_category='whole_motorcycle'
   and 'model_hero'=any(p.usage_contexts))::integer as approved_hero_count,
 count(*) filter(where 'model_variant_gallery'=any(p.usage_contexts)
   or 'engineering'=any(p.usage_contexts))::integer as approved_gallery_count
 from public.anybike_editorial_photo_bank p
 where p.approval_status='approved'
  and p.image_url ~ '^https://[^[:space:]]+$'
  and p.source_page_url ~ '^https://[^[:space:]]+$'
  and p.licence_url ~ '^https://[^[:space:]]+$'
  and nullif(btrim(p.attribution),'') is not null
  and nullif(btrim(p.licence),'') is not null
 group by p.manufacturer,p.model
)
select d.model_id,d.make,d.model,d.slug,
 coalesce(case when coalesce(exact_facts.verified_fact_count,0)>0
   then exact_facts.verified_fact_count
   else canon_facts.verified_fact_count end,0)::integer as verified_research_facts,
 (coalesce(exact_facts.verified_fact_count,0)=0
   and coalesce(canon_facts.verified_fact_count,0)>0)::boolean as research_uses_approved_alias,
 coalesce(pc.approved_hero_count,0)::integer as approved_hero_photos,
 coalesce(pc.approved_gallery_count,0)::integer as approved_gallery_photos
from public.motorcycle_catalog_dropdown_clean d
left join public.anybike_model_identity_aliases alias
 on alias.manufacturer=d.make and alias.alias_model=d.model
left join public.motorcycle_catalog_dropdown_clean canonical
 on canonical.make=d.make and canonical.model=alias.canonical_model
left join eligible_facts exact_facts on exact_facts.catalog_model_id=d.model_id
left join eligible_facts canon_facts on canon_facts.catalog_model_id=canonical.model_id
left join photo_counts pc on pc.manufacturer=d.make and pc.model=coalesce(
  case when alias.canonical_model is not null and canonical.model_id is not null
   then alias.canonical_model end,d.model);
revoke all on public.anybike_public_model_research_coverage_v1 from anon,authenticated;
