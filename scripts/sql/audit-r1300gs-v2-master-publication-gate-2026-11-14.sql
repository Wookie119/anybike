-- AnyBike BMW R 1300 GS V2 universal-master publication worklist.
-- READ ONLY. Validated against live Supabase on 2026-11-14.
-- Do NOT publish staged drafts on the strength of verified individual facts.
-- Preserve the original R 1300 GS design, photographs and stock-first layout.
WITH slots AS (
  SELECT generate_series(1,20) AS section_number
),
drafts AS (
  SELECT id,section_number,section_key,section_title,editorial_status,
         source_reference,content
  FROM public.motorcycle_universal_page_sections_v1
  WHERE entity_type='model' AND model_id=77
),
published AS (
  SELECT section_number,count(*) AS live_rows
  FROM public.motorcycle_universal_published_sections_v1
  WHERE entity_type='model' AND entity_id=77
    AND editorial_status='published' AND publication_eligible IS TRUE
  GROUP BY section_number
)
SELECT s.section_number,
       'section_'||lpad(s.section_number::text,2,'0') AS expected_key,
       d.section_title,
       coalesce(d.editorial_status,'missing') AS draft_status,
       coalesce(p.live_rows,0) AS published_rows,
       CASE
         WHEN d.id IS NULL THEN 'NO_DRAFT: leave empty unless evidence supports it'
         WHEN d.section_key IS DISTINCT FROM 'section_'||lpad(s.section_number::text,2,'0')
           THEN 'BLOCKED: wrong slot key'
         WHEN d.content IS NULL OR d.content IN ('{}'::jsonb,'null'::jsonb,'[]'::jsonb)
           THEN 'BLOCKED: empty content'
         WHEN nullif(btrim(d.source_reference),'') IS NULL
           THEN 'BLOCKED: no staging provenance'
         WHEN d.content::text ILIKE '%pending_editorial_review%'
           THEN 'REVIEW: pending material inside draft'
         WHEN d.editorial_status<>'published'
           THEN 'REVIEW: draft only; requires section-level approval'
         ELSE 'CHECK: still requires approved publication provenance'
       END AS editorial_gate
FROM slots s
LEFT JOIN drafts d USING(section_number)
LEFT JOIN published p USING(section_number)
ORDER BY s.section_number;

-- 2. Independent evidence and unresolved nested-content inventory.
-- A verified fact is NOT equivalent to an approved section.
-- Keep all records in draft until section-specific publication review.
WITH section_checks AS (
 SELECT s.section_number,s.section_title,s.editorial_status,
        s.content,s.source_reference,
        s.content::text ILIKE '%pending_editorial_review%' AS pending_nested,
        (s.content IS NOT NULL AND s.content NOT IN ('{}'::jsonb,'null'::jsonb,'[]'::jsonb)) AS has_payload,
        (nullif(btrim(s.source_reference),'') IS NOT NULL) AS has_provenance,
        s.section_key=('section_'||lpad(s.section_number::text,2,'0')) AS key_ok
 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model' AND s.model_id=77
), facts AS (
 SELECT count(*) FILTER(WHERE f.verification_status='verified') verified_facts,
        count(*) FILTER(WHERE f.verification_status='verified' AND EXISTS(
          SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
          WHERE a.fact_id=f.id AND a.source_url=f.source_url
            AND nullif(btrim(a.verification_basis),'') IS NOT NULL
            AND a.checked_at<=now()
        )) audited_facts
 FROM public.motorcycle_catalog_facts f WHERE f.catalog_model_id=77
)
SELECT count(*) staged_sections,
 count(*) FILTER(WHERE pending_nested) sections_with_pending_nested,
 count(*) FILTER(WHERE NOT has_payload) blank_sections,
 count(*) FILTER(WHERE NOT has_provenance) missing_provenance,
 count(*) FILTER(WHERE NOT key_ok) invalid_keys,
 count(*) FILTER(WHERE editorial_status='draft') unapproved_drafts,
 (SELECT verified_facts FROM facts) verified_facts,
 (SELECT audited_facts FROM facts) audited_facts,
 (SELECT count(*) FROM public.motorcycle_universal_published_sections_v1
  WHERE entity_type='model' AND entity_id=77
    AND publication_eligible IS TRUE AND editorial_status='published') published_sections
