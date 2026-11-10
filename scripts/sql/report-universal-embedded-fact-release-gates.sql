-- AnyBike: exact canonical model + independent source-audit integrity.
-- READ ONLY. All 125 staged verified_catalogue_facts are compared by
-- immutable fact_id, not label, model name, or nearest manufacturer.
-- A section is NOT publication-ready if even one embedded fact lacks a
-- source audit or disagrees with its canonical fact record.
WITH embedded AS (
 SELECT s.id AS staged_section_id,s.model_id,s.section_number,
        j.fact->>'fact_id' AS raw_fact_id,
        CASE WHEN j.fact->>'fact_id' ~ '^[1-9][0-9]*$'
             THEN (j.fact->>'fact_id')::bigint ELSE NULL END AS fact_id,
        j.fact->>'source_url' AS embedded_source_url,
        j.fact->>'source_verification_status' AS embedded_verification
 FROM public.motorcycle_universal_page_sections_v1 s
 CROSS JOIN LATERAL jsonb_array_elements(
   CASE WHEN jsonb_typeof(s.content->'verified_catalogue_facts')='array'
   THEN s.content->'verified_catalogue_facts' ELSE '[]'::jsonb END
 ) j(fact)
 WHERE s.entity_type='model'
), checked AS (
 SELECT emb.*,m.manufacturer,m.model,
        f.catalog_model_id AS canonical_fact_model_id,
        f.source_url AS canonical_fact_source_url,
        f.verification_status AS canonical_fact_verification,
        a.fact_id AS audited_fact_id,
        a.source_url AS audited_source_url,
        a.checked_at,a.verification_basis,
        CASE
         WHEN emb.fact_id IS NULL THEN 'invalid_fact_identifier'
         WHEN f.id IS NULL THEN 'missing_canonical_fact'
         WHEN f.catalog_model_id IS DISTINCT FROM emb.model_id
              THEN 'wrong_canonical_model'
         WHEN emb.embedded_source_url IS DISTINCT FROM f.source_url
              THEN 'embedded_source_disagrees'
         WHEN emb.embedded_verification IS DISTINCT FROM f.verification_status
              THEN 'embedded_verification_disagrees'
         WHEN f.verification_status<>'verified' THEN 'fact_not_verified'
         WHEN a.fact_id IS NULL THEN 'missing_independent_audit'
         WHEN nullif(trim(a.verification_basis),'') IS NULL THEN 'missing_audit_basis'
         WHEN a.checked_at IS NULL OR a.checked_at>now()
              THEN 'invalid_audit_timestamp'
         WHEN a.source_url IS DISTINCT FROM f.source_url
              THEN 'audited_source_disagrees'
         WHEN a.source_url NOT LIKE 'https://%' OR
              f.source_url NOT LIKE 'https://%'
              THEN 'unsafe_documentary_url'
         ELSE 'identity_and_audit_consistent'
        END AS gate_status
 FROM embedded emb
 JOIN public.motorcycle_catalog_models m ON m.id=emb.model_id
 LEFT JOIN public.motorcycle_catalog_facts f ON f.id=emb.fact_id
 LEFT JOIN public.motorcycle_catalog_fact_verification_audit a
  ON a.fact_id=emb.fact_id
)
SELECT gate_status,count(*) AS fact_references,
       count(DISTINCT model_id) AS models,
       count(DISTINCT manufacturer) AS manufacturers
FROM checked GROUP BY gate_status ORDER BY gate_status;

-- Per-fact review worklist; repeat the exact checks above without mutating.
WITH embedded AS (
 SELECT s.model_id,s.section_number,
        CASE WHEN j.fact->>'fact_id' ~ '^[1-9][0-9]*$'
             THEN (j.fact->>'fact_id')::bigint ELSE NULL END AS fact_id,
        j.fact->>'source_url' AS embedded_source_url,
        j.fact->>'source_verification_status' AS embedded_verification
 FROM public.motorcycle_universal_page_sections_v1 s
 CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(s.content->'verified_catalogue_facts')='array'
   THEN s.content->'verified_catalogue_facts' ELSE '[]'::jsonb END
 ) j(fact) WHERE s.entity_type='model'
)
SELECT e.model_id,m.manufacturer,m.model,e.section_number,e.fact_id,
       f.label,f.category,e.embedded_source_url,
       f.source_url AS canonical_source_url,
       a.source_url AS audited_source_url,a.verification_basis,a.checked_at,
       CASE
        WHEN e.fact_id IS NULL OR f.id IS NULL THEN 'missing_fact'
        WHEN f.catalog_model_id IS DISTINCT FROM e.model_id THEN 'wrong_model'
        WHEN e.embedded_source_url IS DISTINCT FROM f.source_url
          THEN 'embedded_url_mismatch'
        WHEN e.embedded_verification IS DISTINCT FROM f.verification_status
          THEN 'verification_status_mismatch'
        WHEN f.verification_status<>'verified' THEN 'fact_unverified'
        WHEN a.fact_id IS NULL THEN 'missing_audit'
        WHEN nullif(trim(a.verification_basis),'') IS NULL THEN 'missing_basis'
        WHEN a.checked_at IS NULL OR a.checked_at>now() THEN 'audit_not_current'
        WHEN a.source_url IS DISTINCT FROM f.source_url THEN 'audit_url_mismatch'
        WHEN f.source_url NOT LIKE 'https://%' THEN 'unsafe_source'
        ELSE 'audit_consistent' END AS review_reason
FROM embedded e
JOIN public.motorcycle_catalog_models m ON m.id=e.model_id
LEFT JOIN public.motorcycle_catalog_facts f ON f.id=e.fact_id
LEFT JOIN public.motorcycle_catalog_fact_verification_audit a ON a.fact_id=e.fact_id
ORDER BY m.manufacturer,m.model,e.fact_id;

-- Release must also explicitly distinguish draft from published sections.
SELECT count(*) AS published_universal_rows
FROM public.motorcycle_universal_published_sections_v1;
