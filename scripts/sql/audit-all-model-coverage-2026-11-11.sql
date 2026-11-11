-- AnyBike universal model coverage audit — 11 November 2026
-- READ ONLY. Run against production Supabase using the connected SQL tool.
-- Exact catalogue IDs preserve manufacturer/model identity; this report never
-- promotes draft content to published or treats verified facts as editorial approval.
-- The model-v2 editorial table is counted independently from universal sections.
WITH
facts AS (
 SELECT catalog_model_id AS model_id,
 count(*) AS fact_rows,
 count(*) FILTER (WHERE verification_status='verified' AND source_url ~* '^https://[^[:space:]]+$') AS verified_source_facts,
 count(*) FILTER (WHERE verification_status<>'verified' OR verification_status IS NULL
                      OR source_url IS NULL OR source_url !~* '^https://[^[:space:]]+$') AS facts_needing_evidence
 FROM public.motorcycle_catalog_facts GROUP BY catalog_model_id
),
sections AS (
 SELECT model_id,
 count(*) AS staged_sections,
 count(*) FILTER (WHERE editorial_status='draft') AS draft_sections,
 count(*) FILTER (WHERE editorial_status IN ('approved','published')) AS approved_stage_sections,
 count(*) FILTER (WHERE source_reference IS NULL OR btrim(source_reference)='') AS sections_missing_source_reference
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model'
 GROUP BY model_id
),
released AS (
 SELECT entity_id AS model_id,count(*) AS published_sections
 FROM public.motorcycle_universal_published_sections_v1
 WHERE entity_type='model' AND publication_eligible IS TRUE
 GROUP BY entity_id
),
editorial AS (
 SELECT model_id,count(*) AS editorial_records
 FROM public.motorcycle_model_v2_editorial GROUP BY model_id
),
sources AS (
 SELECT model_id,
 count(*) AS indexed_sources,
 count(*) FILTER(WHERE verification_status='verified' AND source_url ~* '^https://') AS verified_indexed_sources
 FROM public.motorcycle_catalog_editorial_source_index GROUP BY model_id
),
clean AS (SELECT model_id FROM public.motorcycle_catalog_dropdown_clean),
all_models AS (
 SELECT m.id AS model_id,m.manufacturer,m.model,m.slug,
 (c.model_id IS NOT NULL) AS in_clean_public_catalogue,
 coalesce(f.fact_rows,0) AS fact_rows,
 coalesce(f.verified_source_facts,0) AS verified_source_facts,
 coalesce(f.facts_needing_evidence,0) AS facts_needing_evidence,
 coalesce(s.staged_sections,0) AS staged_sections,
 coalesce(s.draft_sections,0) AS draft_sections,
 coalesce(s.approved_stage_sections,0) AS approved_stage_sections,
 coalesce(s.sections_missing_source_reference,0) AS sections_missing_source_reference,
 coalesce(r.published_sections,0) AS published_sections,
 coalesce(e.editorial_records,0) AS existing_editorial_records,
 coalesce(src.indexed_sources,0) AS indexed_sources,
 coalesce(src.verified_indexed_sources,0) AS verified_indexed_sources,
 (m.manufacturer IS NULL OR btrim(m.manufacturer)=''
   OR m.model IS NULL OR btrim(m.model)='') AS missing_identity
 FROM public.motorcycle_catalog_models m
 LEFT JOIN facts f ON f.model_id=m.id
 LEFT JOIN sections s ON s.model_id=m.id
 LEFT JOIN released r ON r.model_id=m.id
 LEFT JOIN editorial e ON e.model_id=m.id
 LEFT JOIN sources src ON src.model_id=m.id
 LEFT JOIN clean c ON c.model_id=m.id
)
SELECT *,
 CASE
  WHEN missing_identity THEN 'identity_review'
  WHEN published_sections>0 THEN 'universal_published'
  WHEN existing_editorial_records>0 THEN 'existing_editorial_preserve'
  WHEN verified_source_facts>0 THEN 'verified_facts_ready_for_editorial_review'
  WHEN staged_sections>0 THEN 'draft_research_needs_verification'
  WHEN indexed_sources>0 OR fact_rows>0 THEN 'source_evidence_needs_review'
  ELSE 'research_not_started'
 END AS next_research_action
FROM all_models
ORDER BY
 CASE WHEN missing_identity THEN 0
      WHEN verified_source_facts>0 AND published_sections=0 THEN 1
      WHEN staged_sections>0 THEN 2
      WHEN existing_editorial_records>0 THEN 3
      ELSE 4 END,
 manufacturer,model,model_id;

-- SUMMARIES: wrap the CTE above (without its final SELECT) in:
-- SELECT manufacturer,count(*) models,
-- count(*) FILTER (WHERE verified_source_facts>0) models_with_verified_facts,
-- count(*) FILTER (WHERE staged_sections>0) models_with_staged_sections,
-- count(*) FILTER (WHERE published_sections>0) models_with_universal_publication,
-- count(*) FILTER (WHERE existing_editorial_records>0) models_with_existing_editorial
-- FROM all_models GROUP BY manufacturer ORDER BY models DESC;
