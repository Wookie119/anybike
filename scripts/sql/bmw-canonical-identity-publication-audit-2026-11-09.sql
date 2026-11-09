-- AnyBike BMW canonical identity and publication audit, 2026-11-09.
-- READ ONLY. No source rows changed; no public publication or permission changes.
-- Run in the connected Supabase SQL editor to inspect the entire BMW range.
WITH bmw AS (
 SELECT m.id,m.model,m.slug
 FROM public.motorcycle_catalog_models m WHERE m.manufacturer='BMW'
), coverage AS (
 SELECT b.id,b.model,b.slug,
 EXISTS(SELECT 1 FROM public.motorcycle_model_v2_editorial e WHERE e.model_id=b.id) AS has_editorial,
 (SELECT count(*) FROM public.motorcycle_catalog_facts f WHERE f.catalog_model_id=b.id AND f.verification_status='verified') AS verified_fact_count,
 (SELECT count(*) FROM public.motorcycle_catalog_model_year_media y WHERE y.model_id=b.id AND y.publication_enabled) AS published_year_media_count,
 (SELECT count(*) FROM public.available_stock s
  WHERE lower(s.make)='bmw' AND s.status='Active' AND s.lifecycle_status='live'
  AND lower(regexp_replace(s.model,'[^a-zA-Z0-9]','','g'))=lower(regexp_replace(b.model,'[^a-zA-Z0-9]','','g'))
 ) AS matching_stock_name_candidates
 FROM bmw b
)
SELECT id,model,slug,has_editorial,verified_fact_count,published_year_media_count,matching_stock_name_candidates,
 CASE WHEN model ~* '(APR|representative|finance|offer)' THEN 'review_model_identity'
      WHEN NOT has_editorial THEN 'missing_editorial'
      WHEN verified_fact_count=0 THEN 'research_gap'
      ELSE 'data_present_not_publication_verified' END AS audit_status
FROM coverage ORDER BY id;
-- IMPORTANT: matching_stock_name_candidates is diagnostic ONLY, not a safe publication join.
-- Production stock-to-model linking must use validated manufacturer_id and model_id,
-- preserving UK/international/anonymous publication entitlements.
