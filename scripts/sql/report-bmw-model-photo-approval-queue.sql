-- AnyBike BMW approval queue, READ ONLY.
-- Published-route models first. Precise year-and-rights matching is required;
-- never infer an edition or model year from filename or a press publication date.
WITH public_pages(path) AS (
 VALUES
 ('bmw-c400gt.html'),('bmw-c400x.html'),('bmw-ce02.html'),('bmw-ce04.html'),
 ('bmw-f850gs.html'),('bmw-f900gs.html'),('bmw-f900r.html'),('bmw-f900xr.html'),
 ('bmw-g650gs.html'),('bmw-hp4.html'),('bmw-k1600gt.html'),('bmw-k1600gtl.html'),
 ('bmw-m1000rr.html'),('bmw-r1200gs.html'),('bmw-r1200rt.html'),('bmw-r1250gs.html'),
 ('bmw-r1250r.html'),('bmw-r1250rt.html'),('bmw-r1300gs.html'),('bmw-r18.html'),
 ('bmw-r32.html'),('bmw-r80gs.html'),('bmw-r90s.html'),('bmw-rninet.html'),
 ('bmw-s1000r.html'),('bmw-s1000rr.html'),('bmw-s1000xr.html')
),
models AS (
 SELECT e.slug,e.preview_visible,e.editorial->>'model' AS model,
  jsonb_array_length(coalesce(e.editorial->'model_year_cards','[]'::jsonb)) AS research_cards,
  p.path IS NOT NULL AS has_public_model_page
 FROM public.motorcycle_model_v2_editorial e LEFT JOIN public_pages p
 ON p.path='bmw-'||replace(substring(e.slug from 5),'-','')||'.html'
 WHERE e.editorial->>'make'='BMW'
),
assets AS (
 SELECT p.model,count(*) AS approved_photo_count,
 count(*) FILTER (WHERE p.subject_category='whole_motorcycle') AS motorcycle_photos,
 count(*) FILTER (WHERE p.model_year_start IS NOT NULL AND p.model_year_end IS NOT NULL) AS year_bounded_photos,
 count(*) FILTER (WHERE coalesce(p.attribution,'')<>'' AND coalesce(p.licence,'')<>''
                    AND p.image_url LIKE 'https://%' AND p.source_page_url LIKE 'https://%'
                    AND p.licence_url LIKE 'https://%') AS attributed_licenced_photos
 FROM public.anybike_editorial_photo_bank p
 WHERE p.manufacturer='BMW' AND p.approval_status='approved'
 GROUP BY p.model
)
SELECT m.slug,m.model,m.has_public_model_page,m.preview_visible,m.research_cards,
 coalesce(a.approved_photo_count,0) AS exact_model_approved_photos,
 coalesce(a.motorcycle_photos,0) AS whole_motorcycle_photos,
 coalesce(a.year_bounded_photos,0) AS year_bounded_photos,
 coalesce(a.attributed_licenced_photos,0) AS attributed_licenced_photos,
 CASE
  WHEN m.research_cards=0 THEN 'research_first'
  WHEN coalesce(a.approved_photo_count,0)=0 THEN 'source_and_clear_exact_model_images'
  WHEN coalesce(a.year_bounded_photos,0)=0 THEN 'verify_exact_model_year'
  ELSE 'review_card_year_to_asset_matching'
 END AS next_editorial_action
FROM models m LEFT JOIN assets a ON lower(regexp_replace(m.model,'[^a-zA-Z0-9]','','g'))=
lower(regexp_replace(a.model,'[^a-zA-Z0-9]','','g'))
ORDER BY m.has_public_model_page DESC,m.research_cards DESC,m.model;
