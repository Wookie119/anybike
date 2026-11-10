-- AnyBike ALL-MANUFACTURER structured evidence review (READ ONLY).
-- Evidence source verification is NOT editorial publication approval.
-- 399 existing catalogue facts/generations/timeline records are reviewed
-- without changing model IDs, public HTML, stock entitlements or approval.
-- Do not auto-create verification audits: a person must check each source.

-- A. Verified facts: require a separate audit with the SAME HTTPS source
-- as the fact. A changed source URL is a new verification task, not a
-- cosmetic mismatch to silently overwrite.
WITH reviews AS (
 SELECT f.id AS fact_id,f.catalog_model_id,m.manufacturer,m.model,
   f.category,f.label,f.verification_status,f.source_url,
   CASE
     WHEN a.fact_id IS NULL THEN 'missing_verification_audit'
     WHEN nullif(trim(a.verification_basis),'') IS NULL THEN 'missing_verification_basis'
     WHEN a.checked_at IS NULL OR a.checked_at>now() THEN 'invalid_audit_date'
     WHEN a.source_url IS NULL OR a.source_url NOT LIKE 'https://%'
       THEN 'invalid_audit_url'
     WHEN a.source_url IS DISTINCT FROM f.source_url THEN 'source_url_disagrees_with_audit'
     WHEN f.source_url IS NULL OR f.source_url NOT LIKE 'https://%'
       THEN 'invalid_fact_source_url'
     ELSE 'audited_source_consistent' END AS audit_status
 FROM public.motorcycle_catalog_facts f
 JOIN public.motorcycle_catalog_models m ON m.id=f.catalog_model_id
 LEFT JOIN public.motorcycle_catalog_fact_verification_audit a ON a.fact_id=f.id
 WHERE f.verification_status='verified'
)
SELECT audit_status,count(*) facts,count(DISTINCT catalog_model_id) model_ids,
 count(DISTINCT manufacturer) manufacturer_labels
FROM reviews GROUP BY audit_status ORDER BY audit_status;

-- B. Exact fact-level worklist: no label-only deduplication.
SELECT f.id AS fact_id,f.catalog_model_id,m.manufacturer,m.model,
 f.category,f.label,f.source_url AS fact_source_url,
 a.source_url AS verification_source_url,a.checked_at,a.verification_basis,
 CASE WHEN a.fact_id IS NULL THEN 'missing_verification_audit'
      WHEN nullif(trim(a.verification_basis),'') IS NULL THEN 'missing_verification_basis'
      WHEN a.checked_at IS NULL OR a.checked_at>now() THEN 'invalid_audit_date'
      WHEN a.source_url IS NULL OR a.source_url NOT LIKE 'https://%'
         THEN 'invalid_audit_url'
      WHEN a.source_url IS DISTINCT FROM f.source_url THEN 'source_url_disagrees_with_audit'
      WHEN f.source_url IS NULL OR f.source_url NOT LIKE 'https://%'
         THEN 'invalid_fact_source_url'
      ELSE 'audited_source_consistent' END AS audit_status
FROM public.motorcycle_catalog_facts f
JOIN public.motorcycle_catalog_models m ON m.id=f.catalog_model_id
LEFT JOIN public.motorcycle_catalog_fact_verification_audit a ON a.fact_id=f.id
WHERE f.verification_status='verified'
ORDER BY m.manufacturer,m.model,f.id;

-- C. Nonfact historical records are a separate editorial queue; a
-- manufacturer timeline should not become approved history automatically.
SELECT record_type,verification_status,
 count(*) entries,count(DISTINCT catalog_model_id) models
FROM (
 SELECT 'fact' record_type,catalog_model_id,verification_status
 FROM public.motorcycle_catalog_facts
 UNION ALL
 SELECT 'generation',catalog_model_id,verification_status
 FROM public.motorcycle_catalog_generations
 UNION ALL
 SELECT 'timeline_event',catalog_model_id,verification_status
 FROM public.motorcycle_catalog_timeline_events
) data
GROUP BY record_type,verification_status
ORDER BY record_type,verification_status;

