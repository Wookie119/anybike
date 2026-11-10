-- AnyBike universal model editorial/readiness funnel. READ ONLY.
-- Each of the canonical model records appears in exactly one queue.
-- Staged research is NOT a public page. Route source verification is not
-- equivalent to live page verification, editorial approval or stock access.
WITH staged AS (
 SELECT model_id,count(*) AS sections,
 count(*) FILTER(WHERE editorial_status<>'draft' OR published_at IS NOT NULL) AS state_anomalies,
 count(*) FILTER(WHERE coalesce(content->>'source_verification_status','pending_review')='pending_review') AS pending_claim_sections,
 count(*) FILTER(WHERE content ? 'source_url') AS source_url_sections
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' GROUP BY model_id
), facts AS (
 SELECT catalog_model_id,count(*) AS facts,
 count(*) FILTER(WHERE verification_status='verified') AS flagged_verified,
 count(*) FILTER(WHERE verification_status='verified'
       AND (a.fact_id IS NULL OR a.checked_at IS NULL OR a.source_url IS DISTINCT FROM f.source_url)) AS verified_audit_gap,
 count(*) FILTER(WHERE verification_status<>'verified') AS pending_facts
 FROM public.motorcycle_catalog_facts f
 LEFT JOIN public.motorcycle_catalog_fact_verification_audit a ON a.fact_id=f.id
 GROUP BY catalog_model_id
), aliases AS (
 SELECT alias_model_id,count(*) FILTER(WHERE review_status<>'approved') AS unapproved
 FROM public.motorcycle_catalog_model_aliases GROUP BY alias_model_id
), registry AS (
 SELECT display_name FROM public.motorcycle_catalog_manufacturers
), routes AS (
 SELECT model_id,count(*) AS route_candidates,
 count(*) FILTER(WHERE source_verified_at IS NOT NULL) AS source_checked,
 count(*) FILTER(WHERE live_verified_at IS NOT NULL) AS live_checked,
 count(*) FILTER(WHERE editorial_verified_at IS NOT NULL AND publication_state='published') AS approved_routes
 FROM anybike_publishing.editorial_page_routes WHERE entity_type='model'
 GROUP BY model_id
), classified AS (
 SELECT m.id,m.manufacturer,m.model,
 coalesce(s.sections,0) AS sections,
 coalesce(f.facts,0) AS facts,
 coalesce(f.flagged_verified,0) AS verified_facts,
 coalesce(f.verified_audit_gap,0) AS audit_gaps,
 coalesce(f.pending_facts,0) AS pending_facts,
 coalesce(s.pending_claim_sections,0) AS pending_section_review,
 coalesce(r.route_candidates,0) AS route_candidates,
 coalesce(r.live_checked,0) AS live_checked_routes,
 CASE
 WHEN reg.display_name IS NULL OR coalesce(a.unapproved,0)>0
   THEN '01_identity_review'
 WHEN coalesce(s.state_anomalies,0)>0 OR coalesce(f.verified_audit_gap,0)>0
   THEN '02_integrity_or_audit_fix'
 WHEN coalesce(s.sections,0)=0
   THEN '03_manufacturer_primary_research'
 WHEN coalesce(s.pending_claim_sections,0)>0 OR coalesce(f.pending_facts,0)>0
   THEN '04_source_and_editorial_review'
 WHEN coalesce(r.route_candidates,0)=0 OR coalesce(r.live_checked,0)=0
   THEN '05_route_and_live_verification'
 ELSE '06_final_release_preflight'
 END AS next_gate
 FROM public.motorcycle_catalog_models m
 LEFT JOIN staged s ON s.model_id=m.id
 LEFT JOIN facts f ON f.catalog_model_id=m.id
 LEFT JOIN aliases a ON a.alias_model_id=m.id
 LEFT JOIN registry reg ON reg.display_name=m.manufacturer
 LEFT JOIN routes r ON r.model_id=m.id
)
SELECT next_gate,count(*) AS models,sum(sections) AS draft_sections,
 sum(facts) AS fact_records,sum(verified_facts) AS flagged_verified_facts,
 sum(audit_gaps) AS audited_fact_gaps,sum(pending_facts) AS pending_facts,
 sum(route_candidates) AS registered_route_records,
 sum(live_checked_routes) AS live_checked_route_records
FROM classified GROUP BY next_gate ORDER BY next_gate;
-- NOTE: to inspect concrete models, reuse classified and instead SELECT
-- id,manufacturer,model,sections,facts,audit_gaps,route_candidates,next_gate
-- FROM classified WHERE next_gate='02_integrity_or_audit_fix'
-- ORDER BY manufacturer,model,id;
-- All queued items remain non-public pending a separate written approval.
