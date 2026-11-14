-- AnyBike V2 R 1300 GS master: photograph release readiness (READ ONLY).
-- Approved photo-bank licensing and model-year verification are necessary but
-- NOT sufficient to enable public image display. Preserve publication switches.
-- No stock-advert photographs may be substituted for a model research gallery.

-- 1. Each reviewed R 1300 GS year link, its publication flag and photo-bank rights.
SELECT y.model_id,y.model_year,y.role,y.verification_status,
       y.publication_enabled,p.approval_status,p.licence,
       p.reviewed_at IS NOT NULL AS has_review,
       p.licence_url LIKE 'https://%' AS licence_url_is_https,
       p.source_page_url LIKE 'https://%' AS source_url_is_https,
       COALESCE(LENGTH(BTRIM(p.attribution)),0)>0 AS has_attribution
FROM public.motorcycle_catalog_model_year_media y
LEFT JOIN public.anybike_editorial_photo_bank p ON p.id=y.photo_bank_id
WHERE y.model_id=77
ORDER BY y.model_year,y.role;

-- 2. Safe overview: verified-but-disabled is a review queue, not an
--    instruction to turn publication on or hotlink an image.
SELECT COUNT(*) AS media_links,
       COUNT(*) FILTER (WHERE verification_status='verified') AS verified,
       COUNT(*) FILTER (WHERE publication_enabled) AS publication_enabled,
       COUNT(*) FILTER (WHERE verification_status='verified'
                         AND publication_enabled=false) AS verified_but_disabled
FROM public.motorcycle_catalog_model_year_media;

-- 3. Fully documented assets with deliberately disabled model-year publishing.
--    Keep separate from the general verified-facts editorial publication pipeline.
SELECT COUNT(*) AS approved_but_disabled,
       COUNT(DISTINCT y.model_id) AS affected_models
FROM public.motorcycle_catalog_model_year_media y
JOIN public.anybike_editorial_photo_bank p ON p.id=y.photo_bank_id
WHERE y.verification_status='verified'
  AND y.publication_enabled=false
  AND p.approval_status='approved'
  AND p.licence_url LIKE 'https://%'
  AND p.source_page_url LIKE 'https://%'
  AND COALESCE(LENGTH(BTRIM(p.attribution)),0)>0;
