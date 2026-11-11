-- AnyBike: repeatable read-only public sourced model facts coverage audit.
-- This report must not promote draft sections or bypass independent source audits.
-- Exact manufacturer/model text is used so similarly named motorcycles do not mix.
WITH model_ids AS (
 SELECT DISTINCT m.id, m.manufacturer, m.model
 FROM public.motorcycle_catalog_models m
 JOIN public.motorcycle_catalog_facts f ON f.catalog_model_id=m.id
 WHERE f.verification_status='verified'
), coverage AS (
 SELECT id,manufacturer,model,
        jsonb_array_length(
          public.public_anybike_verified_model_facts_v1(manufacturer,model)
        ) AS public_sourced_facts
 FROM model_ids
)
SELECT count(*) AS models_with_verified_evidence,
       count(*) FILTER(WHERE public_sourced_facts>0) AS models_with_public_facts,
       count(*) FILTER(WHERE public_sourced_facts=0) AS models_blocked_from_public_facts,
       sum(public_sourced_facts) AS total_public_fact_rows
FROM coverage;

-- Investigate these exact identities before publication.
-- A zero count is NOT authorisation to expose draft or non-audited facts.
WITH model_ids AS (
 SELECT DISTINCT m.id,m.manufacturer,m.model
 FROM public.motorcycle_catalog_models m
 JOIN public.motorcycle_catalog_facts f ON f.catalog_model_id=m.id
 WHERE f.verification_status='verified'
)
SELECT manufacturer,model,
       jsonb_array_length(
         public.public_anybike_verified_model_facts_v1(manufacturer,model)
       ) AS public_sourced_facts
FROM model_ids
WHERE jsonb_array_length(
        public.public_anybike_verified_model_facts_v1(manufacturer,model)
      )=0
ORDER BY manufacturer,model;
