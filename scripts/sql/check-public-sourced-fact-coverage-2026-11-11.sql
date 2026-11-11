-- AnyBike production research audit. READ ONLY.
-- Preserve approved manufacturer/model identity, alias and editorial gates.
-- A verified source fact is NOT permission to publish a draft section.
WITH evidence AS (
 SELECT m.id,m.manufacturer,m.model,
        count(*) FILTER (WHERE f.verification_status='verified') AS verified_facts,
        count(*) FILTER (
          WHERE f.verification_status='verified'
          AND f.source_url ~ '^https://[^[:space:]]+$'
          AND EXISTS (
            SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
            WHERE a.fact_id=f.id AND a.source_url=f.source_url
              AND nullif(btrim(a.verification_basis),'') IS NOT NULL
              AND a.checked_at IS NOT NULL AND a.checked_at<=now()
          )
        ) AS independently_audited_facts
 FROM public.motorcycle_catalog_models m
 JOIN public.motorcycle_catalog_facts f ON f.catalog_model_id=m.id
 GROUP BY m.id,m.manufacturer,m.model
 HAVING count(*) FILTER(WHERE f.verification_status='verified')>0
),
coverage AS (
 SELECT e.*,
   (d.model_id IS NOT NULL) AS clean_catalogue_identity,
   EXISTS (
    SELECT 1 FROM public.motorcycle_catalog_name_reviews r
    WHERE r.catalog_model_id=e.id AND r.review_status='pending_review'
   ) AS pending_name_review,
   EXISTS (
    SELECT 1 FROM public.motorcycle_catalog_model_aliases a
    WHERE a.alias_model_id=e.id
   ) AS alias_redirect,
   jsonb_array_length(public.public_anybike_verified_model_facts_v1(e.manufacturer,e.model))
    AS public_sourced_facts
 FROM evidence e
 LEFT JOIN public.motorcycle_catalog_dropdown_clean d ON d.model_id=e.id
)
SELECT count(*) AS models_with_verified_evidence,
       count(*) FILTER(WHERE public_sourced_facts>0) AS models_with_public_facts,
       sum(public_sourced_facts) AS total_public_fact_rows,
       count(*) FILTER(WHERE public_sourced_facts=0 AND pending_name_review)
        AS blocked_pending_name_review,
       count(*) FILTER(WHERE public_sourced_facts=0 AND alias_redirect)
        AS blocked_alias_identity,
       count(*) FILTER(WHERE public_sourced_facts=0 AND NOT pending_name_review
         AND NOT alias_redirect AND independently_audited_facts=0)
        AS lacking_independent_audit,
       count(*) FILTER(WHERE public_sourced_facts=0 AND NOT pending_name_review
         AND NOT alias_redirect AND independently_audited_facts>0)
        AS other_publication_checks_needed
FROM coverage;

-- Exact-model worklist: diagnose the block instead of inviting blind publication.
WITH evidence AS (
 SELECT m.id,m.manufacturer,m.model,
        count(*) FILTER(WHERE f.verification_status='verified') AS verified_facts,
        count(*) FILTER(
          WHERE f.verification_status='verified'
            AND EXISTS (
              SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
              WHERE a.fact_id=f.id AND a.source_url=f.source_url
                AND nullif(btrim(a.verification_basis),'') IS NOT NULL
                AND a.checked_at IS NOT NULL AND a.checked_at<=now()
            )
        ) AS audited_facts
 FROM public.motorcycle_catalog_models m
 JOIN public.motorcycle_catalog_facts f ON f.catalog_model_id=m.id
 GROUP BY m.id,m.manufacturer,m.model
 HAVING count(*) FILTER(WHERE f.verification_status='verified')>0
), coverage AS (
 SELECT e.*,
        d.model_id IS NOT NULL AS in_clean_catalogue,
        EXISTS(SELECT 1 FROM public.motorcycle_catalog_name_reviews r
               WHERE r.catalog_model_id=e.id AND r.review_status='pending_review') AS pending_review,
        EXISTS(SELECT 1 FROM public.motorcycle_catalog_model_aliases a
               WHERE a.alias_model_id=e.id) AS alias_model,
        jsonb_array_length(public.public_anybike_verified_model_facts_v1(e.manufacturer,e.model))
         AS public_facts
 FROM evidence e
 LEFT JOIN public.motorcycle_catalog_dropdown_clean d ON d.model_id=e.id
)
SELECT c.id AS catalog_model_id,c.manufacturer,c.model,c.verified_facts,c.audited_facts,
       c.in_clean_catalogue,c.public_facts,
       r.issue_type,r.suggested_model,r.notes AS review_reason,
       CASE
        WHEN c.pending_review THEN 'resolve_catalogue_name_or_relationship_review'
        WHEN c.alias_model THEN 'use_approved_canonical_model'
        WHEN NOT c.in_clean_catalogue THEN 'inspect_clean_catalogue_exclusion'
        WHEN c.audited_facts=0 THEN 'independent_source_audit_required'
        ELSE 'inspect_public_fact_eligibility'
       END AS next_action
FROM coverage c
LEFT JOIN LATERAL (
 SELECT issue_type,suggested_model,notes
 FROM public.motorcycle_catalog_name_reviews n
 WHERE n.catalog_model_id=c.id AND n.review_status='pending_review'
 ORDER BY n.created_at DESC,n.id DESC LIMIT 1
) r ON true
WHERE c.public_facts=0
ORDER BY c.manufacturer,c.model,c.id;
