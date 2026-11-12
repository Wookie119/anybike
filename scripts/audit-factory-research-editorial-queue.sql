-- AnyBike factory research editorial review queue
-- Read-only: never promote a fact without checking exact model identity,
-- primary manufacturer source, publication scope and editorial approval.
-- Run in the Supabase SQL editor. The public RPC remains the sole source
-- for the browser; pending facts must not appear on public pages.

-- 1. Prioritise the 22 pending facts with existing manufacturer evidence.
SELECT c.make,c.model,f.id AS fact_id,f.category,f.label,
       f.source_name,f.source_url,f.verification_status,
       CASE
        WHEN f.source_url IS NULL THEN 'Find primary manufacturer source'
        WHEN h.fact_id IS NOT NULL THEN 'Resolve catalogue identity hold'
        WHEN f.category='editorial_photo_reference' THEN 'Check photo-bank licence and template scope'
        ELSE 'Check source claim, model identity, date and market'
       END AS next_editorial_action
FROM public.motorcycle_catalog_facts f
JOIN public.anybike_public_model_research_coverage_v1 c
 ON c.model_id=f.catalog_model_id
LEFT JOIN public.anybike_model_research_publication_holds_v1 h
 ON h.fact_id=f.id
WHERE f.verification_status='pending_review'
ORDER BY CASE WHEN f.source_url IS NOT NULL THEN 0 ELSE 1 END,
         CASE WHEN h.fact_id IS NOT NULL THEN 1 ELSE 0 END,
         c.make,c.model,f.id;

-- 2. Publication holds must be resolved explicitly, not bypassed.
SELECT make,model,fact_id,category,label,hold_reason,
       review_status,source_audited,research_section_supported
FROM public.anybike_model_research_publication_holds_v1
ORDER BY make,model,fact_id;

-- 3. Identify research-rich motorcycles awaiting licensed gallery coverage.
SELECT make,model,verified_research_facts,
       approved_hero_photos,approved_gallery_photos
FROM public.anybike_public_model_research_coverage_v1
WHERE verified_research_facts>0 AND approved_gallery_photos=0
ORDER BY verified_research_facts DESC,make,model
LIMIT 100;

-- 4. Manufacturer-level research gaps, including no-research models.
SELECT make,COUNT(*) AS public_models,
       COUNT(*) FILTER (WHERE verified_research_facts>0) AS researched_models,
       SUM(verified_research_facts) AS published_verified_facts,
       COUNT(*) FILTER (WHERE approved_gallery_photos>0) AS models_with_approved_gallery
FROM public.anybike_public_model_research_coverage_v1
GROUP BY make
ORDER BY COUNT(*) FILTER (WHERE verified_research_facts=0) DESC,make;

-- 5. Spot potentially duplicated claims within the same exact model.
-- These are review signals, not instructions to delete historical facts.
SELECT c.make,c.model,f.category,f.label,
       COUNT(*) AS matching_records,
       ARRAY_AGG(f.id ORDER BY f.id) AS fact_ids
FROM public.motorcycle_catalog_facts f
JOIN public.anybike_public_model_research_coverage_v1 c
 ON c.model_id=f.catalog_model_id
GROUP BY c.make,c.model,f.category,f.label
HAVING COUNT(*)>1
ORDER BY matching_records DESC,c.make,c.model,f.category;

-- 6. Public readiness: a fact marked verified is not necessarily
-- publishable until source audit, category and identity checks pass.
SELECT f.verification_status,
       COUNT(*) AS stored_facts,
       COUNT(*) FILTER (WHERE f.source_url IS NULL) AS without_primary_url,
       COUNT(*) FILTER (WHERE h.fact_id IS NOT NULL) AS publication_holds
FROM public.motorcycle_catalog_facts f
LEFT JOIN public.anybike_model_research_publication_holds_v1 h
 ON h.fact_id=f.id
GROUP BY f.verification_status
ORDER BY f.verification_status;

