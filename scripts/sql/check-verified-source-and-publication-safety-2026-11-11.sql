-- AnyBike verified-source and publication safety gate | 11 November 2026
-- Read-only QA. Run after each research verification/import batch.
-- Independent audit matching requires same fact ID AND source URL; a similar
-- factory article in another country/locale remains a reconciliation item.
-- Verified source evidence alone NEVER grants universal editorial approval.
WITH fact_audit AS (
 SELECT f.id fact_id,f.catalog_model_id model_id,f.verification_status,
        f.source_url fact_url,a.source_url audit_url,
        nullif(btrim(a.verification_basis),'') audit_basis,a.checked_at,
        (a.fact_id IS NOT NULL) audit_exists
 FROM public.motorcycle_catalog_facts f
 LEFT JOIN public.motorcycle_catalog_fact_verification_audit a ON a.fact_id=f.id
),
classed AS (
 SELECT *,
 CASE
  WHEN verification_status IS DISTINCT FROM 'verified' THEN 'pending_fact_verification'
  WHEN fact_url IS NULL OR fact_url !~* '^https://' THEN 'missing_valid_factory_source'
  WHEN NOT audit_exists THEN 'missing_independent_audit'
  WHEN audit_url IS DISTINCT FROM fact_url THEN 'alternate_audit_url_review'
  WHEN audit_basis IS NULL OR checked_at IS NULL OR checked_at>now() THEN 'incomplete_audit_record'
  ELSE 'independently_audited'
 END AS evidence_state
 FROM fact_audit
)
SELECT evidence_state,count(*) AS fact_count,
 count(DISTINCT model_id) AS affected_models
FROM classed GROUP BY evidence_state ORDER BY evidence_state;

-- Cross-check the corrected CB750 domestic market date against the exact
-- factory announcement (18 July 1969), without changing the data.
SELECT f.id,f.value,f.source_url,
 CASE WHEN f.catalog_model_id=1043
       AND f.category='history'
       AND f.label='Japanese market launch'
       AND f.value=to_jsonb('10 August 1969'::text)
       AND f.source_url='https://global.honda/jp/news/1969/2690728.html'
      THEN 'PASS'
      ELSE 'REVIEW_REQUIRED' END AS factory_date_guard
FROM public.motorcycle_catalog_facts f WHERE f.id=25;

-- No universal draft becomes public simply because fact sources are checked.
SELECT count(*) FILTER (WHERE entity_type='model' AND editorial_status='draft') AS model_draft_sections,
 count(*) FILTER (WHERE entity_type='model' AND editorial_status IN ('approved','published')) AS approved_or_published_model_staging
FROM public.motorcycle_universal_page_sections_v1;

SELECT count(*) AS published_universal_model_sections
FROM public.motorcycle_universal_published_sections_v1
WHERE entity_type='model' AND publication_eligible IS TRUE;