-- D. Work by manufacturer; deliberately separate verified facts with
-- a consistent audit from pending generation and historical records.
WITH evidence AS (
 SELECT m.manufacturer,m.id AS model_id,'fact' AS kind,
   f.id AS evidence_id,f.verification_status,
   CASE WHEN a.fact_id IS NOT NULL
     AND nullif(trim(a.verification_basis),'') IS NOT NULL
     AND a.checked_at IS NOT NULL AND a.checked_at<=now()
     AND a.source_url=f.source_url AND f.source_url LIKE 'https://%'
      THEN true ELSE false END AS audit_complete
 FROM public.motorcycle_catalog_models m
 JOIN public.motorcycle_catalog_facts f ON f.catalog_model_id=m.id
 LEFT JOIN public.motorcycle_catalog_fact_verification_audit a ON a.fact_id=f.id
 UNION ALL
 SELECT m.manufacturer,m.id,'generation',g.id,g.verification_status,false
 FROM public.motorcycle_catalog_models m
 JOIN public.motorcycle_catalog_generations g ON g.catalog_model_id=m.id
 UNION ALL
 SELECT m.manufacturer,m.id,'timeline',e.id,e.verification_status,false
 FROM public.motorcycle_catalog_models m
 JOIN public.motorcycle_catalog_timeline_events e ON e.catalog_model_id=m.id
)
SELECT manufacturer,count(DISTINCT model_id) covered_models,
 count(*) evidence_entries,
 count(*) FILTER (WHERE kind='fact' AND verification_status='verified'
   AND audit_complete) verified_consistent_facts,
 count(*) FILTER (WHERE kind='fact' AND verification_status='verified'
   AND NOT audit_complete) verified_facts_needing_audit,
 count(*) FILTER (WHERE kind='fact' AND verification_status<>'verified')
   fact_pending_review,
 count(*) FILTER (WHERE kind='generation') generations_pending_review,
 count(*) FILTER (WHERE kind='timeline') timeline_pending_review
FROM evidence GROUP BY manufacturer ORDER BY evidence_entries DESC,manufacturer;

-- E. Strict public release confirmation, not inferred from audits.
SELECT count(*) AS actual_published_universal_sections
FROM public.motorcycle_universal_published_sections_v1;

-- F. Independent fact-audit URL discrepancy triage. Query-parameter-only
-- changes still need review, but different paths may describe different
-- model years, country editions or separate factory announcements.
SELECT m.manufacturer,m.model,f.catalog_model_id,f.id AS fact_id,
 f.source_url AS canonical_fact_source,
 a.source_url AS audited_source,
 CASE
  WHEN split_part(f.source_url,'?',1)=split_part(a.source_url,'?',1)
    THEN 'same_path_query_parameters_differ'
  ELSE 'different_document_url_path' END AS discrepancy_type
FROM public.motorcycle_catalog_facts f
JOIN public.motorcycle_catalog_models m ON m.id=f.catalog_model_id
JOIN public.motorcycle_catalog_fact_verification_audit a ON a.fact_id=f.id
WHERE f.verification_status='verified'
 AND a.source_url IS DISTINCT FROM f.source_url
ORDER BY m.manufacturer,m.model,f.id;

-- Summary for large-batch independent source review.
SELECT CASE
  WHEN split_part(f.source_url,'?',1)=split_part(a.source_url,'?',1)
    THEN 'same_path_query_parameters_differ'
  ELSE 'different_document_url_path' END AS discrepancy_type,
 count(*) AS facts,count(DISTINCT f.catalog_model_id) AS canonical_models
FROM public.motorcycle_catalog_facts f
JOIN public.motorcycle_catalog_fact_verification_audit a ON a.fact_id=f.id
WHERE f.verification_status='verified'
 AND a.source_url IS DISTINCT FROM f.source_url
GROUP BY 1 ORDER BY discrepancy_type;
