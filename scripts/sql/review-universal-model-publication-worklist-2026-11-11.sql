-- AnyBike universal model editorial review queue — 11 November 2026.
-- READ ONLY: verified individual facts do not approve an entire model section.
-- Preserve BMW R 1300 GS and Harley-Davidson approved page layouts.
WITH staged AS (
 SELECT s.model_id,
        count(*) AS draft_sections,
        count(*) FILTER (WHERE s.source_reference IS NULL OR btrim(s.source_reference)='') AS missing_stage_reference,
        count(*) FILTER (WHERE s.content IS NULL OR s.content='{}'::jsonb OR s.content='null'::jsonb) AS blank_content,
        count(DISTINCT s.section_key) AS distinct_sections,
        string_agg(DISTINCT s.section_key, ', ' ORDER BY s.section_key) AS section_keys
 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model' AND s.editorial_status='draft'
 GROUP BY s.model_id
), independently_audited AS (
 SELECT f.catalog_model_id AS model_id,
        count(*) AS audited_fact_count
 FROM public.motorcycle_catalog_facts f
 WHERE f.verification_status='verified'
   AND f.source_url ~ '^https://[^[:space:]]+$'
   AND EXISTS (
      SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
      WHERE a.fact_id=f.id AND a.source_url=f.source_url
        AND nullif(btrim(a.verification_basis),'') IS NOT NULL
        AND a.checked_at IS NOT NULL AND a.checked_at<=now()
   )
 GROUP BY f.catalog_model_id
), summary AS (
 SELECT m.id AS model_id,m.manufacturer,m.model,m.slug,
        s.draft_sections,s.distinct_sections,s.missing_stage_reference,s.blank_content,
        s.section_keys,coalesce(a.audited_fact_count,0) AS audited_fact_count,
        (c.model_id IS NOT NULL) AS clean_public_identity,
        EXISTS(SELECT 1 FROM public.motorcycle_catalog_name_reviews r
               WHERE r.catalog_model_id=m.id AND r.review_status='pending_review') AS pending_catalogue_review,
        EXISTS(SELECT 1 FROM public.motorcycle_catalog_model_aliases al
               WHERE al.alias_model_id=m.id) AS alias_record,
        (SELECT count(*) FROM public.motorcycle_universal_published_sections_v1 p
         WHERE p.entity_type='model' AND p.entity_id=m.id AND p.publication_eligible=true) AS eligible_published_sections
 FROM staged s
 JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
 LEFT JOIN independently_audited a ON a.model_id=m.id
 LEFT JOIN public.motorcycle_catalog_dropdown_clean c ON c.model_id=m.id
)
SELECT model_id,manufacturer,model,slug,draft_sections,distinct_sections,
       audited_fact_count,missing_stage_reference,blank_content,clean_public_identity,
       pending_catalogue_review,alias_record,eligible_published_sections,section_keys,
       CASE
        WHEN pending_catalogue_review THEN 'resolve_identity_before_editorial_approval'
        WHEN alias_record OR NOT clean_public_identity THEN 'resolve_canonical_catalogue_identity'
        WHEN blank_content>0 THEN 'repair_empty_section_draft'
        WHEN missing_stage_reference>0 THEN 'document_stage_provenance'
        WHEN audited_fact_count>0 THEN 'editorial_section_review_candidate_not_approved'
        ELSE 'obtain_and_independently_audit_model_sources'
       END AS next_action
FROM summary
ORDER BY
 CASE WHEN pending_catalogue_review OR alias_record OR NOT clean_public_identity THEN 2
      WHEN audited_fact_count>0 AND blank_content=0 AND missing_stage_reference=0 THEN 0
      ELSE 1 END,
 audited_fact_count DESC,draft_sections DESC,manufacturer,model;

-- Summary check (execute separately):
-- SELECT count(*) FROM public.motorcycle_universal_published_sections_v1
-- WHERE entity_type='model' AND publication_eligible=true;
-- This must not be inferred from draft count or model-level source coverage.