-- 7. Existing manufacturer/document URLs waiting for editorial extraction.
-- These source URLs already exist in the database; they are NOT verified facts.
-- Prioritise motorcycles that currently have no public research.
SELECT c.make,c.model,c.verified_research_facts,
       COUNT(DISTINCT s.source_url) AS candidate_sources,
       ARRAY_AGG(DISTINCT s.source_url ORDER BY s.source_url) AS review_urls,
       'https://www.anybike.co.uk/motorcycle-model-guide.html?make=' ||
         replace(c.make,' ','%20') || '&model=' ||
         replace(c.model,' ','%20') AS public_review_page
FROM public.motorcycle_catalog_editorial_source_index s
JOIN public.anybike_public_model_research_coverage_v1 c
 ON c.model_id=s.model_id
WHERE s.verification_status='pending_review'
  AND s.source_url ~* '^https://'
GROUP BY c.make,c.model,c.verified_research_facts
ORDER BY CASE WHEN c.verified_research_facts=0 THEN 0 ELSE 1 END,
         candidate_sources DESC,c.make,c.model
LIMIT 120;

-- 8. Count how much of the existing source-index backlog could be researched
-- without inventing new source URLs. No auto-verification or auto-publication.
SELECT COUNT(*) AS pending_source_links,
       COUNT(DISTINCT s.model_id) AS models_with_source_candidates,
       COUNT(DISTINCT s.model_id) FILTER
         (WHERE c.verified_research_facts=0) AS unresearched_models_with_sources
FROM public.motorcycle_catalog_editorial_source_index s
JOIN public.anybike_public_model_research_coverage_v1 c
 ON c.model_id=s.model_id
WHERE s.verification_status='pending_review';

-- 9. Manufacturer-wide publication batches, not one model at a time.
-- Use this to allocate source-extraction batches without changing public data.
-- A source link alone is never an approved factual claim.
WITH candidate AS (
 SELECT c.model_id,c.make,c.model,c.verified_research_facts,
        COUNT(DISTINCT s.source_url) FILTER
          (WHERE s.verification_status='pending_review'
             AND s.source_url ~* '^https://') AS source_count
 FROM public.anybike_public_model_research_coverage_v1 c
 LEFT JOIN public.motorcycle_catalog_editorial_source_index s
   ON s.model_id=c.model_id
 GROUP BY c.model_id,c.make,c.model,c.verified_research_facts
)
SELECT make,
       COUNT(*) AS catalogue_models,
       COUNT(*) FILTER (WHERE verified_research_facts=0) AS no_research_models,
       COUNT(*) FILTER (WHERE verified_research_facts=0 AND source_count>0)
         AS source_ready_for_fact_review,
       COUNT(*) FILTER (WHERE verified_research_facts=0 AND source_count=0)
         AS needs_source_discovery,
       SUM(source_count) AS pending_candidate_urls
FROM candidate
GROUP BY make
ORDER BY source_ready_for_fact_review DESC,
         no_research_models DESC,make;

-- 10. Next 100 exact-model manufacturer source reviews. Work through the
-- whole output as a batch. Never conflate model variants or generations.
WITH queue AS (
 SELECT c.model_id,c.make,c.model,
        COUNT(DISTINCT s.source_url) AS candidate_sources,
        ARRAY_AGG(DISTINCT s.source_url ORDER BY s.source_url) AS source_urls
 FROM public.anybike_public_model_research_coverage_v1 c
 JOIN public.motorcycle_catalog_editorial_source_index s
   ON s.model_id=c.model_id
 WHERE c.verified_research_facts=0
   AND s.verification_status='pending_review'
   AND s.source_url ~* '^https://'
 GROUP BY c.model_id,c.make,c.model
)
SELECT make,model,model_id,candidate_sources,source_urls,
       'Verify source and model/year; write facts into approved sections; audit; publish' AS action
FROM queue
ORDER BY candidate_sources DESC,make,model
LIMIT 100;
