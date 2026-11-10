-- AnyBike: exact-ID, fact-audit and source claim worklist. READ ONLY.
-- All review candidates retain source URL and canonical identity; no approval.
WITH fact_audits AS (
 SELECT f.id AS fact_id,f.catalog_model_id AS model_id,
  m.manufacturer,m.model,f.category,f.label,f.verification_status,
  f.source_url AS fact_source_url,a.source_url AS audit_source_url,
  a.checked_at,a.verification_basis,
  CASE
   WHEN f.verification_status <> 'verified' THEN 'pending_primary_source_review'
   WHEN f.source_url IS NULL OR f.source_url !~ '^https://[^[:space:]/@]+'
    THEN 'invalid_fact_source'
   WHEN a.fact_id IS NULL THEN 'missing_audit'
   WHEN a.source_url IS DISTINCT FROM f.source_url THEN 'source_audit_url_conflict'
   WHEN a.checked_at IS NULL OR a.checked_at > now() OR
        nullif(trim(a.verification_basis),'') IS NULL THEN 'incomplete_audit'
   ELSE 'fact_audit_consistent_not_editorially_approved'
  END AS gate
 FROM public.motorcycle_catalog_facts f
 JOIN public.motorcycle_catalog_models m ON m.id=f.catalog_model_id
 LEFT JOIN public.motorcycle_catalog_fact_verification_audit a ON a.fact_id=f.id
)
SELECT gate,manufacturer,count(*) AS fact_records,count(DISTINCT model_id) AS models,
 count(*) FILTER(WHERE verification_status='verified') AS marked_verified
FROM fact_audits GROUP BY gate,manufacturer ORDER BY gate,manufacturer;
-- To get individual review cases, use CTE above then:
-- SELECT fact_id,model_id,manufacturer,model,category,label,
--        verification_status,fact_source_url,audit_source_url,
--        checked_at,verification_basis,gate FROM fact_audits
-- WHERE gate <> 'fact_audit_consistent_not_editorially_approved'
-- ORDER BY gate,manufacturer,model,model_id,fact_id;
-- Never manufacture a missing audit row or set editorial approval here.
