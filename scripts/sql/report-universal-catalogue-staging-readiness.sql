-- AnyBike universal catalogue: read-only pre-publication inventory.
-- One 20-section contract for manufacturers and models.
-- Structural completeness is NOT publication approval: source verification,
-- exact model identity, image rights, stock entitlement and visual QA still apply.
-- This report never promotes draft records or modifies public projections.
WITH staged AS (
 SELECT entity_type,manufacturer_id,model_id,section_number,section_key,
        section_title,content,editorial_status
 FROM public.motorcycle_universal_page_sections_v1
), per_entity AS (
 SELECT entity_type,coalesce(model_id,manufacturer_id) AS entity_id,
        count(*) AS section_count,
        count(*) FILTER (WHERE content IS NULL OR content='{}'::jsonb) AS empty_sections,
        count(*) FILTER (
          WHERE section_number NOT BETWEEN 1 AND 20
             OR section_key IS DISTINCT FROM 'section_'||lpad(section_number::text,2,'0')
        ) AS invalid_keys,
        count(*) FILTER (WHERE editorial_status='published') AS published_sections,
        count(*) FILTER (
          WHERE content->'engineering'->>'verification_status'='pending_editorial_review'
        ) AS pending_engineering
 FROM staged GROUP BY entity_type,coalesce(model_id,manufacturer_id)
)
SELECT entity_type,count(*) AS entities,sum(section_count) AS staged_sections,
       sum(empty_sections) AS empty_sections,sum(invalid_keys) AS invalid_keys,
       sum(pending_engineering) AS pending_engineering,
       count(*) FILTER (
         WHERE section_count=20 AND empty_sections=0
           AND invalid_keys=0 AND pending_engineering=0
       ) AS structurally_complete_20,
       sum(published_sections) AS published_sections
FROM per_entity GROUP BY entity_type ORDER BY entity_type;

-- Exact empty-section worklist: no placeholder or fabricated content.
SELECT entity_type,manufacturer_id,model_id,section_number,section_key,section_title
FROM public.motorcycle_universal_page_sections_v1
WHERE content IS NULL OR content='{}'::jsonb
ORDER BY entity_type,manufacturer_id,model_id,section_number;

-- Canonical section identity collisions (should return no rows).
SELECT entity_type,manufacturer_id,model_id,section_number,count(*) AS duplicates
FROM public.motorcycle_universal_page_sections_v1
GROUP BY entity_type,manufacturer_id,model_id,section_number
HAVING count(*)>1;

-- BMW canonical model-name review. The readiness view flags ambiguous identities:
-- review them individually; do not automatically rename legitimate variants.
SELECT m.id,m.model,r.name_issue_count,r.verified_specification_count,
       r.generation_count,r.timeline_count
FROM public.motorcycle_catalog_models m
JOIN public.motorcycle_catalog_readiness r ON r.id=m.id
WHERE m.manufacturer='BMW' AND r.name_issue_count>0
ORDER BY m.model,m.id;

-- BMW model staging coverage and nested engineering review, without promoting drafts.
-- Count left-join rows using s.id, not count(*): missing sections must remain zero.
SELECT m.id,m.model,
       count(s.id) AS staged_sections,
       count(s.id) FILTER (WHERE s.content IS NULL OR s.content='{}'::jsonb) AS empty_sections,
       count(s.id) FILTER (
         WHERE s.content->'engineering'->>'verification_status'='pending_editorial_review'
       ) AS pending_engineering_sections,
       count(s.id) FILTER (WHERE s.editorial_status='published') AS published_sections
FROM public.motorcycle_catalog_models m
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
  ON s.entity_type='model' AND s.model_id=m.id
WHERE m.manufacturer='BMW'
GROUP BY m.id,m.model ORDER BY staged_sections DESC,m.model,m.id;

-- Coverage by manufacturer is staging only, never a count of approved live pages.
SELECT m.manufacturer,count(DISTINCT m.id) AS catalog_models,
       count(s.id) AS staged_model_sections
FROM public.motorcycle_catalog_models m
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
  ON s.entity_type='model' AND s.model_id=m.id
GROUP BY m.manufacturer ORDER BY catalog_models DESC,m.manufacturer;
