-- AnyBike approved BMW model route and Supabase editorial crosslink audit.
-- READ ONLY. Includes the 27 verified published HTML paths (7 November 2026).
-- Never treat a database editorial record as published without a real public route.
WITH routes(path) AS (VALUES
 ('bmw-c400gt.html'),
 ('bmw-c400x.html'),
 ('bmw-ce02.html'),
 ('bmw-ce04.html'),
 ('bmw-f850gs.html'),
 ('bmw-f900gs.html'),
 ('bmw-f900r.html'),
 ('bmw-f900xr.html'),
 ('bmw-g650gs.html'),
 ('bmw-hp4.html'),
 ('bmw-k1600gt.html'),
 ('bmw-k1600gtl.html'),
 ('bmw-m1000rr.html'),
 ('bmw-r1200gs.html'),
 ('bmw-r1200rt.html'),
 ('bmw-r1250gs.html'),
 ('bmw-r1250r.html'),
 ('bmw-r1250rt.html'),
 ('bmw-r1300gs.html'),
 ('bmw-r18.html'),
 ('bmw-r32.html'),
 ('bmw-r80gs.html'),
 ('bmw-r90s.html'),
 ('bmw-rninet.html'),
 ('bmw-s1000r.html'),
 ('bmw-s1000rr.html'),
 ('bmw-s1000xr.html')
),
models AS (
 SELECT e.slug, e.preview_visible, r.path,
        e.editorial#>>'{page_metadata,canonical_url}' AS canonical,
        COALESCE(e.editorial->'related_model_links','[]'::jsonb) AS related
 FROM public.motorcycle_model_v2_editorial e
 JOIN routes r ON r.path='bmw-'||REPLACE(SUBSTRING(e.slug FROM 5),'-','')||'.html'
),
audit AS (
 SELECT m.*, 
        m.canonical IS DISTINCT FROM 'https://www.anybike.co.uk/'||m.path AS wrong_canonical,
        JSONB_ARRAY_LENGTH(m.related)=0 AS missing_related,
        EXISTS(
          SELECT 1 FROM JSONB_ARRAY_ELEMENTS(m.related) link
          WHERE link->>'url' NOT IN (SELECT '/'||path FROM routes)
        ) AS invalid_related
 FROM models m
)
SELECT COUNT(*) AS matched_published_bmw_models,
       COUNT(*) FILTER (WHERE wrong_canonical) AS wrong_canonicals,
       COUNT(*) FILTER (WHERE missing_related) AS missing_related_links,
       COUNT(*) FILTER (WHERE invalid_related) AS broken_related_links,
       COUNT(*) FILTER (WHERE preview_visible) AS approved_universal_previews
FROM audit;
