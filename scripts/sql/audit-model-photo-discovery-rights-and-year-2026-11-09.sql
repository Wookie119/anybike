-- Read-only photo QA for the entire model database.
-- Zero is required for every safety-check column.
SELECT
 (SELECT count(*) FROM anybike_publishing.model_photo_discovery_queue_v1 d
 LEFT JOIN public.motorcycle_catalog_models m ON m.id=d.model_id
 WHERE m.id IS NULL) AS orphan_discoveries,
 (SELECT count(*) FROM anybike_publishing.model_photo_discovery_queue_v1 d
 WHERE d.publication_enabled OR d.rights_review_status<>'licence_terms_need_review'
 OR d.model_year_verified OR d.exact_model_review_status<>'candidate_needs_visual_review'
 ) AS unreviewed_discoveries_mislabelled_approved,
 (SELECT count(*) FROM public.motorcycle_catalog_model_year_media y
 JOIN public.motorcycle_catalog_models m ON m.id=y.model_id
 JOIN public.anybike_editorial_photo_bank p ON p.id=y.photo_bank_id
 WHERE p.model IS DISTINCT FROM m.model
 OR p.manufacturer IS DISTINCT FROM m.manufacturer
 OR (p.model_year_start IS NOT NULL AND y.model_year<p.model_year_start)
 OR (p.model_year_end IS NOT NULL AND y.model_year>p.model_year_end)
 ) AS model_year_photo_identity_mismatches,
 (SELECT count(*) FROM public.motorcycle_universal_published_sections_v1)
 AS new_universal_sections_published;
