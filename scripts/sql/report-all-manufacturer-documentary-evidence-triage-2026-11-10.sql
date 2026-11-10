-- AnyBike: manufacturer-wide structured evidence triage (READ ONLY)
-- 10 November 2026. Does not alter canonical IDs, research, approvals,
-- public pages, stock access, or editorial verification state.
-- A matching audit is NOT a public publication decision.
--
-- Output: mutually exclusive work lanes for ALL structured catalogue
-- evidence; rows with no HTTPS source are isolated before review.
-- Exact model IDs / original URLs are never normalized or merged.

WITH evidence AS (
  SELECT 'fact'::text AS evidence_type, f.id AS evidence_id,
         f.catalog_model_id AS model_id, f.label AS item_title,
         f.verification_status, f.source_url,
         a.source_url AS audit_source_url, a.checked_at,
         a.verification_basis
  FROM public.motorcycle_catalog_facts f
  LEFT JOIN public.motorcycle_catalog_fact_verification_audit a
    ON a.fact_id=f.id
  UNION ALL
  SELECT 'generation', g.id, g.catalog_model_id, g.generation_name,
         g.verification_status, g.source_url,
         NULL::text, NULL::timestamptz, NULL::text
  FROM public.motorcycle_catalog_generations g
  UNION ALL
  SELECT 'timeline', t.id, t.catalog_model_id, t.title,
         t.verification_status, t.source_url,
         NULL::text, NULL::timestamptz, NULL::text
  FROM public.motorcycle_catalog_timeline_events t
), triaged AS (
  SELECT m.manufacturer, m.model, e.*,
    CASE
      WHEN e.source_url IS NULL OR e.source_url NOT LIKE 'https://%'
        THEN '01_missing_or_unsafe_source'
      WHEN e.evidence_type <> 'fact'
        THEN '05_history_requires_editorial_review'
      WHEN e.verification_status <> 'verified'
        THEN '04_fact_requires_source_review'
      WHEN e.audit_source_url IS NULL
        THEN '02_missing_independent_fact_audit'
      WHEN e.audit_source_url IS DISTINCT FROM e.source_url
        THEN '03_conflicting_fact_audit_url'
      WHEN e.checked_at IS NULL OR e.checked_at > now()
        OR nullif(btrim(e.verification_basis),'') IS NULL
        THEN '03_incomplete_fact_audit'
      ELSE '06_fact_audit_consistent_not_published'
    END AS review_lane
  FROM evidence e
  JOIN public.motorcycle_catalog_models m ON m.id=e.model_id
)
SELECT review_lane, evidence_type,
       count(*) AS evidence_rows,
       count(DISTINCT model_id) AS model_ids,
       count(DISTINCT manufacturer) AS manufacturer_labels
FROM triaged
GROUP BY review_lane, evidence_type
ORDER BY review_lane, evidence_type;

-- To inspect exact IDs, URLs and titles before independent source review,
-- replace the final SELECT above with the following SELECT, using the SAME
-- preceding CTEs:
--
-- SELECT review_lane, manufacturer, model, model_id, evidence_type,
--        evidence_id, item_title, source_url, audit_source_url,
--        verification_status, checked_at, verification_basis
-- FROM triaged
-- WHERE review_lane <> '06_fact_audit_consistent_not_published'
-- ORDER BY review_lane, manufacturer, model, model_id, evidence_id;
--
-- Never auto-add audit records for a mismatched URL, promote a pending
-- source, infer a missing exact model, or publish based on this report.
