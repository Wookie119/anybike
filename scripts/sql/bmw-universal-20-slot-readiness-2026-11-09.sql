-- AnyBike BMW universal 20-slot publishing readiness, 9 November 2026.
-- READ ONLY. A staged slot is not a published section and an empty slot
-- must never be filled with invented or unrelated motorcycle data.
WITH bmw AS (
 SELECT id,model,slug FROM public.motorcycle_catalog_models
 WHERE manufacturer='BMW'
), slots AS (
 SELECT model_id,count(*) AS staged_slots,
 count(*) FILTER (WHERE editorial_status='draft') AS draft_slots,
 count(*) FILTER (WHERE editorial_status='published' AND published_at IS NOT NULL) AS published_slots
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model'
 GROUP BY model_id
), routes AS (
 SELECT model_id,count(*) FILTER (WHERE source_verified_at IS NOT NULL) AS source_routes,
 count(*) FILTER (WHERE live_verified_at IS NOT NULL) AS live_routes
 FROM anybike_publishing.editorial_page_routes
 WHERE entity_type='model'
 GROUP BY model_id
)
SELECT b.id,b.model,b.slug,
 COALESCE(s.staged_slots,0) AS staged_of_20,
 20-COALESCE(s.staged_slots,0) AS unfilled_slots,
 COALESCE(s.published_slots,0) AS published_slots,
 COALESCE(r.source_routes,0) AS source_verified_routes,
 COALESCE(r.live_routes,0) AS live_verified_routes,
 CASE
  WHEN b.model ~* '(APR|representative|finance|deposit|monthly payment|PCP|[0-9]+[.]?[0-9]*[[:space:]]*%)' THEN 'BLOCK_NON_MODEL_PROMOTION'
  WHEN COALESCE(s.staged_slots,0)=0 THEN 'STAGE_SOURCE_RESEARCH'
  WHEN COALESCE(r.source_routes,0)=0 THEN 'REVIEW_ROUTE_AND_CANONICAL'
  WHEN COALESCE(r.live_routes,0)=0 THEN 'VERIFY_LIVE_ROUTE'
  ELSE 'EDITORIAL_AND_DESIGN_REVIEW'
 END AS next_review
FROM bmw b LEFT JOIN slots s ON s.model_id=b.id
LEFT JOIN routes r ON r.model_id=b.id
ORDER BY next_review,b.model;

-- Independently verify no candidate draft is exposed in the public projection.
SELECT count(*) AS public_eligible_sections
FROM public.motorcycle_universal_published_sections_v1
WHERE publication_eligible=true;
