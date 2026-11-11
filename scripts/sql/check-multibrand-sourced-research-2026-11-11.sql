-- AnyBike 11 November 2026 multi-manufacturer public research coverage
-- READ ONLY. Exact identities, approved audit evidence and no draft publishing.
-- Run after each large source import before requesting visual sign-off.
WITH expected(make,model) AS (
 VALUES
 ('Aprilia','RS 660'),('Ducati','PANIGALE V4'),
 ('Honda','CBR600RR'),('Honda','Africa Twin CRF1100L'),
 ('Royal Enfield','Classic 350'),('Suzuki','GSX-R750'),
 ('Triumph','Bonneville T120'),('Yamaha','MT-07')
)
SELECT make,model,
 jsonb_array_length(public.public_anybike_verified_model_facts_v1(make,model)) AS public_sourced_facts
FROM expected ORDER BY make,model;

SELECT count(*) AS total_fact_rows,
 count(*) FILTER (WHERE verification_status='verified') AS verified_fact_rows,
 count(*) FILTER (WHERE verification_status='pending_review') AS pending_original_fact_rows,
 count(DISTINCT catalog_model_id) FILTER (WHERE verification_status='verified') AS verified_models
FROM public.motorcycle_catalog_facts;

SELECT count(*) AS verified_matching_audits
FROM public.motorcycle_catalog_facts f
WHERE f.verification_status='verified'
AND EXISTS(SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
 WHERE a.fact_id=f.id AND a.source_url=f.source_url
 AND nullif(btrim(a.verification_basis),'') IS NOT NULL AND a.checked_at<=now());

SELECT count(*) AS published_universal_model_sections
FROM public.motorcycle_universal_published_sections_v1
WHERE entity_type='model' AND publication_eligible IS TRUE;
