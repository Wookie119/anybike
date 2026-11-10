-- READ ONLY: the highest-coverage BMW universal candidates for editorial QA.
-- This is a release REVIEW WORKLIST, not a release/approval migration.
-- Never publish automatically based on source pointers or section count.
WITH staged AS (
 SELECT s.model_id,count(*) AS draft_sections,
 count(*) FILTER(WHERE s.section_number BETWEEN 1 AND 20) AS valid_slots,
 count(*) FILTER(WHERE s.editorial_status<>'draft' OR s.published_at IS NOT NULL) AS release_anomalies,
 count(*) FILTER(WHERE nullif(trim(s.source_reference),'') IS NULL) AS missing_source,
 count(*) FILTER(WHERE s.content->>'source_verification_status'='pending_review') AS content_pending
 FROM public.motorcycle_universal_page_sections_v1 s WHERE s.entity_type='model'
 GROUP BY s.model_id
), routes AS (
 SELECT model_id,
 count(*) AS route_records,
 count(*) FILTER(WHERE source_verified_at IS NOT NULL) AS source_verified_routes,
 count(*) FILTER(WHERE live_verified_at IS NOT NULL) AS live_verified_routes
 FROM anybike_publishing.editorial_page_routes
 WHERE entity_type='model' GROUP BY model_id
), aliases AS (
 SELECT alias_model_id,count(*) FILTER(WHERE review_status<>'approved') AS pending_aliases
 FROM public.motorcycle_catalog_model_aliases GROUP BY alias_model_id
)
SELECT m.id AS canonical_model_id,m.manufacturer,m.model,
 s.draft_sections AS existing_research_sections,
 20-s.draft_sections AS unfilled_slots_not_placeholders,
 coalesce(r.route_records,0) AS registered_routes,
 coalesce(r.source_verified_routes,0) AS source_checked_routes,
 coalesce(r.live_verified_routes,0) AS live_checked_routes,
 coalesce(a.pending_aliases,0) AS pending_aliases,
 s.content_pending AS sections_pending_source_review,
 s.release_anomalies,s.missing_source,
 CASE WHEN coalesce(a.pending_aliases,0)>0 THEN 'identity_review'
 WHEN s.release_anomalies>0 OR s.missing_source>0 THEN 'repair_staging_integrity'
 WHEN coalesce(r.live_verified_routes,0)=0 THEN 'independent_live_and_visual_QA'
 ELSE 'editorial_evidence_photo_rights_and_signoff'
 END AS next_work
FROM public.motorcycle_catalog_models m JOIN staged s ON s.model_id=m.id
LEFT JOIN routes r ON r.model_id=m.id
LEFT JOIN aliases a ON a.alias_model_id=m.id
WHERE m.manufacturer='BMW' AND s.draft_sections>=11
ORDER BY s.draft_sections DESC,m.model,m.id;
