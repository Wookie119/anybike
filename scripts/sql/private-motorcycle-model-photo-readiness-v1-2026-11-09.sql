-- Internal photo QA; generated from the deployed SECURITY INVOKER view.
-- No public privileges; source photos may not be published by this report.
CREATE OR REPLACE VIEW anybike_publishing.motorcycle_model_photo_readiness_v1
WITH (security_invoker=true) AS
 WITH bank AS (
         SELECT m_1.id AS model_id,
            count(p.id) FILTER (WHERE p.approval_status = 'approved'::text AND p.image_url ~ '^https://[^[:space:]]+$'::text AND p.source_page_url ~ '^https://[^[:space:]]+$'::text AND p.licence_url ~ '^https://[^[:space:]]+$'::text AND length(btrim(COALESCE(p.attribution, ''::text))) > 0 AND length(btrim(COALESCE(p.licence, ''::text))) > 0 AND p.reviewed_at IS NOT NULL)::integer AS approved_attributed_assets,
            count(p.id) FILTER (WHERE p.approval_status = 'approved'::text AND ('model_hero'::text = ANY (COALESCE(p.usage_contexts, ARRAY[]::text[]))) AND p.subject_category = 'whole_motorcycle'::text AND p.image_url ~ '^https://[^[:space:]]+$'::text AND p.source_page_url ~ '^https://[^[:space:]]+$'::text AND p.licence_url ~ '^https://[^[:space:]]+$'::text AND length(btrim(COALESCE(p.attribution, ''::text))) > 0 AND length(btrim(COALESCE(p.licence, ''::text))) > 0 AND p.reviewed_at IS NOT NULL)::integer AS approved_exact_model_heroes
           FROM motorcycle_catalog_models m_1
             LEFT JOIN anybike_editorial_photo_bank p ON p.manufacturer = m_1.manufacturer AND p.model = m_1.model
          GROUP BY m_1.id
        ), source_candidates AS (
         SELECT model_photo_source_candidates.model_id,
            count(*)::integer AS candidate_count,
            count(*) FILTER (WHERE model_photo_source_candidates.rights_review_status = 'requires_review'::text)::integer AS rights_review_pending,
            count(*) FILTER (WHERE model_photo_source_candidates.year_accuracy_status = 'unverified'::text)::integer AS model_year_review_pending,
            count(*) FILTER (WHERE model_photo_source_candidates.image_url !~ '^https://[^[:space:]]+$'::text OR COALESCE(model_photo_source_candidates.attribution_link, ''::text) !~ '^https://[^[:space:]]+$'::text)::integer AS incomplete_source_candidates
           FROM anybike_publishing.model_photo_source_candidates
          GROUP BY model_photo_source_candidates.model_id
        ), year_gallery AS (
         SELECT y_1.model_id,
            count(*)::integer AS model_year_mappings,
            count(*) FILTER (WHERE y_1.verification_status = 'verified'::text AND y_1.publication_enabled = true AND p.approval_status = 'approved'::text AND p.manufacturer = m_1.manufacturer AND p.model = m_1.model AND (p.model_year_start IS NULL OR y_1.model_year >= p.model_year_start) AND (p.model_year_end IS NULL OR y_1.model_year <= p.model_year_end))::integer AS publishable_exact_year_mappings
           FROM motorcycle_catalog_model_year_media y_1
             JOIN motorcycle_catalog_models m_1 ON m_1.id = y_1.model_id
             LEFT JOIN anybike_editorial_photo_bank p ON p.id = y_1.photo_bank_id
          GROUP BY y_1.model_id
        )
 SELECT m.id AS model_id,
    m.manufacturer,
    m.model,
    m.slug,
    COALESCE(r.registered_routes, 0::bigint)::integer AS registered_routes,
    COALESCE(b.approved_attributed_assets, 0) AS approved_attributed_assets,
    COALESCE(b.approved_exact_model_heroes, 0) AS approved_exact_model_heroes,
    COALESCE(y.model_year_mappings, 0) AS model_year_mappings,
    COALESCE(y.publishable_exact_year_mappings, 0) AS publishable_exact_year_mappings,
    COALESCE(c.candidate_count, 0) AS photo_source_candidates,
    COALESCE(c.rights_review_pending, 0) AS rights_review_pending,
    COALESCE(c.model_year_review_pending, 0) AS model_year_review_pending,
    COALESCE(c.incomplete_source_candidates, 0) AS incomplete_source_candidates,
        CASE
            WHEN m.model ~* '(APR|representative|finance|deposit|monthly payment|PCP|[0-9]+[.]?[0-9]*[[:space:]]*%)'::text THEN 'EXCLUDE_FINANCE_PROMOTION'::text
            WHEN COALESCE(b.approved_exact_model_heroes, 0) > 0 THEN 'APPROVED_HERO_PRESENT_CHECK_YEAR_GALLERIES'::text
            WHEN COALESCE(c.candidate_count, 0) > 0 THEN 'REVIEW_SOURCE_RIGHTS_AND_MODEL_YEAR'::text
            ELSE 'SOURCE_EXACT_MODEL_IMAGE_CANDIDATES'::text
        END AS next_photo_action
   FROM motorcycle_catalog_models m
     LEFT JOIN bank b ON b.model_id = m.id
     LEFT JOIN source_candidates c ON c.model_id = m.id
     LEFT JOIN year_gallery y ON y.model_id = m.id
     LEFT JOIN LATERAL ( SELECT count(*) AS registered_routes
           FROM anybike_publishing.editorial_page_routes r_1
          WHERE r_1.entity_type = 'model'::text AND r_1.model_id = m.id) r ON true;;
REVOKE ALL ON anybike_publishing.motorcycle_model_photo_readiness_v1 FROM PUBLIC,anon,authenticated;

-- Database-assisted audit of exact-model photographs, photo source reviews,
-- year-correct mappings, and excluded promotional catalogue records:
SELECT manufacturer,next_photo_action,count(*) AS models,
 sum(photo_source_candidates) AS source_candidates,
 sum(approved_exact_model_heroes) AS approved_heroes,
 sum(publishable_exact_year_mappings) AS publishable_year_links
FROM anybike_publishing.motorcycle_model_photo_readiness_v1
GROUP BY manufacturer,next_photo_action
ORDER BY manufacturer,next_photo_action;
