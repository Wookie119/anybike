-- AnyBike: deterministic 100-model all-manufacturer intake batches
-- 10 November 2026. Read-only: NO write, publishing, ID merge or alias approval.
-- Maintain original 19 identity-review records as blockers.
-- Batches are stable for unchanged catalogue input; new rows can reorder
-- future batches, so record ID-level reports when reviewing a particular run.
WITH registry AS (
 SELECT display_name FROM public.motorcycle_catalog_manufacturers
), pending_aliases AS (
 SELECT alias_model_id FROM public.motorcycle_catalog_model_aliases
 WHERE review_status<>'approved'
), colliding_names AS (
 SELECT lower(regexp_replace(manufacturer,'[^a-z0-9]','','gi')) make_key,
        lower(regexp_replace(model,'[^a-z0-9]','','gi')) model_key
 FROM public.motorcycle_catalog_models GROUP BY 1,2 HAVING count(*)>1
), staged AS (
 SELECT model_id,count(*) AS section_count
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' GROUP BY model_id
), items AS (
 SELECT m.id AS model_id,m.manufacturer,m.model,m.slug,
        coalesce(s.section_count,0)::int staged_sections,
        CASE
        WHEN NOT EXISTS(
          SELECT 1 FROM registry r WHERE r.display_name=m.manufacturer)
         OR EXISTS(
          SELECT 1 FROM pending_aliases a WHERE a.alias_model_id=m.id)
         OR EXISTS(
          SELECT 1 FROM colliding_names c
           WHERE c.make_key=lower(regexp_replace(m.manufacturer,'[^a-z0-9]','','gi'))
             AND c.model_key=lower(regexp_replace(m.model,'[^a-z0-9]','','gi')))
         OR m.model ~* '(apr|representative|finance|financing|deposit|monthly payment|pcp|[0-9]+([.][0-9]+)?[[:space:]]*%)'
          THEN 'identity_review'
        WHEN coalesce(s.section_count,0)>0
          THEN 'existing_draft_review'
        WHEN nullif(trim(m.overview),'') IS NOT NULL
          OR (m.specifications IS NOT NULL AND m.specifications<>'{}'::jsonb)
          THEN 'source_verification'
        ELSE 'manufacturer_primary_research'
        END AS workstream
 FROM public.motorcycle_catalog_models m
 LEFT JOIN staged s ON s.model_id=m.id
), numbered AS (
 SELECT *,row_number() OVER(ORDER BY
  CASE workstream WHEN 'identity_review' THEN 1
   WHEN 'existing_draft_review' THEN 2
   WHEN 'source_verification' THEN 3 ELSE 4 END,
  lower(manufacturer),lower(model),model_id) AS queue_position
 FROM items
), assigned AS (
 SELECT *,((queue_position-1)/100+1)::int AS batch_no FROM numbered
)
SELECT batch_no,workstream,count(*) AS models,
       count(DISTINCT manufacturer) AS manufacturer_labels,
       coalesce(sum(staged_sections),0) AS staged_sections,
       min(queue_position) AS start_position,max(queue_position) AS end_position
FROM assigned GROUP BY batch_no,workstream ORDER BY batch_no,workstream;

-- To export every model ID and batch assignment, reuse the identical WITH
-- block above and replace its final SELECT with:
-- SELECT batch_no,queue_position,workstream,model_id,manufacturer,model,slug,
--        staged_sections FROM assigned ORDER BY queue_position;
--
-- Existing drafts require factual verification. Identity-review entries are
-- frozen for manual investigation; NEVER merge on make/model normalization.
-- Source-verification candidates are private input, NOT verified public facts.
-- Research-required models with no source text MUST NOT receive filler sections.
