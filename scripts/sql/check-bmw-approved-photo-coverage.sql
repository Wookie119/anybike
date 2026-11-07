-- AnyBike BMW editorial photo coverage — read-only.
-- Do not use stock advert photography for model history without approved reuse rights.
-- Exact manufacturer/model matching prevents R 1300 GS assets appearing on R 1250 GS.
WITH editorial AS (
 SELECT slug,editorial->>'make' AS make,editorial->>'model' AS model,preview_visible,
  jsonb_array_length(coalesce(editorial->'model_year_cards','[]'::jsonb)) AS documented_cards
 FROM public.motorcycle_model_v2_editorial
 WHERE editorial->>'make'='BMW'
), approved AS (
 SELECT manufacturer,model,asset_key,model_year_start,model_year_end,subject_category
 FROM public.anybike_editorial_photo_bank
 WHERE approval_status='approved' AND manufacturer='BMW'
), coverage AS (
 SELECT e.slug,e.model,e.preview_visible,e.documented_cards,
  count(distinct p.asset_key) AS approved_images,
  count(distinct p.asset_key) FILTER(WHERE p.subject_category='whole_motorcycle') AS whole_motorcycle_images
 FROM editorial e LEFT JOIN approved p
 ON lower(regexp_replace(e.make,'[^a-zA-Z0-9]','','g'))=lower(regexp_replace(p.manufacturer,'[^a-zA-Z0-9]','','g'))
 AND lower(regexp_replace(e.model,'[^a-zA-Z0-9]','','g'))=lower(regexp_replace(p.model,'[^a-zA-Z0-9]','','g'))
 GROUP BY e.slug,e.model,e.preview_visible,e.documented_cards
)
SELECT count(*) AS bmw_editorial_records,
 count(*) FILTER(WHERE documented_cards>0) AS records_with_documented_gallery_cards,
 sum(documented_cards) AS documented_gallery_cards,
 count(*) FILTER(WHERE approved_images>0) AS models_with_approved_editorial_images,
 count(*) FILTER(WHERE whole_motorcycle_images>0) AS models_with_approved_motorcycle_photos,
 sum(approved_images) AS total_exact_model_approved_photo_matches,
 count(*) FILTER(WHERE documented_cards>0 AND approved_images=0) AS documented_galleries_without_approved_photos,
 count(*) FILTER(WHERE preview_visible) AS preview_enabled_models
FROM coverage;
