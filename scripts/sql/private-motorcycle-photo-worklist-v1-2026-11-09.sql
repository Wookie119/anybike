-- Private, SECURITY INVOKER consolidated photo preparation by model ID.
-- Does not publish photos or expose draft/rights data to anon users.
CREATE OR REPLACE VIEW anybike_publishing.motorcycle_model_photo_worklist_v1
WITH (security_invoker=true) AS
 WITH discoveries AS (
         SELECT d_1.model_id,
            count(*)::integer AS commons_discoveries,
            count(*) FILTER (WHERE d_1.exact_model_review_status = 'confirmed'::text)::integer AS exact_model_confirmed,
            count(*) FILTER (WHERE d_1.rights_review_status = 'cleared'::text)::integer AS licence_review_cleared,
            count(*) FILTER (WHERE d_1.model_year_verified)::integer AS model_year_verified
           FROM anybike_publishing.model_photo_discovery_queue_v1 d_1
          GROUP BY d_1.model_id
        )
 SELECT p.model_id,
    p.manufacturer,
    p.model,
    p.slug,
    p.registered_routes,
    p.approved_attributed_assets,
    p.approved_exact_model_heroes,
    p.model_year_mappings,
    p.publishable_exact_year_mappings,
    p.photo_source_candidates,
    p.rights_review_pending,
    p.model_year_review_pending,
    p.incomplete_source_candidates,
    p.next_photo_action,
    COALESCE(d.commons_discoveries, 0) AS commons_discoveries,
    COALESCE(d.exact_model_confirmed, 0) AS discovery_exact_model_confirmed,
    COALESCE(d.licence_review_cleared, 0) AS discovery_licence_review_cleared,
    COALESCE(d.model_year_verified, 0) AS discovery_model_year_verified,
        CASE
            WHEN p.next_photo_action = 'EXCLUDE_FINANCE_PROMOTION'::text THEN 'EXCLUDE_FINANCE_PROMOTION'::text
            WHEN p.approved_exact_model_heroes > 0 THEN 'RETAIN_APPROVED_HERO'::text
            WHEN COALESCE(d.commons_discoveries, 0) > 0 THEN 'VERIFY_DISCOVERED_COMMONS_PHOTOS'::text
            WHEN p.photo_source_candidates > 0 THEN 'REVIEW_LEGACY_SOURCE_PHOTOS'::text
            ELSE 'SOURCE_EXACT_MODEL_PHOTOS'::text
        END AS worklist_action
   FROM anybike_publishing.motorcycle_model_photo_readiness_v1 p
     LEFT JOIN discoveries d ON d.model_id = p.model_id;;
REVOKE ALL ON anybike_publishing.motorcycle_model_photo_worklist_v1 FROM PUBLIC,anon,authenticated;
SELECT manufacturer,worklist_action,count(*) AS models,sum(commons_discoveries) AS candidates
FROM anybike_publishing.motorcycle_model_photo_worklist_v1
GROUP BY 1,2 ORDER BY 1,2;
