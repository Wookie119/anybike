-- AnyBike universal V2 model coverage and editorial review readiness.
-- READ ONLY. Does not publish, approve, or alter source material.
-- Run against Supabase as an authorised database maintainer.
-- Results are intentionally model-specific and include both the public
-- verified-facts pipeline and the separately gated 20-section editorial.
-- Snapshot reference: 2026-11-16 (not a fixed-count assertion).

-- 1. Top-level public research and editorial queues.
select
 (select count(*) from public.motorcycle_catalog_models) as catalogue_model_records,
 (select count(*) from public.anybike_public_model_research_coverage_v1) as public_dropdown_models,
 (select count(*) from public.anybike_public_model_research_coverage_v1
   where verified_research_facts>0) as models_with_public_verified_facts,
 (select coalesce(sum(verified_research_facts),0)
   from public.anybike_public_model_research_coverage_v1) as published_verified_facts,
 (select count(*) from public.anybike_public_model_research_coverage_v1
   where approved_hero_photos>0) as models_with_approved_hero,
 (select count(*) from public.anybike_public_model_research_coverage_v1
   where approved_gallery_photos>0) as models_with_approved_gallery,
 (select count(distinct model_id)
   from public.anybike_model_editorial_review_queue_v1) as models_awaiting_human_review,
 (select count(*) from public.anybike_model_editorial_review_queue_v1) as sections_awaiting_human_review,
 (select count(*) from public.motorcycle_universal_published_sections_v1
   where entity_type='model' and editorial_status='published'
   and publication_eligible is true) as published_universal_sections,
 (select count(*) from public.anybike_model_research_unrenderable_verified_v1) as verified_facts_without_renderer_slot;

-- 2. Manufacturer-level review work. Nothing is automatically approved.
with drafts as (
 select model_id,count(*) as section_count,
  count(*) filter(where has_structured_source) as structured_count,
  count(*) filter(where has_model_year_scope) as year_scope_count,
  count(*) filter(where nullif(btrim(source_url),'') is null) as missing_source_url_count,
  count(*) filter(where image_rights_pending is true) as photo_rights_holds
 from public.anybike_model_editorial_review_queue_v1
 group by model_id
)
select c.manufacturer,count(*) as model_count,
 sum(d.section_count) as sections_awaiting_review,
 sum(d.structured_count) as with_structured_source,
 sum(d.year_scope_count) as year_scoped_sections,
 sum(d.missing_source_url_count) as sections_without_direct_source_url,
 sum(d.photo_rights_holds) as image_rights_holds
from drafts d join public.motorcycle_catalog_models c on c.id=d.model_id
group by c.manufacturer order by sections_awaiting_review desc,c.manufacturer;

-- 3. Exact model-ranked first 50 candidates, with alias/name-review
-- exclusion from direct approval. This is a REVIEW worklist, not a release list.
with drafts as (
 select model_id,count(*) as draft_sections,
  count(*) filter(where has_structured_source) as structured_sections,
  count(*) filter(where has_model_year_scope) as year_scoped_sections,
  count(*) filter(where nullif(btrim(source_url),'') is not null) as direct_source_urls,
  count(*) filter(where image_rights_pending is true) as image_rights_holds
 from public.anybike_model_editorial_review_queue_v1 group by model_id
), published as (
 select entity_id as model_id,count(*) as published_sections
 from public.motorcycle_universal_published_sections_v1
 where entity_type='model' and editorial_status='published'
  and publication_eligible is true group by entity_id
)
select m.id as model_id,m.manufacturer as make,m.model,
 coalesce(v.verified_research_facts,0) as already_public_verified_facts,
 coalesce(v.approved_hero_photos,0) as approved_hero_photos,
 d.draft_sections,d.structured_sections,d.year_scoped_sections,
 d.direct_source_urls,d.image_rights_holds,coalesce(p.published_sections,0) as published_sections
from drafts d
join public.motorcycle_catalog_models m on m.id=d.model_id
left join public.anybike_public_model_research_coverage_v1 v on v.model_id=m.id
left join published p on p.model_id=m.id
where d.structured_sections>0 and d.direct_source_urls>0
  and not exists(select 1 from public.motorcycle_catalog_model_aliases a
    where a.alias_model_id=m.id)
  and not exists(select 1 from public.motorcycle_catalog_name_reviews n
    where n.catalog_model_id=m.id and n.review_status='pending_review')
order by
 case when coalesce(v.verified_research_facts,0)=0 then 0 else 1 end,
 case when d.image_rights_holds=0 then 0 else 1 end,
 d.structured_sections desc,d.year_scoped_sections desc,
 m.manufacturer,m.model
limit 50;

-- 4. Existing approval safeguards, not editorial judgement.
select review_state,count(*) as pending_sections,
 count(distinct model_id) as affected_models,
 count(*) filter(where has_source_reference) as with_source_reference,
 count(*) filter(where has_structured_source) as with_structured_source,
 count(*) filter(where has_model_year_scope) as with_year_scope,
 count(*) filter(where nullif(btrim(source_url),'') is null) as missing_direct_source_url,
 count(*) filter(where image_rights_pending is true) as image_rights_holds
from public.anybike_model_editorial_review_queue_v1
group by review_state order by pending_sections desc;
