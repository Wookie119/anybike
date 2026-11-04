-- AnyBike editorial publishing readiness: read-only batch report.
-- Run with private database access (Supabase SQL editor or server-side tooling).
-- NEVER put this query's underlying private registry rows in browser JavaScript.
-- Source verification is NOT proof that a URL is live, approved, or indexable.
WITH classified AS (
  SELECT entity_type, public_path, publication_state,
         source_verified_at IS NOT NULL AS source_verified,
         live_verified_at IS NOT NULL AS live_verified,
         editorial_verified_at IS NOT NULL AS editorial_verified,
         public_path ~ '^/(markets/[a-z0-9-]+|global/[a-z0-9-]+|[a-z0-9-]+)\\.html$' AS safe_path
  FROM anybike_publishing.editorial_page_routes
), duplicates AS (
  SELECT public_path FROM classified GROUP BY public_path HAVING count(*) > 1
)
SELECT entity_type,
       count(*) AS registered,
       count(*) FILTER (WHERE publication_state = 'candidate') AS candidates,
       count(*) FILTER (WHERE publication_state = 'published') AS marked_published,
       count(*) FILTER (WHERE source_verified) AS source_verified,
       count(*) FILTER (WHERE live_verified) AS live_verified,
       count(*) FILTER (WHERE editorial_verified) AS editorial_verified,
       count(*) FILTER (WHERE publication_state = 'published' AND source_verified AND live_verified
                             AND editorial_verified AND safe_path AND d.public_path IS NULL) AS registry_ready,
       count(*) FILTER (WHERE NOT safe_path) AS unsafe_paths,
       count(*) FILTER (WHERE d.public_path IS NOT NULL) AS duplicate_paths
FROM classified c
LEFT JOIN duplicates d USING (public_path)
GROUP BY entity_type
ORDER BY entity_type;
