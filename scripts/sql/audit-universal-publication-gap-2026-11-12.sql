-- AnyBike universal research publication gap — read-only, 12 Nov 2026.
-- Does not approve drafts, alter page designs or bypass stock/photo permissions.
-- Run each SELECT separately in Supabase SQL editor.
-- 1. Publication funnel: do not equate verified facts with approved sections.
select s.entity_type,s.editorial_status,count(*) as sections,
 count(distinct s.model_id) filter(where s.entity_type='model') as model_count,
 count(*) filter(where s.source_reference is null or btrim(s.source_reference)='') as missing_reference,
 count(*) filter(where s.content is null or s.content='{}'::jsonb or s.content='null'::jsonb) as empty_content,
 count(*) filter(where s.published_at is not null) as dated_sections
from public.motorcycle_universal_page_sections_v1 s
group by s.entity_type,s.editorial_status order by 1,2;

-- 2. Independently audited facts are not editorial sign-off.
select count(*) as verified_facts,count(distinct f.catalog_model_id) as models_with_verified_facts
from public.motorcycle_catalog_facts f where f.verification_status='verified';

-- 3. Model review worklist, prioritising verified sources with existing staged sections.
with sections as (
 select model_id,count(*) as staged_sections,
 count(*) filter(where content is null or content='{}'::jsonb or content='null'::jsonb) as empty_sections,
 count(*) filter(where source_reference is null or btrim(source_reference)='') as missing_references
 from public.motorcycle_universal_page_sections_v1
 where entity_type='model' group by model_id
), facts as (
 select catalog_model_id,count(*) as verified_facts
 from public.motorcycle_catalog_facts where verification_status='verified'
 group by catalog_model_id
)
select m.id as model_id,m.manufacturer,m.model,
 coalesce(s.staged_sections,0) as staged_sections,
 coalesce(f.verified_facts,0) as verified_facts,
 coalesce(s.empty_sections,0) as empty_sections,
 coalesce(s.missing_references,0) as missing_references,
 case when s.model_id is null then 'stage research before editorial review'
      when coalesce(s.empty_sections,0)>0 then 'repair empty sections'
      when coalesce(s.missing_references,0)>0 then 'document section provenance'
      when coalesce(f.verified_facts,0)=0 then 'verify exact-model sources'
      else 'editorial review required; do not auto-publish' end as next_action
from public.motorcycle_catalog_models m
left join sections s on s.model_id=m.id
left join facts f on f.catalog_model_id=m.id
order by (coalesce(f.verified_facts,0)>0 and coalesce(s.staged_sections,0)>0) desc,
 verified_facts desc,staged_sections desc,m.manufacturer,m.model limit 100;

-- 4. Publication projection must contain only explicitly released records.
select count(*) as published_sections,
 count(distinct entity_id) filter(where entity_type='model') as published_models
from public.motorcycle_universal_published_sections_v1;
