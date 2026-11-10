-- AnyBike BMW public rollout matrix (READ ONLY, no publication changes).
-- Existing 27 allowlisted BMW guide routes, not 103 catalogue variants.
-- Run as a privileged read-only audit; this query is NOT a public client API.
-- Buyer-safe catalogue RPC data does not override Edge Function country access.
WITH approved_routes(path) AS (
 VALUES
 ('/bmw-c400gt.html'),('/bmw-c400x.html'),('/bmw-ce02.html'),('/bmw-ce04.html'),
 ('/bmw-f850gs.html'),('/bmw-f900gs.html'),('/bmw-f900r.html'),('/bmw-f900xr.html'),
 ('/bmw-g650gs.html'),('/bmw-hp4.html'),('/bmw-k1600gt.html'),('/bmw-k1600gtl.html'),
 ('/bmw-m1000rr.html'),('/bmw-r1200gs.html'),('/bmw-r1200rt.html'),
 ('/bmw-r1250gs.html'),('/bmw-r1250r.html'),('/bmw-r1250rt.html'),
 ('/bmw-r1300gs.html'),('/bmw-r18.html'),('/bmw-r32.html'),('/bmw-r80gs.html'),
 ('/bmw-r90s.html'),('/bmw-rninet.html'),('/bmw-s1000r.html'),
 ('/bmw-s1000rr.html'),('/bmw-s1000xr.html')
), public_guides AS (
 SELECT path, public.public_bmw_model_history_v1(path) AS guide
 FROM approved_routes
), resolved AS (
 SELECT g.path,g.guide,m.id AS catalog_model_id,m.model AS catalogue_model,
        r.name_issue_count,r.verified_specification_count
 FROM public_guides g
 LEFT JOIN public.motorcycle_catalog_models m
   ON m.manufacturer='BMW' AND
   lower(regexp_replace(m.model,'[^a-zA-Z0-9]','','g'))=
   lower(regexp_replace(g.guide->>'model','[^a-zA-Z0-9]','','g'))
 LEFT JOIN public.motorcycle_catalog_readiness r ON r.id=m.id
), research AS (
 SELECT model_id,count(*) AS staged_sections,
        count(*) FILTER(WHERE content IS NULL OR content='{}'::jsonb) AS empty_sections,
        count(*) FILTER(
          WHERE content->'engineering'->>'verification_status'='pending_editorial_review'
        ) AS pending_engineering
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model'
 GROUP BY model_id
), photos AS (
 SELECT manufacturer,model,count(*) AS approved_photo_assets
 FROM public.anybike_editorial_photo_bank
 WHERE approval_status='approved' AND image_url LIKE 'https://%'
   AND source_page_url LIKE 'https://%' AND licence_url LIKE 'https://%'
   AND nullif(trim(attribution),'') IS NOT NULL
   AND nullif(trim(licence),'') IS NOT NULL
 GROUP BY manufacturer,model
), permitted_source_data AS (
 -- The RPC is the data source behind the internationally restricted endpoint.
 -- Do not treat direct SQL results as permission for UK browsing.
 SELECT (item->>'catalog_model_id')::bigint AS catalog_model_id,
        count(*) AS buyer_safe_source_items
 FROM (
   SELECT jsonb_array_elements(public.international_vq_public_catalog_v2()) AS item
 ) x
 WHERE item->>'catalogue_identity_status'='verified'
   AND item->>'publication_eligible'='true'
   AND (item->>'catalog_model_id') ~ '^[1-9][0-9]*$'
 GROUP BY (item->>'catalog_model_id')::bigint
)
SELECT m.path,m.catalog_model_id,m.catalogue_model,
       m.guide IS NOT NULL AS public_research_exists,
       jsonb_array_length(coalesce(m.guide->'generations','[]'::jsonb)) AS generation_entries,
       jsonb_array_length(coalesce(m.guide->'technical_specifications','[]'::jsonb)) AS specification_entries,
       coalesce(m.name_issue_count,0) AS name_review_flags,
       coalesce(m.verified_specification_count,0) AS verified_catalogue_specifications,
       coalesce(r.staged_sections,0) AS staged_universal_sections,
       coalesce(r.empty_sections,0) AS empty_staged_sections,
       coalesce(r.pending_engineering,0) AS pending_engineering_sections,
       coalesce(p.approved_photo_assets,0) AS approved_editorial_photo_assets,
       coalesce(s.buyer_safe_source_items,0) AS international_source_stock_items
FROM resolved m
LEFT JOIN research r ON r.model_id=m.catalog_model_id
LEFT JOIN photos p ON p.manufacturer='BMW' AND p.model=m.catalogue_model
LEFT JOIN permitted_source_data s ON s.catalog_model_id=m.catalog_model_id
ORDER BY m.path;

-- Any unmatched or ambiguous route/catalogue identities are a release blocker.
WITH approved_routes(path) AS (
 VALUES
 ('/bmw-c400gt.html'),('/bmw-c400x.html'),('/bmw-ce02.html'),('/bmw-ce04.html'),
 ('/bmw-f850gs.html'),('/bmw-f900gs.html'),('/bmw-f900r.html'),('/bmw-f900xr.html'),
 ('/bmw-g650gs.html'),('/bmw-hp4.html'),('/bmw-k1600gt.html'),('/bmw-k1600gtl.html'),
 ('/bmw-m1000rr.html'),('/bmw-r1200gs.html'),('/bmw-r1200rt.html'),
 ('/bmw-r1250gs.html'),('/bmw-r1250r.html'),('/bmw-r1250rt.html'),
 ('/bmw-r1300gs.html'),('/bmw-r18.html'),('/bmw-r32.html'),('/bmw-r80gs.html'),
 ('/bmw-r90s.html'),('/bmw-rninet.html'),('/bmw-s1000r.html'),
 ('/bmw-s1000rr.html'),('/bmw-s1000xr.html')
)
SELECT rt.path,count(m.id) AS catalogue_matches
FROM approved_routes rt
LEFT JOIN public.motorcycle_catalog_models m
 ON m.manufacturer='BMW'
 AND lower(regexp_replace(m.model,'[^a-zA-Z0-9]','','g'))=
     lower(regexp_replace(public.public_bmw_model_history_v1(rt.path)->>'model','[^a-zA-Z0-9]','','g'))
GROUP BY rt.path HAVING count(m.id)<>1 ORDER BY rt.path;
