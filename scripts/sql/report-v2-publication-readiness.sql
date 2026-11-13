-- AnyBike V2 | READ ONLY publication readiness
-- ONE database, ONE approved 20-section master, existing publication checks.
-- Run in Supabase SQL editor or psql. Never use this report to bulk publish
-- draft, pending-review, source-mismatched, or otherwise unapproved content.
-- Section source_reference alone is NOT proof of approval.

-- 1. Published versus staged model research, with no disclosure of private leads.
select
 (select count(*) from public.motorcycle_catalog_models) as catalogue_models,
 (select count(*) from public.motorcycle_model_v2_editorial) as v2_editorials,
 (select count(*) from public.motorcycle_model_v2_editorial where preview_visible is true) as preview_visible_editorials,
 (select count(*) from public.motorcycle_universal_page_sections_v1 where entity_type='model') as staged_model_sections,
 (select count(distinct model_id) from public.motorcycle_universal_page_sections_v1 where entity_type='model') as models_with_staged_sections,
 (select count(*) from public.motorcycle_universal_published_sections_v1 where entity_type='model' and editorial_status='published' and publication_eligible is true) as published_model_sections,
 (select count(distinct entity_id) from public.motorcycle_universal_published_sections_v1 where entity_type='model' and editorial_status='published' and publication_eligible is true) as models_with_published_sections;

-- 2. Staged content provenance; these categories are diagnostic, NOT approvals.
select
 case
  when source_reference like 'motorcycle_model_v2_editorial:%' then 'v2_editorial_source'
  when source_reference ilike '%https://%' then 'source_url_reference'
  else 'other_reference'
 end as source_class,
 editorial_status,
 count(*) as sections,
 count(distinct model_id) as models,
 count(*) filter (where content::text ilike '%pending_editorial_review%') as pending_review_mentioned,
 count(*) filter (where published_at is not null) as published_dates_set
from public.motorcycle_universal_page_sections_v1
where entity_type='model'
group by 1,2
order by 1,2;

-- 3. Independently audited public facts; only the existing protected RPC
-- decides which exact identity and records can be published to visitors.
select
 f.verification_status,
 count(*) as fact_records,
 count(distinct f.catalog_model_id) as distinct_models,
 count(*) filter (where a.fact_id is not null and a.source_url=f.source_url
   and nullif(btrim(a.verification_basis),'') is not null
   and a.checked_at<=now()) as matching_source_audit_records
from public.motorcycle_catalog_facts f
left join public.motorcycle_catalog_fact_verification_audit a on a.fact_id=f.id
group by f.verification_status
order by fact_records desc;

-- 4. Find the largest model research publication gaps for supervised review.
-- These are draft counts only, not ready-to-publish recommendations.
select
 m.id as model_id,
 m.manufacturer,
 m.model,
 count(s.id) as staged_sections,
 count(s.id) filter (where s.content::text ilike '%pending_editorial_review%') as pending_review_sections,
 count(s.id) filter (where s.source_reference ilike '%https://%') as url_reference_sections,
 (select count(*) from public.motorcycle_universal_published_sections_v1 p
   where p.entity_type='model' and p.entity_id=m.id
    and p.editorial_status='published' and p.publication_eligible is true) as published_sections
from public.motorcycle_catalog_models m
join public.motorcycle_universal_page_sections_v1 s
 on s.entity_type='model' and s.model_id=m.id
group by m.id,m.manufacturer,m.model
order by staged_sections desc,m.manufacturer,m.model
limit 30;
