-- AnyBike V2 MASTER: independent source-verified fact delivery audit (READ ONLY).
-- This audits the existing production verified-facts RPC separately from
-- the still-unpublished 20-slot editorial draft/publish system.
-- NEVER mark drafts as published, auto-approve sources or infer specifications.
--
-- Public RPC eligibility requires a registered research category, a verified
-- fact, HTTPS source, acceptable label and an independently recorded
-- verification audit with a matching source URL.
WITH audited_facts AS (
 SELECT f.catalog_model_id,f.id,f.category,
        (f.source_url ~ '^https://[^[:space:]]+$'
         AND LENGTH(TRIM(f.label)) BETWEEN 1 AND 160
         AND EXISTS (
           SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
           WHERE a.fact_id=f.id AND a.source_url=f.source_url
             AND NULLIF(BTRIM(a.verification_basis),'') IS NOT NULL
             AND a.checked_at IS NOT NULL AND a.checked_at<=now()
         )
         AND EXISTS (
           SELECT 1 FROM public.anybike_model_research_section_registry r
           WHERE r.category=f.category
         )) AS rpc_eligible
 FROM public.motorcycle_catalog_facts f
 WHERE f.verification_status='verified'
)
SELECT COUNT(*) AS verified_fact_records,
       COUNT(DISTINCT catalog_model_id) AS models_with_verified_facts,
       COUNT(*) FILTER (WHERE rpc_eligible) AS rpc_eligible_records,
       COUNT(*) FILTER (WHERE NOT rpc_eligible) AS review_eligibility_failures
FROM audited_facts;

-- Factory facts in the approved BMW R 1300 GS reference are authoritative
-- source evidence, but their presence does NOT automatically approve a
-- universal editorial draft or licensed image.
SELECT model, jsonb_array_length(public.public_anybike_verified_model_facts_v1('BMW',model))
  AS facts_returned_by_public_rpc
FROM (VALUES ('R 1300 GS'),('R 1300 GS Adventure'),('R 1300 GS TE'))
     AS reference_models(model);

-- Exact-model research categories returned for the locked reference model.
SELECT f.category,COUNT(*) AS factory_facts
FROM public.motorcycle_catalog_facts f
WHERE f.catalog_model_id=77 AND f.verification_status='verified'
GROUP BY f.category ORDER BY f.category;

-- The published 20-slot editorial projection is a separate approval gate.
SELECT COUNT(*) AS published_universal_editorial_sections
FROM public.motorcycle_universal_published_sections_v1;
