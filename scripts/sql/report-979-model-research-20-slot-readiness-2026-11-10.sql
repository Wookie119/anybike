-- READ-ONLY: all-catalogue 20-slot research completeness and next editorial action.
-- There is ONE 20-section contract. Empty slots remain empty, not generated
-- placeholder cards. All staged data remains private until independently approved.
WITH model_sections AS (
 SELECT model_id,count(*) AS staged_sections,
 count(*) FILTER(WHERE editorial_status='draft' AND published_at IS NULL) AS private_drafts,
 count(*) FILTER(WHERE content->>'source_verification_status'='pending_review') AS pending_source,
 count(*) FILTER(WHERE section_number=1) AS has_intro,
 count(*) FILTER(WHERE section_number=7) AS has_history,
 count(*) FILTER(WHERE section_number=12) AS has_specification,
 count(*) FILTER(WHERE section_number=13) AS has_editions,
 count(*) FILTER(WHERE nullif(trim(source_reference),'') IS NULL) AS blank_source
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' GROUP BY model_id
), by_model AS (
 SELECT m.id,m.manufacturer,m.model,
 coalesce(s.staged_sections,0) AS staged_sections,
 20-coalesce(s.staged_sections,0) AS remaining_unfilled_slots,
 coalesce(s.private_drafts,0) AS private_drafts,
 coalesce(s.pending_source,0) AS pending_source,
 coalesce(s.has_intro,0) AS has_intro,
 coalesce(s.has_history,0) AS has_history,
 coalesce(s.has_specification,0) AS has_specification,
 coalesce(s.has_editions,0) AS has_editions,
 coalesce(s.blank_source,0) AS blank_source
 FROM public.motorcycle_catalog_models m
 LEFT JOIN model_sections s ON s.model_id=m.id
)
SELECT manufacturer,count(*) AS canonical_models,
 count(*) FILTER(WHERE staged_sections>0) AS models_with_staging,
 sum(staged_sections) AS staged_model_sections,
 count(*) FILTER(WHERE staged_sections>=11) AS models_11_plus_sections,
 count(*) FILTER(WHERE has_intro=1) AS models_with_intro,
 count(*) FILTER(WHERE has_history=1) AS models_with_history,
 count(*) FILTER(WHERE has_specification=1) AS models_with_specification,
 count(*) FILTER(WHERE has_editions=1) AS models_with_editions,
 sum(pending_source) AS pending_source_sections,
 sum(blank_source) AS blank_sources,
 count(*) FILTER(WHERE staged_sections=0) AS models_not_started
FROM by_model GROUP BY manufacturer
ORDER BY models_with_staging DESC,canonical_models DESC,manufacturer;

-- Execution shortcut for overall 979-model coverage bands:
-- Reuse model_sections and by_model CTEs above then run:
-- SELECT CASE WHEN staged_sections=0 THEN '00_unstaged'
-- WHEN staged_sections<=2 THEN '01_02_sections'
-- WHEN staged_sections<=5 THEN '03_05_sections'
-- WHEN staged_sections<=10 THEN '06_10_sections'
-- WHEN staged_sections<=15 THEN '11_15_sections'
-- ELSE '16_20_sections' END AS band,
-- count(*) AS models,sum(staged_sections) AS staged_sections
-- FROM by_model GROUP BY band ORDER BY band;
-- Never auto-publish based on count, manufacturer or a source URL alone.