FROM section_checks;

-- 3. Locate nested editorial entries awaiting explicit review.
-- Model-year photographs and dated manufacturer evidence must not be
-- inferred approved from their presence inside an otherwise useful draft.
SELECT section_number,section_title,
       jsonb_path_query_array(content,
         '$.** ? (@ == "pending_editorial_review")') AS pending_status_values
FROM public.motorcycle_universal_page_sections_v1
WHERE entity_type='model' AND model_id=77
  AND content::text ILIKE '%pending_editorial_review%'
ORDER BY section_number;

-- 4. Editorial payload compatibility with the approved universal renderer.
-- A metadata-only section must not become a blank public research card.
-- Photography remains subject to the independent rights-approved hero/gallery
-- pathway; this report does NOT authorise photos or alter the approved design.
WITH renderable_keys(key) AS (
 SELECT unnest(ARRAY[
 'summary','years','timeline','production_evidence','engineering',
 'generations','milestones','types','specifications','colours','editions',
 'global_stories','deep_dive','development_cards','related_model_links',
 'actions','customer_copy','paragraphs','entries','links','hero','production'
 ]::text[])
)
SELECT s.section_number,s.section_title,
       array(SELECT jsonb_object_keys(s.content) ORDER BY 1) AS content_keys,
       EXISTS (
         SELECT 1 FROM renderable_keys k WHERE s.content ? k.key
       ) AS contains_recognised_renderer_payload,
       CASE
         WHEN s.content ? 'photography' AND
              NOT EXISTS (SELECT 1 FROM renderable_keys k WHERE s.content ? k.key)
           THEN 'PHOTOGRAPHY_METADATA_ONLY: use rights-approved media pipeline'
         WHEN NOT EXISTS (SELECT 1 FROM renderable_keys k WHERE s.content ? k.key)
           THEN 'REVIEW_UNRENDERABLE_SECTION'
         ELSE 'SCHEMA_KEY_RECOGNISED: still requires content and editorial QA'
       END AS renderer_review
FROM public.motorcycle_universal_page_sections_v1 s
WHERE s.entity_type='model' AND s.model_id=77
ORDER BY s.section_number;

-- 5. Canonical manufacturer registry and STAGING constraint audit.
-- Model drafts MUST have model_id set and manufacturer_id NULL, as required by
-- the existing universal_section_exact_entity check constraint. Resolve BMW's
-- manufacturer ID (15) from the registry only at an independently reviewed
-- publication step. Do NOT set the draft manufacturer_id; that would violate
-- the schema. BMW registry status currently requires editorial review, but
-- registry 'review' does not change the validity of a model draft.
SELECT m.id AS canonical_model_id,m.manufacturer,m.model,
       reg.id AS canonical_manufacturer_id,reg.status AS manufacturer_registry_status,
       COUNT(s.id) AS staged_sections,
       COUNT(s.id) FILTER (WHERE s.model_id=m.id AND s.manufacturer_id IS NULL)
          AS correctly_shaped_model_drafts,
       COUNT(s.id) FILTER (WHERE s.model_id IS DISTINCT FROM m.id
                           OR s.manufacturer_id IS NOT NULL)
          AS staging_identity_violations,
       CASE
         WHEN reg.id IS NULL THEN 'BLOCKED: manufacturer registry identity missing'
         WHEN COUNT(s.id) FILTER (
              WHERE s.model_id IS DISTINCT FROM m.id OR s.manufacturer_id IS NOT NULL
            )>0 THEN 'BLOCKED: incorrect model-draft identity'
         WHEN reg.status<>'approved' THEN 'REVIEW: manufacturer registry awaits approval'
         ELSE 'STAGING_AND_REGISTRY_CHECK_PASSED: publication needs separate editorial signoff'
       END AS release_gate
FROM public.motorcycle_catalog_models m
LEFT JOIN public.motorcycle_catalog_manufacturers reg
  ON reg.display_name=m.manufacturer
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
  ON s.entity_type='model' AND s.model_id=m.id
WHERE m.id=77
GROUP BY m.id,m.manufacturer,m.model,reg.id,reg.status;
