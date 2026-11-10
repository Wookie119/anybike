-- AnyBike multi-manufacturer draft provenance audit: READ ONLY.
-- Distinguishes private source captures from reviewed and public releases.
-- Source review is a separate editorial step, not implied by a Git commit.
SELECT m.manufacturer,count(DISTINCT s.model_id) AS staged_models,
 count(*) AS draft_sections,
 count(*) FILTER(WHERE s.section_number=1) AS introductions,
 count(*) FILTER(WHERE s.section_number=3) AS history,
 count(*) FILTER(WHERE s.section_number=6) AS generations,
 count(*) FILTER(WHERE s.section_number=12) AS technical_references,
 count(*) FILTER(WHERE s.section_number=16) AS buying_guidance,
 count(*) FILTER(WHERE s.editorial_status<>'draft' OR s.published_at IS NOT NULL)
  AS non_draft_rows,
 count(*) FILTER(WHERE coalesce(s.content->>'source_verification_status','')<>'pending_review')
  AS missing_pending_source_review,
 count(*) FILTER(WHERE nullif(trim(s.source_reference),'') IS NULL)
  AS missing_source_reference
FROM public.motorcycle_universal_page_sections_v1 s
JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
WHERE s.entity_type='model' AND (
 s.source_reference LIKE 'harley-davidson-%.html@%'
 OR s.source_reference LIKE 'motorcycle_catalog_models.overview:model_id=%'
 OR s.source_reference LIKE 'data/motorcycle-model-guides.json:ducati@%'
)
GROUP BY m.manufacturer ORDER BY m.manufacturer;

-- Imported Harley guide source revision and canonical model identity.
SELECT s.model_id,m.manufacturer,m.model,s.section_number,s.section_key,
 s.source_reference,s.editorial_status,
 s.content->>'source_origin' AS source_path,
 s.content->>'source_revision' AS source_sha,
 s.content->>'source_category' AS captured_category,
 s.content->>'review_state' AS review_state,
 s.content->>'source_verification_status' AS source_review
FROM public.motorcycle_universal_page_sections_v1 s
JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
WHERE s.source_reference LIKE 'harley-davidson-%.html@%'
ORDER BY m.model,s.section_number;

-- Fail-closed release exceptions for all three recent cross-brand imports.
SELECT s.id,s.model_id,s.section_number,s.editorial_status,s.published_at,
 s.source_reference
FROM public.motorcycle_universal_page_sections_v1 s
WHERE (s.source_reference LIKE 'harley-davidson-%.html@%'
 OR s.source_reference LIKE 'motorcycle_catalog_models.overview:model_id=%'
 OR s.source_reference LIKE 'data/motorcycle-model-guides.json:ducati@%')
AND (
 s.editorial_status<>'draft' OR s.published_at IS NOT NULL
 OR s.content->>'source_verification_status'<>'pending_review'
 OR nullif(trim(s.source_reference),'') IS NULL)
ORDER BY s.model_id,s.section_number;

-- Global publication result, independent of the above source audits.
SELECT count(*) AS actually_published_universal_sections
FROM public.motorcycle_universal_published_sections_v1;
