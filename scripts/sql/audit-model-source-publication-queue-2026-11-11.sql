-- AnyBike research publication review queue — 11 November 2026
-- Read-only. Independent factory-source evidence does not equal permission
-- to publish. Editorial sign-off and the existing universal publication gate
-- remain compulsory; this query never modifies them.
WITH source_audits AS (
 SELECT fact_id,
 bool_or(source_url ~* '^https://' AND btrim(coalesce(verification_basis,''))<>''
         AND checked_at<=now()) AS has_independent_source_audit,
 array_agg(DISTINCT source_url) FILTER (WHERE source_url IS NOT NULL) AS audited_urls
 FROM public.motorcycle_catalog_fact_verification_audit GROUP BY fact_id
),
per_model AS (
 SELECT m.id AS model_id,m.manufacturer,m.model,
 count(f.id) AS fact_records,
 count(f.id) FILTER (WHERE f.verification_status='verified'
                     AND f.source_url ~* '^https://') AS verified_sourced,
 count(f.id) FILTER (WHERE f.verification_status='verified'
                     AND a.has_independent_source_audit IS TRUE
                     AND f.source_url=ANY(a.audited_urls)) AS verified_and_independently_audited,
 count(f.id) FILTER (WHERE f.verification_status='verified'
                     AND (a.has_independent_source_audit IS DISTINCT FROM TRUE
                          OR f.source_url IS DISTINCT FROM ALL(a.audited_urls))) AS verified_missing_matching_audit,
 count(f.id) FILTER (WHERE f.verification_status IS DISTINCT FROM 'verified'
                     OR f.source_url IS NULL) AS unverified_or_unsourced
 FROM public.motorcycle_catalog_models m
 LEFT JOIN public.motorcycle_catalog_facts f ON f.catalog_model_id=m.id
 LEFT JOIN source_audits a ON a.fact_id=f.id
 GROUP BY m.id,m.manufacturer,m.model
)
SELECT *,
 CASE
   WHEN verified_missing_matching_audit>0 THEN 'independent_source_audit_needed'
   WHEN verified_and_independently_audited>0 THEN 'editorial_review_candidate_not_publication_approval'
   WHEN unverified_or_unsourced>0 THEN 'fact_verification_needed'
   ELSE 'factory_source_research_needed'
 END AS next_review_queue
FROM per_model
ORDER BY verified_missing_matching_audit DESC,
 verified_and_independently_audited DESC,
 unverified_or_unsourced DESC,manufacturer,model,model_id;
