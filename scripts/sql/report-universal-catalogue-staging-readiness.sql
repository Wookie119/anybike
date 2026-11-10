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

-- Live-source canonical identity integrity. Reports exceptions only.
-- A verified match can still have a stale feed label, so check both ID
-- and normalized make/model; never reassign identity automatically.
SELECT x.live_source_item_id,x.catalog_model_id,x.source_make,x.source_model,
       m.manufacturer AS canonical_manufacturer,m.model AS canonical_model,
       x.review_status
FROM public.motorcycle_live_source_catalogue_identity_v1 x
LEFT JOIN public.motorcycle_catalog_models m ON m.id=x.catalog_model_id
WHERE x.review_status='verified'
  AND (m.id IS NULL OR
       (nullif(trim(x.source_make),'') IS NOT NULL AND
         regexp_replace(lower(x.source_make),'[^a-z0-9]','','g') <>
         regexp_replace(lower(m.manufacturer),'[^a-z0-9]','','g')) OR
       (nullif(trim(x.source_model),'') IS NOT NULL AND
         regexp_replace(lower(x.source_model),'[^a-z0-9]','','g') <>
         regexp_replace(lower(m.model),'[^a-z0-9]','','g')))
ORDER BY x.live_source_item_id;

-- Verified parent identities must point at actual catalogue models.
SELECT x.catalog_model_id,x.source_manufacturer_name,x.review_status
FROM public.motorcycle_catalog_model_parent_identity_v1 x
LEFT JOIN public.motorcycle_catalog_models m ON m.id=x.catalog_model_id
WHERE x.review_status='verified' AND m.id IS NULL
ORDER BY x.catalog_model_id;

-- BMW research readiness ranked by staged section coverage and cited facts.
-- The report counts facts embedded in private draft sections only; numbers
-- are NOT publication approvals or a claim all research is verified.
SELECT m.id,m.model,
       count(s.id) AS staged_sections,
       count(s.id) FILTER (
         WHERE s.content->'engineering'->>'verification_status'='pending_editorial_review'
       ) AS pending_engineering,
       coalesce(sum(jsonb_array_length(
         CASE WHEN jsonb_typeof(s.content->'verified_catalogue_facts')='array'
              THEN s.content->'verified_catalogue_facts'
              ELSE '[]'::jsonb END
       )),0) AS embedded_evidence_facts,
       count(s.id) FILTER (
         WHERE s.content IS NULL OR s.content='{}'::jsonb
       ) AS empty_sections
FROM public.motorcycle_catalog_models m
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
  ON s.entity_type='model' AND s.model_id=m.id
WHERE m.manufacturer='BMW'
GROUP BY m.id,m.model
ORDER BY staged_sections DESC,embedded_evidence_facts DESC,m.model,m.id;

-- Publication provenance integrity. Run before approving ANY public release.
-- A source-section foreign key alone does not prove the source belongs to the
-- same model, section slot or manufacturer. Report all mismatches without writes.
SELECT pub.source_section_id,pub.entity_type,pub.entity_id,pub.manufacturer_id,
       pub.section_number,pub.section_key,pub.publication_review_reference,
       src.model_id AS source_model_id,src.manufacturer_id AS source_manufacturer_id,
       m.manufacturer AS catalogue_manufacturer
FROM public.motorcycle_universal_published_sections_v1 pub
LEFT JOIN public.motorcycle_universal_page_sections_v1 src
  ON src.id=pub.source_section_id
LEFT JOIN public.motorcycle_catalog_models m
  ON pub.entity_type='model' AND pub.entity_id=m.id
LEFT JOIN public.motorcycle_catalog_manufacturers cm
  ON cm.display_name=m.manufacturer
WHERE src.id IS NULL
   OR src.entity_type IS DISTINCT FROM pub.entity_type
   OR src.section_number IS DISTINCT FROM pub.section_number
   OR src.section_key IS DISTINCT FROM pub.section_key
   OR (pub.entity_type='model' AND (
       src.model_id IS DISTINCT FROM pub.entity_id
       OR m.id IS NULL OR cm.id IS DISTINCT FROM pub.manufacturer_id))
   OR (pub.entity_type='manufacturer' AND (
       src.manufacturer_id IS DISTINCT FROM pub.entity_id
       OR pub.manufacturer_id IS DISTINCT FROM pub.entity_id))
ORDER BY pub.entity_type,pub.entity_id,pub.section_number;

-- Staging rows must refer to their proper canonical entity.
SELECT s.id AS source_section_id,s.entity_type,s.manufacturer_id,s.model_id
FROM public.motorcycle_universal_page_sections_v1 s
LEFT JOIN public.motorcycle_catalog_models m
  ON s.entity_type='model' AND s.model_id=m.id
LEFT JOIN public.motorcycle_catalog_manufacturers mf
  ON s.entity_type='manufacturer' AND s.manufacturer_id=mf.id
WHERE (s.entity_type='model' AND m.id IS NULL)
   OR (s.entity_type='manufacturer' AND mf.id IS NULL)
ORDER BY s.entity_type,s.id;
