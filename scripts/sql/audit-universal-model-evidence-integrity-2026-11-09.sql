-- AnyBike shared 20-slot evidence integrity checks (read only).
-- Expected results: all checks zero, except count columns explicitly labelled.
WITH reference_rows AS (
 SELECT s.model_id,s.section_number,
   e->>'fact_id' AS fact_id_text,
   e->>'source_verification_status' AS source_status,
   e->>'source_url' AS listed_source
 FROM public.motorcycle_universal_page_sections_v1 s
 CROSS JOIN LATERAL jsonb_array_elements(
   CASE WHEN jsonb_typeof(s.content->'verified_catalogue_facts')='array'
    THEN s.content->'verified_catalogue_facts' ELSE '[]'::jsonb END
 ) e
 WHERE s.entity_type='model'
), valid_refs AS (
 SELECT r.*,f.id fact_id,f.catalog_model_id,f.verification_status,f.source_url
 FROM reference_rows r
 LEFT JOIN public.motorcycle_catalog_facts f
 ON f.id=CASE WHEN r.fact_id_text ~ '^[0-9]+$'
    THEN r.fact_id_text::bigint ELSE NULL END
)
SELECT
 (SELECT count(*) FROM valid_refs) AS evidence_links,
 (SELECT count(*) FROM valid_refs
   WHERE catalog_model_id IS DISTINCT FROM model_id
    OR verification_status IS DISTINCT FROM 'verified'
    OR source_status IS DISTINCT FROM 'verified'
    OR listed_source IS DISTINCT FROM source_url) AS invalid_source_or_model_links,
 (SELECT count(*) FROM (
   SELECT model_id,fact_id_text FROM valid_refs GROUP BY 1,2 HAVING count(*)>1
 ) repeated) AS duplicate_model_evidence,
 (SELECT count(*) FROM public.motorcycle_universal_page_sections_v1
   WHERE editorial_status<>'draft' OR published_at IS NOT NULL) AS staged_sections_inappropriately_published,
 (SELECT count(*) FROM public.motorcycle_universal_published_sections_v1) AS released_sections;
