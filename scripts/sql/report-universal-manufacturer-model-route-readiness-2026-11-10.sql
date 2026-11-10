-- AnyBike one-system coverage report for ALL 979+ canonical model IDs.
-- READ ONLY: no route publication, alias resolution or stock changes.
-- Do not infer that a source-verified *candidate* route is live.
WITH staged AS (
 SELECT model_id,count(*) AS sections,
 count(*) FILTER(WHERE editorial_status='published' OR published_at IS NOT NULL)
 AS published_like
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' GROUP BY model_id
), routes AS (
 SELECT model_id,count(*) AS registered_routes,
 count(*) FILTER(WHERE source_verified_at IS NOT NULL)
 AS source_checked_routes,
 count(*) FILTER(WHERE live_verified_at IS NOT NULL)
 AS live_checked_routes,
 count(*) FILTER(WHERE editorial_verified_at IS NOT NULL
 AND publication_state='published') AS approved_published_routes
 FROM anybike_publishing.editorial_page_routes
 WHERE entity_type='model' GROUP BY model_id
)
SELECT m.manufacturer,count(*) AS catalogue_models,
 count(*) FILTER(WHERE staged.model_id IS NOT NULL) AS staged_models,
 coalesce(sum(staged.sections),0) AS staged_sections,
 count(*) FILTER(WHERE routes.model_id IS NOT NULL) AS route_registered_models,
 coalesce(sum(routes.source_checked_routes),0) AS source_checked_routes,
 coalesce(sum(routes.live_checked_routes),0) AS live_checked_routes,
 coalesce(sum(routes.approved_published_routes),0) AS approved_published_routes,
 coalesce(sum(staged.published_like),0) AS sections_appearing_published
FROM public.motorcycle_catalog_models m
LEFT JOIN staged ON staged.model_id=m.id
LEFT JOIN routes ON routes.model_id=m.id
GROUP BY m.manufacturer ORDER BY catalogue_models DESC,m.manufacturer;
-- Registered source-checked routes are not proof of a real live URL.
-- No automatic approval or page generation is performed by this query.
