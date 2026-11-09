-- AnyBike private model release readiness view. No public read grants and no
-- automatic publication. Designed to report all manufacturers in batches.
CREATE OR REPLACE VIEW anybike_publishing.motorcycle_model_release_readiness_v1
WITH (security_invoker = true) AS
 WITH sections AS (
         SELECT s_1.model_id,
            count(*) AS staged_sections,
            count(*) FILTER (WHERE s_1.editorial_status = 'published'::text) AS reviewed_sections,
            count(*) FILTER (WHERE s_1.source_reference IS NOT NULL AND btrim(s_1.source_reference) <> ''::text) AS source_referenced_sections,
            sum(
                CASE
                    WHEN jsonb_typeof(s_1.content -> 'verified_catalogue_facts'::text) = 'array'::text THEN jsonb_array_length(s_1.content -> 'verified_catalogue_facts'::text)
                    ELSE 0
                END) AS evidence_entries
           FROM motorcycle_universal_page_sections_v1 s_1
          WHERE s_1.entity_type = 'model'::text
          GROUP BY s_1.model_id
        ), photos AS (
         SELECT lower(regexp_replace(p_1.model, '[^a-z0-9]'::text, ''::text, 'gi'::text)) AS model_key,
            p_1.manufacturer AS make,
            count(*) AS approved_photos
           FROM anybike_editorial_photo_bank p_1
          WHERE p_1.approval_status = 'approved'::text AND p_1.image_url ~~ 'https://%'::text AND p_1.source_page_url ~~ 'https://%'::text AND p_1.licence_url ~~ 'https://%'::text AND length(btrim(COALESCE(p_1.attribution, ''::text))) > 0 AND length(btrim(COALESCE(p_1.licence, ''::text))) > 0
          GROUP BY p_1.manufacturer, (lower(regexp_replace(p_1.model, '[^a-z0-9]'::text, ''::text, 'gi'::text)))
        ), routes AS (
         SELECT r_1.model_id,
            count(*) AS registered_routes,
            count(*) FILTER (WHERE r_1.source_verified_at IS NOT NULL) AS source_verified_routes,
            count(*) FILTER (WHERE r_1.live_verified_at IS NOT NULL) AS live_verified_routes,
            count(*) FILTER (WHERE r_1.editorial_verified_at IS NOT NULL AND r_1.publication_state = 'published'::text) AS editorial_published_routes
           FROM anybike_publishing.editorial_page_routes r_1
          WHERE r_1.entity_type = 'model'::text
          GROUP BY r_1.model_id
        )
 SELECT m.id AS model_id,
    m.manufacturer AS make,
    m.model,
    m.slug,
    COALESCE(s.staged_sections, 0::bigint)::integer AS staged_sections,
    (20 - COALESCE(s.staged_sections, 0::bigint))::integer AS unfilled_sections,
    COALESCE(s.reviewed_sections, 0::bigint)::integer AS reviewed_sections,
    COALESCE(s.source_referenced_sections, 0::bigint)::integer AS source_referenced_sections,
    COALESCE(s.evidence_entries, 0::bigint)::integer AS evidence_entries,
    COALESCE(p.approved_photos, 0::bigint)::integer AS approved_photos,
    COALESCE(r.registered_routes, 0::bigint)::integer AS registered_routes,
    COALESCE(r.source_verified_routes, 0::bigint)::integer AS source_verified_routes,
    COALESCE(r.live_verified_routes, 0::bigint)::integer AS live_verified_routes,
    COALESCE(r.editorial_published_routes, 0::bigint)::integer AS editorial_published_routes,
        CASE
            WHEN m.model ~* '(APR|representative|finance|deposit|monthly payment|PCP|[0-9]+[.]?[0-9]*[[:space:]]*%)'::text THEN 'BLOCK_NON_MODEL_PROMOTION'::text
            WHEN COALESCE(s.staged_sections, 0::bigint) = 0 THEN 'NEEDS_RESEARCH'::text
            WHEN COALESCE(s.evidence_entries, 0::bigint) = 0 THEN 'NEEDS_FACT_EVIDENCE'::text
            WHEN COALESCE(p.approved_photos, 0::bigint) = 0 THEN 'NEEDS_APPROVED_EXACT_MODEL_PHOTO'::text
            WHEN COALESCE(r.source_verified_routes, 0::bigint) = 0 THEN 'NEEDS_SOURCE_VERIFIED_ROUTE'::text
            WHEN COALESCE(r.live_verified_routes, 0::bigint) = 0 THEN 'NEEDS_LIVE_ROUTE_QA'::text
            WHEN COALESCE(s.reviewed_sections, 0::bigint) = 0 OR COALESCE(r.editorial_published_routes, 0::bigint) = 0 THEN 'NEEDS_EDITORIAL_APPROVAL'::text
            ELSE 'REVIEW_RELEASE'::text
        END AS next_action
   FROM motorcycle_catalog_models m
     LEFT JOIN sections s ON s.model_id = m.id
     LEFT JOIN photos p ON p.make = m.manufacturer AND p.model_key = lower(regexp_replace(m.model, '[^a-z0-9]'::text, ''::text, 'gi'::text))
     LEFT JOIN routes r ON r.model_id = m.id;;
REVOKE ALL ON anybike_publishing.motorcycle_model_release_readiness_v1 FROM PUBLIC,anon,authenticated;

-- Summary by manufacturer and next release blocker:
SELECT make,next_action,count(*) AS models
FROM anybike_publishing.motorcycle_model_release_readiness_v1
GROUP BY make,next_action
ORDER BY make,next_action;
