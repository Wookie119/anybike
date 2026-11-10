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
