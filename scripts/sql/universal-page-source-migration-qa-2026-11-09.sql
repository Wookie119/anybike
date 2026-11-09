-- Universal AnyBike catalogue rollout QA, 2026-11-09 (READ ONLY).
-- Report staging coverage; no claim that drafts are published research.
select entity_type,editorial_status,
 count(*) as section_records,
 count(distinct coalesce(manufacturer_id,model_id)) as entities,
 count(*) filter(where content='{}'::jsonb) as empty_content
from public.motorcycle_universal_page_sections_v1
group by entity_type,editorial_status order by entity_type,editorial_status;

-- Prevent mistaken cross-brand ingestion.
select count(*) as non_bmw_model_sections
from public.motorcycle_universal_page_sections_v1 s
join public.motorcycle_catalog_models m on m.id=s.model_id
where s.entity_type='model' and m.manufacturer<>'BMW';

-- Verify all imported BMW section references identify their source model.
select count(*) as wrong_model_provenance
from public.motorcycle_universal_page_sections_v1
where entity_type='model'
and source_reference not like 'motorcycle_model_v2_editorial:model_id='||model_id::text||'%';

-- Publication gate: zero new sections should be published before approved projection,
-- rights/source checks, customer permission tests and design comparisons.
select count(*) as published_section_records
from public.motorcycle_universal_page_sections_v1
where editorial_status='published';

-- Identify catalogue BMW records missing source editorial and staged sections.
select m.id,m.model,m.slug
from public.motorcycle_catalog_models m
where m.manufacturer='BMW'
 and not exists(select 1 from public.motorcycle_universal_page_sections_v1 s
                where s.entity_type='model' and s.model_id=m.id)
order by m.model;
