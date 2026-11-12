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
